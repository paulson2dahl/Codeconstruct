#!/usr/bin/env python3
"""
detect_range.py — Detects marks that fall outside valid range.

Checks for:
  - marks_obtained > max_marks (e.g., 152/100)
  - marks_obtained < 0 (negative marks)
  - NULL or empty marks_obtained

Usage:
  python3 detect_range.py [db_path]

Output (JSON to stdout):
  {
    "out_of_range_found": N,
    "details": [
      {"student_id": "...", "subject": "...", "exam": "...", "marks": 152, "max_marks": 100},
      ...
    ]
  }
"""
import sqlite3
import json
import sys
import os

DB_PATH = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "school_ops.db"
)

def detect_out_of_range(conn):
    """Detect marks entries outside valid range."""
    cursor = conn.cursor()

    cursor.execute("""
        SELECT m.marks_obtained, m.max_marks, s.student_id, s.full_name,
               su.name as subject, e.name as exam
        FROM marks m
        JOIN students s ON m.student_id = s.id
        JOIN subjects su ON m.subject_id = su.id
        JOIN exams e ON m.exam_id = e.id
        WHERE m.marks_obtained > m.max_marks
           OR m.marks_obtained < 0
           OR m.marks_obtained IS NULL
        ORDER BY m.marks_obtained DESC
    """)

    outliers = []
    for row in cursor.fetchall():
        outliers.append({
            "student_id": row[2],
            "student_name": row[3],
            "subject": row[4],
            "exam": row[5],
            "marks": row[0],
            "max_marks": row[1],
            "anomaly_type": "out_of_range" if row[0] > row[1] else "negative"
        })

    return {
        "out_of_range_found": len(outliers),
        "details": outliers
    }

if __name__ == "__main__":
    conn = sqlite3.connect(DB_PATH)
    result = detect_out_of_range(conn)
    conn.close()
    print(json.dumps(result, indent=2))
