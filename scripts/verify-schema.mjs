#!/usr/bin/env node
/**
 * verify-schema.mjs — Verifies that the DB schema was created correctly.
 * Output: schema_ok on success, error message on failure.
 */
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, '..', 'school_ops.db');

async function main() {
  try {
    const db = await open({ filename: DB_PATH, driver: sqlite3.Database });

    // Check that all required tables exist
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    const tableNames = tables.map(t => t.name);

    const requiredTables = [
      'students', 'classes', 'subjects', 'exams', 'marks',
      'staff', 'timetable', 'duty_ledger', 'syllabus_tracker',
      'lesson_plans', 'session_log'
    ];

    const missing = requiredTables.filter(t => !tableNames.includes(t));
    if (missing.length > 0) {
      console.error(`Missing tables: ${missing.join(', ')}`);
      process.exit(1);
    }

    // Check indexes
    const indexes = await db.all(
      "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'"
    );
    if (indexes.length < 5) {
      console.error(`Expected at least 5 indexes, found ${indexes.length}`);
      process.exit(1);
    }

    // Check marks table has expected columns
    const markCols = await db.all("PRAGMA table_info(marks)");
    const markColNames = markCols.map(c => c.name);
    const requiredMarkCols = ['student_id', 'subject_id', 'exam_id', 'marks_obtained', 'max_marks'];
    const missingCols = requiredMarkCols.filter(c => !markColNames.includes(c));
    if (missingCols.length > 0) {
      console.error(`Missing marks columns: ${missingCols.join(', ')}`);
      process.exit(1);
    }

    await db.close();
    console.log('schema_ok');
  } catch (err) {
    if (err.code === 'SQLITE_CANTOPEN' || err.code === 'SQLITE_NOMEM') {
      console.error('Database file not found. Run seed-database.py first.');
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}

main();
