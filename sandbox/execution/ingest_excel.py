#!/usr/bin/env python3
"""
ingest_excel.py — Generic Excel/CSV ingestion to SQLite.

This script runs INSIDE the TrueForge sandbox (Code Mode).
It reads any Excel/CSV file, infers schema, creates/updates tables,
and returns an Anomaly Report Card for human review.

Usage:
  python3 ingest_excel.py '{"action": "ingest", "file_path": "/sandbox/input.xlsx", "db_path": "/sandbox/user_data.db", "table_name": "auto"}'

Output: Ingestion result with anomalies for approval
"""
import sqlite3
import json
import sys
import os
import pandas as pd
from typing import Dict, List, Any, Optional
from datetime import datetime


def resolve_db(db_path: str) -> str:
    if db_path and os.path.exists(db_path):
        return db_path
    possible = [
        "/sandbox/user_data.db",
        os.path.join(os.getcwd(), "user_data.db"),
    ]
    for p in possible:
        if os.path.exists(p):
            return p
    return os.path.join(os.getcwd(), "user_data.db")


def infer_sqlite_type(series: pd.Series, semantic_type: str) -> str:
    """Map pandas dtype + semantic type to SQLite type."""
    if semantic_type == "identifier":
        return "INTEGER"
    elif semantic_type == "numeric":
        return "REAL"
    elif semantic_type == "boolean":
        return "INTEGER"
    elif semantic_type in ("date", "datetime"):
        return "TEXT"
    elif semantic_type == "categorical":
        return "TEXT"
    else:
        # Fallback to pandas dtype
        dtype = str(series.dtype)
        if dtype in ('int64', 'Int64'):
            return "INTEGER"
        elif dtype in ('float64', 'Float64'):
            return "REAL"
        elif 'datetime' in dtype:
            return "TEXT"
        elif 'bool' in dtype:
            return "INTEGER"
        return "TEXT"


def clean_column_name(name: str) -> str:
    """Clean column name for SQL."""
    import re
    # Replace non-alphanumeric with underscore
    clean = re.sub(r'[^a-zA-Z0-9_]', '_', str(name).strip())
    # Ensure it doesn't start with a number
    if clean and clean[0].isdigit():
        clean = 'col_' + clean
    # Ensure not empty
    if not clean:
        clean = 'column'
    return clean.lower()


def analyze_excel_file(file_path: str) -> Dict[str, Any]:
    """Analyze Excel/CSV file and return sheet analysis."""
    if file_path.endswith('.csv'):
        df = pd.read_csv(file_path)
        sheets = {"Sheet1": df}
    else:
        xls = pd.ExcelFile(file_path)
        sheets = {}
        for sheet in xls.sheet_names:
            sheets[sheet] = pd.read_excel(file_path, sheet_name=sheet)

    analysis = {"sheets": {}}
    for sheet_name, df in sheets.items():
        df_clean = df.copy()
        df_clean.columns = [clean_column_name(c) for c in df_clean.columns]

        columns = []
        for col in df_clean.columns:
            series = df_clean[col]
            dtype = str(series.dtype)
            null_count = int(series.isnull().sum())
            unique_count = int(series.nunique())
            total_count = len(series)

            semantic_type = infer_semantic_type(series, dtype)
            sample_values = series.dropna().head(5).tolist()

            columns.append({
                "name": col,
                "original_name": df.columns[df_clean.columns.get_loc(col)],
                "pandas_dtype": dtype,
                "semantic_type": semantic_type,
                "sqlite_type": infer_sqlite_type(series, semantic_type),
                "null_count": null_count,
                "null_percentage": round(null_count / total_count * 100, 2) if total_count > 0 else 0,
                "unique_count": unique_count,
                "unique_percentage": round(unique_count / total_count * 100, 2) if total_count > 0 else 0,
                "sample_values": sample_values,
                "stats": get_column_stats(series, dtype)
            })

        analysis["sheets"][sheet_name] = {
            "row_count": len(df_clean),
            "columns": columns
        }

    return analysis


def infer_semantic_type(series: pd.Series, dtype: str) -> str:
    if dtype in ('int64', 'float64', 'Int64', 'Float64'):
        if series.nunique() == len(series) and series.dtype in ('int64', 'Int64'):
            return "identifier"
        return "numeric"
    elif dtype == 'object':
        sample = series.dropna().head(20)
        if len(sample) > 0:
            date_like = sum(1 for v in sample if is_date_like(str(v))) / len(sample)
            if date_like > 0.5:
                return "date"
        if series.nunique() / len(series) < 0.1:
            return "categorical"
        return "text"
    elif 'datetime' in dtype:
        return "datetime"
    elif 'bool' in dtype:
        return "boolean"
    return "unknown"


