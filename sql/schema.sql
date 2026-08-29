-- School Operations Responder Database Schema
-- SQLite/PostgreSQL compatible

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE NOT NULL,  -- e.g., "STU-2024-001"
    full_name TEXT NOT NULL,
    class_id INTEGER NOT NULL,
    section TEXT NOT NULL DEFAULT 'A',
    roll_number INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,  -- e.g., "Class 8"
    academic_year TEXT NOT NULL,  -- e.g., "2024-25"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,  -- e.g., "Mathematics", "Science", "English"
    code TEXT UNIQUE NOT NULL,  -- e.g., "MATH", "SCI", "ENG"
    max_marks INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,  -- e.g., "Term 1", "Mid Term", "Final"
    exam_date DATE NOT NULL,
    academic_year TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Marks table (core table for validation)
CREATE TABLE IF NOT EXISTS marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id),
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    exam_id INTEGER NOT NULL REFERENCES exams(id),
    marks_obtained INTEGER NOT NULL,
    max_marks INTEGER NOT NULL DEFAULT 100,
    entered_by TEXT,  -- teacher identifier
    entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_validated BOOLEAN DEFAULT FALSE,
    validation_notes TEXT,
    UNIQUE(student_id, subject_id, exam_id)
);

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT UNIQUE NOT NULL,  -- e.g., "EMP-001"
    full_name TEXT NOT NULL,
    subject_specialization TEXT,  -- e.g., "Mathematics, Physics"
    email TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Timetable table
CREATE TABLE IF NOT EXISTS timetable (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL REFERENCES classes(id),
    section TEXT NOT NULL DEFAULT 'A',
    period_number INTEGER NOT NULL,  -- 1-8
    day_of_week INTEGER NOT NULL,  -- 1=Monday, 7=Sunday
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    teacher_id INTEGER NOT NULL REFERENCES staff(id),
    room TEXT,
    academic_year TEXT NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    UNIQUE(class_id, section, period_number, day_of_week, academic_year)
);

-- Duty Ledger (fairness tracking)
CREATE TABLE IF NOT EXISTS duty_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id INTEGER NOT NULL REFERENCES staff(id),
    duty_type TEXT NOT NULL,  -- 'substitution', 'invigilation', 'extra_class'
    date_assigned DATE NOT NULL,
    period_number INTEGER,
    class_id INTEGER REFERENCES classes(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Syllabus Tracker
CREATE TABLE IF NOT EXISTS syllabus_tracker (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL REFERENCES classes(id),
    section TEXT NOT NULL DEFAULT 'A',
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    topic TEXT NOT NULL,
    planned_date DATE NOT NULL,
    completed_date DATE,
    completion_percentage INTEGER DEFAULT 0,  -- 0-100
    teacher_id INTEGER NOT NULL REFERENCES staff(id),
    academic_year TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lesson Plans
CREATE TABLE IF NOT EXISTS lesson_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL REFERENCES staff(id),
    class_id INTEGER NOT NULL REFERENCES classes(id),
    section TEXT NOT NULL DEFAULT 'A',
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    topic TEXT NOT NULL,
    period_number INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    content TEXT,  -- what to teach, activities, homework
    resources TEXT,  -- textbook pages, worksheets, links
    academic_year TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session Log (audit trail)
CREATE TABLE IF NOT EXISTS session_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    turn_id TEXT,
    event_type TEXT NOT NULL,  -- 'tool_call', 'sandbox_run', 'approval', 'user_message', 'agent_response'
    tool_name TEXT,
    tool_input TEXT,
    tool_output TEXT,
    approval_status TEXT,  -- 'pending', 'approved', 'denied'
    approval_reason TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_marks_student_exam ON marks(student_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_marks_subject_exam ON marks(subject_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_timetable_class_day ON timetable(class_id, section, day_of_week);
CREATE INDEX IF NOT EXISTS idx_duty_ledger_staff_date ON duty_ledger(staff_id, date_assigned);
CREATE INDEX IF NOT EXISTS idx_syllabus_class_subject ON syllabus_tracker(class_id, section, subject_id);
CREATE INDEX IF NOT EXISTS idx_session_log_session ON session_log(session_id, timestamp);