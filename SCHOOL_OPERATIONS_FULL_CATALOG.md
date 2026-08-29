# School Operations Responder — Complete Problem & Idea Catalog

> **Source:** MD files 01–08 + conversation archive · **Date:** 24–28 Aug 2026
> **Status:** This is the master reference — every school ops problem, idea, constraint, and harness mapping the participant raised.

---

## PART 1: YOUR COUSIN'S REAL SCHOOL — OBSERVED PAIN POINTS (First-Hand)

### A1. Marks & Grading — The Core MVP Problem (27/30 score)

Your cousin (a real teacher at a Delhi private school) described the exact workflow this project automates:

| # | Pain Point | Your Exact Words / Detail | Harness Feature |
|---|------------|----------------------------|-----------------|
| 1 | Manual marks entry retyping | "per-class Excel files, marks retyped by hand" | Sheet ingestion → sandbox validation |
| 2 | Name ordering breaks on mid-term joins | "name ordering breaks when students join mid-term" | Fuzzy-matching in sandbox (AI load-bearing) |
| 3 | Duplicate/inconsistent rows | "same student, different spellings (Sharma, R. vs R. Sharma)" | `detect_duplicates.py` + approval gate |
| 4 | Impossible marks | "152/100 entered by mistake" | `detect_range.py` (Code Mode) |
| 5 | Missing entries | "gaps where marks should be" | `detect_gaps.py` |
| 6 | Column shifts | "data misaligned across columns" | Schema validation on ingest |
| 7 | Wrong class sheets | "data entered in wrong class file" | Class-ID validation |
| 8 | Errors propagate silently | "into official records without detection" | Approval-gated writes + session_log |
| 9 | Retyping across sheets | "same data re-typed across multiple sheets for same exam" | Single source of truth (SQLite) + export |
| 10 | No audit trail on corrections | "who fixed what and when — nobody knows" | Every step in session_log table |

### A2. Attendance — The 2% Daily Absence Problem

| # | Pain Point | Detail | Harness Feature |
|---|------------|--------|-----------------|
| 11 | 30-sec register but no auto-flag | "register taken but chronic absentees never flagged" | Sandbox pattern detection (Code Mode) |
| 12 | Whole-class absence mystery | "trip? outbreak? bunk wave? — discovered at day's end" | Sandbox scripts: anomaly detection on time-series |
| 13 | Exam-day absent-list errors | "wrong lists submitted to exam cell" | Validation + approval gate before submission |
| 14 | Register late to office | "paper-based register, delayed hand-carry to office" | Digital register + instant sync |
| 15 | No parent-notice automation | "notices drafted manually in English, sometimes Hindi" | Bilingual notice drafts (approval-gated send) |

### A3. Timetable & Operations — The 7 AM Crisis

**Evidence numbers (from schoolites.com, teachngo.com, openeducat.org):**
- Manual substitution search: 30–40 minutes per crisis
- Frequency: 2–3 times weekly, often period 1 already running
- Yearly coordinator hours burned: 200+ hours on substitution alone
- Daily teacher absence rate: ~2% → ~120 substitutions/month in a 50-teacher school
- Fairness: same teachers repeatedly dumped on; no duty ledger
- Continuity: substitutes assigned by availability, not subject → wasted periods
- Records: Excel/Sheets version chaos; payroll can't reconcile month-end duty
- Communication: phone-tree from paper lists before sunrise; callbacks untracked

| # | Pain Point | Detail | Harness Feature |
|---|------------|--------|-----------------|
| 16 | Teacher sick at 7 AM | "→ 6 uncovered periods, coordinator scrambling before class" | Substitution chart in seconds |
| 17 | 30–40 min manual search | "printed timetables + phone-tree calls, callbacks untracked" | Subagents: parallel DB queries |
| 18 | Same teachers dumped on | "no duty ledger exists — same people always cover" | Fair-duty ledger (tracking table) |
| 19 | Substitutes by availability | "not subject-qualified → wasted periods" | Subject-match first → workload → fairness |
| 20 | No cover work provided | "substitute has no lesson plan, period wasted" | Cover work from lesson_plan table |
| 21 | Invigilation gaps | "room double-booking during exams" | Clash detection in Code Mode |
| 22 | Excel/Sheets version chaos | "payroll can't reconcile month-end duty" | Single DB + audit trail |
| 23 | Communication chaos | "phone-tree from paper lists before sunrise" | Approval-gated notifications + log |

