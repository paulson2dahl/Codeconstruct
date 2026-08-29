#!/usr/bin/env python3
"""
detect_outliers.py — Generic outlier detection for ANY numeric column.

Runs in TrueForge sandbox (Code Mode).
Outputs structured anomaly report for Generative UI.
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


def detect_outliers(db_path: str, table: str, column: str, method: str = "iqr") -> Dict[str, Any]:
    """Detect outliers in a numeric column using IQR or Z-score."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get column data
    cursor.execute(f"SELECT {column} FROM {table} WHERE {column} IS NOT NULL")
    values = [row[0] for row in cursor.fetchall() if row[0] is not None]
    conn.close()

    if len(values) < 4:
        return {
            "table": table,
            "column": column,
            "method": method,
            "outliers": [],
            "message": "Insufficient data for outlier detection"
        }

    import statistics
    mean_val = statistics.mean(values)
    stdev_val = statistics.stdev(values) if len(values) > 1 else 0

    outliers = []

    if method == "iqr":
        sorted_vals = sorted(values)
        n = len(sorted_vals)
        q1 = sorted_vals[n // 4]
        q3 = sorted_vals[3 * n // 4]
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr

        for v in values:
            if v < lower or v > upper:
                outliers.append({"value": v, "deviation": "below" if v < lower else "above"})

        return {
            "table": table,
            "column": column,
            "method": "iqr",
            "bounds": {"lower": lower, "upper": upper, "q1": q1, "q3": q3, "iqr": iqr},
            "outliers": outliers,
            "outlier_count": len(outliers),
            "total_count": len(values)
        }

    elif method == "zscore":
        threshold = 3.0
        for v in values:
            if stdev_val > 0:
                z = abs(v - mean_val) / stdev_val
                if z > threshold:
                    outliers.append({"value": v, "z_score": z})

        return {
            "table": table,
            "column": column,
            "method": "zscore",
            "mean": mean_val,
            "stdev": stdev_val,
            "threshold": threshold,
            "outliers": outliers,
            "outlier_count": len(outliers),
            "total_count": len(values)
        }

    return {"error": f"Unknown method: {method}"}


def detect_all_outliers(db_path: str, tables: List[str] = None) -> Dict[str, Any]:
    """Detect outliers for ALL numeric columns in specified tables."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    if tables is None:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        tables = [row[0] for row in cursor.fetchall()]

    results = {}

    for table in tables:
        cursor.execute(f"PRAGMA table_info({table})")
        columns = cursor.fetchall()

        table_results = {}
        for col in columns:
            col_name = col[1]
            col_type = col[2].upper()
            if col_type in ("INTEGER", "REAL", "NUMERIC", "FLOAT", "DOUBLE"):
                result = detect_outliers(db_path, table, col_name, "iqr")
                if result.get("outlier_count", 0) > 0:
                    table_results[col_name] = result

        if table_results:
            results[table] = table_results

    conn.close()
    return {"outliers_by_table": results, "total_anomalies": sum(
        sum(len(c.get("outliers", [])) for c in t.values()) for t in results.values()
    )}


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: detect_outliers.py '<json_request>'"}))
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
    method = request.get("method", "iqr")

    db_path = resolve_db(db_path)

    if action == "detect_outliers":
        if table and column:
            result = detect_outliers(db_path, table, column, method)
        elif table:
            result = {"error": "column required when table specified"}
        else:
            result = detect_all_outliers(db_path, request.get("tables"))
    else:
        result = {"error": f"Unknown action: {action}"}

    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()