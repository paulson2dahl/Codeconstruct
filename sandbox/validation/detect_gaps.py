#!/usr/bin/env python3
"""
detect_gaps.py — Generic gap detection for ANY date/sequential column.

Runs in TrueForge sandbox (Code Mode).
"""
import sqlite3
import json
import sys
import os
from typing import Dict, List, Any
from datetime import datetime, timedelta


def resolve_db(db_path: str) -> str:
    if db_path and os.path.exists(db_path):
        return db_path
    possible = ["/sandbox/user_data.db", os.path.join(os.getcwd(), "user_data.db")]
    for p in possible:
        if os.path.exists(p):
            return p
    return os.path.join(os.getcwd(), "user_data.db")


def detect_date_gaps(db_path: str, table: str, date_column: str, expected_frequency: str = "daily") -> Dict[str, Any]:
    """Detect gaps in a date column."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(f"SELECT {date_column} FROM {table} WHERE {date_column} IS NOT NULL ORDER BY {date_column}")
    dates_raw = [row[0] for row in cursor.fetchall()]
    conn.close()

    if not dates_raw:
        return {"table": table, "column": date_column, "gaps": [], "message": "No date data found"}

    # Parse dates
    dates = []
    for d in dates_raw:
        try:
            # Try multiple formats
            for fmt in ["%Y-%m-%d", "%Y/%m/%d", "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d %H:%M:%S"]:
                try:
                    dates.append(datetime.strptime(str(d), fmt))
                    break
                except ValueError:
                    continue
        except:
            pass

    if len(dates) < 2:
        return {"table": table, "column": date_column, "gaps": [], "message": "Insufficient date data"}

    dates = sorted(set(dates))

    gaps = []
    if expected_frequency == "daily":
        expected_delta = timedelta(days=1)
    elif expected_frequency == "weekly":
        expected_delta = timedelta(weeks=1)
    elif expected_frequency == "monthly":
        expected_delta = timedelta(days=30)  # Approximate
    else:
        expected_delta = timedelta(days=1)

    for i in range(len(dates) - 1):
        diff = dates[i + 1] - dates[i]
        if diff > expected_delta * 1.5:  # Allow some tolerance
            gaps.append({
                "from": dates[i].isoformat(),
                "to": dates[i + 1].isoformat(),
                "missing_days": diff.days - 1,
                "expected_next": (dates[i] + expected_delta).isoformat()
            })

    return {
        "table": table,
        "column": date_column,
        "frequency": expected_frequency,
        "date_range": {"min": dates[0].isoformat(), "max": dates[-1].isoformat()},
        "total_dates": len(dates),
        "gaps": gaps,
        "gap_count": len(gaps)
    }


def detect_sequence_gaps(db_path: str, table: str, column: str) -> Dict[str, Any]:
    """Detect gaps in a sequential integer column (e.g., IDs)."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(f"SELECT {column} FROM {table} WHERE {column} IS NOT NULL ORDER BY {column}")
    values = [row[0] for row in cursor.fetchall()]
    conn.close()

    if len(values) < 2:
        return {"table": table, "column": column, "gaps": [], "message": "Insufficient data"}

    values = sorted(set(values))
    gaps = []

    for i in range(len(values) - 1):
        if values[i + 1] - values[i] > 1:
            gaps.append({
                "from": values[i],
                "to": values[i + 1],
                "missing_count": values[i + 1] - values[i] - 1,
                "missing_values": list(range(values[i] + 1, values[i + 1]))
            })

    return {
        "table": table,
        "column": column,
        "value_range": {"min": values[0], "max": values[-1]},
        "total_values": len(values),
        "gaps": gaps,
        "gap_count": len(gaps)
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: detect_gaps.py '<json_request>'"}))
        sys.exit(1)

    try:
        request = json.loads(sys.argv[1])
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON request"}))
        sys.exit(1)

    action = request.get("action")
    db_path = request.get("db_path", "")
    table = request.get("table")
    column = request.get("column")
    frequency = request.get("frequency", "daily")

    db_path = resolve_db(db_path)

    if action == "detect_date_gaps":
        if table and column:
            result = detect_date_gaps(db_path, table, column, frequency)
        else:
            result = {"error": "table and column required"}
    elif action == "detect_sequence_gaps":
        if table and column:
            result = detect_sequence_gaps(db_path, table, column)
        else:
            result = {"error": "table and column required"}
    else:
        result = {"error": f"Unknown action: {action}"}

    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()