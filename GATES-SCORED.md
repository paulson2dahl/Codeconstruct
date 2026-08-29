# Gates: Slice 1 — Harness Setup + DB Schema + Seed Data

> **Scored:** 29 August 2026  
> **Gate Check Command:** `node scripts/gate-check.mjs --reverify GATES.md`

OWNS: `sql/**`, `scripts/**`, `sandbox/validation/**`, `sandbox/matching/**`, `sandbox/analytics/**`, `GATES.md`, `agent.json`

Scope: Verify TrueForge runs locally, schema is created from `sql/schema.sql`, seed script populates the database with planted anomalies, all 4 validation scripts exist, and `agent.json` matches the TrueForge spec.

---

## Gate Results

- [x] G1: TrueForge harness is running and responds on localhost:8790
  CHECK: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8790`
  EXPECT: `200`
  EVIDENCE: ✓ PASS — output: "200"

- [x] G2: DB schema created from sql/schema.sql — all 11 tables + 6 indexes present
  CHECK: `node scripts/verify-schema.mjs`
  EXPECT: `schema_ok`
  EVIDENCE: ✓ PASS — output: "schema_ok"

- [x] G3: Seed script populates 40 students (39 unique + 1 duplicate), 5 subjects, 3 exams, 600 marks rows
  CHECK: `python3 scripts/seed-database.py && node scripts/verify-seed.mjs`
  EXPECT: `seed_ok`
  EVIDENCE: ✓ PASS — 40 students (39 unique + 1 duplicate "Rohan K. Sharma"), 5 subjects, 3 exams, 8 staff, 600 marks rows, rolls 15/22/38 missing, mark 152/100 present

- [x] G4: All 4 planted anomaly classes are detectable (duplicate, out-of-range, order break, gaps)
  CHECK: `python3 scripts/seed-database.py && node scripts/verify-anomalies.mjs`
  EXPECT: `/duplicates=1 out_of_range=1 order_break=1 gaps=3/`
  EVIDENCE: ✓ PASS — output: "duplicates=1 out_of_range=1 order_break=1 gaps=3"

- [x] G5: All 4 validation scripts exist in sandbox/validation/
  CHECK: `for f in sandbox/validation/detect_duplicates.py sandbox/validation/detect_range.py sandbox/validation/detect_order.py sandbox/validation/detect_gaps.py; do test -f "$f" || { echo "missing: $f"; exit 1; }; done && echo "all 4 scripts exist"`
  EXPECT: `all 4 scripts exist`
  EVIDENCE: ✓ PASS — output: "all 4 scripts exist"

- [x] G6: agent.json matches the TrueForge agent spec format (model, instructions, mcp_servers, config)
  CHECK: `node scripts/verify-agent.mjs`
  EXPECT: `agent_ok`
  EVIDENCE: ✓ PASS — output: "agent_ok"

- [x] G7: Seeding is idempotent — re-running produces same DB state
  CHECK: `python3 scripts/seed-database.py && python3 scripts/seed-database.py && node scripts/verify-seed.mjs`
  EXPECT: `seed_ok`
  EVIDENCE: ✓ PASS — output: "seed_ok"

---

## Summary

| Gate | Status | Evidence |
|------|--------|----------|
| G1 | ✅ PASS | HTTP 200 from localhost:8790 |
| G2 | ✅ PASS | schema_ok — 11 tables, 6 indexes |
| G3 | ✅ PASS | seed_ok — 40 students, 5 subjects, 3 exams, 600 marks |
| G4 | ✅ PASS | duplicates=1, out_of_range=1, order_break=1, gaps=3 |
| G5 | ✅ PASS | All 4 validation scripts exist |
| G6 | ✅ PASS | agent_ok — matches TrueForge manifest format |
| G7 | ✅ PASS | Idempotent re-seed produces same counts |

**All 7 gates PASSED.**
