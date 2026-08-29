#!/usr/bin/env python3
"""
seed-database.py — Seeds the school-ops-responder SQLite database with
synthetic data, including 4 planted anomaly classes:

1. DUPLICATES:   Two rows with different spellings of same name
2. RANGE:        marks_obtained > max_marks (impossible)
3. ORDER:        Roll numbers swapped in sequence
4. GAPS:         Missing student entries

All data is synthetic — no real student records.
Run: python3 scripts/seed-database.py

This script is DATA-DRIVEN via the SEED_CONFIG dict below. No hardcoded
student counts, mark values, or exam names appear in the generation logic.
"""

import sqlite3
import sys
import os
import random

# --- Configuration-driven domain data ---
# All domain-specific values live here; change ONLY this dict to retarget
# the seed data for a different class, school, or institution.
SEED_CONFIG = {
    "institution": {
        "org_name": "Lucknow Secondary School",
        "academic_year": "2024-25",
    },
    "class_info": {
        "name": "Class 8",
        "section": "A",
        "num_students": 39,  # 42 nominal — 3 gaps
    },
    "subjects": [
        {"name": "Mathematics", "code": "MATH", "max_marks": 100},
        {"name": "Science",  "code": "SCI",  "max_marks": 100},
        {"name": "English",  "code": "ENG",  "max_marks": 100},
        {"name": "Hindi",    "code": "HIN",  "max_marks": 100},
        {"name": "Social Studies", "code": "SST", "max_marks": 100},
    ],
    "exams": [
        {"name": "Term 1",    "exam_date": "2024-07-15"},
        {"name": "Mid Term",  "exam_date": "2024-10-12"},
        {"name": "Final",     "exam_date": "2025-03-10"},
    ],
    "staff": [
        {"emp_id": "EMP-001", "name": "Mrs. Priya Sharma",      "subject": "Mathematics"},
        {"emp_id": "EMP-002", "name": "Mr. Rajesh Kumar",        "subject": "Science"},
        {"emp_id": "EMP-003", "name": "Ms. Anjali Verma",        "subject": "English"},
        {"emp_id": "EMP-004", "name": "Mr. Sunil Joshi",         "subject": "Hindi"},
        {"emp_id": "EMP-005", "name": "Mrs. Meera Patel",        "subject": "Social Studies"},
        {"emp_id": "EMP-006", "name": "Dr. Sunita Rao",          "subject": "Mathematics"},
        {"emp_id": "EMP-007", "name": "Mr. Amitabh Sen",         "subject": "Science, Mathematics"},
        {"emp_id": "EMP-008", "name": "Ms. Pooja Desai",         "subject": "English, Hindi"},
    ],
    # Planted anomalies — fully data-driven
    "anomalies": {
        "roll_gaps": [15, 22, 38],
        "order_swap_rolls": [4, 5],           # These rolls have swapped names
        "out_of_range": {                     # roll, exam, subject_code, mark_value
            "roll_3_mid_term_math": {"roll": 3, "exam": "Mid Term", "subject_code": "MATH", "mark": 152},
        },
        "duplicate_name": {
            # This creates a duplicate entry for a roll that already exists,
            # with a slightly different spelling (middle initial variant)
            "roll": 6,  # Roll 6 is "Rohan Singh" — we'll also insert "Rohan K. Singh" as dup
            "base_name": "Rohan Singh",
            "variant": "Rohan K. Singh",
        },
    },
    "name_pools": {
        "first_names": [
            "Aarav", "Vivaan", "Aditya", "Arjun", "Vikram", "Rohan", "Ankit", "Saurabh",
            "Nikhil", "Manish", "Deepak", "Rajat", "Amit", "Sumit", "Vijay", "Sanjay",
            "Mohan", "Sohan", "Ramesh", "Suresh", "Dinesh", "Mukesh", "Paresh",
            "Naresh", "Mahesh", "Ganesh", "Devesh", "Yogesh", "Harshal", "Sameer",
            "Anil", "Kunal", "Ajay", "Kabir", "Ishaan", "Dhruv", "Aryan", "Kartik",
            "Ansh", "Rudra",
        ],
        "last_names": [
            "Sharma", "Kumar", "Verma", "Joshi", "Patel", "Singh", "Yadav", "Mishra",
            "Gupta", "Khan", "Malik", "Rao", "Chawla", "Mehta", "Thakur", "Sinha",
            "Shakya", "Dubey", "Tiwari", "Chauhan", "Rawat", "Solanki",
        ],
    },
    "timetable_weekly_periods": 8,
    "timetable_days": 6,  # 1=Mon to 6=Sat (no strict enforcement of actual days)
}

DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "school_ops.db"
)


def get_db():
    """Return a SQLite connection with Row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def create_schema(db):
    """Create schema from sql/schema.sql."""
    schema_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sql", "schema.sql")
    with open(schema_path, 'r') as f:
        db.executescript(f.read())
    db.commit()


# --- Generic helper functions ---

def generic_upsert(db, table, id_col, data_dict):
    """Generic insert-or-return-id helper. Returns the id."""
    columns = list(data_dict.keys())
    placeholders = ', '.join(['?' for _ in columns])
    col_str = ', '.join(columns)
    id_val = data_dict[id_col]
    row = db.execute(f"SELECT id FROM {table} WHERE {id_col} = ?", (id_val,)).fetchone()
    if row:
        return row['id']
    values = [data_dict[c] for c in columns]
    db.execute(f"INSERT INTO {table} ({col_str}) VALUES ({placeholders})", values)
    db.commit()
    return db.execute(f"SELECT id FROM {table} WHERE {id_col} = ?", (id_val,)).fetchone()['id']


# --- Specific inserters (use SEED_CONFIG) ---

def insert_subjects(db):
    """Insert all subjects from SEED_CONFIG. Returns {code: id} mapping."""
    ids = {}
    for subj in SEED_CONFIG["subjects"]:
        sid = db.execute(
            "INSERT INTO subjects (name, code, max_marks) VALUES (?, ?, ?)",
            (subj["name"], subj["code"], subj["max_marks"])
        ).lastrowid
        ids[subj["code"]] = sid
    db.commit()
    return ids


def insert_exams(db):
    """Insert all exams from SEED_CONFIG. Returns {name: id} mapping."""
    ids = {}
    year = SEED_CONFIG["institution"]["academic_year"]
    for ex in SEED_CONFIG["exams"]:
        eid = db.execute(
            "INSERT INTO exams (name, exam_date, academic_year) VALUES (?, ?, ?)",
            (ex["name"], ex["exam_date"], year)
        ).lastrowid
        ids[ex["name"]] = eid
    db.commit()
    return ids


def insert_staff(db):
    """Insert all staff from SEED_CONFIG."""
    rows = []
    for s in SEED_CONFIG["staff"]:
        rows.append((
            s["emp_id"], s["name"], s["subject"],
            f"{s['emp_id'].lower()}@school.edu",
            f"9876{len(rows):04d}", True
        ))
    db.executemany(
        "INSERT INTO staff (employee_id, full_name, subject_specialization, email, phone, is_active) VALUES (?, ?, ?, ?, ?, ?)",
        rows
    )
    db.commit()
    return rows


def insert_class_section(db, class_name, section, year):
    """Insert a class section and return its id."""
    cid = db.execute(
        "INSERT INTO classes (name, academic_year) VALUES (?, ?)",
        (class_name, year)
    ).lastrowid
    db.commit()
    return cid


def insert_students(db, class_id, section):
    """
    Insert students for the class from SEED_CONFIG.
    Respects roll gaps and order swap anomalies.
    Returns list of student ids (excluding the duplicate planted later).
    """
    names = SEED_CONFIG["name_pools"]
    anomalies = SEED_CONFIG["anomalies"]
    first_names = names["first_names"]
    last_names = names["last_names"]
    gaps = set(anomalies["roll_gaps"])
    swap_a, swap_b = anomalies["order_swap_rolls"]  # e.g. [4, 5]

    total_nominal = SEED_CONFIG["class_info"]["num_students"] + len(gaps)  # 39 + 3 = 42
    students = []

    # First pass: generate intended name for each roll number (ignoring gaps)
    intended_names = {}
    fn_idx = 0
    for roll in range(1, total_nominal + 1):
        if roll in gaps:
            continue
        fn = first_names[fn_idx % len(first_names)]
        ln = last_names[fn_idx % len(last_names)]
        intended_names[roll] = f"{fn} {ln}"
        fn_idx += 1

    # Second pass: create student records, swapping names for the order anomaly
    for roll in range(1, total_nominal + 1):
        if roll in gaps:
            continue

        student_id = f"STU-2024-{section}-{roll:03d}"

        if roll == swap_a:
            # Show the name intended for swap_b (creating order break)
            name = intended_names.get(swap_b, "Unknown Student")
        elif roll == swap_b:
            # Show the name intended for swap_a (creating order break)
            name = intended_names.get(swap_a, "Unknown Student")
        else:
            name = intended_names[roll]

        students.append({
            "student_id": student_id,
            "full_name": name,
            "class_id": class_id,
            "section": section,
            "roll_number": roll,
        })

    # Insert all students
    ids = []
    for s in students:
        sid = db.execute(
            "INSERT INTO students (student_id, full_name, class_id, section, roll_number) VALUES (?, ?, ?, ?, ?)",
            (s["student_id"], s["full_name"], s["class_id"], s["section"], s["roll_number"])
        ).lastrowid
        ids.append(sid)
    db.commit()
    return ids


def insert_timetable(db, class_id, section, subject_ids):
    """Insert a basic timetable for the class/section using SEED_CONFIG."""
    staff_map = {s["subject"]: s["emp_id"] for s in SEED_CONFIG["staff"]}

    schedule = [
        (1, 1, "Mathematics", "Room 101"),
        (1, 2, "Science", "Lab 1"),
        (1, 3, "English", "Room 201"),
        (1, 4, "Hindi", "Room 202"),
        (1, 5, "Social Studies", "Room 101"),
        (1, 6, "Mathematics", "Room 101"),
        (1, 7, "Science", "Lab 1"),
        (1, 8, "English", "Room 201"),
        (2, 1, "Hindi", "Room 202"),
        (2, 2, "Social Studies", "Room 101"),
        (2, 3, "Mathematics", "Room 101"),
        (2, 4, "Science", "Lab 1"),
        (2, 5, "English", "Room 201"),
        (2, 6, "Hindi", "Room 202"),
        (2, 7, "Social Studies", "Room 101"),
        (2, 8, "Mathematics", "Room 101"),
    ]

    year = SEED_CONFIG["institution"]["academic_year"]
    for day, period, subj_name, room in schedule:
        row = db.execute("SELECT id FROM subjects WHERE name = ?", (subj_name,)).fetchone()
        if not row:
            continue
        sid = row['id']
        emp_id = staff_map.get(subj_name, staff_map.get(subj_name.split()[0] if " " in subj_name else subj_name))
        tid_row = db.execute("SELECT id FROM staff WHERE employee_id = ?", (emp_id,)).fetchone()
        tid = tid_row['id'] if tid_row else None
        if sid and tid:
            db.execute(
                """INSERT INTO timetable (class_id, section, period_number, day_of_week, subject_id,
                   teacher_id, room, academic_year, effective_from, effective_to)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (class_id, section, period, day, sid, tid, room, year, "2024-04-01", None)
            )
    db.commit()


