# School Operations Responder — Complete Problem & Idea Catalog

> **Source:** All conversations + MD files (06-school-domain-deep-dive.md, 03-problem-candidates-analysis.md, 04-archetypes-deep-dive-and-project-fit.md, 05-ui-strategy.md, 07-build-discipline-unlazy-qodo.md)
> **Status:** Living document — add as you remember more

---

## PART A: YOUR COUSIN'S SCHOOL — OBSERVED PAIN POINTS (First-Hand)

### A1. Marks & Grading (The Core MVP Problem)
| # | Pain Point | Detail | Harness Feature to Solve |
|---|------------|--------|--------------------------|
| 1 | Manual marks entry | Teachers re-type marks into per-class Excel files | Sheet ingestion → sandbox validation |
| 2 | Name ordering breaks | Mid-term joiners break alphabetical order | Fuzzy-matching in sandbox (AI load-bearing) |
| 3 | Duplicate/inconsistent rows | Same student, different spellings ("Sharma, R." vs "R. Sharma") | Duplicate detection script + approval gate |
| 4 | Impossible marks | e.g., 152/100 entered by mistake | Range validation script (Code Mode) |
| 5 | Missing entries | Gaps where marks should be | Gap detection script |
| 6 | Column shifts | Data misaligned across columns | Schema validation on ingest |
| 7 | Wrong class sheets | Data entered in wrong class file | Class-ID validation |
| 8 | Errors propagate silently | Into official records without detection | Approval-gated writes + session log |
| 9 | Retyping same data | Across multiple sheets for same exam | Single source of truth (SQLite) + export |

### A2. Attendance
| # | Pain Point | Detail | Harness Feature |
|---|------------|--------|-----------------|
| 10 | 30-sec register but no auto-flag | Chronic absentees missed | Sandbox pattern detection |
| 11 | Whole-class absence | Trip? outbreak? bunk wave? — discovered at day's end | Sandbox scripts for pattern detection |
| 12 | Exam-day absent-list errors | Wrong lists submitted | Validation + approval gate |
| 13 | Register late to office | Paper-based, delayed | Digital register + instant sync |

### A3. Timetable & Operations (The 7 AM Crisis)
| # | Pain Point | Detail | Harness Feature |
|---|------------|--------|-----------------|
| 14 | Teacher sick at 7 AM | → 6 uncovered periods | Substitution chart in seconds |
| 15 | 30–40 min manual search | Printed timetables + phone-tree calls | Subagents: parallel DB queries |
| 16 | Same teachers dumped on | No duty ledger exists | Fair-duty ledger (tracking) |
| 17 | Substitutes by availability | Not subject → wasted periods | Subject-match first → workload → fairness |
| 18 | Invigilation gaps | Room double-booking | Clash detection in Code Mode |
| 19 | Excel/Sheets version chaos | Payroll can't reconcile month-end duty | Single DB + audit trail |
| 20 | Communication chaos | Phone-tree from paper lists before sunrise; callbacks untracked | Approval-gated notifications + log |

### A4. The 4 Arrangement Triggers (आवर्त System) — One Loop
| # | Trigger | Manual Today | Agent Proposes |
|---|---------|--------------|----------------|
| 21 | **Absence** | 30–40 min printed timetable + phone calls | Substitution chart: subject-match → workload → fair-duty ledger; cover work from lesson plan |
| 22 | **Syllabus lag** | Ad-hoc requests; teacher favours; principal hears at exam time | Rearrangement chart: borrow periods from ahead subjects; syllabus tracker feeds proposal |
| 23 | **Exam near** | Zero-period/after-school extra classes verbally; weak students missed | Extra-class chart: target lagging students from marks + attendance data |
| 24 | **One-off events** | Whole-day schedule redrawn on whiteboard | Day-adjustment chart preserving subject-hours constraints |

### A5. Homework & Internal Assessment
| # | Pain Point | Detail |
|---|------------|--------|
| 25 | Teacher chasing notebooks | Post assignment → track submissions (photo/PDF) |
| 26 | Internal-assessment marks | Auto-compile per board format |
| 27 | Submission compliance | Report per class |

### A6. Exams
| # | Pain Point | Detail |
|---|------------|--------|
| 28 | Invigilation duty fairness | Clash-free exam calendar |
| 29 | Question-paper blueprint | Chapter weights, difficulty mix, repetition rules |
| 30 | Paper-count verification | |

