#!/usr/bin/env python3
"""
detect_referential.py — Generic referential integrity checker.

Runs in TrueForge sandbox (Code Mode).
Finds orphaned foreign keys, missing references.
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


def check_referential_integrity(db_path: str) -> Dict[str, Any]:
    """Check all foreign key relationships in the database."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get all foreign keys from sqlite_master
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND sql LIKE '%FOREIGN KEY%'")
    fk_defs = [row[0] for row in cursor.fetchall()]

    # Also check PRAGMA foreign_key_list for each table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    tables = [row[0] for row in cursor.fetchall()]

    results = {
        "orphaned_keys": [],
        "missing_references": [],
        "checked_relationships": 0
    }

    for table in tables:
        cursor.execute(f"PRAGMA foreign_key_list({table})")
        fks = cursor.fetchall()

        for fk in fks:
            # fk: (id, seq, table, from, to, on_update, on_delete, match)
            fk_id, seq, ref_table, from_col, to_col, on_update, on_delete, match = fk

            results["checked_relationships"] += 1

            # Check for orphaned keys (values in from_col that don't exist in ref_table.to_col)
            cursor.execute(f"""
                SELECT t.{from_col}, COUNT(*) as cnt
                FROM {table} t
                LEFT JOIN {ref_table} r ON t.{from_col} = r.{to_col}
                WHERE t.{from_col} IS NOT NULL AND r.{to_col} IS NULL
                GROUP BY t.{from_col}
            """)

            orphans = [{"value": row[0], "row_count": row[1]} for row in cursor.fetchall()]
            if orphans:
                results["orphaned_keys"].append({
                    "from_table": table,
                    "from_column": from_col,
                    "to_table": ref_table,
                    "to_column": to_col,
                    "orphaned_values": orphans[:50],  # Limit
                    "total_orphaned_rows": sum(o["row_count"] for o in orphans)
                })

    conn.close()
    return results


def check_specific_relationship(db_path: str, from_table: str, from_column: str, to_table: str, to_column: str) -> Dict[str, Any]:
    """Check a specific foreign key relationship."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Check both directions
    cursor.execute(f"""
        SELECT t.{from_column}, COUNT(*) as cnt
        FROM {from_table} t
        LEFT JOIN {to_table} r ON t.{from_column} = r.{to_column}
        WHERE t.{from_column} IS NOT NULL AND r.{to_column} IS NULL
        GROUP BY t.{from_column}
    """)
    orphans = [{"value": row[0], "row_count": row[1]} for row in cursor.fetchall()]

    cursor.execute(f"""
        SELECT r.{to_column}, COUNT(*) as cnt
        FROM {to_table} r
        LEFT JOIN {from_table} t ON t.{from_column} = r.{to_column}
        WHERE r.{to_column} IS NOT NULL AND t.{from_column} IS NULL
        GROUP BY r.{to_column}
    """)
    unreferenced = [{"value": row[0], "row_count": row[1]} for row in cursor.fetchall()]

    conn.close()

    return {
        "from_table": from_table,
        "from_column": from_column,
        "to_table": to_table,
        "to_column": to_column,
        "orphaned_keys": orphans[:50],
        "orphaned_count": len(orphans),
        "unreferenced_keys": unreferenced[:50],
        "unreferenced_count": len(unreferenced)
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: detect_referential.py '<json_request>'"}))
        sys.exit(1)

    try:
        request = json.loads(sys.argv[1])
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON request"}))
        sys.exit(1)

    action = request.get("action")
    db_path = request.get("db_path", "")
    from_table = request.get("from_table")
    from_column = request.get("from_column")
    to_table = request.get("to_table")
    to_column = request.get("to_column")

    db_path = resolve_db(db_path)

    if action == "check_all":
        result = check_referential_integrity(db_path)
    elif action == "check_relationship":
        if not all([from_table, from_column, to_table, to_column]):
            result = {"error": "from_table, from_column, to_table, to_column required"}
        else:
            result = check_specific_relationship(db_path, from_table, from_column, to_table, to_column)
    else:
        result = {"error": f"Unknown action: {action}"}

    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()