### A4. The Arrangement (आवर्त) System — 4 Triggers, One Loop

You explicitly identified this as the key insight: "substitution is only *one* trigger for rearranging staff. Indian schools run a continuous **arrangement (आवरट) system** with four recurring triggers, all solved by the same loop."

| # | Trigger | Trigger Phrase | Manual Today | Agent Proposes |
|---|---------|----------------|--------------|----------------|
| 24 | **Absence** | "Sharma is out sick at 7am" | 30–40 min printed timetable + phone calls | Substitution chart: subject-match → workload fairness → fair-duty ledger; cover work from lesson plan |
| 25 | **Syllabus lag** | "Science is 2 weeks behind; Maths finished early" | Ad-hoc requests; teacher-to-teacher favours; principal hears at exam time | Rearrangement chart: borrow periods from ahead subjects; weekly syllabus tracker feeds proposal |
| 26 | **Exam near** | Extra-class scheduling needed | Zero-period/after-school extra classes arranged verbally; weak students missed | Extra-class chart: which class/subject/teacher/when, targeting lagging students from marks + attendance |
| 27 | **One-off events** | Sports day, VIP visit, assembly | Whole-day schedule redrawn on whiteboard | Day-adjustment chart preserving subject-hours constraints |

### A5. Homework & Internal Assessment

| # | Pain Point | Detail |
|---|------------|--------|
| 28 | Teacher chasing notebooks | "post assignment → track submissions (photo/PDF)" |
| 29 | Internal-assessment marks | "auto-compile per board format" |
| 30 | Submission compliance | "report per class, who's missing what" |
| 31 | Photo ingestion | "OCR drags in — keep MVP to status-tracking, not content-checking" (your explicit cut) |

### A6. Exams — The High-Stakes Week

| # | Pain Point | Detail |
|---|------------|--------|
| 32 | Invigilation duty fairness | "same teachers always get exam duty" |
| 33 | Clash-free exam calendar | "rooms double-booked, papers overlapping" |
| 34 | Question-paper blueprint | "chapter weights, difficulty mix, repetition rules — hand-balanced" |
| 35 | Paper-count verification | "counted manually, errors caught late" |
| 36 | Exam readiness | "principal has no checklist view" |

### A7. Communication — The Notice Problem

| # | Pain Point | Detail |
|---|------------|--------|
| 37 | Repeating same notices | "teacher re-types the same circular every week" |
| 38 | Parent notices bilingual need | "needs Hindi + English, approval-gated before send" |
| 39 | No read receipts | "sent notice, nobody knows if anyone read it" |
| 40 | Wrong message timing | "right message, right time — currently random" |

### A8. Compliance & Records

| # | Pain Point | Detail |
|---|------------|--------|
| 41 | Board-format document assembly | "RTE records, fee reconciliation, staff files — assembled by hand" |
| 42 | One-click inspection-ready exports | "auditors show up, nobody ready" |

---

## PART 2: PRIVACY & DATA CONCERNS (Non-Negotiable Constraints)

| # | Concern | Your Exact Words | Implication for Build |
|---|---------|------------------|----------------------|
| 43 | "sending data from your device to anywhere is truly worse" | Direct quote: "sending data from your device to anywhere is truly worse than local first" | Local-first; sandbox only for compute; DB local/self-hosted |
| 44 | Local-first preference | "on-device models (GGUF via Ollama/Unsloth)" | TrueForge accepts OpenAI-compatible local endpoints |
| 45 | Hindi OCR install fatigue | "install fatigue + privacy fear + education gap = adoption barrier" | Post-MVP; keep MVP Excel/CSV only |
| 46 | No real student data | "no real student records — Rule 6" | Synthetic seed data only; planted anomalies |
| 47 | Groq key exposure risk | "Groq keys auto-redacted by secrets-detection guardrail" | Keep keys in env vars; never in repo |
| 48 | Government form data | "re-entering identical details across portals, uploading PDFs/resumes" | Separate local-first agent (not school responder) |
| 49 | Medical records sensitivity | "prescriptions and slips discarded; history lost across doctors" | Post-hackathon build; deserves more than hackathon-grade care |

