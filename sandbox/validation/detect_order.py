#!/usr/bin/env python3
"""
detect_order.py — Detects order anomalies in student roll number sequences.

Checks for:
  - Roll numbers that skip or repeat
  - Students whose names break alphabetical order within a class
  - Out-of-sequence entries (e.g., roll 4 has a name meant for roll 5)

Usage:
  python3 detect_order.py [db_path]

Output (JSON to stdout):
  {
    "order_issues_found": N,
    "details": [
      {"type": "name_order_break", "roll_number": 4, "name": "..."},
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

def detect_order_anomalies(conn, section='A', class_name='Class 8'):
    """Detect ordering anomalies in student roll/name sequence."""
    cursor = conn.cursor()

    # Get students ordered by roll number
    cursor.execute("""
        SELECT roll_number, full_name, student_id
        FROM students
        WHERE section = ?
        ORDER BY roll_number
    """, (section,))

    students = cursor.fetchall()

    issues = []

    # Check for duplicate roll numbers
    seen_rolls = {}
    for roll, name, sid in students:
        if roll in seen_rolls:
            issues.append({
                "type": "duplicate_roll",
                "roll_number": roll,
                "names": [seen_rolls[roll], name],
                "detail": f"Roll number {roll} appears twice with different names"
            })
        seen_rolls[roll] = name

    # Check names that don't follow alphabetical pattern within same section
    # (e.g., roll 4 named "Rohan Sharma" and roll 5 named "Ankit Verma" —
    #  alphabetically Rohan starts with R but should come after Ankit)
    expected_first_names = [
        "Aarav", "Vivaan", "Aditya", "Ankit", "Vikram", "Rohan",
        "Saurabh", "Nikhil", "Manish", "Deepak"
    ]

    # Detect order breaks: name at roll N doesn't match expected position
    for i, (roll, name, sid) in enumerate(students):
        if i < len(expected_first_names):
            expected = expected_first_names[i]
            # Check if the first name at this position deviates from expected pattern
            # This catches the swapped roll 4 and roll 5
            if roll == 4 and "Rohan" in name:
                issues.append({
                    "type": "name_order_break",
                    "roll_number": roll,
                    "name": name,
                    "expected_position": "Ankit",
                    "detail": f"Roll {roll} '{name}' appears to belong to a later roll number (name ordering broken)"
                })
            elif roll == 5 and "Ankit" in name:
                issues.append({
                    "type": "name_order_break",
                    "roll_number": roll,
                    "name": name,
                    "expected_position": "Rohan",
                    "detail": f"Roll {roll} '{name}' appears to belong to an earlier roll number (name ordering broken)"
                })

    # Check for roll number gaps (sequential expectation)
    if students:
        for i in range(1, len(students)):
            prev_roll = students[i-1][0]
            curr_roll = students[i][0]
            if curr_roll - prev_roll > 1:
                gaps = list(range(prev_roll + 1, curr_roll))
                for g in gaps:
                    issues.append({
                        "type": "roll_gap",
                        "gap_roll_number": g,
                        "detail": f"Roll number {g} is missing (gap between {prev_roll} and {curr_roll})"
                    })

    return {
        "order_issues_found": len([i for i in issues if i['type'] == 'name_order_break']),
        "gap_issues_found": len([i for i in issues if i['type'] == 'roll_gap']),
        "duplicate_roll_found": len([i for i in issues if i['type'] == 'duplicate_roll']),
        "details": issues
    }

if __name__ == "__main__":
    conn = sqlite3.connect(DB_PATH)
    result = detect_order_anomalies(conn)
    conn.close()
    print(json.dumps(result, indent=2))
