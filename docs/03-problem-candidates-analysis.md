# Problem Candidates — Analysis & Scoring

> **Project:** The Agent Harness Hackathon · **Date:** 24 August 2026
> **Decided by:** participant-observed pains + constraint audit · **Status:** awaiting final selection
> **Companions:** `01-hackathon-rules.md`, `02-challenge-brief-and-judging.md`

---

## Constraint Audit (what we can actually touch — Rule 6)

| Resource | Verdict |
|----------|---------|
| Team | Solo |
| GitHub | Available — hosts PRs + Qodo review trail |
| AWS | Account available (free-tier friendly workloads only) |
| Docker | Available — doubles as the harness sandbox environment |
| Database | None owned; we build our own (SQLite/Postgres) — fully permitted |
| Slack/Discord | Connectable; credentials stay private and out of repo/video |
| Model keys | OpenRouter (multi-model router), Groq, OpenCode, Hugging Face |
| On-device models | Ollama + GGUF viable; TrueForge accepts local providers |

**Terminology fixed:** TrueForge *is* the harness (provided); we build the **agent** that runs on it. Configuring harness ≠ building harness.

## Scoring Rubric

Six dimensions aligned with the judging criteria, each /5:
pain evidence · TrueForge visibility · approval-gate strength · demo impact · solo-novice feasibility · originality.

## Scorecard

| Candidate | Pain | Forge fit | Gate | Wow | Feasible | Original | Total | Verdict |
|---|---|---|---|---|---|---|---|---|
| School operations assistant | 5 | 4 | 5 | 4 | 4.5 | 4.5 | **27** | ★ recommended |
| Forms autofill (on-device) | 4 | 4 | 5 | 5 | 2.5 | 4 | 24.5 | deferred |
| AWS resource janitor (sysadmin) | 3.5 | 5 | 5 | 3.5 | 3.5 | 3 | 23.5 | backup |
| Health records keeper | 4 | 4 | 3.5 | 3.5 | 3.5 | 3.5 | 22 | post-hackathon build |
| Hindi OCR desk (local retail) | 4 | 3.5 | 4 | 4 | 2 | 4.5 | 22 | deferred — quality risk |
| Finance slips · university · space · drones · biotech · cybersecurity | — | — | — | — | — | — | — | cut — no owned data, access, or hardware |

## Candidate Deep-Dives

### ★ 1. School Operations Assistant — RECOMMENDED (27/30)

**Observed pain (first-hand, via family):** a real school maintains marks in manually written sheets and per-class Excel files. Name ordering breaks when students join mid-term; duplicate/inconsistent rows appear; marks entry is retyped by hand. Errors propagate silently into official records.

**Agent loop:** ingest class sheets (Excel/PDF) → normalize into our SQLite schema (students, classes, subjects, exams) → **sandbox executes** validation scripts (duplicates, out-of-range marks, sequence gaps, missing entries) → agent explains each anomaly and proposes corrections → **approval gate: permanent mark-writes require human sign-off** → approved changes commit; clean sheets and rank lists export.

**Why it wins:**
- Only candidate with all three organiser ingredients: named victim, fully-owned artifacts, natural irreversible step (final marks).
- Zero-explanation domain — every judge attended school.
- Stack is boring-reliable: Python, pandas, openpyxl, SQLite, Docker. No exotic dependencies to fail during setup week.
- Anti-slop: an AI component (anomaly explanation, fuzzy-matching misspelled names) is load-bearing, not decorative.

**MVP cut:** Excel/CSV in, validated SQLite, corrected-sheet + rank-list out, approval gate, session log. *Stretch (day 5+):* photographed-sheet ingestion, homework/attendance modules — only if core is flawless.

**Risks & mitigations:** synthetic-but-realistic seed data for repo/demo (no real student data — Rule 6); schema kept tiny (4–5 tables); demo rehearsed with planted errors.

### 2. Government/Web Forms Copilot — on-device (24.5/30)

Real personal pain (re-entering identical details across portals). Strongest privacy story: local GGUF via Ollama so personal data never leaves the machine. Highest raw demo drama (watch a form fill itself). **Deferred:** browser automation against real government portals is demo-fragile (CAPTCHAs, shifting DOMs), and local-model setup eats days. Revisit post-hackathon as the participant's personal tool.

### 3. AWS Resource Janitor (23.5/30)

Best pure TrueForge showcase (read-only investigation → approval-gated cleanup of idle EBS volumes, unattached IPs, stale snapshots). Safe, cheap, judge-legitimate. **Backup** if school data modelling stalls early. Requires modest IAM read-only setup.

### 4. Health Records Keeper (22/30)

Genuine family pain: prescriptions and slips discarded; history lost across doctors. Same architectural skeleton as #1 (paper → structured record → timeline → summary). **Deferred to post-hackathon** — deliberately, not rejected; medical-data handling deserves more than hackathon-grade care.

### 5. Hindi OCR Desk (22/30)

Loved domain, real adoption barrier identified correctly (install fatigue + privacy fear + education gap). **Deferred:** local Indic OCR reliability on handwriting/mixed-script retail paper is research-grade; a failed OCR demo kills all other judging criteria at once. Post-hackathon candidate using Surya/Tesseract-hin pipelines.

## Decision

Pending participant sign-off between: **School Operations Assistant** (recommended), **AWS Janitor**, or another direction the participant names.