---

## PART 3: YOUR TECHNICAL RESOURCES & CONSTRAINTS

| # | Resource | Status | Your Notes |
|---|----------|--------|------------|
| 50 | Team | Solo (1 person) | "Solo × 6 days — a chat client is weeks of work" |
| 51 | GitHub | Available | PRs + Qodo review trail required |
| 52 | AWS | Free-tier only | "for any deployed workloads" |
| 53 | Docker | Available | "doubles as the harness sandbox environment" |
| 54 | Database | None owned | "build our own (SQLite/PostgreSQL) — fully permitted" |
| 55 | Slack/Discord | Connectable | "credentials stay private and out of repo/video" |
| 56 | Model APIs | OpenRouter, OpenCode (free), Groq, HF | "OpenRouter = multi-model router" |
| 57 | On-device models | Ollama + GGUF viable | "TrueForge accepts local providers" |
| 58 | Experience level | Novice | "no production incidents faced" |
| 59 | TrueForge | Running | localhost:8790 |
| 60 | OpenRouter key | Available | Use `openrouter/anthropic/claude-sonnet-4-6` format |

---

## PART 4: ALL 6 IDEAS (In-Bound + Out-of-Box + Bonus)

### In-Bound (Safe, Conventional, Judges Instantly Get)

| ID | Name | Victim | Loop | Score | Risk |
|----|------|--------|------|-------|------|
| **IB-1** | **Marks Integrity Desk (MVP)** | Clerk/teacher re-typing marks | Ingest sheets → sandbox validate (duplicates, range, order, gaps) → explain anomalies → **approval-gated** writes → rank lists & summaries | **27/30** | Excel parsing tedium; mitigated by tight seed-data control |
| **IB-2** | Attendance Intelligence | Coordinator discovering problems at day's end | Morning registers → sandbox pattern detection → drafted parent notices (bilingual) → **approval-gated** send → daily brief for principal | — | Needs realistic attendance time-series seed |
| **IB-3** | Homework & IA Tracker | Teacher chasing notebooks | Post assignment → track submissions (photo/PDF) → compile IA marks per board format → **approval-gated** gradebook write | — | Photo ingestion drags OCR in — keep MVP to status-tracking, not content-checking |

### Out-of-Box ("Why Has Nobody Built This")

| ID | Name | Triggers | Key Insight |
|----|------|----------|-------------|
| **OB-1** | **Staff & Timetable Responder ★** | 4 arrangement triggers (absence, syllabus lag, exam near, one-off events) | One loop solves all: read → constrained match → propose → **one approval** → publish + notify + log |
| **OB-2** | Exam-Week Responder | Invigilation, rooms, paper counts | Seasonal twin of OB-1; same spine; clash-free exam calendar + paper-count verification |
| **OB-3** | Question-Paper Blueprint Agent | Chapter weights, difficulty mix, repetition rules | Most *generative*; AI drafts → sandbox validates coverage %, difficulty distribution, duplicate-question detection → approval-gated PDF export |

### Bonus (Post-MVP)

| ID | Name | Detail |
|----|------|--------|
| **Bonus** | Parent-Notice Composer | Personalised bilingual summaries per student drafted from real data, approval-gated before send. Natural day-5 stretch or roadmap item. |

---

## PART 5: EXPANDED INCIDENT TYPES (All 10 You Named)

| Incident | Matching Rule | Notification Target | Spine Component |
|----------|---------------|---------------------|-----------------|
| Marks Integrity (IB-1) | Duplicate/range/order/gap detection | Teacher/Coordinator | DB write gate (G4) |
| Staff Substitution (OB-1) | Subject-match → workload → fairness | Substitute + absent teacher | Approval gate + duty ledger |
| Syllabus Lag (OB-1) | <80% completion → borrow from ahead | Teachers involved | Approval gate + syllabus tracker |
| Extra Classes (OB-1) | Lagging students from marks+attendance | Teachers + students | Approval gate |
| Day Adjustment (OB-1) | Preserve subject-hours constraints | All affected | Approval gate |
| Overdue Fees | fees_unpaid > 30 days → flag | Parent email/SMS (approval-gated) | DB write gate |
| Student Conflict | Log → gather witnesses → propose resolution | Coordinator + parents | Session log + approval gate |
| Multi-School Org | Staffing gaps across schools → redistribute | Coordinator across schools | Multi-tenant DB (same schema, different tenant_id) |
| PII Protection | Sandbox detects/flags PII → blocks → redacts | Internal safeguard | Sandbox config + gate |
| Internal DB Access | Read-only query → filtered view → approve writes | Coordinator | Read-only MCP + gate |

