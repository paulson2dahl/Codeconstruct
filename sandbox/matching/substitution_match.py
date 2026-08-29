#!/usr/bin/env python3
"""
substitution_match.py — Given an absent teacher, proposes a substitution chart.

Matching priority:
  1. Subject-match first (substitute must teach the subject)
  2. Workload fairness (nobody dumped on twice — check duty_ledger)
  3. Coverage from lesson_plan table (what to teach)

Usage:
  python3 substitution_match.py <absent_subject> [db_path]

Output (JSON to stdout):
  {
    "absent_subject": "Mathematics",
    "proposed_substitutions": [
      {"period": 1, "day": "Monday", "original_teacher": "...", "substitute_teacher": "...",
       "reason": "Subject: Mathematics", "cover_work": "..."},
      ...
    ],
    "duty_ledger_updates": [...]
  }
"""
import sqlite3
import json
import sys
import os
from datetime import date

DB_PATH = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "school_ops.db"
)

def get_timetable_for_subject(conn, subject_name):
    """Get all timetable slots for the absent teacher's subject."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT t.id, t.period_number, t.day_of_week, t.room, s.full_name as teacher_name,
               c.name as class_name, t.section
        FROM timetable t
        JOIN subjects su ON t.subject_id = su.id
        JOIN staff s ON t.teacher_id = s.id
        JOIN classes c ON t.class_id = c.id
        WHERE su.name = ? AND t.effective_to IS NULL
        ORDER BY t.day_of_week, t.period_number
    """, (subject_name,))
    return cursor.fetchall()

def get_substitute_candidates(conn, subject_name):
    """Get staff who can teach the subject, ranked by workload fairness."""
    cursor = conn.cursor()

    # Get teachers who specialize in this subject
    cursor.execute("""
        SELECT id, full_name, subject_specialization, email
        FROM staff
        WHERE is_active = 1
        AND (subject_specialization LIKE ? OR subject_specialization LIKE ?)
    """, (f"%{subject_name}%", f"%{subject_name.split()[0]}%"))

    candidates = cursor.fetchall()

    # Check duty ledger for fairness
    results = []
    for cand in candidates:
        cursor.execute("""
            SELECT COUNT(*) as duties
            FROM duty_ledger
            WHERE staff_id = ? AND duty_type = 'substitution'
            AND date_assigned >= date('now', '-7 days')
        """, (cand[0],))
        duty_count = cursor.fetchone()[0] if cursor.fetchone() else 0

        results.append({
            "id": cand[0],
            "name": cand[1],
            "specialization": cand[2],
            "recent_substitution_count": duty_count,
            "fairness_score": duty_count  # Lower is better
        })

    # Sort by fewest recent duties (fairness)
    results.sort(key=lambda x: x["recent_substitution_count"])
    return results

def get_cover_work(conn, class_id, section, subject_name):
    """Get lesson plan content for the substitute."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT lp.topic, lp.content, lp.resources
        FROM lesson_plans lp
        JOIN classes c ON lp.class_id = c.id
        JOIN subjects su ON lp.subject_id = su.id
        WHERE c.name = ? AND lp.section = ? AND su.name = ?
        LIMIT 1
    """, (f"Class {class_id}" if isinstance(class_id, str) else f"Class {class_id}", section, subject_name))

    row = cursor.fetchone()
    if row:
        return {
            "topic": row[0],
            "content": row[1] if row[1] else "No specific content available",
            "resources": row[2] if row[2] else "Refer to textbook chapter on this topic"
        }
    return {"topic": "N/A", "content": "No lesson plan found", "resources": "Default: review previous lesson"}

DAY_NAMES = {
    1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday",
    6: "Saturday", 7: "Sunday"
}

def propose_substitution(conn, absent_subject):
    """Main substitution proposal logic."""
    timetable = get_timetable_for_subject(conn, absent_subject)
    candidates = get_substitute_candidates(conn, absent_subject)

    if not candidates:
        return {"error": f"No substitute candidates found for {absent_subject}"}

    proposed = []
    duty_updates = []

    for slot in timetable:
        tid, period, day, room, teacher, class_name, section = slot
        day_name = DAY_NAMES.get(day, str(day))

        # Pick candidate with lowest duty count
        substitute = candidates[0]
        reason = f"Subject: {absent_subject} | Fairness: {substitute['recent_substitution_count']} recent subs"
        candidates[0]["recent_substitution_count"] += 1
        candidates.sort(key=lambda x: x["recent_substitution_count"])

        cover = get_cover_work(conn, class_name.replace("Class ", ""), section, absent_subject)

        proposed.append({
            "period": period,
            "day": day_name,
            "original_teacher": teacher,
            "substitute_teacher": substitute["name"],
            "reason": reason,
            "cover_work": cover
        })

        duty_updates.append({
            "staff_id": substitute["id"],
            "staff_name": substitute["name"],
            "duty_type": "substitution",
            "date_assigned": date.today().isoformat(),
            "period_number": period,
            "class_name": class_name,
            "notes": f"Covering {absent_subject} for {teacher}"
        })

    return {
        "absent_subject": absent_subject,
        "proposed_substitutions": proposed,
        "duty_ledger_updates": duty_updates,
        "notes": "Priority: subject-match first → workload fairness → cover work from lesson plans"
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python3 substitution_match.py <absent_subject> [db_path]"}))
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    result = propose_substitution(conn, sys.argv[1])
    conn.close()
    print(json.dumps(result, indent=2))