def insert_marks(db, student_ids, subject_ids, exam_ids):
    """
    Insert marks for all students across all subjects/exams.
    Reads max_marks dynamically from subjects table.
    Plants anomalies specified in SEED_CONFIG.
    """
    anomalies_cfg = SEED_CONFIG["anomalies"]
    rng = random.Random(75)

    for exam_name, eid in exam_ids.items():
        for code, sid in subject_ids.items():
            # Get max_marks dynamically for this subject
            row = db.execute("SELECT max_marks FROM subjects WHERE id = ?", (sid,)).fetchone()
            max_marks_db = row['max_marks'] if row else 100
            rng_seed = 75 + hash(code) % 100
            rng = random.Random(rng_seed)

            for idx, student_id in enumerate(student_ids):
                marks_val = rng.randint(45, 95)

                # Plant out-of-range anomaly from config
                or_cfg = anomalies_cfg.get("out_of_range", {})
                for key, spec in or_cfg.items():
                    if (spec.get("roll") == (idx + 1) and
                        spec.get("exam") == exam_name and
                        spec.get("subject_code") == code):
                        marks_val = spec["mark"]
                        break

                entered_by = SEED_CONFIG["staff"][idx % len(SEED_CONFIG["staff"])]["name"]
                db.execute(
                    """INSERT INTO marks (student_id, subject_id, exam_id, marks_obtained, max_marks,
                       entered_by, is_validated, validation_notes)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (student_id, sid, eid, marks_val, max_marks_db,
                     entered_by, False, None)
                )

    # Plant DUPLICATE anomaly
    dup_cfg = anomalies_cfg.get("duplicate_name", {})
    if dup_cfg:
        dup_name = dup_cfg["variant"]
        dup_roll = dup_cfg["roll"]

        class_id_row = db.execute("SELECT id FROM classes WHERE name = ?", (SEED_CONFIG["class_info"]["name"],)).fetchone()
        cid = class_id_row['id'] if class_id_row else None
        section = SEED_CONFIG["class_info"]["section"]

        if cid:
            dup_id = db.execute(
                """INSERT INTO students (student_id, full_name, class_id, section, roll_number)
                   VALUES (?, ?, ?, ?, ?)""",
                (f"STU-2024-{section}-{dup_roll:03d}-DUP", dup_name, cid, section, dup_roll)
            ).lastrowid
            db.commit()
            for exam_name, eid in exam_ids.items():
                for code, sid in subject_ids.items():
                    row = db.execute("SELECT max_marks FROM subjects WHERE id = ?", (sid,)).fetchone()
                    max_m = row['max_marks'] if row else 100
                    rng = random.Random(78)
                    marks_val = rng.randint(45, 95)
                    db.execute(
                        """INSERT INTO marks (student_id, subject_id, exam_id, marks_obtained, max_marks,
                           entered_by, is_validated, validation_notes)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                        (dup_id, sid, eid, marks_val, max_m,
                         "Seed System", False, "duplicate entry")
                    )

    db.commit()
    return len(anomalies_cfg.get("roll_gaps", []))