### A7. Communication
| # | Pain Point | Detail |
|---|------------|--------|
| 31 | Repeating same notices | Draft → approve → send needed |
| 32 | Parent notices | Bilingual (Hindi/English), approval-gated before send |

### A8. Compliance & Records
| # | Pain Point | Detail |
|---|------------|--------|
| 33 | Board-format document assembly | RTE records, fee reconciliation, staff files |
| 34 | One-click inspection-ready exports | |

---

## PART B: PRIVACY & DATA CONCERNS YOU RAISED

| # | Concern | Your Words | Implication for Build |
|---|---------|------------|----------------------|
| 35 | No cloud for personal data | "sending data from your device to anywhere is truly worse" | Local-first; sandbox only for compute; DB local/self-hosted |
| 36 | Local-first preference | On-device models (GGUF via Ollama/Unsloth) | TrueForge accepts OpenAI-compatible local endpoints |
| 37 | Hindi OCR barrier | Install fatigue + privacy fear + education gap = adoption barrier | Post-MVP; keep MVP Excel/CSV only |
| 38 | Government forms | Re-entering identical details across portals, uploading PDFs/resumes | Separate local-first agent (not school responder) |
| 39 | Medical prescriptions | Discarded slips, history lost across doctors | Post-hackathon build; deserves more than hackathon-grade care |
| 40 | No real student data | Synthetic seed data only (Rule 6) | Planted anomalies in seeded Class-8 sheet |

---

## PART C: YOUR TECHNICAL CONSTRAINTS & RESOURCES

| # | Resource | Status | Notes |
|---|----------|--------|-------|
| 41 | Team | Solo (team of 1) | |
| 42 | GitHub | Available | PRs + Qodo review trail |
| 43 | AWS | Free-tier only | |
| 44 | Docker | Available | Doubles as sandbox environment |
| 45 | Database | None owned | Build own (SQLite/PostgreSQL) — fully permitted |
| 46 | Slack/Discord | Connectable | Credentials stay private, out of repo/video |
| 47 | Model APIs | OpenRouter, OpenCode (free), Groq, HF | OpenRouter = multi-model router |
| 48 | On-device models | Ollama + GGUF viable | TrueForge accepts local providers |
| 49 | Experience | Novice | No production incidents faced |

---

## PART D: OTHER DOMAINS YOU LIKE (Not School)

| # | Domain | Why |
|---|--------|-----|
| 50 | Hindi OCR for retail | Local-first, privacy-preserving |
| 51 | Healthcare records | Prescription slips, medical history timeline |
| 52 | Finance slips | University/space/drones/biotech/cybersecurity — no owned data/access/hardware |
| 53 | Government forms autofill | Local model, privacy-first |
| 54 | Space, drone tech, biotech, cybersecurity | Interest areas |

---

## PART E: YOUR EXPLICIT STATEMENTS ABOUT SCHOOL RESPONDER

| # | Statement | Source |
|---|-----------|--------|
| 55 | "This is not a 'nice app' — it is a daily operational incident with a paper trail nobody maintains" | Conversation |
| 56 | "Exactly the investigate → match → propose → approve → notify → log loop the hackathon rewards" | Conversation |
| 57 | "Zero-explanation domain — every judge attended school" | MD 03 |
| 58 | "Stack is boring-reliable: Python, pandas, openpyxl, SQLite, Docker. No exotic dependencies to fail during setup week" | MD 03 |
| 59 | "Anti-slop: AI component (anomaly explanation, fuzzy-matching misspelled names) is load-bearing, not decorative" | MD 03 |
| 60 | MVP cut: Excel/CSV in → validated SQLite → corrected-sheet + rank-list out → approval gate → session log | MD 03 |
| 61 | Stretch (day 5+): photographed-sheet ingestion, homework/attendance modules — only if core is flawless | MD 03 |
| 62 | Risks: synthetic-but-realistic seed data; schema kept tiny (4–5 tables); demo rehearsed with planted errors | MD 03 |
| 63 | "The insight this module generalises: substitution is only *one* trigger for rearranging staff. Indian schools run a continuous **arrangement (आवर्त) system** with four recurring triggers, all solved by the same loop — read state → constrained matching → propose chart → **one approval** → publish + notify + log" | MD 06 |