---

## PART 6: MCP SERVER INTEGRATIONS (Future Extensions)

| MCP Server | Enables for School Ops | Agent Spec Entry |
|------------|------------------------|-------------------|
| **Google Classroom** | Query rosters, assignments, due dates; propose make-up work; auto-generate arrangement charts when teacher away | `"name": "classroom-mcp", "enable_tools": ["@read-only"], "preload": false` |
| **Google Sheets** | Ingest messy class sheets directly from shared drive; validation runs same scripts; approved writes commit back | `"name": "sheets-mcp", "enable_tools": ["@read-only", "@write"], "require_approval_for_tools": ["commit_sheet_changes"], "preload": false` |
| **Zoom** | Schedule parent-teacher conferences; reschedule cancelled classes; propose extra-class slots | `"name": "zoom-mcp", "enable_tools": ["@read-only"], "preload": false` |
| **Email (SMTP)** | Send approval notifications, parent notices (bilingual), absence summaries; agent drafts, human gates send | `"name": "email-mcp", "enable_tools": ["@write"], "require_approval_for_tools": ["send_email"]` |
| **Supabase** | (Current) DB MCP server for all school data | `"name": "supabase", "enable_tools": ["@all"], "require_approval_for_tools": ["@write", "@destructive"]` |

**Your rule:** "The core loop (read state → constrained matching → propose → one approval → publish + notify + log) is *unchanged*. Only the matching sub-rules and notification templates differ."

---

## PART 7: SUB-AGENT WORKFLOWS (TrueForge Native)

| Use Case | Sub-Agent Division |
|----------|-------------------|
| **Syllabus-lag crisis** | Main reads syllabus tracker → Sub-agent A: "which classes have <80% Science completion?" → Sub-agent B: "which subjects finished early?" → Main constrains match → proposes swap chart |
| **Substitution crisis** | Sub-agent A: reads timetable for absent teacher's slots → Sub-agent B: queries duty ledger for fairness scores → Main merges + proposes substitution chart |
| **DB queries** | One sub-agent reads-only queries, another handles writes |
| **Web research** | Parallel sub-agents search different sources, merge answers |
| **Code generation** | One sub-agent writes validation script, another tests it |
| **Notification drafting** | One drafts parent notice (Hindi), another drafts staff email (English) |

**Cost/latency trade-off:** "Sub-agents add wall-clock time but keep the main context lean. The iteration limit (default 100) prevents runaway loops."

---

## PART 8: HARNESS CAPABILITIES (All Features You Want to Exercise)

| Feature | How Used in School Responder | TrueForge Config |
|---------|------------------------------|-------------------|
| **Sandbox-as-tool** | Validation scripts run in Daytona (not entire agent) | `config.sandbox.enabled: true` |
| **Subagents** | Parallel DB queries: timetable + duty ledger + syllabus tracker | `config.dynamic_sub_agents.enabled: true` |
| **Deferred tool loading** | Keep context lean; load MCP tools on demand | `mcp_servers[].preload: false` |
| **Code Mode** | All aggregation/counting/matching in sandbox Python (not LLM prose) | (native harness mode) |
| **Large tool responses** | Offload big query results to sandbox files | `config.context_management.large_tool_response.enabled: true` |
| **Tool approval gates** | Every irreversible write (marks, timetable, notifications) pauses for human | `mcp_servers[].require_approval_for_tools` + TrueForge checkpoints |
| **Generative UI** | Anomaly Report Cards, Substitution Charts, Syllabus Swap Charts | `config.generative_ui.enabled: true` |
| **Context compaction** | Long sessions survive; 80% trigger | `config.context_management.compaction` |
| **Session log** | Every tool call, sandbox run, approval timestamped | Manual log writes to session_log table |
| **Ask user questions** | Clarifying when data is ambiguous | `config.ask_user_questions.enabled: true` |

