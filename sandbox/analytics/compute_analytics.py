#!/usr/bin/env python3
"""
compute_analytics.py — Generic analytics engine for ANY data.

Runs in TrueForge sandbox (Code Mode).
Computes rankings, summaries, trends, correlations.
"""
import sqlite3
import json
import sys
import os
from typing import Dict, List, Any
from collections import Counter
import statistics


def resolve_db(db_path: str) -> str:
    if db_path and os.path.exists(db_path):
        return db_path
    possible = ["/sandbox/user_data.db", os.path.join(os.getcwd(), "user_data.db")]
    for p in possible:
        if os.path.exists(p):
            return p
    return os.path.join(os.getcwd(), "user_data.db")


def compute_ranking(db_path: str, table: str, value_column: str, group_by: str = None, ascending: bool = False, limit: int = 10) -> Dict[str, Any]:
    """Rank entities by a numeric column, optionally grouped."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    if group_by:
        cursor.execute(f"""
            SELECT {group_by}, SUM({value_column}) as total
            FROM {table}
            WHERE {value_column} IS NOT NULL
            GROUP BY {group_by}
            ORDER BY total {'ASC' if ascending else 'DESC'}
            LIMIT ?
        """, (limit,))
    else:
        cursor.execute(f"""
            SELECT *, {value_column}
            FROM {table}
            WHERE {value_column} IS NOT NULL
            ORDER BY {value_column} {'ASC' if ascending else 'DESC'}
            LIMIT ?
        """, (limit,))

    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return {
        "table": table,
        "value_column": value_column,
        "group_by": group_by,
        "ranking": rows,
        "count": len(rows)
    }


def compute_summary(db_path: str, table: str, columns: List[str] = None) -> Dict[str, Any]:
    """Compute summary statistics for numeric columns."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    if columns is None:
        cursor.execute(f"PRAGMA table_info({table})")
        columns = [row[1] for row in cursor.fetchall() if row[2].upper() in ("INTEGER", "REAL", "NUMERIC", "FLOAT", "DOUBLE")]

    summary = {}
    for col in columns:
        cursor.execute(f"SELECT {col} FROM {table} WHERE {col} IS NOT NULL")
        values = [row[0] for row in cursor.fetchall() if row[0] is not None]

        if not values:
            summary[col] = {"count": 0}
            continue

        summary[col] = {
            "count": len(values),
            "min": min(values),
            "max": max(values),
            "mean": statistics.mean(values),
            "median": statistics.median(values),
            "stdev": statistics.stdev(values) if len(values) > 1 else 0,
            "sum": sum(values)
        }

    conn.close()
    return {"table": table, "summary": summary}


