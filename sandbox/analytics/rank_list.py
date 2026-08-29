#!/usr/bin/env python3
"""
rank_list.py — Generates a clean rank list for a given exam + subject.

Usage:
  python3 rank_list.py <exam_name> <subject_name> [db_path]

Output (JSON to stdout):
  {
    "exam": "Mid Term",
    "subject": "Mathematics",
    "rank_list": [
      {"rank": 1, "student_id": "...", "name": "...", "roll_number": N, "marks": X, "max_marks": 100},
      ...
    ]
  }
"""
import sqlite3
import json
import sys
import os

DB_PATH = sys.argv[3] if len(sys.argv) > 3 else os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "school_ops.db"
)

def generate_rank_list(conn, exam_name, subject_name):
    """Generate a sorted rank list for a specific exam and subject."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT m.marks_obtained, m.max_marks, s.roll_number, s.student_id, s.full_name
        FROM marks m
        JOIN students s ON m.student_id = s.id
        JOIN exams e ON m.exam_id = e.id
        JOIN subjects su ON m.subject_id = su.id
        WHERE e.name = ? AND su.name = ?
        ORDER BY m.marks_obtained DESC, s.roll_number ASC
    """, (exam_name, subject_name))

    rows = cursor.fetchall()
    rank_list = []
    prev_marks = None
    rank = 0
    for idx, row in enumerate(rows):
        marks, max_marks, roll, sid, name = row
        if marks != prev_marks:
            rank = idx + 1
            prev_marks = marks
        rank_list.append({
            "rank": rank,
            "student_id": sid,
            "name": name,
            "roll_number": roll,
            "marks": marks,
            "max_marks": max_marks
        })

    return {
        "exam": exam_name,
        "subject": subject_name,
        "rank_list": rank_list,
        "total_students": len(rank_list)
    }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python3 rank_list.py <exam_name> <subject_name> [db_path]"}))
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    result = generate_rank_list(conn, sys.argv[1], sys.argv[2])
    conn.close()
    print(json.dumps(result, indent=2))