---

## PART 9: STAKEHOLDER × DOMAIN MATRIX

| Domain | Teacher | Coordinator/Manager | Principal | Student | Parent |
|--------|---------|---------------------|-----------|---------|--------|
| **Marks & grading** | enter once, errors caught 🔥 | class-wise anomaly review, correction workflow with audit trail 🔥 | subject/class performance trends via plain-English questions 🔥(analytics: self-written SQL) | see own corrected marks with explanation | trustworthy report cards |
| **Attendance** | 30-second register; auto-flag chronic absentees 🔥 | live whole-school attendance view; outbreak/bunk-wave detection 🔥(sandbox scripts) | daily absence brief auto-drafted ✅ | — | absence notice drafts (Hindi/English) before send 🔥(approval gate) |
| **Homework & internal assessment** | post once; completion tracked per student; internal-assessment marks auto-compiled ✅ | submission-compliance report per class ✅ | curriculum-coverage view ◻ | see pending work in one place | know what's due |
| **Timetable & operations** | see substitutions instantly; fair-duty visibility 🔥 | **morning crisis solved: proposed substitution plan in seconds, approve & notify** 🔥(read-only matching → approval → notifications) | staffing-gap overview; duty-ledger fairness report ✅ | know who's taking class | — |
| **Exams** | invigilation duty fairness ✅; question-paper blueprint drafts validated against norms 🔥(generative + sandbox checks + approval) | clash-free exam calendar; paper-count verification ✅ | exam-readiness checklist ✅ | clear schedule | — |
| **Activities & participation** | log participation once ✅ | house/club point ledgers ✅ | talent-pipeline view ◻ | see own record | celebrate achievements |
| **Communication** | stop repeating the same notice 🔥(draft → approve → send) | circulars with read-receipts ◻ | announcements ✅ | — | right message, right time |
| **Compliance & records** | — | board-format document assembly 🔥(sandbox generation + gate) | one-click inspection-ready exports ◻ | — | — |

🔥 = strong agent+harness fit | ✅ = useful, mostly deterministic | ◻ = roadmap-only

---

## PART 10: ARCHETYPES YOU MAPPED (1+2+5 Fused)

| Archetype | Meaning | Our Asset Fit | Verdict |
|-----------|---------|---------------|---------|
| **1. Approval-gated assistant** | Drafts actions; irreversible steps wait for human OK | Pattern inside our project | Mechanism to reuse |
| **2. Analytics agent** | English question → self-written SQL → run → explain | Literally inside School Ops | Mechanism to reuse |
| **3. Code review agent** | Reads PRs, runs tests, comments | GitHub available | **Skip — competes with sponsor's Qodo** |
| **4. Research desk** | Subagents search web, merge sourced answers | Generic | Crowded; weak demo drama |
| **5. Incident responder** | Investigate→approve→act loop | = our anomaly loop; = AWS Janitor | Pattern to reuse |
| **6. Untrusted code runner** | Execute third-party code isolated | Docker yes, niche audience | Skip |

**Your winning reframe:** "School Ops = archetypes **1 + 2 + 5 fused in an untouched domain**. Three kinds of visible harness work; originality from domain, not tech-stacking."

---

## PART 11: BUILD SLICES (PR-per-Slice, Qodo-Reviewed)

| Slice | Days | Gate | Deliverable |
|-------|------|------|-------------|
| **1** | Day 1 | G1: Harness health check | TrueForge running, model+sandbox+DB configured, schema created, seed data with planted anomalies |
| **2** | Day 2 | G2: Ingest verification | Sheet parses → 42 students / 5 subjects in DB |
| **3** | Day 2-3 | G3: Anomaly verification | All 4 planted anomaly classes detected, none missed |
| **4** | Day 3 | G4: Approval gate works | Write blocked → approve → committed atomically |
| **5** | Day 4 | G5: Substitution works | 7AM crisis → subject-matched chart → approval → notifications + duty ledger |
| **6** | Day 4-5 | G6: Syllabus lag works | Tracker shows lag → swap chart → approval → published |
| **7** | Day 5 | G7: Analytics + log | Plain-English SQL answers; session log captures everything |
| **8** | Day 5-6 | G8 (stretch) | Question-Paper Blueprint: teacher states norms → agent drafts → sandbox validates → approval → PDF |

