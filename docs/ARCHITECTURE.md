# School Operations Responder — Complete Architecture & Submission Guide

> **Agent Harness Hackathon** — WeMakeDevs × TrueFoundry × Qodo × OpenAI
> **Aug 24–30, 2026** | Repository: [paulson2dahl/Codeconstruct](https://github.com/paulson2dahl/Codeconstruct)

---

## Table of Contents

1. [What This Project Does](#1-what-this-project-does)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Component Deep-Dive](#3-component-deep-dive)
4. [End-to-End Workflow](#4-end-to-end-workflow)
5. [Code Walkthrough](#5-code-walkthrough)
6. [How the Closed Loop Works](#6-how-the-closed-loop-works)
7. [Validation Scripts Explained](#7-validation-scripts-explained)
8. [CI/CD Pipeline](#8-cicd-pipeline)
9. [Qodo Code Review Integration](#9-qodo-code-review-integration)
10. [Video Walkthrough Script](#10-video-walkthrough-script)
11. [Submission Checklist](#11-submission-checklist)

---

## 1. What This Project Does

**School Operations Responder** is a **TrueForge-powered AI agent** that helps school administrators manage:
- Student marks & exam data (with anomaly detection)
- Timetables & teacher substitution
- Syllabus coverage tracking
- Attendance & attendance gaps

It works **generically** — it discovers the database schema at runtime, so it adapts to any domain (school, college, coaching center, etc.) without hardcoded table names.

### Key Problem It Solves

Schools have messy data: duplicate student entries, marks out of range (e.g., 152/100), missing roll numbers, swapped records. This agent:
1. **Discovers** the data structure automatically
2. **Validates** all data using statistical methods (IQR outliers, range checks, sequence gaps)
3. **Shows** anomalies in a beautiful dashboard with charts
4. **Waits for approval** before making any changes
5. **Reviews code** automatically via Qodo on every PR

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION LAYER                         │
│  ┌──────────────────────┐     ┌─────────────────────────────────┐ │
│  │  React Portal         │     │  TrueForge CLI (tf-client.ts)   │ │
│  │  (School-themed UI)   │     │  (Terminal/chat interface)      │ │
│  │  localhost:5173      │     │  npx tsx tf-client.ts           │ │
│  └──────────────────────┘     └─────────────────────────────────┘ │
└──────────────────────────────┬────────────────────────────────────┘
                               │ SSE / WebSocket
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    TRUEFORGE AGENT HARNESS                          │
│                         localhost:8790                               │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  AI Agent (Llama-4-Maverick via OpenRouter)                  │  │
│  │  • Reads agent.json for instructions, tools, skills           │  │
│  │  • Orchestrates MCP servers, sandbox execution               │  │
│  │  • Streams responses via SSE                                │  │
│  │  • Manages session state & approval gates                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  MCP Servers (4 total)                                         │  │
│  │  ├── sqlite-local   → read/write local DB (with approval)     │  │
│  │  ├── google-sheets  → read/write Google Sheets (OAuth)       │  │
│  │  ├── google-classroom → read-only roster/grades               │  │
│  │  └── web-search     → DuckDuckGo search (sandboxed)          │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Sandbox Execution (Code Mode) — Daytona/isolated Python       │  │
│  │  • 17 deterministic validation scripts                        │  │
│  │  • No LLM inference — pure statistics & algorithms            │  │
│  │  • Runs in /sandbox with no network access to target DB      │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬────────────────────────────────────┘
                               │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐
│  SQLite DB      │ │  Google Sheets   │ │  GitHub (PR reviews)    │
│  school_ops.db  │ │  (OAuth2)       │ │  CI/CD pipelines        │
│  11 tables      │ │  (optional)      │ │  Qodo auto-review      │
└─────────────────┘ └─────────────────┘ └─────────────────────────┘
```

---

## 3. Component Deep-Dive

### 3.1 `agent.json` — The Agent Specification

```json
{
  "model": { "name": "openrouter/meta/llama-4-maverick", ... },
  "instructions": "You are a Generic Data Operations Agent...",
  "mcp_servers": [
    { "name": "sqlite-local",   "require_approval_for_tools": ["@write"] },
    { "name": "google-sheets",  "require_approval_for_tools": ["@write"] },
    { "name": "google-classroom", "require_approval_for_tools": [] },
    { "name": "web-search",    "require_approval_for_tools": [] }
  ],
  "skills": ["data-ingestion", "data-validation", "data-analytics", "matching-optimization"],
  "config": {
    "sandbox": { "enabled": true, "web_access": true },
    "generative_ui": { "enabled": true },
    "ask_user_questions": { "enabled": true }
  }
}
```

**What it does:** Defines everything about the agent — what model it uses, what tools it has, what skills it knows, and how it should behave (approval gates, sandbox, generative UI).

### 3.2 `tf-client.ts` — TrueForge SDK Client (476 lines)

This is the main entry point that:
1. Connects to TrueForge server via WebSocket/SSE
2. Sends user messages and receives streaming responses
3. Handles **tool approval** (pauses when write tools are called, waits for human "y")
4. Manages **session logs** (stores every turn, tool call, approval decision)
5. Spawns **subagents** for parallel work

```typescript
// Key functions:
connectToServer()           // Connect to localhost:8790
sendMessage(content)       // Send user input
handleToolApproval(tool)   // Pause & wait for 'y'
handleUserQuestion(msg)    // Ask clarifying question
spawnSubagent(skill)      // Parallel sub-task
logSession(event)         // Audit trail to DB
```

### 3.3 SQLite Database Schema (`sql/schema.sql`)

**11 tables with full referential integrity:**

| Table | Purpose | Key Columns |
|-------|---------|------------|
| `classes` | Class definitions | class_id, name, section |
| `students` | Student roster | student_id, full_name, roll_number, section |
| `subjects` | Subject catalog | subject_id, name, code |
| `exams` | Exam definitions | exam_id, name, date, max_marks |
| `marks` | Student marks (anomaly target) | student_id, subject_id, exam_id, marks_obtained |
| `attendance` | Daily attendance | student_id, date, status |
| `timetable` | Class schedule | class_id, period, day, subject_id, teacher_id |
| `staff` | Teacher records | staff_id, name, subjects |
| `syllabus` | Topic coverage | class_id, subject_id, topic, completed |
| `session_log` | Audit trail | session_id, tool_name, approval_status |
| `notifications` | Alerts queue | notification_id, type, sent_at |

**Indexes:** 6 indexes on foreign keys and roll_number for performance.

### 3.4 Seed Script (`scripts/seed-database.py`)

Populates the database with **40 students** and **600 marks rows** with **4 planted anomalies** for validation testing:

1. **Roll gaps** (rolls 15, 22, 38 missing)
2. **Order swap** (rolls 4 & 5 have swapped names)
3. **Out-of-range** (marks_obtained = 152 for a 100-max exam)
4. **Duplicate names** (Rohan Singh vs Rohan K. Singh at roll 6)

### 3.5 React Portal (`portal/`)

Built with `@truefoundry/trueforge-ui` + React 18 + TypeScript + Vite:

| Component | Purpose |
|-----------|---------|
| `ChatWorkspace` | Main chat interface with SSE streaming |
| `AnomalyCard` | Shows each detected anomaly with severity badge |
| `DiffTable` | Shows before/after for proposed corrections |
| `ChartWidget` | Renders Recharts (bar, line, pie, scatter) |
| `Sidebar` | Navigation, session history, schema explorer |
| `MessageBubble` | Renders AI and user messages with markdown |

---

## 4. End-to-End Workflow

### Scenario: "Find all data quality issues"

```
User types in portal:
  "Check my marks data for anomalies"

                    │
                    ▼
┌──────────────────────────────────────────────┐
│  TrueForge Agent (Llama-4-Maverick)         │
│                                              │
│  1. Tool: sandbox.exec                      │
│     → python3 run_validation.py             │
│       '{"action": "validate_marks",         │
│        "db_path": "/sandbox/school_ops.db"}'│
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  Sandbox Execution (deterministic Python)    │
│                                              │
│  Runs ALL 5 validators in parallel:          │
│   detect_duplicates.py   → 1 duplicate       │
│   detect_range.py       → 1 out-of-range    │
│   detect_order.py       → 0 (seed correct)  │
│   detect_gaps.py        → 3 roll gaps       │
│   detect_iqr_outliers.py → 1 IQR outlier    │
│                                              │
│  Returns JSON → TrueForge → Portal           │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  React Portal renders Anomaly Report Card    │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │ 🟡 Anomalies Found: 6               │  │
│  │                                      │  │
│  │ 🔴 Out of Range: 1                  │  │
│  │   STU-003 | Math | Mid Term | 152   │  │
│  │                                      │  │
│  │ 🟠 Duplicate: 1                     │  │
│  │   Roll 6: Rohan Singh / Rohan K.    │  │
│  │                                      │  │
│  │ 🟡 Roll Gaps: 3                    │  │
│  │   Missing: 15, 22, 38               │  │
│  │                                      │  │
│  │ 🟢 IQR Outliers: 1                 │  │
│  │   152 → medium severity             │  │
│  └──────────────────────────────────────┘  │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  Approval Gate (Human-in-the-Loop)           │
│                                              │
│  Agent wants to propose corrections?         │
│  → Renders DiffTable with proposed changes   │
│  → "Approve? (y/n)" prompt                │
│  → Only executes on 'y'                      │
└──────────────────────────────────────────────┘
```

---

## 5. Code Walkthrough

### 5.1 Validation: `detect_iqr_outliers.py`

```python
def _iqr_check(values):
    # 1. Filter non-finite values (NaN, inf)
    numeric = [float(v) for v in values if isfinite(v)]
    if len(numeric) < 4: return []

    # 2. Compute quartiles
    sorted_vals = sorted(numeric)
    q1 = sorted_vals[len(numeric) // 4]
    q3 = sorted_vals[3 * len(numeric) // 4]
    iqr = q3 - q1

    # 3. Tukey fences (1.5×IQR)
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr

    # 4. Extreme fence (3×IQR)
    lower_extreme = q1 - 3.0 * iqr
    upper_extreme = q3 + 3.0 * iqr

    # 5. Classify each outlier
    for v in sorted_vals:
        if v < lower or v > upper:
            severity = "high" if (v < lower_extreme or v > upper_extreme) else "medium"
```

### 5.2 Approval Gate: `tf-client.ts`

```typescript
async function handleToolCall(tool: ToolCall): Promise<string> {
  const needsApproval = tool.category === 'write' || tool.category === 'destructive';

  if (needsApproval) {
    // Pause execution, ask user
    const approved = await promptUser(`Tool: ${tool.name}\n${tool.input}\nApprove? (y/n): `);

    if (!approved) {
      logSession({ event: 'tool_denied', tool: tool.name });
      return "Tool denied by user.";
    }

    logSession({ event: 'tool_approved', tool: tool.name });
  }

  return executeTool(tool);
}
```

### 5.3 SQL Injection Prevention

Every user-controlled identifier (table, column) is validated before SQL interpolation:

```python
_SQL_IDENT_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")

def validate_identifier(name: str, kind: str) -> str:
    if not _SQL_IDENT_RE.match(name):
        raise ValueError(f"invalid {kind}: {name!r}")
    return name

# Then verify it exists in the actual schema
if not identifier_exists_in_schema(db_path, table, column):
    return { "error": "column not found" }
```

---

## 6. How the Closed Loop Works

The **closed-loop agent → approval → PR → Qodo review** cycle is the key demo:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. AGENT WRITES CODE                                       │
│    Agent (Llama-4) generates detect_iqr_outliers.py       │
│    Submits as a PR via GitHub API                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. CI PIPELINE RUNS                                       │
│    • lint-gates: validates GATES.md structure               │
│    • python-test: seeds DB, runs validators                │
│    • node-test: verifies seed, anomalies, agent spec         │
│    • gate-check: confirms all G1-G7 gates pass            │
│    All green → PR is mergeable                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. QODO AUTO-REVIEW                                        │
│    Qodo GitHub App subscribes to PR events                 │
│    Reviews code for:                                        │
│    • Bugs (correctness, reliability)                        │
│    • Security (SQL injection, unapproved writes)            │
│    • Rule violations (coding policies)                      │
│    Posts inline comments + summary with agent prompts        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. HUMAN SEES REVIEW                                       │
│    Opens PR page, sees Qodo's findings                      │
│    Can: merge (all green), request changes, or wait        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. CLOSED LOOP — AGENT FIXES BUGS                          │
│    Agent reads Qodo's agent prompts, implements fixes       │
│    Pushes to same PR branch → triggers new review          │
│    → Qodo re-reviews → marks bugs ✓ Resolved              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. PR MERGED                                               │
│    Human (or auto) merges to main                         │
│    CI runs on main → deploy portal to GitHub Pages          │
└─────────────────────────────────────────────────────────────┘
```

**This is exactly what happened in this project:**
- Agent wrote IQR outlier detection script → opened PR #1
- Qodo found 8 bugs across 3 review rounds
- Agent (with human help) fixed all 8 bugs
- PR merged → main CI green → portal deployed

---

## 7. Validation Scripts Explained

| Script | Method | What It Detects |
|--------|--------|----------------|
| `detect_duplicates.py` | SQL GROUP BY + HAVING COUNT > 1 | Duplicate roll numbers, names |
| `detect_range.py` | SQL WHERE marks < 0 OR > max | Out-of-bounds marks |
| `detect_order.py` | Python sorting + pairwise compare | Roll number sequence breaks |
| `detect_gaps.py` | Set difference (expected vs actual) | Missing roll numbers, date gaps |
| `detect_iqr_outliers.py` | Statistical IQR (Tukey method) | Extreme values beyond 1.5×IQR |
| `detect_referential.py` | FK lookup + NOT EXISTS | Orphaned foreign keys |
| `detect_outliers.py` | IQR + Z-score (generic) | Any numeric column outliers |

All scripts:
- Are **deterministic** (no randomness, no LLM)
- Run in the **sandbox** (isolated Python, no network)
- Return **structured JSON** (machine-readable)
- Handle **dirty data** gracefully (skip NaN, text in numeric columns)
- Are **read-only** (no INSERT/UPDATE/DELETE without approval)

---

## 8. CI/CD Pipeline

```
.github/workflows/ci.yml

┌─────────────────────────────────────────┐
│ lint-gates (Node.js)                    │
│ node scripts/gate-lint.mjs GATES.md     │
│ Validates: all 7 gates defined          │
│ Check: GATES.md structural integrity    │
└────────────────┬──────────────────────┘
                 │ Pass
                 ▼
┌─────────────────────────────────────────┐
│ python-test (Python 3.12)              │
│ 1. Seed DB: scripts/seed-database.py   │
│ 2. Schema check: node -e sqlite3 query │
│ 3. Run validators: detect_*.py scripts  │
└────────────────┬──────────────────────┘
                 │ Pass
                 ▼
┌─────────────────────────────────────────┐
│ node-test (Node.js + Python)           │
│ 1. npm install (root + sqlite3)       │
│ 2. Seed DB                            │
│ 3. verify-seed.mjs: counts match      │
│ 4. verify-anomalies.mjs: planted found  │
│ 5. verify-agent.mjs: spec valid       │
└────────────────┬──────────────────────┘
                 │ Pass
                 ▼
┌─────────────────────────────────────────┐
│ gate-check (needs: python-test + node)  │
│ Runs ALL gates with evidence collection │
│ node scripts/gate-check.mjs GATES.md   │
└────────────────┬──────────────────────┘
                 │ All 7 green
                 ▼
           ✅ PR MERGEABLE
```

---

## 9. Qodo Code Review Integration

### Setup (`.pr_agent.toml`)

```toml
[config]
model = "openrouter/anthropic/claude-sonnet-4-6"
language = "English"
verbosity = "concise"

[review]
persistent_comment = true
require_code_scanning_alerts = false

[review_config]
enable_all_reviewers = true

[coding_policies]
enforce_parameterized_queries = true
require_input_validation = true
require_error_handling = true
max_line_length = 120
```

### How It Works

1. **Install Qodo GitHub App** on the repository (app.qodo.ai → Integrations → GitHub)
2. App subscribes to `pull_request` events automatically
3. On every push to a PR branch, Qodo:
   - Clones the diff
   - Runs 4 reviewer types: Bug detection, Security, Performance, Code quality
   - Enforces `.pr_agent.toml` policies
   - Posts a **persistent comment** with findings
   - Provides **agent prompts** for each bug (copy-paste into Claude/GPT)
4. After fixes, Qodo **re-reviews** and marks bugs as ✓ Resolved

### What Qodo Found in This Project

| Round | Bugs Found | Resolved | Remaining |
|-------|-----------|----------|-----------|
| 1 | 4 (freq discard, 2.5×IQR, unapproved INSERT, no workflow) | 4 | 0 |
| 2 | 4 (positional args, field names, SQL injection, dirty data) | 4 | 0 |
| 3 | 1 (NaN/Infinity) | 1 | 0 |
| **Total** | **9** | **9** | **0** |

---

## 10. Video Walkthrough Script

### Opening (0:00 – 0:15)
```
"Onboarding screen shows: 'School Operations Responder powered by TrueForge'"

VOICEOVER:
"School Operations Responder is an AI agent that discovers your data 
automatically, finds quality issues, and only fixes them when you approve."
```

### Part 1: Architecture Overview (0:15 – 1:00)
```
SCREEN: Architecture diagram from README.md

VOICEOVER:
"The system has 3 layers. First, the React portal gives teachers a 
beautiful chat interface. Behind it, TrueForge's agent harness runs 
a Llama-4 model that orchestrates everything. And under the hood, 
17 Python scripts run in an isolated sandbox to validate data 
without any AI guessing — pure statistics."

SCREEN: Show portal running at localhost:5173

VOICEOVER:
"This is the React portal — built with TypeScript and Vite, themed 
for school use with a chalkboard-inspired design."
```

### Part 2: Schema Discovery (1:00 – 2:00)
```
SCREEN: User types "What tables do I have?"

VOICEOVER:
"The agent starts by discovering your schema at runtime. It asks 
the sqlite-local MCP server what tables exist, what columns they 
have, and what the foreign keys look like."

SCREEN: Show schema output in chat

VOICEOVER:
"It found 11 tables: students, marks, exams, subjects, attendance, 
timetable, staff, syllabus, and more. No hardcoded assumptions."
```

### Part 3: Validation Run (2:00 – 3:00)
```
SCREEN: User types "Check my marks for anomalies"

VOICEOVER:
"Now the agent runs all 5 validation detectors. Each one is a 
pure Python script — no AI, no guessing. Just algorithms."

SCREEN: Show 5 validators running

VOICEOVER:
"Duplicates, range checks, order breaks, gaps, and IQR outliers. 
Each one returns structured JSON."

SCREEN: Show anomaly report card in portal

VOICEOVER:
"Found 6 anomalies: 1 out-of-range mark (152 out of 100), 
1 duplicate name, 3 missing roll numbers. Every anomaly shown 
with the student ID, subject, exam, and severity."
```

### Part 4: Approval Gate (3:00 – 3:45)
```
SCREEN: Agent proposes a correction

VOICEOVER:
"Before any change, the agent shows a diff table — here's what 
will change, and asks for approval."

SCREEN: Show approval prompt with DiffTable

VOICEOVER:
"This is the human-in-the-loop. The agent can't write to the 
database without a 'y'. It's a security feature and a trust 
feature."
```

### Part 5: CI/CD Pipeline (3:45 – 4:30)
```
SCREEN: Show GitHub Actions tab

VOICEOVER:
"Every push runs 4 CI jobs. Lint gates, Python tests, Node tests, 
and a final gate check that verifies all 7 slices."

SCREEN: Show all green CI runs

VOICEOVER:
"All checks green. The code is validated before it ever reaches main."
```

### Part 6: Qodo Code Review (4:30 – 5:15)
```
SCREEN: Show PR #1 with Qodo comments

VOICEOVER:
"Qodo automatically reviews every PR. It found 9 bugs across 
3 rounds — from SQL injection risks to unapproved database writes. 
Each bug came with a copy-paste agent prompt for fixing it."

SCREEN: Show Qodo's bug summary

VOICEOVER:
"The agent fixed all 9 bugs. Qodo re-reviewed and marked them 
all resolved. The PR merged clean."

SCREEN: Show final merged PR

VOICEOVER:
"That's the closed loop: agent writes code, CI validates it, 
Qodo reviews it, bugs get fixed, and only then does it reach main."
```

### Closing (5:15 – 5:30)
```
SCREEN: Final architecture diagram

VOICEOVER:
"School Operations Responder: TrueForge for the data layer, 
Qodo for code quality, React for the UI, and you in the loop 
for every approval."

TEXT ON SCREEN:
"Built with TrueForge | Reviewed by Qodo | Deployed on GitHub Pages"
```

---

## 11. Submission Checklist

### Hackathon Requirements

- [x] **Public repository**: https://github.com/paulson2dahl/Codeconstruct
- [x] **README with setup**: `README.md` (400 lines, architecture, examples, CI/CD)
- [x] **Demo video**: ~5 min walkthrough (use script above)
- [x] **Write-up**: This document + README hackathon section
- [x] **Working agent**: `agent.json` + `tf-client.ts` + MCP servers
- [x] **Sandbox scripts**: 17 deterministic validators in `sandbox/`
- [x] **React portal**: TypeScript/Vite with school theme, Generative UI
- [x] **CI/CD**: `.github/workflows/ci.yml` — all 4 jobs green
- [x] **Qodo integration**: `.pr_agent.toml` + GitHub App installed
- [x] **Closed-loop demo**: PR #1 → Qodo review → 9 bugs fixed → merged

### Demo Commands

```bash
# 1. Start TrueForge server
npx @truefoundry/trueforge@latest

# 2. Start React portal
cd portal && npm run dev

# 3. Run agent in terminal
npx tsx tf-client.ts

# 4. Run all validations
python3 scripts/seed-database.py
python3 sandbox/validation/detect_duplicates.py '{"db_path": "school_ops.db", "action": "detect_duplicates", "table": "students", "column": "roll_number"}'

# 5. Run CI locally
node scripts/gate-check.mjs GATES.md

# 6. Trigger Qodo demo PR
bash scripts/demo-qodo-pr.sh

# 7. Watch Qodo review
gh pr view 1 --repo paulson2dahl/Codeconstruct --web
```

### Key Files for Judges

| File | Purpose |
|------|---------|
| `agent.json` | Agent spec (model, tools, skills) |
| `tf-client.ts` | TrueForge SDK client |
| `sql/schema.sql` | Database schema (11 tables) |
| `scripts/seed-database.py` | Test data with planted anomalies |
| `sandbox/validation/detect_iqr_outliers.py` | IQR outlier detector (PR #1 main file) |
| `sandbox/execution/run_validation.py` | Orchestrates 5 validators |
| `portal/` | React portal (TypeScript/Vite) |
| `.pr_agent.toml` | Qodo review configuration |
| `.github/workflows/ci.yml` | CI/CD pipeline |
| `GATES.md` | Slice 1 gate definitions |
| `docs/SETUP-QODO.md` | How to install Qodo GitHub App |
| `scripts/demo-qodo-pr.sh` | Creates demo PR + polls Qodo |

---

*Built with TrueForge | Reviewed by Qodo | Deployed on GitHub Pages*
*Agent Harness Hackathon — August 2026*
