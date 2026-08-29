# School Domain Deep-Dive — Automation Map, Incident Taxonomy & Idea Menu

> **Project:** The Agent Harness Hackathon · **Date:** 24 August 2026 · **Effort:** maximum (xhigh)
> **Method:** brainstorming skill (obra/superpowers, 339K installs) + live web evidence + system-design skill archived for build week
> **Companions:** `03-problem-candidates` · `04-archetypes-deep-dive` · `05-ui-strategy`
> **⚠️ Decomposition flag (brainstorming-skill rule):** everything below is the *menu*. The hackathon build is **one plate**. The matrix is the roadmap that goes in the write-up, not the build list.

---

## 1. Evidence Base — The Problem Is Real and Quantified

Live research (24 Aug 2026) on substitute/operations pain in schools, India-focused sources:

| Finding | Number |
|---------|--------|
| Manual substitution search: printed timetables of ~50 teachers for ~6 periods | **30–40 minutes per crisis** |
| Frequency | **2–3 times weekly**, often with period 1 already running |
| Yearly coordinator hours burned on substitution alone | **200+ hours** |
| Average daily teacher absence rate | ~2% → ≈120 substitutions/month in a 50-teacher school |
| Fairness | same teachers repeatedly dumped on; **no duty ledger exists** |
| Continuity | substitutes assigned by availability, **not subject** → wasted periods |
| Records | Excel/Google-Sheets version chaos; **payroll can't reconcile month-end duty** |
| Communication | phone-tree from paper lists before sunrise; callbacks untracked |

