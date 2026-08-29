#!/usr/bin/env python3
"""
IQR-based outlier detection for numeric columns.

Uses interquartile range method to flag values beyond Q1 - 1.5*IQR
and Q3 + 1.5*IQR boundaries.
"""
import argparse
import json
import sqlite3
import statistics
from pathlib import Path


def detect_iqr_outliers(db_path: str, table: str, column: str,
                        group_by: str = None) -> list[dict]:
    """Detect outliers using IQR method."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    if group_by:
        query = f"""
            SELECT {group_by}, {column}, COUNT(*) as count
            FROM {table}
            WHERE {column} IS NOT NULL
            GROUP BY {group_by}, {column}
            ORDER BY {group_by}
        """
    else:
        query = f"""
            SELECT {column} FROM {table}
            WHERE {column} IS NOT NULL
        """

    cur.execute(query)
    rows = cur.fetchall()

    if not rows:
        return []

    if group_by:
        groups = {}
        for row in rows:
            key = row[group_by]
            if key not in groups:
                groups[key] = []
            groups[key].append(row[column])
        outliers = []
        for key, values in groups.items():
            outliers.extend(_iqr_check(values, key))
        return outliers
    else:
        values = [row[0] for row in rows]
        return _iqr_check(values)


def _iqr_check(values: list, group: str = None) -> list[dict]:
    n = len(values)
    if n < 4:
        return []

    sorted_vals = sorted(values)
    q1_idx = n // 4
    q3_idx = 3 * n // 4
    q1 = sorted_vals[q1_idx]
    q3 = sorted_vals[q3_idx]
    iqr = q3 - q1
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr

    result = []
    for v in sorted_vals:
        if v < lower or v > upper:
            result.append({
                "value": v,
                "group": group,
                "lower_bound": round(lower, 2),
                "upper_bound": round(upper, 2),
                "severity": "high" if (v < lower - iqr or v > upper + iqr) else "medium"
            })
    return result


def main():
    parser = argparse.ArgumentParser(description="IQR-based outlier detection")
    parser.add_argument("--db", default="school_ops.db", help="Path to SQLite DB")
    parser.add_argument("--table", default="marks", help="Table name")
    parser.add_argument("--column", default="marks_obtained", help="Column to check")
    parser.add_argument("--group-by", default=None, help="Optional group-by column")
    args = parser.parse_args()

    result = detect_iqr_outliers(args.db, args.table, args.column, args.group_by)
    print(json.dumps({"outliers": result, "count": len(result)}, indent=2))

    conn = sqlite3.connect(args.db)
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO session_log (session_id, event_type, tool_name, tool_input, tool_output, approval_status)
        VALUES ('demo', 'sandbox_run', 'detect_iqr_outliers',
                ?, ?, 'auto')
    """, (f"{args.table}.{args.column}", json.dumps(result)))
    conn.commit()
    conn.close()


if __name__ == "__main__":
    main()