def compute_correlation(db_path: str, table: str, col1: str, col2: str) -> Dict[str, Any]:
    """Compute Pearson correlation between two numeric columns."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(f"SELECT {col1}, {col2} FROM {table} WHERE {col1} IS NOT NULL AND {col2} IS NOT NULL")
    pairs = [(row[0], row[1]) for row in cursor.fetchall()]
    conn.close()

    if len(pairs) < 3:
        return {"table": table, "col1": col1, "col2": col2, "correlation": None, "error": "Insufficient data"}

    x_vals = [p[0] for p in pairs]
    y_vals = [p[1] for p in pairs]

    mean_x = statistics.mean(x_vals)
    mean_y = statistics.mean(y_vals)

    numerator = sum((x - mean_x) * (y - mean_y) for x, y in pairs)
    denom_x = sum((x - mean_x) ** 2 for x in x_vals)
    denom_y = sum((y - mean_y) ** 2 for y in y_vals)

    if denom_x == 0 or denom_y == 0:
        return {"table": table, "col1": col1, "col2": col2, "correlation": 0, "note": "Zero variance"}

    correlation = numerator / (denom_x * denom_y) ** 0.5

    return {
        "table": table,
        "col1": col1,
        "col2": col2,
        "correlation": round(correlation, 4),
        "sample_size": len(pairs),
        "interpretation": "strong positive" if correlation > 0.7 else
                         "moderate positive" if correlation > 0.3 else
                         "weak positive" if correlation > 0.1 else
                         "weak negative" if correlation > -0.1 else
                         "moderate negative" if correlation > -0.3 else
                         "strong negative" if correlation > -0.7 else "very strong negative"
    }


def compute_trend(db_path: str, table: str, date_column: str, value_column: str, group_by: str = None) -> Dict[str, Any]:
    """Compute trend over time for a value column."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    if group_by:
        cursor.execute(f"""
            SELECT {date_column}, {group_by}, AVG({value_column}) as avg_value
            FROM {table}
            WHERE {date_column} IS NOT NULL AND {value_column} IS NOT NULL
            GROUP BY {date_column}, {group_by}
            ORDER BY {date_column}, {group_by}
        """)
    else:
        cursor.execute(f"""
            SELECT {date_column}, AVG({value_column}) as avg_value
            FROM {table}
            WHERE {date_column} IS NOT NULL AND {value_column} IS NOT NULL
            GROUP BY {date_column}
            ORDER BY {date_column}
        """)

    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()

    # Parse dates and compute trend
    from datetime import datetime
    trend_data = []
    for row in rows:
        date_val = row[date_column]
        try:
            for fmt in ["%Y-%m-%d", "%Y/%m/%d", "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d %H:%M:%S"]:
                try:
                    parsed = datetime.strptime(str(date_val), fmt)
                    break
                except ValueError:
                    continue
            trend_data.append({"date": parsed, "value": row.get("avg_value", row.get(value_column)), "group": row.get(group_by)})
        except:
            continue

    if len(trend_data) < 2:
        return {"error": "Insufficient trend data"}

    # Simple linear regression for overall trend
    x = [(d["date"] - trend_data[0]["date"]).days for d in trend_data]
    y = [d["value"] for d in trend_data]

    mean_x = statistics.mean(x)
    mean_y = statistics.mean(y)
    numerator = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))
    denom = sum((xi - mean_x) ** 2 for xi in x)

    slope = numerator / denom if denom != 0 else 0

    return {
        "table": table,
        "date_column": date_column,
        "value_column": value_column,
        "group_by": group_by,
        "data_points": [{"date": d["date"].isoformat(), "value": d["value"], "group": d.get("group")} for d in trend_data],
        "trend_slope": round(slope, 4),
        "trend_direction": "increasing" if slope > 0.01 else "decreasing" if slope < -0.01 else "stable"
    }


def compute_grouped_stats(db_path: str, table: str, group_by: str, value_columns: List[str]) -> Dict[str, Any]:
    """Compute statistics grouped by a categorical column."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Build query
    selects = [group_by]
    for vc in value_columns:
        selects.append(f"AVG({vc}) as avg_{vc}")
        selects.append(f"COUNT({vc}) as count_{vc}")
        selects.append(f"MIN({vc}) as min_{vc}")
        selects.append(f"MAX({vc}) as max_{vc}")

    query = f"SELECT {', '.join(selects)} FROM {table} WHERE {group_by} IS NOT NULL GROUP BY {group_by} ORDER BY {group_by}"
    cursor.execute(query)

    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return {
        "table": table,
        "group_by": group_by,
        "value_columns": value_columns,
        "groups": rows,
        "group_count": len(rows)
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: compute_analytics.py '<json_request>'"}))
        sys.exit(1)

    try:
        request = json.loads(sys.argv[1])
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON request"}))
        sys.exit(1)

    action = request.get("action")
    db_path = request.get("db_path", "")
    table = request.get("table")

    db_path = resolve_db(db_path)

    if action == "ranking":
        result = compute_ranking(db_path, table, request.get("value_column"), request.get("group_by"), request.get("ascending", False), request.get("limit", 10))
    elif action == "summary":
        result = compute_summary(db_path, table, request.get("columns"))
    elif action == "correlation":
        result = compute_correlation(db_path, table, request.get("col1"), request.get("col2"))
    elif action == "trend":
        result = compute_trend(db_path, table, request.get("date_column"), request.get("value_column"), request.get("group_by"))
    elif action == "grouped_stats":
        result = compute_grouped_stats(db_path, table, request.get("group_by"), request.get("value_columns", []))
    else:
        result = {"error": f"Unknown action: {action}"}

    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()