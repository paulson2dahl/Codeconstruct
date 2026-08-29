#!/usr/bin/env python3
"""
class_summary.py — Generates a per-class, per-exam summary with statistics.

Usage:
  python3 class_summary.py <class_section> <exam_name> [db_path]

Output (JSON to stdout):
  {
    "class": "8-A",
    "exam": "Mid Term",
    "stats": {
      "total_students": N,
      "present": N,
      "absent": N,
      "max_marks": 100,
      "class_avg": XX.XX
    },
    "subjects": [
      {"subject": "Mathematics", "avg": XX, "min": X, "max": X, "out_of_range_count": N,
       "anomaly_count": N},
      ...
    ]
  }
"""
import sqlite3
import json
import sys
import os
from statistics import mean

DB_PATH = sys.argv[3] if len(sys.argv) > 3 else os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "school_ops.db"
)

def generate_summary(conn, class_section, exam_name):
    """Generate class summary for a specific exam."""
    parts = class_section.split("-")
    class_num = parts[0]
    section = parts[1] if len(parts) > 1 else "A"

    cursor = conn.cursor()

    # Get all subjects
    cursor.execute("SELECT id, name, max_marks FROM subjects ORDER BY name")
    subjects = cursor.fetchall()

    subject_summaries = []
    for subj_id, subj_name, max_marks in subjects:
        cursor.execute("""
            SELECT m.marks_obtained, s.roll_number, s.student_id, s.full_name
            FROM marks m
            JOIN students s ON m.student_id = s.id
            JOIN exams e ON m.exam_id = e.id
            JOIN classes c ON s.class_id = c.id
            WHERE c.name = ? AND s.section = ? AND e.name = ? AND m.subject_id = ?
            ORDER BY s.roll_number
        """, (f"Class {class_num}", section, exam_name, subj_id))

        rows = cursor.fetchall()
        if not rows:
            continue

        marks_values = [r[0] for r in rows if r[0] is not None]
        out_of_range = [r for r in rows if r[0] is not None and (r[0] > max_marks or r[0] < 0)]

        subject_summaries.append({
            "subject": subj_name,
            "avg": round(mean(marks_values), 2) if marks_values else 0,
            "min": min(marks_values) if marks_values else 0,
            "max": max(marks_values) if marks_values else 0,
            "max_possible": max_marks,
            "total_entries": len(rows),
            "out_of_range_count": len(out_of_range),
            "anomaly_count": len(out_of_range),
            "anomalies": [{"roll_number": r[1], "marks": r[0], "type": "out_of_range"} for r in out_of_range]
        })

    # Class-level stats
    cursor.execute("""
        SELECT COUNT(DISTINCT s.id)
        FROM students s
        JOIN classes c ON s.class_id = c.id
        WHERE c.name = ? AND s.section = ?
    """, (f"Class {class_num}", section))
    total_students = cursor.fetchone()[0]

    all_marks = []
    for ss in subject_summaries:
        cursor.execute("""
            SELECT m.marks_obtained
            FROM marks m
            JOIN students s ON m.student_id = s.id
            JOIN exams e ON m.exam_id = e.id
            JOIN classes c ON s.class_id = c.id
            JOIN subjects su ON m.subject_id = su.id
            WHERE c.name = ? AND s.section = ? AND e.name = ? AND su.name = ?
        """, (f"Class {class_num}", section, exam_name, ss["subject"]))
        rows = cursor.fetchall()
        all_marks.extend([r[0] for r in rows if r[0] is not None and r[0] <= ss["max_possible"]])

    return {
        "class": class_section,
        "exam": exam_name,
        "stats": {
            "total_students": total_students,
            "total_marks_entries": len(all_marks),
            "class_avg": round(mean(all_marks), 2) if all_marks else 0,
            "max_marks_per_subject": 100
        },
        "subjects": subject_summaries,
        "generated_by": "class_summary.py"
    }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python3 class_summary.py <class_section> <exam_name> [db_path]"}))
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    result = generate_summary(conn, sys.argv[1], sys.argv[2])
    conn.close()
    print(json.dumps(result, indent=2))