---

## PART F: HARNESS FEATURES YOU WANT TO EXERCISE

| # | Feature | How Used in School Responder |
|---|---------|------------------------------|
| 64 | **Sandbox-as-tool** | Validation scripts run in Daytona (not entire agent) |
| 65 | **Subagents** | Parallel DB queries: timetable + duty ledger + syllabus tracker |
| 66 | **Deferred tool loading** | Keep context lean; load MCP tools on demand |
| 67 | **Code Mode** | All aggregation/counting/matching in sandbox Python (not LLM prose) |
| 68 | **Large tool responses** | Offload big query results to sandbox files |
| 69 | **Tool approval gates** | Every irreversible write (marks, timetable, notifications) pauses for human |
| 70 | **Generative UI** | Anomaly Report Cards, Substitution Charts, Syllabus Swap Charts |
| 71 | **Context compaction** | Long sessions survive; 80% trigger |
| 72 | **Session log** | Every tool call, sandbox run, approval timestamped — audit trail |

---

## PART G: STAKEHOLDER × DOMAIN AUTOMATION MATRIX (from MD 06)

| Domain | Teacher | Coordinator/Manager | Principal | Student | Parent |
|--------|---------|---------------------|-----------|---------|--------|
| **Marks & grading** | enter once, errors caught 🔥 | class-wise anomaly review 🔥 | trends via plain-English SQL 🔥 | see corrected marks | trustworthy report cards |
| **Attendance** | 30-sec register; auto-flag 🔥 | live view; outbreak detection 🔥 | daily absence brief ✅ | — | absence notices (Hindi/English) 🔥 |
| **Homework & IA** | post once; track completion ✅ | submission-compliance report ✅ | curriculum-coverage ◻ | see pending work | know what's due |
| **Timetable & ops** | see substitutions; fair-duty 🔥 | **morning crisis solved in seconds** 🔥 | staffing-gap overview ✅ | know who's teaching | — |
| **Exams** | invigilation fairness ✅; blueprint drafts 🔥 | clash-free calendar ✅ | exam-readiness ✅ | clear schedule | — |
| **Activities** | log participation ✅ | house/club point ledgers ✅ | talent-pipeline ◻ | see own record | celebrate achievements |
| **Communication** | stop repeating notices 🔥 | circulars with read-receipts ◻ | announcements ✅ | — | right message, right time |
| **Compliance** | — | board-format assembly 🔥 | inspection-ready exports ◻ | — | — |

🔥 = strong agent+harness fit | ✅ = useful, mostly deterministic | ◻ = roadmap-only

---

## PART H: THE 6 IDEAS MENU (from MD 06)

### In-Bound (Safe, Conventional, Judges Instantly Get)
| ID | Name | Victim | Loop | Score | Risk |
|----|------|--------|------|-------|------|
| **IB-1** | **Marks Integrity Desk** (MVP) | Clerk/teacher re-typing marks | Ingest → sandbox validate (duplicates, range, order, gaps) → explain anomalies → **approval-gated** writes → rank lists & summaries | 27/30 | Excel parsing tedium; mitigated by tight seed-data |
| **IB-2** | Attendance Intelligence | Coordinator discovering problems at day's end | Morning registers → sandbox pattern detection → drafted parent notices (bilingual) → **approval-gated** send → daily brief | — | Needs realistic attendance time-series seed |
| **IB-3** | Homework & IA Tracker | Teacher chasing notebooks | Post assignment → track submissions → compile IA marks → **approval-gated** gradebook write | — | Photo ingestion drags OCR; keep MVP to status-tracking |

### Out-of-Box ("Why Has Nobody Built This")
| ID | Name | Triggers | Key Insight |
|----|------|----------|-------------|
| **OB-1** | **Staff & Timetable Responder** ★ | 4 arrangement triggers (absence, syllabus lag, exam near, one-off events) | One loop solves all: read → constrained match → propose → **one approval** → publish + notify + log |
| **OB-2** | Exam-Week Responder | Invigilation, rooms, paper counts | Seasonal twin of OB-1; same spine |
| **OB-3** | Question-Paper Blueprint Agent | Chapter weights, difficulty mix, repetition rules | Most *generative*; sandbox validates coverage %, difficulty distribution, duplicates |

