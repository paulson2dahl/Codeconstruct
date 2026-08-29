#!/usr/bin/env node
/**
 * verify-seed.mjs — Verifies that the seed database has expected counts.
 * Output: seed_ok on success.
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

    const studentCount = (await db.get("SELECT COUNT(*) as cnt FROM students")).cnt;
    const subjectCount = (await db.get("SELECT COUNT(*) as cnt FROM subjects")).cnt;
    const examCount = (await db.get("SELECT COUNT(*) as cnt FROM exams")).cnt;
    const markCount = (await db.get("SELECT COUNT(*) as cnt FROM marks")).cnt;
    const staffCount = (await db.get("SELECT COUNT(*) as cnt FROM staff")).cnt;

    // Verify expectations: 40 students (39 with rolls + 3 gaps + 1 duplicate), 5 subjects, 3 exams,
    // 40*5*3 = 600 marks rows, 8 staff
    if (studentCount !== 40) {
      console.error(`Expected 40 students (39 unique + 1 duplicate, minus 3 gap rolls + dup), got ${studentCount}`);
      process.exit(1);
    }
    if (subjectCount !== 5) {
      console.error(`Expected 5 subjects, got ${subjectCount}`);
      process.exit(1);
    }
    if (examCount !== 3) {
      console.error(`Expected 3 exams, got ${examCount}`);
      process.exit(1);
    }
    if (markCount !== 600) {
      console.error(`Expected 600 marks rows (40*5*3), got ${markCount}`);
      process.exit(1);
    }
    if (staffCount !== 8) {
      console.error(`Expected 8 staff, got ${staffCount}`);
      process.exit(1);
    }

    // Verify rolls 15, 22, 38 are missing (gaps)
    const presentRolls = await db.all(
      "SELECT roll_number FROM students WHERE section='A' ORDER BY roll_number"
    );
    const rolls = presentRolls.map(r => r.roll_number);
    for (const gapRoll of [15, 22, 38]) {
      if (rolls.includes(gapRoll)) {
        console.error(`Gap roll ${gapRoll} should be missing but was found`);
        process.exit(1);
      }
    }

    // Verify out-of-range mark exists (152)
    const over100 = (await db.get(
      "SELECT COUNT(*) as cnt FROM marks WHERE marks_obtained > 100"
    )).cnt;
    if (over100 < 1) {
      console.error(`Expected at least 1 out-of-range mark (>100), got ${over100}`);
      process.exit(1);
    }

    // Verify duplicate name pattern exists (at least 2 Rohan Singh/Sharma variants)
    const dupVariants = await db.all(
      "SELECT full_name FROM students WHERE full_name LIKE '%Rohan%Singh%' OR full_name LIKE '%Rohan K.%'"
    );
    if (dupVariants.length < 2) {
      console.error(`Expected at least 2 Rohan name variants for duplicate anomaly, got ${dupVariants.length}`);
      process.exit(1);
    }

    await db.close();
    console.log('seed_ok');
  } catch (err) {
    if (err.code === 'SQLITE_CANTOPEN') {
      console.error('Database file not found. Run seed-database.py first.');
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}

main();