Sources: [Schoolites — teacher substitution problems (India)](https://schoolites.com/school-problems/teacher-substitution) · [Teach 'n Go — substitute scheduling](https://www.teachngo.com/blog/how_to_handle_substitute_teacher_scheduling_without_a_fuss) · [OpenEduCat — substitute management guide](https://openeducat.org/articles/substitute-teacher-management-software-guide/) · [ESS Clinical — absence management models](https://essclinical.com/blog/articles-three-models-for-absence-management-in-substitute-teachers/)

**Read:** this is not a "nice app" — it is a daily operational incident with a paper trail nobody maintains. It is also *exactly* the investigate → match → propose → approve → notify → log loop the hackathon rewards.

## 2. School Incident Taxonomy — What Actually Goes Wrong

The "incident responder, but for schools, not slop" answer starts with an honest inventory. Six incident families, rated for agent-harness fit (does the investigate→propose→**approve**→act loop naturally apply?):

| Family | Real examples | Harness fit | Why |
|--------|--------------|-------------|-----|
| **A. Data integrity** | impossible marks (152/100), duplicate student rows, name-order breaks, missing entries, column shifts, wrong class sheets | 🔥 Perfect | sandbox validation scripts; writes to permanent records = the approval gate; agent explains anomalies |
| **B. People operations** | teacher sick at 7am → 6 uncovered periods; invigilation gaps; room double-booking; duty unfairness | 🔥 Perfect | read-only timetable query → constrained matching (subject, workload, fairness) → coordinator approves → notifications fire; every step judge-visible |
| **C. Attendance** | whole class absent (trip? outbreak? bunk wave?), chronic absentee patterns, register late to office, exam-day absent-list errors | 🔥 Strong | pattern detection in sandbox; parent-notice drafts approval-gated before sending |
| **D. Assessment cycles** | internal+external marks compilation, moderation, board-format report cards, deadline crunch | ✅ Strong | compilation scripts in sandbox; final PDF generation gated; board-rule validation |
| **E. Safety & wellbeing** | playground injury, medical emergency, allergy event, bullying report, missing-on-trip, gate breach, bus delay | ⚠️ Partial — deliberately | agent's role = structured intake, timeline logging, checklist escalation, **never decisions**; humans decide everything; frame as record-keeping aid only, or omit from MVP |
| **F. Compliance & records** | board submissions, RTE records, fee reconciliation, staff files | ✅ Moderate | document assembly + validation; low demo drama |

Family E needs moral care: an agent "responding" to a child-safety event is a bad look and a bad product. The honest, non-slop position: **the agent is the incident *secretariat* — it structures, timestamps, and routes; humans decide.** Say this explicitly in the write-up; it demonstrates safety maturity (judging criterion 5).

## 3. Stakeholder × Domain Automation Matrix — "the list of real-world use"

Legend: 🔥 = strong agent+harness fit · ✅ = useful, mostly deterministic · ◻ = roadmap-only. Each 🔥 cell names the harness mechanics it exercises.

| Domain | **Teacher** | **Coordinator / Manager** | **Principal** | **Student** | **Parent** |
|--------|------------|---------------------------|---------------|-------------|------------|
| **Marks & grading** | enter once, errors caught before they become official 🔥(sandbox validation + approval gate) | class-wise anomaly review, correction workflow with audit trail 🔥 | subject/class performance trends via plain-English questions 🔥(analytics: self-written SQL) | see own corrected marks with explanation | trustworthy report cards |
| **Attendance** | 30-second register; auto-flag chronic absentees 🔥 | live whole-school attendance view; outbreak/bunk-wave detection 🔥(sandbox scripts) | daily absence brief auto-drafted ✅ | — | absence notice drafts (Hindi/English) before send 🔥(approval gate) |
| **Homework & internal assessment** | post once; completion tracked per student; internal-assessment marks auto-compiled ✅ | submission-compliance report per class ✅ | curriculum-coverage view ◻ | see pending work in one place | know what's due |
| **Timetable & operations** | see substitutions instantly; fair-duty visibility 🔥 | **morning crisis solved: proposed substitution plan in seconds, approve & notify** 🔥(read-only matching → approval → notifications) | staffing-gap overview; duty-ledger fairness report ✅ | know who's taking class | — |
| **Exams** | invigilation duty fairness ✅; question-paper blueprint drafts validated against norms 🔥(generative + sandbox checks + approval) | clash-free exam calendar; paper-count verification ✅ | exam-readiness checklist ✅ | clear schedule | — |
| **Activities & participation** | log participation once ✅ | house/club point ledgers ✅ | talent-pipeline view ◻ | see own record | celebrate achievements |
| **Communication** | stop repeating the same notice 🔥(draft → approve → send) | circulars with read-receipts ◻ | announcements ✅ | — | right message, right time |
| **Compliance & records** | — | board-format document assembly 🔥(sandbox generation + gate) | one-click inspection-ready exports ◻ | — | — |

**Multi-school & university scaling (same principle):** the schema generalises cleanly — school→organisation, class→section→batch/course, subject→course, teacher→faculty, coordinator→department head, principal→dean. Ten schools nearby = ten tenants of the same harness; a university is the same loop with different nouns. This paragraph *is* the "potential impact" criterion — one architecture, whole education segment.

## 4. The Idea Menu — 3 In-Bound + 3 Out-of-Box

### In-bound (safe, conventional, judges instantly get them)

**IB-1 · Marks Integrity Desk** *(current MVP)*
Victim: the clerk/teacher re-typing marks into per-class Excel. Loop: ingest sheets → sandbox validation (duplicates, range, order, gaps) → explain anomalies → **approval-gated** permanent writes → rank lists & class summaries. Score 27/30 (doc 03). Risk: Excel parsing tedium; mitigated by tight seed-data control.

**IB-2 · Attendance Intelligence**
Victim: coordinator discovering problems at day's end. Loop: morning registers in → sandbox pattern detection (chronic, whole-class, exam-day mismatches) → drafted parent notices (bilingual) → **approval-gated** send → daily brief for principal. Shares ingestion+approval spine with IB-1. Risk: needs realistic attendance time-series seed.

**IB-3 · Homework & Internal-Assessment Tracker**
Victim: teacher chasing notebooks. Loop: post assignment → track submissions (photo/PDF) → compile internal-assessment marks per board format → **approval-gated** gradebook write. Risk: submission ingestion (photos) drags OCR in — keep MVP to status-tracking, not content-checking.

### Out-of-box (the "why has nobody built this" reaction)

**OB-1 · Staff & Timetable Responder — four arrangement triggers, one loop** ★ *(absence evidence-backed above; syllabus/extra-class practices from domain knowledge, to be evidence-backed when search recovers)*

The insight this module generalises: substitution is only *one* trigger for rearranging staff. Indian schools run a continuous **arrangement (आवर्त) system** with four recurring triggers, all solved by the same loop — read state → constrained matching → propose chart → **one approval** → publish + notify + log:

| Trigger | What the school does manually today | What the agent proposes |
|---------|--------------------------------------|------------------------|
| **1 · Absence** ("Sharma is out sick") | 30–40 min of printed-timetable searching, phone-tree calls | Substitution chart: subject-match first → workload → **fair-duty ledger** (nobody dumped on twice); each substitute gets the absent teacher's cover work from the lesson plan |
| **2 · Syllabus lag** ("Science is 2 weeks behind; Maths finished early") | Ad-hoc requests; teacher-to-teacher favours; principal hears about it at exam time | Rearrangement chart: borrow periods from ahead-of-plan subjects for lagging ones; weekly syllabus tracker (plan vs completed per class/subject) feeds the proposal; **approval-gated** swap chart |
| **3 · Exam near** | Zero-period/after-school extra classes arranged verbally; weak students missed | Extra-class chart: which class/subject/teacher/when, targeting lagging students from marks + attendance data; approval-gated publication |
| **4 · One-off events** (sports day, meets, VIP visit) | Whole-day schedule redrawn on the whiteboard | Day-adjustment chart preserving subject-hours constraints |

Harness mechanics on display: DB reads, sandbox matching/generation algorithms, **syllabus-tracker analytics** (agent-written SQL: "which subjects are behind?"), approval gate, multi-recipient notifications, session log. Demo drama: *"the 7 am crisis solved in 40 seconds with one approval click"* — then *"Science is behind → swap chart → one click."* Feasibility: matching is greedy-with-constraints; the syllabus tracker is one small table — **easier than IB-1's Excel parsing**.

**OB-2 · Exam-Week Responder**
Victim: exam coordinator juggling invigilation, rooms, paper counts. Loop: exam calendar + staff list → generate clash-free invigilation roster (fairness-weighted) → detect room/paper shortfalls → propose fixes → approve → publish roster + duty letters. Seasonal twin of OB-1; same spine. Risk: none technical; demo timing (exams feel urgent to every judge who went to school).

**OB-3 · Question-Paper Blueprint Agent**
Victim: teacher hand-balancing blueprints (chapter weights, difficulty mix, repetition rules). Loop: teacher states chapters/weights/norms → agent drafts the paper → **sandbox validates** coverage %, difficulty distribution, duplicate-question detection → teacher reviews → **approval-gated** final export (PDF). The most *generative* idea; the validation step is what makes it non-slop (AI drafts, code verifies, human approves).

**Bonus (Hindi-interest tie-in, post-MVP):** Parent-Notice Composer — personalised bilingual summaries per student drafted from real data, approval-gated before send. Natural day-5 stretch or roadmap item.

## 5. DeepAgents (LangChain) — What to Borrow, What Never to Do

**What it is (verified):** an opinionated agent *harness* on LangGraph — planning tool, pluggable filesystem, sub-agents with isolated context, context management/summarisation, skills, human-in-the-loop, shell in "your sandbox of choice". 28.4k stars, MIT, actively maintained. ([github.com/langchain-ai/deepagents](https://github.com/langchain-ai/deepagents))

**⚠️ The rule-3 line:** DeepAgents is a *competing harness*. Building on it instead of TrueForge risks disqualification ("must run on TrueForge"). **We do not import it. We borrow its patterns.**

| DeepAgents pattern | TrueForge native equivalent (verified in docs) |
|---|---|
| Planning tool | Agent instructions + Code Mode stepwise execution |
| Filesystem memory | Sandbox files persist across turns in a session |
| Sub-agents (isolated context) | TrueForge **subagents** capability |
| Context management/summarisation | Compaction + large-tool-response offloading |
| Skills on demand | Git-backed SKILL.md packs |
| Human-in-the-loop tool approval | Native checkpoints (tool approval, ask-user, generative UI) |
| Shell in sandbox | Daytona sandbox as a tool |

**The judge-facing narrative:** TrueForge's own repo ships `benchmark/` code comparing itself against *deepagents* — meaning deep-agent-grade behaviour is literally the harness's own measuring stick. Demonstrating plan→delegate→verify→approve behaviour **on TrueForge** is the strongest possible "Best Use of TrueForge" story: we run at the benchmark's bar, on the sponsor's tool.

## 6. Harness Capabilities — Extensions Beyond MVP ★

This section documents what becomes possible when you add MCP servers and subagents to the core School Operations Responder spine. **Nothing in this section changes the MVP** (spine + Incident 1 + Incident 2 with 4 arrangement triggers). These are roadmap items for after the core is proven, or for the write-up's "ambition" section.

### 6.1 MCP Server Integrations (what the agent can reach)

Each MCP server is a **bring-your-own** connector configured under `Settings → Connectors`. In the agent spec, each adds a `"mcp_servers": [{ ... }]` entry. The school Ops spine stays identical — only the matching rules and notification templates change per domain.

| MCP Server | What it enables for School Ops | Agent-spec change |
|---|---|---|
| **Google Classroom** | Query rosters, assignments, due dates; propose make-up work for absent students; auto-generate arrangement charts when a teacher is away | `"name": "classroom-mcp", "enable_tools": ["@read-only"], "preload": false` |
| **Google Sheets** | Ingest messy class sheets (the G1 gate seed) directly from a shared drive; the validation engine runs the same anomaly scripts; approved writes commit back to the sheet | `"name": "sheets-mcp", "enable_tools": ["@read-only", "@write"], "preload": false, "require_approval_for_tools": ["commit_sheet_changes"]` |
| **Zoom** | Schedule parent-teacher conferences; reschedule cancelled classes; propose extra-class slots when the arrangement chart shows lagging periods | `"name": "zoom-mcp", "enable_tools": ["@read-only"], ...` |
| **Email (SMTP)** | Send approval notifications, parent notices (bilingual), absence summaries; the agent drafts, human approval gates the send | `"name": "email-mcp", "enable_tools": ["@write"], "require_approval_for_tools": ["send_email"]` |

**Matching rule per integration**: the core loop (read state → constrained matching → propose chart → one approval → publish + notify + log) is *unchanged*. Only the matching sub-rules and notification templates differ:
- Classroom: "which students are in which section?" → section-aware substitution
- Sheets: "which rows are planted errors?" → same anomaly scripts, just different source
- Zoom: "which time slots are free?" → calendar-aware extra-class chart

### 6.2 Dynamic Sub-agents (parallel work within the harness)

Enable `dynamic_sub_agents: true` in the agent config (`config.dynamic_sub_agents.enabled: true`). This lets the main agent fan out to parallel sub-agents, keeping its own context clean. Example workflow for a **syllabus-lag crisis**:

1. **Main agent** reads the syllabus tracker → "Science is 2 weeks behind; Maths finished early"
2. **Sub-agent A** queries the DB: "Which classes have <80% completion on Science topic 3?" → returns class list
3. **Sub-agent B** searches the lesson-plan repo: "Which other subjects finished Maths topic 5 early?" → returns teacher names + periods available
4. **Main agent** constrains the match: "borrow 3 periods from Mr. Maths's section for Science's lag" → proposes the swap chart → **one human approval** → publishes the arrangement + notifies all three teachers

**What sub-agents are good for** (per the harness design):
- **DB queries**: one sub-agent reads-only queries, another handles writes
- **Web research**: parallel sub-agents search different sources, merge answers
- **Code generation**: one sub-agent writes the validation script, another tests it
- **Notification drafting**: one drafts the parent notice, another drafts the staff email

**Cost/latency note**: sub-agents add wall-clock time but keep the main context lean. The iteration limit (API only, default 100) prevents runaway loops.

### 6.3 Expanded Incident Types (the 5 you asked about, now structurally defined)

All five follow the **identical loop**: read state → constrained matching → propose → one human approval → publish + notify + log. Only the matching rules differ. This table makes them first-class roadmap items:

| Incident | Matching rule (example) | Notification target | Spine component |
|---|---|---|---|
| **Overdue fee submission** | "fees_unpaid > 30 days → flag; else no-action" | Parent's email/SMS (approval-gated send) | DB write gate (G4) |
| **Student conflict / fight report** | "incident logged → gather witness info → propose resolution steps → coordinator approves" | Coordinator + parents (approval-gated) | Session log + approval gate |
| **Multi-school organization management** (DPS chain, state/district) | "coordinator views overview → agent shows staffing gaps across all schools → propose redistribution → one approval → publish updated rosters" | Coordinator across all schools | Multi-tenant DB (same schema, different tenant_id) |
| **PII / credential protection in sandbox** | "teacher / student PII in agent prompts → sandbox detects/flags → blocks write → redaction → one approval → safe write" | N/A (internal safeguard) | Sandbox config + gate |
| **Internal database access** (teacher lists, staff rolls) | "query requested → agent runs read-only sandbox query → returns filtered view → coordinator approves → any writes gated" | Coordinator | Read-only MCP query + gate |

**Why this matters for the hackathon**: the "potential impact" criterion (judging #1) gets stronger when you can say *"the same spine + loop handles 7 incident types, only the matching rules differ."* That's originality from domain depth, not tech-stacking.

### 6.4 Agent Spec Changes for Extensions

When you're ready to add these, the agent spec changes are minimal and API-only (kept out of the UI to keep the chat simple, per doc 05):

```json
{
  "model": { "name": "anthropic/claude-sonnet-4-6" },
  "instructions": "You are a school operations responder. Investigate → match → propose → one human approval → publish + notify + log.",
  "mcp_servers": [
    { "name": "classroom-mcp", "enable_tools": ["@read-only"], "preload": false },
    { "name": "sheets-mcp", "enable_tools": ["@read-only", "@write"], "require_approval_for_tools": ["commit_sheet_changes"], "preload": false }
  ],
  "skills": [{ "name": "unlazy" }],
  "config": {
    "sandbox": { "enabled": true },
    "dynamic_sub_agents": { "enabled": true },
    "context_management": {
      "compaction": { "enabled": true },
      "large_tool_response": { "enabled": true }
    },
    "iteration_limit": 50
  }
}
```

**What changed from the MVP spec**:
- `mcp_servers`: added Classroom + Sheets (MVP had none, or just the school DB)
- `config.dynamic_sub_agents.enabled`: `true` (MVP had it on by default, but no sub-agents were spawned)
- `config.iteration_limit`: reduced from 100 to 50 (MVP default; tighter for extensions)

**Nothing in the spine, incident loops, or gate contracts changes.** The whole point of the design.

## 7. Demo Artifacts — "What Else We Show" (unchanged)

1. Seeded *messy* Class-8 sheet (planted: duplicate, 152/100, order break, gaps)
2. Anomaly Report Cards (generative UI) with reasons in plain language
3. **Approval Panel** — diff table, "Approve 42 corrections" / "Reject" (signature element)
4. Clean rank list + class summary after approval
5. 7:10 am scenario: "Sharma is out" → substitution plan card (subject-matched, fairness-noted, cover work attached) → one approval → notifications + updated timetable + duty ledger
6. Syllabus-lag scenario: tracker shows Science 2 weeks behind, Maths finished → agent proposes period-swap chart → one approval → published arrangement + teachers notified
7. Plain-English analytics: "which class dropped hardest since Exam 1?" / "which subjects are behind on syllabus?" → agent-written SQL → answer
8. Session log / timeline: every tool call, sandbox run, and approval timestamped — the audit story
9. Roadmap slide: the full matrix (many schools, university, attendance, exams…)
10. **Harness capabilities slide**: the 5 extension incident types + MCP server integrations + subagent parallel work pattern (for the write-up's "ambition" section)

All existing artifacts stay. Item 10 is new for the write-up if you want to show the judges the full reach.

## 6. Recommendation — The Lock

**Product: "School Operations Responder" — one spine, two incidents, one stretch.**

- **Spine (shared, days 1–3):** org DB (students, staff, classes, timetable, subjects) + sheet ingestion + validation engine + approval panel + session log.
- **Incident 1 (days 3–4): Marks integrity** (IB-1) — the data incident; hardest parsing, do it first while fresh.
- **Incident 2 (days 4–5): Staff & Timetable Responder** (OB-1) — absence substitution first (the 7 am crisis), syllabus-lag rearrangement second (your teacher-present scenario); extra-class chart only if ahead of schedule; *cut to roadmap if behind*.
- **Stretch (day 5–6, only if clean):** Question-Paper Blueprint (OB-3) or Parent-Notice Composer.
- **Write-up & video present the full matrix (section 3) as the roadmap** — ambition shown, scope kept.

**Anti-slop guarantees:** AI explains anomalies and drafts plans (load-bearing); code validates and computes (deterministic); human approves everything irreversible (the gate). Delete the LLM and validation still runs — that's the test passing.

## 7. Demo Artifacts — "What Else We Show"

1. Seeded *messy* Class-8 sheet (planted: duplicate, 152/100, order break, gaps)
2. Anomaly Report Cards (generative UI) with reasons in plain language
3. **Approval Panel** — diff table, "Approve 42 corrections" / "Reject" (signature element)
4. Clean rank list + class summary after approval
5. 7:10 am scenario: "Sharma is out" → substitution plan card (subject-matched, fairness-noted, cover work attached) → one approval → notifications + updated timetable + duty ledger
6. Syllabus-lag scenario: tracker shows Science 2 weeks behind, Maths finished → agent proposes period-swap chart → one approval → published arrangement + teachers notified
7. Plain-English analytics: "which class dropped hardest since Exam 1?" / "which subjects are behind on syllabus?" → agent-written SQL → answer
8. Session log / timeline: every tool call, sandbox run, and approval timestamped — the audit story
9. Roadmap slide: the full matrix (many schools, university, attendance, exams…)