### Bonus (Post-MVP)
| ID | Name | Detail |
|----|------|--------|
| **Bonus** | Parent-Notice Composer | Personalised bilingual summaries per student, approval-gated before send |

---

## PART I: EXPANDED INCIDENT TYPES (Roadmap - 7 Total)

| Incident | Matching Rule | Notification Target | Spine Component |
|----------|---------------|---------------------|-----------------|
| Marks Integrity (IB-1) | Duplicate/range/order/gap detection | Teacher/Coordinator | DB write gate (G4) |
| Staff Substitution (OB-1) | Subject-match → workload → fairness | Substitute + absent teacher | Approval gate + duty ledger |
| Syllabus Lag (OB-1) | <80% completion → borrow from ahead | Teachers involved | Approval gate + syllabus tracker |
| Extra Classes (OB-1) | Lagging students from marks+attendance | Teachers + students | Approval gate |
| Day Adjustment (OB-1) | Preserve subject-hours constraints | All affected | Approval gate |
| Overdue Fees | fees_unpaid > 30 days → flag | Parent email/SMS (approval-gated) | DB write gate |
| Student Conflict | Log → gather witnesses → propose resolution | Coordinator + parents | Session log + approval gate |
| Multi-School Org | Staffing gaps across schools → redistribute | Coordinator across schools | Multi-tenant DB |
| PII Protection | Sandbox detects/flags PII → blocks → redacts | Internal safeguard | Sandbox config + gate |
| Internal DB Access | Read-only query → filtered view → approve writes | Coordinator | Read-only MCP + gate |

---

## PART J: MCP SERVER INTEGRATIONS (Future Extensions)

| MCP Server | Enables for School Ops | Agent Spec Change |
|------------|------------------------|-------------------|
| **Google Classroom** | Query rosters, assignments, due dates; propose make-up work; auto-generate arrangement charts | `"name": "classroom-mcp", "enable_tools": ["@read-only"], "preload": false` |
| **Google Sheets** | Ingest messy class sheets directly from shared drive; validation runs same scripts; approved writes commit back | `"name": "sheets-mcp", "enable_tools": ["@read-only", "@write"], "require_approval_for_tools": ["commit_sheet_changes"], "preload": false` |
| **Zoom** | Schedule parent-teacher conferences; reschedule cancelled classes; propose extra-class slots | `"name": "zoom-mcp", "enable_tools": ["@read-only"], ...` |
| **Email (SMTP)** | Send approval notifications, parent notices (bilingual), absence summaries; agent drafts, human gates send | `"name": "email-mcp", "enable_tools": ["@write"], "require_approval_for_tools": ["send_email"]` |

**Core loop unchanged** — only matching sub-rules and notification templates differ per integration.

---

## PART K: SUB-AGENT WORKFLOWS (TrueForge Native)

| Use Case | Sub-Agent Division |
|----------|-------------------|
| **Syllabus-lag crisis** | Main reads tracker → Sub-agent A: "classes with <80% Science completion" → Sub-agent B: "subjects finished early" → Main constrains match → proposes swap chart |
| **DB queries** | One sub-agent reads-only, another handles writes |
| **Web research** | Parallel sub-agents search different sources, merge answers |
| **Code generation** | One writes validation script, another tests it |
| **Notification drafting** | One drafts parent notice, another drafts staff email |

**Cost/latency:** Sub-agents add wall-clock time but keep main context lean. Iteration limit (default 100) prevents runaway loops.

---

## PART L: DEMO ARTIFACTS (What Judges See)

| # | Artifact | Harness Feature Demonstrated |
|---|----------|------------------------------|
| 1 | Seeded messy Class-8 sheet (planted: duplicate, 152/100, order break, gaps) | — |
| 2 | Anomaly Report Cards (Generative UI) with plain-language reasons | Generative UI, sandbox validation |
| 3 | **Approval Panel** — diff table, "Approve 42 corrections" / "Reject" | **Tool approval gate (signature element)** |
| 4 | Clean rank list + class summary after approval | Sandbox computation, Code Mode |
| 5 | 7:10 AM scenario: "Sharma is out" → substitution chart → one approval → notifications + updated timetable + duty ledger | Subagents, Code Mode, approval, Generative UI |
| 6 | Syllabus-lag scenario: tracker → swap chart → one approval → published arrangement | Subagents, Code Mode, approval |
| 7 | Plain-English analytics: "which class dropped hardest since Exam 1?" → agent-written SQL → answer | Subagents, Code Mode, deferred tool loading |
| 8 | Session log / timeline: every tool call, sandbox run, approval timestamped | Context compaction, large tool responses |
| 9 | Roadmap slide: full matrix (many schools, university, attendance, exams…) | — |
| 10 | Harness capabilities slide: 5 extension incidents + MCP integrations + subagent pattern | — |

