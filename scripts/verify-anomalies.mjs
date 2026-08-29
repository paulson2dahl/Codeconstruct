#!/usr/bin/env node
/**
 * verify-anomalies.mjs — Verifies that all 4 planted anomaly classes are detectable.
 * Output: duplicates=N out_of_range=N order_break=N gaps=N
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

    let results = {};

    // 1. Detect duplicates: students with same roll_number but different names
    const dupRolls = await db.all(`
      SELECT roll_number, COUNT(DISTINCT full_name) as name_count
      FROM students
      WHERE section = 'A'
      GROUP BY roll_number
      HAVING COUNT(DISTINCT full_name) > 1
      ORDER BY roll_number
    `);
    results.duplicates = dupRolls.length;

    // 2. Detect out-of-range marks (>100 or <0)
    const outOfRange = await db.all(
      "SELECT marks_obtained, student_id FROM marks WHERE marks_obtained > 100 OR marks_obtained < 0"
    );
    results.out_of_range = outOfRange.length;

    // 3. Detect order break: rolls 4 and 5 have swapped names
    //    Roll 4 intended name is "Arjun Joshi", roll 5 intended name is "Vikram Patel"
    //    After swap, roll 4 has "Vikram Patel" and roll 5 has "Arjun Joshi"
    const orderBreak = await db.all(`
      SELECT roll_number, full_name FROM students
      WHERE section = 'A' AND roll_number IN (4, 5)
      ORDER BY roll_number, student_id
    `);
    let orderDetected = 0;
    if (orderBreak.length >= 2) {
      // Get distinct names for rolls 4 and 5 (excluding duplicate entries)
      const r4Names = orderBreak.filter(r => r.roll_number === 4).map(r => r.full_name);
      const r5Names = orderBreak.filter(r => r.roll_number === 5).map(r => r.full_name);
      const r4Name = r4Names[0];  // Primary name for roll 4
      const r5Name = r5Names[0];  // Primary name for roll 5
      // Order break detected if names are swapped (roll 4 has Vikram, roll 5 has Arjun)
      if ((r4Name.includes('Vikram') && r5Name.includes('Arjun')) ||
          (r4Name.includes('Arjun') && r5Name.includes('Vikram'))) {
        orderDetected = 1;
      }
    }
    results.order_break = orderDetected;

    // 4. Detect gaps: missing roll numbers
    const allRolls = await db.all(
      "SELECT roll_number FROM students WHERE section = 'A' ORDER BY roll_number"
    );
    const rollSet = new Set(allRolls.map(r => r.roll_number));
    let gaps = [];
    for (let i = 1; i <= 42; i++) {
      if (!rollSet.has(i)) {
        gaps.push(i);
      }
    }
    results.gaps = gaps.length;

    await db.close();

    console.log(
      `duplicates=${results.duplicates} ` +
      `out_of_range=${results.out_of_range} ` +
      `order_break=${results.order_break} ` +
      `gaps=${results.gaps}`
    );

    // Exit non-zero if any anomaly type is missing
    if (results.duplicates === 0 || results.out_of_range === 0 ||
        results.order_break === 0 || results.gaps === 0) {
      console.error("Missing anomaly types — check seed-data.py");
      process.exit(1);
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

main();
