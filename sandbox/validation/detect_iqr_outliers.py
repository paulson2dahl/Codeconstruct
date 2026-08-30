#!/usr/bin/env python3
"""
IQR-based outlier detection for numeric columns.

Uses interquartile range method to flag values beyond Q1 - 1.5*IQR
and Q3 + 1.5*IQR boundaries.

Severity levels:
- "medium" : 1.5*IQR <= |v - median| < 3.0*IQR (mild outlier, Tukey fence)
- "high"   : |v - median| >= 3.0*IQR             (extreme outlier)

Read-only: never INSERTs into the target database. Audit emission
must go through the approval-aware orchestration layer, not directly
into the analyzed database.
"""
import argparse
import json
import sqlite3
from pathlib import Path


def detect_iqr_outliers(db_path: str, table: str, column: str,
                        group_by: str = None) -> list[dict]:
    """Detect outliers using IQR method.

    If `group_by` is supplied, the query returns one row per
    (group, value) pair with a frequency count. We expand that
    into the full list of observations so quartiles and `n` are
    computed over every source row, not over distinct values.
    """
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
    conn.close()

    if not rows:
        return []

    if group_by:
        groups = {}
        for row in rows:
            key = row[group_by]
            count = row["count"]
            if key not in groups:
                groups[key] = []
            # Expand by frequency: this value appeared `count` times.
            groups[key].extend([row[column]] * count)
        outliers = []
        for key, values in groups.items():
            outliers.extend(_iqr_check(values, key))
        return outliers
    else:
        values = [row[0] for row in rows]
        return _iqr_check(values)


def _iqr_check(values: list, group: str = None) -> list[dict]:
    # Coerce each value to float; drop any that cannot be converted.
    numeric = []
    for v in values:
        try:
            numeric.append(float(v))
        except (TypeError, ValueError):
            pass  # skip non-numeric cells (text, BLOB, etc.)

    n = len(numeric)
    if n < 4:
        return []

    sorted_vals = sorted(numeric)
    q1_idx = n // 4
    q3_idx = 3 * n // 4
    q1 = sorted_vals[q1_idx]
    q3 = sorted_vals[q3_idx]
    iqr = q3 - q1
    # Tukey fences (mild outlier boundary)
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    # Extreme outlier boundary (3 * IQR from the quartiles)
    lower_extreme = q1 - 3.0 * iqr
    upper_extreme = q3 + 3.0 * iqr

    result = []
    for v in sorted_vals:
        if v < lower or v > upper:
            result.append({
                "value": v,
                "group": group,
                "lower_bound": round(lower, 2),
                "upper_bound": round(upper, 2),
                "severity": "high" if (v < lower_extreme or v > upper_extreme) else "medium",
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
    # Read-only: print results to stdout. Audit logging is the
    # responsibility of the orchestration layer (run_validation.py),
    # which routes through the approval workflow.
    print(json.dumps({"outliers": result, "count": len(result)}, indent=2))


if __name__ == "__main__":
    main()
