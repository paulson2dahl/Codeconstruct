#!/usr/bin/env python3
"""
discover_schema.py — Generic schema discovery for ANY database.

This script runs INSIDE the TrueForge sandbox (Code Mode).
It discovers the complete database structure without any hardcoded assumptions.

Usage:
  python3 discover_schema.py '{"action": "discover_schema", "db_path": "/sandbox/user_data.db"}'

Output: Complete schema map as JSON
"""
import sqlite3
import json
import sys
import os
from typing import Dict, List, Any


def resolve_db(db_path: str) -> str:
    """Resolve database path."""
    if db_path and os.path.exists(db_path):
        return db_path
    # Check common locations
    possible = [
        "/sandbox/user_data.db",
        os.path.join(os.getcwd(), "user_data.db"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "user_data.db"),
    ]
    for p in possible:
        if os.path.exists(p):
            return p
    return os.path.join(os.getcwd(), "user_data.db")


def discover_sqlite_schema(db_path: str) -> Dict[str, Any]:
    """Discover complete SQLite schema."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    schema = {
        "database": db_path,
        "tables": {},
        "relationships": [],
        "indexes": []
    }

    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    tables = [row[0] for row in cursor.fetchall()]

    for table_name in tables:
        # Get column info
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = []
        pk_columns = []
        for col in cursor.fetchall():
            col_info = {
                "name": col[1],
                "type": col[2],
                "not_null": bool(col[3]),
                "default": col[4],
                "primary_key": bool(col[5])
            }
            columns.append(col_info)
            if col[5]:
                pk_columns.append(col[1])

        # Get foreign keys
        cursor.execute(f"PRAGMA foreign_key_list({table_name})")
        foreign_keys = []
        for fk in cursor.fetchall():
            foreign_keys.append({
                "column": fk[3],
                "references_table": fk[2],
                "references_column": fk[4]
            })
            schema["relationships"].append({
                "from_table": table_name,
                "from_column": fk[3],
                "to_table": fk[2],
                "to_column": fk[4]
            })

        # Get indexes
        cursor.execute(f"PRAGMA index_list({table_name})")
        for idx in cursor.fetchall():
            if not idx[1].startswith("sqlite_"):
                cursor.execute(f"PRAGMA index_info({idx[1]})")
                idx_cols = [row[2] for row in cursor.fetchall()]
                schema["indexes"].append({
                    "table": table_name,
                    "name": idx[1],
                    "columns": idx_cols,
                    "unique": bool(idx[2])
                })

        # Get row count
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        row_count = cursor.fetchone()[0]

        # Sample data (first 3 rows)
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
        sample_rows = [dict(row) for row in cursor.fetchall()]

        schema["tables"][table_name] = {
            "columns": columns,
            "primary_keys": pk_columns,
            "foreign_keys": foreign_keys,
            "row_count": row_count,
            "sample_data": sample_rows
        }

    conn.close()
    return schema


def discover_excel_schema(file_path: str) -> Dict[str, Any]:
    """Discover schema from Excel/CSV file."""
    import pandas as pd

    # Read file
    if file_path.endswith('.csv'):
        df = pd.read_csv(file_path, nrows=1000)
    else:
        df = pd.read_excel(file_path, nrows=1000)

    schema = {
        "source": file_path,
        "sheets": {}
    }

    if file_path.endswith('.csv'):
        sheet_name = "Sheet1"
        schema["sheets"][sheet_name] = analyze_dataframe(df, sheet_name)
    else:
        # Multi-sheet Excel
        xls = pd.ExcelFile(file_path)
        for sheet in xls.sheet_names:
            df_sheet = pd.read_excel(file_path, sheet_name=sheet, nrows=1000)
            schema["sheets"][sheet] = analyze_dataframe(df_sheet, sheet)

    return schema


def analyze_dataframe(df, sheet_name: str) -> Dict[str, Any]:
    """Analyze a pandas DataFrame to infer schema."""
    columns = []
    for col in df.columns:
        series = df[col]
        dtype = str(series.dtype)
        null_count = int(series.isnull().sum())
        unique_count = int(series.nunique())
        total_count = len(series)

        # Infer semantic type
        semantic_type = infer_semantic_type(series, dtype)

        # Sample values
        sample_values = series.dropna().head(5).tolist()

        columns.append({
            "name": str(col),
            "pandas_dtype": dtype,
            "semantic_type": semantic_type,
            "null_count": null_count,
            "null_percentage": round(null_count / total_count * 100, 2) if total_count > 0 else 0,
            "unique_count": unique_count,
            "unique_percentage": round(unique_count / total_count * 100, 2) if total_count > 0 else 0,
            "sample_values": sample_values,
            "stats": get_column_stats(series, dtype)
        })

    return {
        "row_count": len(df),
        "columns": columns
    }


def infer_semantic_type(series, dtype: str) -> str:
    """Infer semantic type from data."""
    if dtype in ('int64', 'float64', 'Int64', 'Float64'):
        # Check if it's an ID (high cardinality, sequential)
        if series.nunique() == len(series) and series.dtype in ('int64', 'Int64'):
            return "identifier"
        return "numeric"
    elif dtype == 'object':
        # Check for dates
        sample = series.dropna().head(20)
        if len(sample) > 0:
            date_like = sum(1 for v in sample if is_date_like(str(v))) / len(sample)
            if date_like > 0.5:
                return "date"
        # Check for categorical (low cardinality)
        if series.nunique() / len(series) < 0.1:
            return "categorical"
        return "text"
    elif 'datetime' in dtype:
        return "datetime"
    elif 'bool' in dtype:
        return "boolean"
    return "unknown"


def is_date_like(value: str) -> bool:
    """Check if string looks like a date."""
    import re
    date_patterns = [
        r'^\d{4}-\d{2}-\d{2}$',  # YYYY-MM-DD
        r'^\d{2}/\d{2}/\d{4}$',  # DD/MM/YYYY
        r'^\d{2}-\d{2}-\d{4}$',  # DD-MM-YYYY
        r'^\d{4}/\d{2}/\d{2}$',  # YYYY/MM/DD
    ]
    return any(re.match(p, value.strip()) for p in date_patterns)


def get_column_stats(series, dtype: str) -> Dict[str, Any]:
    """Get statistics for a column."""
    stats = {}
    if dtype in ('int64', 'float64', 'Int64', 'Float64'):
        clean = series.dropna()
        if len(clean) > 0:
            stats = {
                "min": float(clean.min()),
                "max": float(clean.max()),
                "mean": float(clean.mean()),
                "median": float(clean.median()),
                "std": float(clean.std())
            }
    elif dtype == 'object':
        clean = series.dropna()
        if len(clean) > 0:
            stats = {
                "most_common": clean.mode().head(3).tolist() if len(clean.mode()) > 0 else [],
                "avg_length": float(clean.astype(str).str.len().mean())
            }
    return stats


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: discover_schema.py '<json_request>'"}))
        sys.exit(1)

    try:
        request = json.loads(sys.argv[1])
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON request"}))
        sys.exit(1)

    action = request.get("action")
    db_path = request.get("db_path")
    file_path = request.get("file_path")

    if action == "discover_schema":
        if db_path:
            result = discover_sqlite_schema(resolve_db(db_path))
        elif file_path:
            result = discover_excel_schema(file_path)
        else:
            result = {"error": "Either db_path or file_path required"}
    else:
        result = {"error": f"Unknown action: {action}"}

    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()