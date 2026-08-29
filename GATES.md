# Gates: Slice 1 — Harness Setup + DB Schema + Seed Data

OWNS: sql/**, scripts/**, sandbox/validation/**, sandbox/matching/**, sandbox/analytics/**, GATES.md, agent.json

Scope: Verify TrueForge runs locally, schema is created from sql/schema.sql, seed script populates the database with planted anomalies, all 4 validation scripts exist, and agent.json matches the TrueForge spec.

- [ ] G1: TrueForge harness is running and responds on localhost:8790
  CHECK: curl -s -o /dev/null -w "%{http_code}" http://localhost:8790
  EXPECT: 200
  EVIDENCE: pending

- [ ] G2: DB schema created from sql/schema.sql — all 11 tables + 6 indexes present
  CHECK: node scripts/verify-schema.mjs
  EXPECT: schema_ok
  EVIDENCE: pending

- [ ] G3: Seed script populates 40 students (39 unique + 1 duplicate), 5 subjects, 3 exams, 600 marks rows
  CHECK: python3 scripts/seed-database.py && node scripts/verify-seed.mjs
  EXPECT: seed_ok
  EVIDENCE: pending

- [ ] G4: All 4 planted anomaly classes are detectable (duplicate, out-of-range, order break, gaps)
  CHECK: python3 scripts/seed-database.py && node scripts/verify-anomalies.mjs
  EXPECT: /duplicates=1 out_of_range=1 order_break=1 gaps=3/
  EVIDENCE: pending

- [ ] G5: All 6 validation scripts exist in sandbox/validation/ (duplicates, range, order, gaps, outliers, referential)
  CHECK: for f in sandbox/validation/detect_duplicates.py sandbox/validation/detect_range.py sandbox/validation/detect_order.py sandbox/validation/detect_gaps.py sandbox/validation/detect_outliers.py sandbox/validation/detect_referential.py; do test -f "$f" || { echo "missing: $f"; exit 1; }; done && echo "all 6 scripts exist"
  EXPECT: all 6 scripts exist
  EVIDENCE: pending

- [ ] G6: agent.json matches the TrueForge agent spec format (model, instructions, mcp_servers, config)
  CHECK: node scripts/verify-agent.mjs
  EXPECT: agent_ok
  EVIDENCE: pending

- [ ] G7: Seeding is idempotent — re-running produces same DB state
  CHECK: python3 scripts/seed-database.py && python3 scripts/seed-database.py && node scripts/verify-seed.mjs
  EXPECT: seed_ok
  EVIDENCE: pending