def is_date_like(value: str) -> bool:
    import re
    date_patterns = [
        r'^\d{4}-\d{2}-\d{2}$',
        r'^\d{2}/\d{2}/\d{4}$',
        r'^\d{2}-\d{2}-\d{4}$',
        r'^\d{4}/\d{2}/\d{2}$',
    ]
    return any(re.match(p, value.strip()) for p in date_patterns)


def get_column_stats(series: pd.Series, dtype: str) -> Dict[str, Any]:
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


def detect_anomalies(df: pd.DataFrame, columns: List[Dict]) -> List[Dict[str, Any]]:
    """Detect anomalies in the dataframe."""
    anomalies = []

    for col_info in columns:
        col_name = col_info["name"]
        semantic_type = col_info["semantic_type"]
        series = df[col_name]

        # 1. Null anomalies
        null_count = int(series.isnull().sum())
        if null_count > 0:
            anomalies.append({
                "type": "null_values",
                "column": col_name,
                "count": null_count,
                "percentage": round(null_count / len(series) * 100, 2),
                "severity": "warning",
                "message": f"Column '{col_name}' has {null_count} null values ({round(null_count / len(series) * 100, 2)}%)"
            })

        # 2. Duplicate detection (for identifiers and categorical)
        if semantic_type in ("identifier", "categorical"):
            duplicate_count = int(series.duplicated().sum())
            if duplicate_count > 0:
                anomalies.append({
                    "type": "duplicates",
                    "column": col_name,
                    "count": duplicate_count,
                    "severity": "error" if semantic_type == "identifier" else "warning",
                    "message": f"Column '{col_name}' has {duplicate_count} duplicate values"
                })

        # 3. Numeric outliers (IQR method)
        if semantic_type == "numeric":
            clean = series.dropna()
            if len(clean) > 4:
                Q1 = clean.quantile(0.25)
                Q3 = clean.quantile(0.75)
                IQR = Q3 - Q1
                if IQR > 0:
                    lower = Q1 - 1.5 * IQR
                    upper = Q3 + 1.5 * IQR
                    outliers = clean[(clean < lower) | (clean > upper)]
                    if len(outliers) > 0:
                        anomalies.append({
                            "type": "numeric_outliers",
                            "column": col_name,
                            "count": len(outliers),
                            "outlier_values": outliers.head(10).tolist(),
                            "bounds": {"lower": float(lower), "upper": float(upper)},
                            "severity": "warning",
                            "message": f"Column '{col_name}' has {len(outliers)} outliers (IQR method)"
                        })

        # 4. Date range anomalies
        if semantic_type == "date":
            clean = series.dropna()
            if len(clean) > 0:
                # Try to parse dates
                try:
                    parsed_dates = pd.to_datetime(clean, errors='coerce')
                    valid_dates = parsed_dates.dropna()
                    if len(valid_dates) > 0:
                        min_date = valid_dates.min()
                        max_date = valid_dates.max()
                        today = pd.Timestamp.now()
                        future_dates = valid_dates[valid_dates > today]
                        if len(future_dates) > 0:
                            anomalies.append({
                                "type": "future_dates",
                                "column": col_name,
                                "count": len(future_dates),
                                "severity": "warning",
                                "message": f"Column '{col_name}' has {len(future_dates)} future dates"
                            })
                except:
                    pass

        # 5. Text format consistency
        if semantic_type == "text":
            clean = series.dropna().astype(str)
            if len(clean) > 0:
                # Check for leading/trailing spaces
                spaces = clean[clean != clean.str.strip()]
                if len(spaces) > 0:
                    anomalies.append({
                        "type": "whitespace",
                        "column": col_name,
                        "count": len(spaces),
                        "severity": "info",
                        "message": f"Column '{col_name}' has {len(spaces)} values with leading/trailing whitespace"
                    })

                # Check for case inconsistencies in categorical-like data
                if col_info["unique_count"] / len(series) < 0.3:
                    lower_counts = clean.str.lower().value_counts()
                    if len(lower_counts) < col_info["unique_count"]:
                        anomalies.append({
                            "type": "case_inconsistency",
                            "column": col_name,
                            "count": col_info["unique_count"] - len(lower_counts),
                            "severity": "info",
                            "message": f"Column '{col_name}' has case inconsistencies (e.g., 'Active' vs 'active')"
                        })

    return anomalies