---

## PART M: DEEPAGENTS PATTERNS → TRUEFORGE NATIVE EQUIVALENTS

| DeepAgents Pattern | TrueForge Native Equivalent |
|-------------------|----------------------------|
| Planning tool | Agent instructions + Code Mode stepwise execution |
| Filesystem memory | Sandbox files persist across turns in a session |
| Sub-agents (isolated context) | **TrueForge subagents** capability |
| Context management/summarisation | Compaction + large-tool-response offloading |
| Skills on demand | Git-backed SKILL.md packs |
| Human-in-the-loop tool approval | Native checkpoints (tool approval, ask-user, generative UI) |
| Shell in sandbox | Daytona sandbox as a tool |

**Judge narrative:** TrueForge's own `benchmark/` compares itself against deepagents — demonstrating plan→delegate→verify→approve **on TrueForge** is the strongest "Best Use of TrueForge" story.

---

## PART N: BUILD SLICES (PR-per-Slice, Qodo-Reviewed)

| Slice | Days | Gate | Deliverable |
|-------|------|------|-------------|
| **1** | Day 1 | G1: Harness health check | TrueForge running, model+sandbox+DB configured, schema created, seed data with planted anomalies |
| **2** | Day 2 | G2: Ingest verification | Sheet parses → 42 students / 5 subjects in DB |
| **3** | Day 2-3 | G3: Anomaly verification | All 4 planted anomaly classes detected, none missed |
| **4** | Day 3 | G4: Approval gate works | Write blocked → approve → committed atomically |
| **5** | Day 4 | G5: Substitution works | 7AM crisis → subject-matched chart → approval → notifications + duty ledger |
| **6** | Day 4-5 | G6: Syllabus lag works | Tracker shows lag → swap chart → approval → published |
| **7** | Day 5 | G7: Analytics + log | Plain-English SQL answers; session log captures everything |
| **8** | Day 5-6 | G8: Question-Paper Blueprint (stretch) | Teacher states norms → agent drafts → sandbox validates → approval → PDF |

---

## PART O: QODO INTEGRATION (Mandatory for Code Quality Track)

| Step | Action |
|------|--------|
| Day 1 | Install Qodo on GitHub repo: `app.qodo.ai/signin` → Integrations → GitHub → Add installation |
| Every PR | Qodo reviews automatically; fix **all High-severity** findings; dismiss wrong ones with reason |
| In README | Add **"Qodo Code Review Evidence"** section linking to ≥1 reviewed merged PR with: what Qodo surfaced, what you changed, what you intentionally dismissed |

**Per-Slice Workflow:**
```
1. Write GATES.md for slice          (before any implementation)
2. node gate-lint.mjs GATES.md      (catch weak oracles early)
3. branch slice-N → implement
4. node gate-check.mjs --approve GATES.md → run gates until green
5. open PR  →  Qodo reviews  →  fix real findings, answer the rest
6. node gate-check.mjs --reverify GATES.md   (on merged state)
7. merge → next slice
```

---

## PART P: FILE STRUCTURE TO CREATE

```
school-ops-responder/
├── agent.json                          # Exact spec (already created)
├── scripts/
│   ├── verify-harness.mjs
│   ├── verify-ingest.mjs
│   ├── verify-anomalies.mjs
│   ├── verify-gate.mjs
│   ├── verify-substitution.mjs
│   ├── verify-syllabus.mjs
│   ├── verify-analytics.mjs
│   ├── verify-log.mjs
│   ├── seed-database.py
│   └── gate-lint.mjs / gate-check.mjs  # From unlazy skill
├── sandbox/
│   ├── validation/
│   │   ├── detect_duplicates.py
│   │   ├── detect_range.py
│   │   ├── detect_order.py
│   │   └── detect_gaps.py
│   ├── matching/
│   │   ├── substitution_match.py
│   │   └── syllabus_swap.py
│   └── analytics/
│       ├── rank_list.py
│       └── class_summary.py
├── sql/
│   └── schema.sql                      # Already created
├── seeds/
│   └── class8_messy.xlsx               # Planted anomalies
├── GATES.md                            # Per-slice acceptance ledgers
├── .pr_agent.toml                      # Qodo config
└── README.md                           # With Qodo Evidence section
```

