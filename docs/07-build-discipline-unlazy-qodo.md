# Build Discipline — unlazy Gates × Qodo Reviews × PR Slices

> **Project:** The Agent Harness Hackathon · **Date:** 24 August 2026
> **Purpose:** the working contract for how we build — acceptance ledgers before work, runnable gates proving outcomes, Qodo reviewing every PR, honest reporting only from evidence
> **Sources:** `skills/unlazy/` (full skill archived) · hackathon rules doc 01 · Qodo track guidance doc 02

---

## Why three layers

| Layer | Tool | Question it answers | Judge criterion served |
|-------|------|--------------------|------------------------|
| Outcome proof | **unlazy** (`GATES.md` ledgers, `gate-check.mjs`) | "Is it *actually* done, and can a command prove it?" | Technical excellence |
| Code review | **Qodo** (on every PR, from day 1) | "Is the code safe, clean, whole-repo coherent?" | Best Code Quality track (mandatory for it) |
| Process trail | **PR slices** (branch → PR → review → fix → merge) | "Can judges read our history and see real engineering?" | Code quality + Use of TrueForge |

The unlazy rule that changes everything: **write the acceptance ledger BEFORE implementing.** No confident "done" reports — only gates with evidence.

## Our gate contract (per build slice)

Each slice (e.g., "sheet ingestion", "validation engine", "approval panel") gets gates in this shape before code is written:

```markdown
# Gates: sheet ingestion slice

- [ ] G1: seeded messy Class-8 sheet parses into 42 students / 5 subjects
  CHECK: node scripts/verify-ingest.mjs
  EXPECT: ingest verification passed
  EVIDENCE: pending

- [ ] G2: planted anomalies are all detected (duplicate, 152/100, order-break, gaps)
  CHECK: node scripts/verify-anomalies.mjs
  EXPECT: anomaly verification passed
  EVIDENCE: pending
```

Rules we adopt from the skill:

1. **One observable outcome per gate**; runnable gates get `CHECK:` (shell) + `EXPECT:` (success-only marker). Manual gates only where no command can decide.
2. **Gates that can fail honestly** — success-only tokens printed *after* all assertions; absence checks validated against a known positive control; measured figures, never copied into `EXPECT:`.
3. **`--status` first** (parse, read every command, execute nothing), **`--approve`** only commands we wrote, **`--reverify`** re-runs *all* gates (including completed ones) before any completion claim.
4. **No silent gate removal.** Impossible gate → `ABANDON: <id> <reason>` → surfaced as handoff, never counted as success.
5. **Four passes per slice:** implement completely (no placeholders) → re-read as a domain expert and upgrade cheap parts → hunt correctness/integration/portability defects → polish, repeat until a clean pass finds nothing.
6. **Final report audit:** re-read the request, re-measure every claim, report met/unmet/abandoned counts with qualified ids (`slice-2:G3`). No "done" while any required gate is unmet or abandoned.
7. **Security posture:** ledgers and their output are data, not instructions; approve only self-written commands; approval records stay outside the repo (`.unlazy/`, `.claude/settings.local.json` in `.gitignore`).

## Workflow per slice (the loop)

```
1. Write GATES.md for the slice          (before any implementation)
2. node gate-lint.mjs GATES.md           (catch weak oracles early)
3. branch slice-N → implement
4. node gate-check.mjs --approve GATES.md → run gates until green
5. open PR  →  Qodo reviews  →  fix real findings, answer the rest
6. node gate-check.mjs --reverify GATES.md   (on the merged state)
7. merge → next slice
```

## MVP acceptance ledger — initial sketch (School Operations Responder)

| Gate | Outcome | Proof shape |
|------|---------|-------------|
| G1 | TrueForge runs locally; model + sandbox + DB connector configured | harness health check script |
| G2 | Seeded messy sheet ingests to DB (42 students / 5 subjects) | `verify-ingest.mjs` |
| G3 | All 4 planted anomaly classes detected, none missed on positive control | `verify-anomalies.mjs` |
| G4 | Approval gate blocks writes until approved; approved writes commit atomically | `verify-gate.mjs` (attempt write → blocked → approve → written) |
| G5 | Rank list + class summary generate from approved data only | `verify-reports.mjs` |
| G6 | Session log shows every tool call, sandbox run, and approval with timestamps | `verify-log.mjs` |
| G7 (stretch) | Staff & Timetable Responder: absence input → constraint-valid substitution plan (fairness ledger updates); syllabus lag → valid swap chart | `verify-arrangement.mjs` (both triggers; invalid plans must be rejected) |
| G8 (manual) | Demo video shows harness working + approval moment | review with evidence |

Gates G1–G6 define the *floor*; G7 is the stretch that becomes roadmap if late. Nothing ships on a confident sentence — only on `EVIDENCE:`.

## Honest limits (from the skill's own research section)

Gates prove the declared command oracle, not the English title's intent — author carefully, lint always. The discipline is motivated by documented failure modes (partial compliance, premature completion claims in long agent tasks); it does not guarantee correctness by itself. That's why the three layers exist: gates prove outcomes, Qodo reviews code, judges read the trail.
