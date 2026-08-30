#!/usr/bin/env python3
"""
run_validation.py — TrueForge Code Mode entry point for the School Operations Responder.

This script runs INSIDE the TrueForge sandbox (via Code Mode / Programmatic Tool Calling).
The AI agent sends a JSON request via stdin or CLI args, and the script runs the
appropriate validation/matching/analytics scripts and returns structured JSON.

Usage (from agent Code Mode):
  python3 run_validation.py '{"action": "validate_marks", "db_path": "/sandbox/school_ops.db"}'

Actions:
  validate_marks      — Run all 5 anomaly detectors (duplicates, range, order, gaps, IQR outliers)
  validate_marks_iqr  — Run IQR outlier detection with severity levels and optional grouping
  substitution        — Propose substitution for absent_subject
  syllabus_swap       — Propose syllabus period swaps for class_section
  rank_list           — Generate rank list for exam + subject
  class_summary       — Generate per-class summary for exam
  apply_correction    — Apply an approved mark correction (after human approval)

Output: JSON to stdout (consumed by the TrueForge event stream)
"""

import json
import re
import sqlite3
import sys
import os
import subprocess

# Add parent dirs to path so we can import sibling modules
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(SCRIPT_DIR)
MATCHING_DIR = os.path.join(PARENT_DIR, "matching")
ANALYTICS_DIR = os.path.join(PARENT_DIR, "analytics")

# Strict allowlist pattern for SQL identifiers (table / column names).
# Rejects spaces, quotes, parentheses, semicolons, comments, anything that
# could turn an identifier into an expression or DDL.
_SQL_IDENT_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def resolve_db(db_path):
    """Resolve database path relative to sandbox mount."""
    if db_path:
        return db_path
    # Check common locations
    possible = [
        "/sandbox/school_ops.db",
        os.path.join(os.getcwd(), "school_ops.db"),
        os.path.join(PARENT_DIR, "school_ops.db"),
    ]
    for p in possible:
        if os.path.exists(p):
            return p
    return os.path.join(os.getcwd(), "school_ops.db")


def validate_identifier(name: str, kind: str) -> str:
    """Validate that a request-supplied SQL identifier is safe.

    SQLite cannot bind identifiers as parameters, so request-controlled
    names must be matched against a strict regex AND verified to exist in
    the database schema before being interpolated into SQL.
    """
    if not isinstance(name, str) or not _SQL_IDENT_RE.match(name):
        raise ValueError(f"invalid {kind} identifier: {name!r}")
    return name


def identifier_exists_in_schema(db_path: str, table: str, column: str = None) -> bool:
    """Return True iff `table` (and optional `column`) exist in the SQLite schema."""
    conn = sqlite3.connect(db_path)
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",
            (table,),
        )
        if cur.fetchone() is None:
            return False
        if column is None:
            return True
        cur.execute(f"PRAGMA table_info({table})", ())  # identifier is already validated
        cols = {row[1] for row in cur.fetchall()}
        return column in cols
    finally:
        conn.close()


def run_python_script_positional(script_path, args, db_path=None):
    """Run a script that uses positional argv parsing (legacy detectors,
    matching, analytics). db_path is appended as the last positional arg."""
    cmd = [sys.executable, script_path]
    cmd.extend(args)
    if db_path:
        cmd.append(db_path)
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if result.returncode != 0:
        return {"error": result.stderr.strip(), "script": os.path.basename(script_path)}
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return {"raw_output": result.stdout, "script": os.path.basename(script_path)}


def run_python_script_json(script_path, request):
    """Run a script that expects a JSON request as the single CLI argument."""
    cmd = [sys.executable, script_path, json.dumps(request)]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if result.returncode != 0:
        return {"error": result.stderr.strip(), "script": os.path.basename(script_path)}
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return {"raw_output": result.stdout, "script": os.path.basename(script_path)}


def run_python_script_argparse(script_path, args):
    """Run a script that uses argparse (e.g. detect_iqr_outliers)."""
    cmd = [sys.executable, script_path]
    cmd.extend(args)
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if result.returncode != 0:
        return {"error": result.stderr.strip(), "script": os.path.basename(script_path)}
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return {"raw_output": result.stdout, "script": os.path.basename(script_path)}


def validate_marks(db_path):
    """Run all 5 anomaly detectors and return a combined report.

    Each detector uses the calling convention its CLI implements; the
    summary normalises all of their return schemas into a single shape.
    """
    validation_dir = os.path.join(PARENT_DIR, "validation")
    results = {
        "duplicates": run_python_script_json(
            os.path.join(validation_dir, "detect_duplicates.py"),
            {"action": "detect_duplicates", "table": "students", "column": "roll_number", "db_path": db_path},
        ),
        "out_of_range": run_python_script_positional(
            os.path.join(validation_dir, "detect_range.py"), [], db_path
        ),
        "order_break": run_python_script_positional(
            os.path.join(validation_dir, "detect_order.py"), [], db_path
        ),
        "gaps": run_python_script_json(
            os.path.join(validation_dir, "detect_gaps.py"),
            {"action": "detect_sequence_gaps", "table": "students", "column": "roll_number", "db_path": db_path},
        ),
        "iqr_outliers": _run_iqr_outlier_detection(db_path, "marks", "marks_obtained", "subject_id"),
    }

    # Normalise each detector's count fields into a single "anomalies" count.
    breakdown = {
        "duplicates": results["duplicates"].get("duplicate_groups", 0)
                      or results["duplicates"].get("duplicates_found", 0),
        "out_of_range": results["out_of_range"].get("out_of_range_found", 0),
        "order_breaks": results["order_break"].get("order_issues_found", 0),
        "gaps": results["gaps"].get("gap_count", 0)
                or results["gaps"].get("gaps_found", 0)
                or results["gaps"].get("gap_issues_found", 0),
        "iqr_outliers": results["iqr_outliers"].get("count", 0),
    }
    return {
        "total_anomalies": sum(breakdown.values()),
        "breakdown": breakdown,
        "details": results,
    }