---

## PART 12: QODO INTEGRATION (Mandatory for Code Quality Track)

| Step | Action |
|------|--------|
| Day 1 | Install Qodo on GitHub repo: `app.qodo.ai/signin` → Integrations → GitHub → Add installation |
| Every PR | Qodo reviews automatically; fix **all High-severity** findings; dismiss wrong ones with reason |
| In README | Add **"Qodo Code Review Evidence"** section linking to ≥1 reviewed merged PR |

**Per-Slice Workflow:**
```
1. Write GATES.md for slice          (before any implementation)
2. node gate-lint.mjs GATES.md       (catch weak oracles early)
3. branch slice-N → implement
4. node gate-check.mjs --approve GATES.md → run gates until green
5. open PR  →  Qodo reviews  →  fix real findings, answer the rest
6. node gate-check.mjs --reverify GATES.md   (on the merged state)
7. merge → next slice
```

---

## PART 13: KEY RISKS & MITIGATIONS

| Risk | Your Mitigation |
|------|-----------------|
| Daytona free-tier limits | Create account Day 1; test concurrent sandboxes; keep sandbox usage minimal |
| MCP = remote only | Use **Code Mode in sandbox** for all DB work (no custom MCP needed) |
| OpenRouter model naming | Use `openrouter/anthropic/claude-sonnet-4-6` format |
| Excel parsing fragility | Tight seed-data control; only parse exact seeded format |
| Time pressure | Slices independent; if behind, cut to Slice 1–5 + Polish |
| Qodo false positives | Dismiss in Qodo thread with reason; record in README |

---

## PART 14: ANTI-SLOP GUARANTEES (Your Explicit Statement)

You said: "Anti-slop: AI explains anomalies and drafts plans (load-bearing); code validates and computes (deterministic); human approves everything irreversible (the gate). Delete the LLM and validation still runs — that's the test passing."

This means:
1. **AI is load-bearing** for: anomaly explanation (plain language), fuzzy name matching, plan drafting, SQL query generation, notification drafting
2. **Code is deterministic** for: range checking, duplicate detection, gap detection, order validation, substitution matching algorithm, rank list computation
3. **Human is the gate** for: any DB write, any notification send, any file commit

---

## PART 15: DEMO ARTIFACTS (What Judges See)

| # | Artifact | Harness Feature Demonstrated |
|---|----------|------------------------------|
| 1 | Seeded messy Class-8 sheet (planted: duplicate, 152/100, order break, gaps) | — |
| 2 | Anomaly Report Cards (Generative UI) with plain-language reasons | Generative UI, sandbox validation |
| 3 | **Approval Panel** — diff table, "Approve 42 corrections" / "Reject" | **Tool approval gate (signature element)** |
| 4 | Clean rank list + class summary after approval | Sandbox computation, Code Mode |
| 5 | 7:10 am scenario: "Sharma is out" → substitution chart → one approval → notifications + duty ledger | Subagents, Code Mode, approval, Generative UI |
| 6 | Syllabus-lag scenario: tracker → swap chart → approval → published arrangement | Subagents, Code Mode, approval |
| 7 | Plain-English analytics: "which class dropped hardest since Exam 1?" → agent-written SQL → answer | Subagents, Code Mode, deferred tool loading |
| 8 | Session log / timeline: every tool call, sandbox run, approval timestamped | Context compaction, large tool responses |
| 9 | Roadmap slide: full matrix (many schools, university, attendance, exams…) | — |
| 10 | Harness capabilities slide: 5 extension incidents + MCP integrations + subagent pattern | — |

---

## PART 16: DEEPAGENTS → TRUEFORGE NATIVE MAPPING

| DeepAgents Pattern | TrueForge Native Equivalent |
|-------------------|----------------------------|
| Planning tool | Agent instructions + Code Mode stepwise execution |
| Filesystem memory | Sandbox files persist across turns in a session |
| Sub-agents (isolated context) | **TrueForge subagents** capability |
| Context management/summarisation | Compaction + large-tool-response offloading |
| Skills on demand | Git-backed SKILL.md packs |
| Human-in-the-loop tool approval | Native checkpoints (tool approval, ask-user, generative UI) |
| Shell in sandbox | Daytona sandbox as a tool |