def create_table_sql(table_name: str, columns: List[Dict]) -> str:
    """Generate CREATE TABLE SQL."""
    col_defs = []
    pk_cols = []

    for col in columns:
        col_name = col["name"]
        col_type = col["sqlite_type"]
        not_null = "NOT NULL" if col["null_count"] == 0 else ""
        col_defs.append(f"  {col_name} {col_type} {not_null}".strip())

        if col["semantic_type"] == "identifier":
            pk_cols.append(col_name)

    if pk_cols:
        col_defs.append(f"  PRIMARY KEY ({', '.join(pk_cols)})")

    return f"CREATE TABLE IF NOT EXISTS {table_name} (\n" + ",\n".join(col_defs) + "\n);"


def ingest_to_db(db_path: str, table_name: str, df: pd.DataFrame, columns: List[Dict], if_exists: str = "replace") -> Dict[str, Any]:
    """Ingest dataframe to SQLite."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create table
    create_sql = create_table_sql(table_name, columns)
    cursor.execute(create_sql)

    # Prepare insert
    col_names = [c["name"] for c in columns]
    placeholders = ", ".join(["?" for _ in col_names])
    insert_sql = f"INSERT OR REPLACE INTO {table_name} ({', '.join(col_names)}) VALUES ({placeholders})"

    # Convert data
    rows_inserted = 0
    rows_failed = 0
    failed_rows = []

    for idx, row in df.iterrows():
        try:
            values = []
            for col in columns:
                val = row[col["name"]]
                if pd.isna(val):
                    values.append(None)
                elif isinstance(val, (pd.Timestamp, datetime)):
                    values.append(val.isoformat())
                elif isinstance(val, (pd.Int64Dtype, pd.Float64Dtype)):
                    values.append(val if not pd.isna(val) else None)
                else:
                    values.append(val)
            cursor.execute(insert_sql, values)
            rows_inserted += 1
        except Exception as e:
            rows_failed += 1
            failed_rows.append({"row": int(idx), "error": str(e)})

    conn.commit()
    conn.close()

    return {
        "rows_inserted": rows_inserted,
        "rows_failed": rows_failed,
        "failed_rows": failed_rows[:10]  # Limit to first 10
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: ingest_excel.py '<json_request>'"}))
        sys.exit(1)

    try:
        request = json.loads(sys.argv[1])
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON request"}))
        sys.exit(1)

    action = request.get("action")
    file_path = request.get("file_path")
    db_path = request.get("db_path", "")
    table_name = request.get("table_name", "auto")
    if_exists = request.get("if_exists", "replace")

    if action != "ingest":
        print(json.dumps({"error": f"Unknown action: {action}"}))
        sys.exit(1)

    if not file_path:
        print(json.dumps({"error": "file_path required"}))
        sys.exit(1)

    if not os.path.exists(file_path):
        print(json.dumps({"error": f"File not found: {file_path}"}))
        sys.exit(1)

    db_path = resolve_db(db_path)

    try:
        # Analyze file
        analysis = analyze_excel_file(file_path)

        # For each sheet, detect anomalies and optionally ingest
        result = {
            "file_path": file_path,
            "db_path": db_path,
            "sheets": {}
        }

        for sheet_name, sheet_analysis in analysis["sheets"].items():
            if table_name == "auto":
                sheet_table_name = clean_column_name(sheet_name)
            else:
                sheet_table_name = table_name

            # Read the actual sheet data
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path, sheet_name=sheet_name)
            df.columns = [clean_column_name(c) for c in df.columns]

            # Detect anomalies
            anomalies = detect_anomalies(df, sheet_analysis["columns"])

            # Ingest if requested
            ingestion_result = None
            if request.get("ingest", False):
                ingestion_result = ingest_to_db(db_path, sheet_table_name, df, sheet_analysis["columns"], if_exists)

            result["sheets"][sheet_name] = {
                "table_name": sheet_table_name,
                "analysis": sheet_analysis,
                "anomalies": anomalies,
                "ingestion": ingestion_result,
                "anomaly_count": len(anomalies),
                "error_count": len([a for a in anomalies if a["severity"] == "error"]),
                "warning_count": len([a for a in anomalies if a["severity"] == "warning"]),
                "info_count": len([a for a in anomalies if a["severity"] == "info"])
            }

        print(json.dumps(result, indent=2, default=str))

    except Exception as e:
        print(json.dumps({"error": str(e), "type": type(e).__name__}))
        sys.exit(1)


if __name__ == "__main__":
    main()