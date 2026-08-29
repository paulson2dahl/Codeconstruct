#!/usr/bin/env python3
"""
detect_duplicates.py — Generic duplicate detection for ANY column.

Runs in TrueForge sandbox (Code Mode).
"""
import sqlite3
import json
import sys
import os
from typing import Dict, List, Any


def resolve_db(db_path: str) -> str:
    if db_path and os.path.exists(db_path):
        return db_path
    possible = ["/sandbox/user_data.db", os.path.join(os.getcwd(), "user_data.db")]
    for p in possible:
        if os.path.exists(p):
            return p
    return os.path.join(os.getcwd(), "user_data.db")


def detect_duplicates(db_path: str, table: str, column: str) -> Dict[str, Any]:
    """Find duplicate values in a column."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Check if column exists
    cursor.execute(f"PRAGMA table_info({table})")
    cols = [row[1] for row in cursor.fetchall()]
    if column not in cols:
        conn.close()
        return {"error": f"Column '{column}' not found in table '{table}'"}

    # Find duplicates
    cursor.execute(f"""
        SELECT {column}, COUNT(*) as cnt
        FROM {table}
        WHERE {column} IS NOT NULL
        GROUP BY {column}
        HAVING COUNT(*) > 1
        ORDER BY cnt DESC
    """)

    duplicates = [{"value": row[0], "count": row[1]} for row in cursor.fetchall()]

    # Get sample rows for each duplicate value
    duplicate_details = []
    for dup in duplicates[:20]:  # Limit to top 20
        cursor.execute(f"SELECT * FROM {table} WHERE {column} = ? LIMIT 3", (dup["value"],))
        rows = [dict(row) for row in cursor.fetchall()]
        duplicate_details.append({
            "value": dup["value"],
            "count": dup["count"],
            "sample_rows": rows
        })

    conn.close()

    return {
        "table": table,
        "column": column,
        "duplicate_groups": len(duplicates),
        "total_duplicate_rows": sum(d["count"] for d in duplicates),
        "details": duplicate_details
    }


def detect_all_duplicates(db_path: str, tables: List[str] = None) -> Dict[str, Any]:
    """Detect duplicates for ALL columns in specified tables."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    if tables is None:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        tables = [row[0] for row in cursor.fetchall()]

    results = {}

    for table in tables:
        cursor.execute(f"PRAGMA table_info({table})")
        columns = [row[1] for row in cursor.fetchall()]

        table_results = {}
        for column in columns:
            result = detect_duplicates(db_path, table, column)
            if result.get("duplicate_groups", 0) > 0:
                table_results[column] = result

        if table_results:
            results[table] = table_results

    conn.close()
    return {"duplicates_by_table": results, "total_duplicate_groups": sum(
        len(c) for t in results.values() for c in t.values()
    )}


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: detect_duplicates.py '<json_request>'"}))
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

    db_path = resolve_db(db_path)

    if action == "detect_duplicates":
        if table and column:
            result = detect_duplicates(db_path, table, column)
        elif table:
            result = {"error": "column required when table specified"}
        else:
            result = detect_all_duplicates(db_path, request.get("tables"))
    else:
        result = {"error": f"Unknown action: {action}"}

    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()