**Your judge-facing narrative:** "TrueForge's own repo ships `benchmark/` code comparing itself against *deepagents* — demonstrating plan→delegate→verify→approve **on TrueForge** is the strongest possible 'Best Use of TrueForge' story."

---

## PART 17: NEXT IMMEDIATE ACTIONS (Your To-Do List)

1. **Run TrueForge locally** → `npx @truefoundry/trueforge@latest` → verify Node 22+, get to http://localhost:8790
2. **Create Daytona account** → get API key → configure in Settings → Sandbox providers
3. **Add OpenRouter model** → Settings → Models → Custom → base URL `https://openrouter.ai/api/v1`
4. **Create Supabase project** (free) → add as MCP connector in Settings → Connectors
5. **Run seed script** → verify 42 students / 5 subjects / planted anomalies land in DB
6. **Write GATES.md for Slice 1** → start the gate-check loop

---

## PART 18: OPEN QUESTIONS FOR YOU (Fill These Gaps)

| # | Question | Why It Matters |
|---|----------|----------------|
| 1 | Exact columns in the cousin's Excel sheets? | Helps seed script match real format |
| 2 | How many classes/sections in the school? | Schema sizing |
| 3 | What board (CBSE/ICSE/State)? | Report card format |
| 4 | Hindi or English for parent notices? | Bilingual templates |
| 5 | Any existing digital system (Google Classroom, etc.)? | MCP integration priority |
| 6 | Duty ledger — what counts as "duty"? | Substitution, invigilation, extra-class, ...? |
| 7 | Syllabus tracker — how granular (chapter/topic/lesson)? | Table design |
| 8 | Lesson plans — where stored today? | Ingestion source |

---

## PART 19: SCHEMA GENERALIZATION & ENTERPRISE DEPLOYMENT

### 19A. Why Hardcoding Academic Data Fails

The agent NEVER hardcodes specific student numbers, roll counts, exam names, or subject lists inside system prompts or agent instructions. Instead, all data is driven by:

1. **The database schema itself** — counts and structures are queried at runtime
2. **The `SEED_CONFIG` dictionary** in `seed-database.py` — a single source of truth for domain data
3. **Dynamic SQL queries** — reading max_marks, subject lists, and exam metadata from tables

This means the same agent code works across schools, colleges, or universities by simply changing the `tenant_id` and seed configuration.

### 19B. Terminology Generalization Across Institutional Types

The system uses an abstract noun mapping that generalizes across educational institutions:

| Abstract Schema Noun | School Entity | University / College Entity | Multi-Campus Trust Entity |
| :--- | :--- | :--- | :--- |
| **`Organisation / Tenant`** | Lucknow Secondary School | Faculty of Engineering | St. Paul's Trust Group |
| **`Section / Batch`** | Class 8A | Course Section B | Lucknow Campus Section A |
| **`Course`** | Mathematics | Data Structures (CS-301) | standard maths |
| **`Staff`** | Teacher | Professor / Lecturer | Lucknow Campus Teacher |
| **`Incident Authority`** | Academic Coordinator | Department Head (HOD) | Trust Operations Director |
| **`Supervisory Head`** | Principal | Dean / Director | Chief Trust Officer |

### 19C. Deployment Modes (Scaling the Architecture)

| Mode | Runtime | Database | Auth | Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Local Mode** | `npx @truefoundry/trueforge` | SQLite file | None (localhost only) | Personal development, agent harness hackathon |
| **Hosted Mode (Docker Compose)** | Kubernetes / Helm | PostgreSQL + Redis | OIDC (Google, Okta, Azure AD) | Shared team deployment, multi-user access |
| **Commercial Gateway** | TrueFoundry Platform | Managed Postgres | SSO + RBAC | Enterprise multi-tenant production |

#### Scaling Path:
1. **Local Mode → Hosted Mode:** Replace SQLite with PostgreSQL for shared session state; add Redis for real-time pub-sub across server replicas behind a load balancer.
2. **Hosted Mode → Commercial Gateway:** Add AI Gateway (semantic caching, cost tracking, PII redaction) and MCP Gateway (centralized credential management, SQL sanitizers).

---

**Last Updated:** Based on all MD files (01–08) + conversation archive as of Aug 29, 2026