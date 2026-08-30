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
import sys
import os
import subprocess

# Add parent dirs to path so we can import sibling modules
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(SCRIPT_DIR)
MATCHING_DIR = os.path.join(PARENT_DIR, "matching")
ANALYTICS_DIR = os.path.join(PARENT_DIR, "analytics")

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

def run_python_script(script_path, args, db_path=None):
    """Run a Python script and return its JSON output.

    Supports two calling conventions:
    - Positional: script_path [--db db_path] [...args]
    - JSON: script_path '<json_request>'
    Scripts that accept only JSON (detect_duplicates, detect_gaps) are
    detected by the presence of a dict as the first element of args.
    """
    cmd = [sys.executable, script_path]
    if args and isinstance(args[0], dict):
        # JSON-mode: scripts that don't accept positional args
        request = args[0]
        if db_path:
            request["db_path"] = db_path
        cmd.append(json.dumps(request))
    else:
        if db_path:
            cmd.extend(["--db", db_path])
        cmd.extend(args)
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if result.returncode != 0:
        return {"error": result.stderr, "script": os.path.basename(script_path)}
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return {"raw_output": result.stdout, "script": os.path.basename(script_path)}

def validate_marks(db_path):
    """Run all 5 anomaly detectors and return a combined report."""
    validation_dir = os.path.join(PARENT_DIR, "validation")
    results = {
        "duplicates": run_python_script(
            os.path.join(validation_dir, "detect_duplicates.py"),
            [{"action": "detect_duplicates", "table": "students", "column": "roll_number"}],
            db_path
        ),
        "out_of_range": run_python_script(
            os.path.join(validation_dir, "detect_range.py"), [], db_path
        ),
        "order_break": run_python_script(
            os.path.join(validation_dir, "detect_order.py"), [], db_path
        ),
        "gaps": run_python_script(
            os.path.join(validation_dir, "detect_gaps.py"),
            [{"action": "detect_sequence_gaps", "table": "students", "column": "roll_number"}],
            db_path
        ),
        "iqr_outliers": _run_iqr_outlier_detection(db_path),
    }

    summary = {
        "total_anomalies": (
            results["duplicates"].get("duplicates_found", 0)
            + results["out_of_range"].get("out_of_range_found", 0)
            + results["order_break"].get("order_issues_found", 0)
            + results["gaps"].get("gaps_found", 0)
            + results["iqr_outliers"].get("count", 0)
        ),
        "breakdown": {
            "duplicates": results["duplicates"].get("duplicates_found", 0),
            "out_of_range": results["out_of_range"].get("out_of_range_found", 0),
            "order_breaks": results["order_break"].get("order_issues_found", 0),
            "gaps": results["gaps"].get("gaps_found", 0),
            "iqr_outliers": results["iqr_outliers"].get("count", 0),
        },
        "details": results,
    }
    return summary


def _run_iqr_outlier_detection(db_path):
    """Run IQR outlier detection on marks table with subject-level grouping."""
    validation_dir = os.path.join(PARENT_DIR, "validation")
    script = os.path.join(validation_dir, "detect_iqr_outliers.py")
    result = run_python_script(script, [
        "--db", db_path,
        "--table", "marks",
        "--column", "marks_obtained",
        "--group-by", "subject_id",
    ])
    return result


def validate_marks_iqr(db_path, table="marks", column="marks_obtained", group_by=None):
    """Run IQR outlier detection with severity levels.

    Args:
        db_path: Path to SQLite database
        table: Table name to analyze (default: marks)
        column: Numeric column to check (default: marks_obtained)
        group_by: Optional column to group by (e.g. subject_id for per-subject analysis)
    """
    validation_dir = os.path.join(PARENT_DIR, "validation")
    args = ["--db", db_path, "--table", table, "--column", column]
    if group_by:
        args.extend(["--group-by", group_by])
    result = run_python_script(
        os.path.join(validation_dir, "detect_iqr_outliers.py"), args
    )
    return result

def propose_substitution(absent_subject, db_path):
    """Run substitution_match.py for the absent teacher's subject."""
    result = run_python_script(
        os.path.join(MATCHING_DIR, "substitution_match.py"),
        [absent_subject],
        db_path,
    )
    return result

def propose_syllabus_swap(class_section, db_path):
    """Run syllabus_swap.py for the given class section."""
    result = run_python_script(
        os.path.join(MATCHING_DIR, "syllabus_swap.py"),
        [class_section],
        db_path,
    )
    return result

def generate_rank_list(exam_name, subject_name, db_path):
    """Run rank_list.py for the given exam and subject."""
    result = run_python_script(
        os.path.join(ANALYTICS_DIR, "rank_list.py"),
        [exam_name, subject_name],
        db_path,
    )
    return result

def generate_class_summary(class_section, exam_name, db_path):
    """Run class_summary.py for the given class and exam."""
    result = run_python_script(
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
    import sqlite3
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