---

## PART Q: DAY-BY-DAY TIMELINE (Aug 24–30)

| Day | Focus | Deliverable |
|-----|-------|-------------|
| **Sun 24** | Setup + Slice 1 | TrueForge running, DB seeded, harness health check green |
| **Mon 25** | Slice 2 + 3 | Ingestion works, 4 anomaly types detected |
| **Tue 26** | Slice 4 | Approval gate working end-to-end |
| **Wed 27** | Slice 5 | Absence substitution demo working |
| **Thu 28** | Slice 6 | Syllabus-lag rearrangement working |
| **Fri 29** | Slice 7 + Stretch | Analytics, session log, (optional) Question-Paper Blueprint |
| **Sat 30** | Polish + Video + README + Submit | 3-min demo video, README with Qodo evidence, submission |

---

## PART R: KEY RISKS & MITIGATIONS

| Risk | Mitigation |
|------|------------|
| Daytona free-tier limits | Create account Day 1; test concurrent sandboxes; keep sandbox usage minimal |
| MCP = remote only | Use **Code Mode in sandbox** for all DB work (no custom MCP needed) |
| OpenRouter model naming | Use `openrouter/anthropic/claude-sonnet-4-6` format |
| Excel parsing fragility | Tight seed-data control; only parse exact seeded format |
| Time pressure | Slices independent; if behind, cut to Slice 1–5 + Polish |

---

## PART S: WHAT MAKES THIS WIN (Judge Alignment)

| Judge Criterion | How We Hit It |
|-----------------|---------------|
| **TrueForge Runtime Utilization** | Sandbox-as-tool, subagents, Code Mode, deferred tools, compaction, approval gates — all native |
| **Deterministic Sandboxing** | All validation/matching runs in Daytona; secrets never leave harness |
| **Human-in-the-Loop** | Every irreversible write pauses for approval; diff shown |
| **MCP Ecosystem** | Supabase MCP for DB; pattern documented for Classroom/Sheets/Zoom/Email |
| **Enterprise Engineering** | Qodo on every PR, gates with runnable checks, PR slices, session log audit trail |

---

## PART T: NEXT IMMEDIATE ACTIONS (Do These Now)

1. **Run TrueForge locally** → `npx @truefoundry/trueforge@latest` → verify Node 22+, get to http://localhost:8790
2. **Create Daytona account** → get API key → configure in Settings → Sandbox providers
3. **Add OpenRouter model** → Settings → Models → Custom → base URL `https://openrouter.ai/api/v1`
4. **Create Supabase project** (free) → add as MCP connector in Settings → Connectors
5. **Run seed script** → verify 42 students / 5 subjects / planted anomalies land in DB
6. **Write GATES.md for Slice 1** → start the gate-check loop

---

## PART U: QUESTIONS FOR YOU (Fill Gaps)

| # | Question | Your Answer Needed? |
|---|----------|---------------------|
| 1 | Exact columns in the cousin's Excel sheets? | Helps seed script |
| 2 | How many classes/sections in the school? | Schema sizing |
| 3 | What board (CBSE/ICSE/State)? | Report card format |
| 4 | Hindi or English for parent notices? | Bilingual templates |
| 5 | Any existing digital system (Google Classroom, etc.)? | MCP integration priority |
| 6 | Duty ledger — what counts as "duty"? | Substitution, invigilation, extra-class, ...? |
| 7 | Syllabus tracker — how granular (chapter/topic/lesson)? | Table design |
| 8 | Lesson plans — where stored today? | Ingestion source |

---

**Last Updated:** Based on all conversations + MD files as of Aug 28, 2026
**Next Step:** Run TrueForge locally (Action 1 above) → then we build Slice 1 together