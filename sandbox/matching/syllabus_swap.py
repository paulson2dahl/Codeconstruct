#!/usr/bin/env python3
"""
syllabus_swap.py — Proposes period-swap chart when one subject is behind
and another is ahead, borrowing periods from ahead subjects.

Strategy:
  - Find subjects with <80% completion (behind)
  - Find subjects with >80% completion (ahead)
  - Propose borrowing periods from ahead → behind
  - Respects timetable constraints (same class/section/period slots)

Usage:
  python3 syllabus_swap.py <class_section> [db_path]

Output (JSON to stdout):
  {
    "class_section": "8-A",
    "behind_subjects": [...],
    "ahead_subjects": [...],
    "proposed_swaps": [
      {"from_subject": "...", "to_subject": "...", "period": N, "day": "...",
       "reason": "..."},
      ...
    ]
  }
"""
import sqlite3
import json
import sys
import os

DB_PATH = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "school_ops.db"
)

DAY_NAMES = {
    1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday",
    6: "Saturday", 7: "Sunday"
}

def get_completion_status(conn, class_name, section):
    """Get syllabus completion status for all subjects in a class section."""
    parts = class_name.replace("Class ", "").split("-")
    class_num = parts[0]

    cursor = conn.cursor()
    cursor.execute("""
        SELECT su.name as subject, st.completion_percentage, st.topic, st.teacher_id
        FROM syllabus_tracker st
        JOIN subjects su ON st.subject_id = su.id
        JOIN classes c ON st.class_id = c.id
        WHERE c.name = ? AND st.section = ? AND st.academic_year = '2024-25'
        ORDER BY st.completion_percentage
    """, (f"Class {class_num}", section))

    rows = cursor.fetchall()
    behind = []
    ahead = []
    for row in rows:
        entry = {
            "subject": row[0],
            "completion": row[1],
            "topic": row[2],
            "teacher_id": row[3]
        }
        if row[1] < 80:
            behind.append(entry)
        else:
            ahead.append(entry)

    return behind, ahead

def get_timetable_slots(conn, class_num, section):
    """Get all timetable slots for a class section."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT t.id, t.period_number, t.day_of_week, su.name as subject, s.full_name as teacher, t.room
        FROM timetable t
        JOIN subjects su ON t.subject_id = su.id
        JOIN staff s ON t.teacher_id = s.id
        JOIN classes c ON t.class_id = c.id
        WHERE c.name = ? AND t.section = ? AND t.effective_to IS NULL
        ORDER BY t.day_of_week, t.period_number
    """, (f"Class {class_num}", section))

    slots = []
    for row in cursor.fetchall():
        slots.append({
            "id": row[0],
            "period": row[1],
            "day": DAY_NAMES.get(row[2], str(row[2])),
            "subject": row[3],
            "teacher": row[4],
            "room": row[5]
        })
    return slots

def propose_swaps(conn, class_section):
    """Main syllabus swap proposal logic."""
    parts = class_section.split("-")
    class_num = parts[0]
    section = parts[1] if len(parts) > 1 else "A"

    behind, ahead = get_completion_status(conn, f"Class {class_num}", section)
    slots = get_timetable_slots(conn, class_num, section)

    proposed = []

    if not behind:
        return {
            "class_section": class_section,
            "behind_subjects": [],
            "ahead_subjects": [{"subject": s["subject"], "completion": s["completion"]} for s in ahead],
            "proposed_swaps": [],
            "note": "All subjects at or above 80% completion — no swaps needed"
        }

    # For each behind subject, find ahead subjects with spare periods
    for behind_subj in behind:
        for ahead_subj in ahead:
            # Find timetable slots for ahead subject
            ahead_slots = [s for s in slots if s["subject"] == ahead_subj["subject"]]

            # Find timetable slots for behind subject
            behind_slots = [s for s in slots if s["subject"] == behind_subj["subject"]]

            # Propose swapping: take one period from ahead subject, give to behind
            if ahead_slots and behind_slots:
                # Pick the first available slot from ahead
                swap_slot = ahead_slots[0]
                proposed.append({
                    "from_subject": ahead_subj["subject"],
                    "to_subject": behind_subj["subject"],
                    "period": swap_slot["period"],
                    "day": swap_slot["day"],
                    "current_teacher": swap_slot["teacher"],
                    "reason": f"{ahead_subj['subject']} is {ahead_subj['completion']}% complete; "
                              f"{behind_subj['subject']} is {behind_subj['completion']}% complete"
                })

    return {
        "class_section": class_section,
        "behind_subjects": [{"subject": s["subject"], "completion": s["completion"], "topic": s["topic"]} for s in behind],
        "ahead_subjects": [{"subject": s["subject"], "completion": s["completion"]} for s in ahead],
        "proposed_swaps": proposed,
        "note": f"Found {len(behind)} behind subjects, {len(ahead)} ahead subjects, {len(proposed)} proposed swaps"
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python3 syllabus_swap.py <class_section> [db_path]"}))
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    result = propose_swaps(conn, sys.argv[1])
    conn.close()
    print(json.dumps(result, indent=2))