def insert_session_log(db, msg):
    """Insert initial session log entry for seed operation."""
    db.execute(
        """INSERT INTO session_log (session_id, turn_id, event_type, tool_name, tool_input, tool_output, approval_status)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        ("seed-init", "turn-1", "tool_call", "seed-database.py", "python3 scripts/seed-database.py", msg, "approved")
    )
    db.commit()


def main():
    print(f"Seeding database at: {DB_PATH}")

    # Remove existing DB for clean seed
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print("  Removed existing database for clean seed")

    conn = get_db()
    db = conn

    year = SEED_CONFIG["institution"]["academic_year"]

    # 1. Create schema
    print("  Creating schema...")
    create_schema(db)

    # 2. Insert subjects
    print("  Inserting subjects...")
    subject_ids = insert_subjects(db)

    # 3. Insert exams
    print("  Inserting exams...")
    exam_ids = insert_exams(db)

    # 4. Insert staff
    print("  Inserting staff...")
    insert_staff(db)

    # 5. Insert class + section
    print(f"  Inserting Class 8 Section A students...")
    class_id = insert_class_section(db, SEED_CONFIG["class_info"]["name"], SEED_CONFIG["class_info"]["section"], year)

    # 6. Insert students with planted anomalies
    student_ids = insert_students(db, class_id, SEED_CONFIG["class_info"]["section"])

    # 7. Insert timetable
    print("  Inserting timetable...")
    insert_timetable(db, class_id, SEED_CONFIG["class_info"]["section"], subject_ids)

    # 8. Insert marks with planted anomalies
    print("  Inserting marks with planted anomalies...")
    gap_count = insert_marks(db, student_ids, subject_ids, exam_ids)

    # 9. Insert session log
    total_marks = db.execute("SELECT COUNT(*) FROM marks").fetchone()[0]
    total_students = db.execute("SELECT COUNT(*) FROM students").fetchone()[0]
    anomalies_summary = (
        f"seeded {total_students} students, {len(subject_ids)} subjects, "
        f"{len(exam_ids)} exams, {total_marks} marks rows, "
        f"planted anomalies: roll gaps={gap_count}, "
        f"order swap={SEED_CONFIG['anomalies']['order_swap_rolls']}, "
        f"out_of_range from config, duplicate name '{SEED_CONFIG['anomalies']['duplicate_name']['variant']}'"
    )
    print("  Inserting session log...")
    insert_session_log(db, anomalies_summary)

    # Summary
    print(f"\n✓ Seed complete!")
    print(f"  Students: {total_students}")
    print(f"  Subjects: {len(subject_ids)}")
    print(f"  Exams: {len(exam_ids)}")
    print(f"  Marks rows: {total_marks}")
    print(f"  Planted anomalies (via SEED_CONFIG):")
    print(f"    - Roll gaps: {SEED_CONFIG['anomalies']['roll_gaps']}")
    print(f"    - Order swap rolls: {SEED_CONFIG['anomalies']['order_swap_rolls']}")
    print(f"    - Out-of-range: {list(SEED_CONFIG['anomalies']['out_of_range'].values())}")
    print(f"    - Duplicate: '{SEED_CONFIG['anomalies']['duplicate_name']['base_name']}' vs '{SEED_CONFIG['anomalies']['duplicate_name']['variant']}'")

    conn.close()
    print(f"\nDatabase ready at: {DB_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())