def _run_iqr_outlier_detection(db_path, table, column, group_by=None):
    """Run IQR outlier detection with strict identifier validation.

    Rejects table/column/group_by names that do not match the regex
    allowlist or do not exist in the database schema.
    """
    try:
        table_q = validate_identifier(table, "table")
        column_q = validate_identifier(column, "column")
        group_q = validate_identifier(group_by, "group_by") if group_by else None
    except ValueError as e:
        return {"error": str(e), "count": 0, "outliers": []}

    if not identifier_exists_in_schema(db_path, table_q, column_q):
        return {
            "error": f"column {table_q}.{column_q} not found",
            "count": 0,
            "outliers": [],
        }
    if group_q and not identifier_exists_in_schema(db_path, table_q, group_q):
        return {
            "error": f"group_by column {table_q}.{group_q} not found",
            "count": 0,
            "outliers": [],
        }

    validation_dir = os.path.join(PARENT_DIR, "validation")
    args = ["--db", db_path, "--table", table_q, "--column", column_q]
    if group_q:
        args.extend(["--group-by", group_q])
    return run_python_script_argparse(
        os.path.join(validation_dir, "detect_iqr_outliers.py"), args
    )


def validate_marks_iqr(db_path, table="marks", column="marks_obtained", group_by=None):
    """Run IQR outlier detection with severity levels and identifier validation."""
    return _run_iqr_outlier_detection(db_path, table, column, group_by)


def propose_substitution(absent_subject, db_path):
    """Run substitution_match.py for the absent teacher's subject."""
    result = run_python_script_positional(
        os.path.join(MATCHING_DIR, "substitution_match.py"),
        [absent_subject],
        db_path,
    )
    return result


def propose_syllabus_swap(class_section, db_path):
    """Run syllabus_swap.py for the given class section."""
    result = run_python_script_positional(
        os.path.join(MATCHING_DIR, "syllabus_swap.py"),
        [class_section],
        db_path,
    )
    return result


def generate_rank_list(exam_name, subject_name, db_path):
    """Run rank_list.py for the given exam and subject."""
    result = run_python_script_positional(
        os.path.join(ANALYTICS_DIR, "rank_list.py"),
        [exam_name, subject_name],
        db_path,
    )
    return result


def generate_class_summary(class_section, exam_name, db_path):
    """Run class_summary.py for the given class and exam."""
    result = run_python_script_positional(
        os.path.join(ANALYTICS_DIR, "class_summary.py"),
        [class_section, exam_name],
        db_path,
    )
    return result


def apply_correction(corrections, db_path):
    """
    Apply approved corrections to the database.
    Called ONLY after human approval via the tool approval gate.

    Args:
        corrections: list of {student_id, subject_id, exam_id, marks_obtained, max_marks, reason}
        db_path: path to SQLite database
    """
    db_path = resolve_db(db_path)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    applied = []
    errors = []
    for corr in corrections:
        try:
            cursor.execute("""
                UPDATE marks SET marks_obtained = ?, max_marks = ?,
                                 is_validated = TRUE,
                                 validation_notes = ?
                WHERE student_id = ? AND subject_id = ? AND exam_id = ?
            """, (
                corr["marks_obtained"],
                corr.get("max_marks", 100),
                f"Corrected: {corr.get('reason', 'N/A')}",
                corr["student_id"],
                corr["subject_id"],
                corr["exam_id"],
            ))
            applied.append({
                "student_id": corr["student_id"],
                "subject_id": corr["subject_id"],
                "exam_id": corr["exam_id"],
                "old_marks": None,
                "new_marks": corr["marks_obtained"],
            })
        except Exception as e:
            errors.append({"correction": corr, "error": str(e)})
    conn.commit()
    conn.close()
    return {"applied": applied, "errors": errors, "total": len(corrections)}


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: run_validation.py '<json_request>'"}))
        sys.exit(1)

    try:
        request = json.loads(sys.argv[1])
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON request"}))
        sys.exit(1)

    action = request.get("action")
    db_path = resolve_db(request.get("db_path"))

    if action == "validate_marks":
        result = validate_marks(db_path)
    elif action == "validate_marks_iqr":
        result = validate_marks_iqr(
            db_path,
            table=request.get("table", "marks"),
            column=request.get("column", "marks_obtained"),
            group_by=request.get("group_by"),
        )
    elif action == "substitution":
        result = propose_substitution(request.get("absent_subject"), db_path)
    elif action == "syllabus_swap":
        result = propose_syllabus_swap(request.get("class_section"), db_path)
    elif action == "rank_list":
        result = generate_rank_list(
            request.get("exam_name"), request.get("subject_name"), db_path
        )
    elif action == "class_summary":
        result = generate_class_summary(
            request.get("class_section"), request.get("exam_name"), db_path
        )
    elif action == "apply_correction":
        result = apply_correction(request.get("corrections", []), db_path)
    else:
        result = {"error": f"Unknown action: {action}"}

    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
