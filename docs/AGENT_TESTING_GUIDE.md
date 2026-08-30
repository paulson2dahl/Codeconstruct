# Agent Capabilities, Tools & Testing Guide

## MCP Server Setup

The agent uses the Model Context Protocol (MCP) to connect to external services. These are configured in `agent.json`:

### 1. `sqlite-local` (fully working)
```
url: mcp://sqlite/local
tools: @all (read + write)
approval: required for @write and @destructive
```
The agent discovers your database schema at runtime — no hardcoded table names. For this demo, the local SQLite file is `school_ops.db` with 11 tables.

### 2. `google-sheets` (configured, needs credentials)
```
url: https://mcp.googleapis.com/v1/sheets
tools: @read + @write
approval: required for @write
```
- Requires a Google Cloud service account with Sheets API enabled
- The agent can ingest data from Google Sheets into the SQLite database
- To set up: provide credentials via `GOOGLE_APPLICATION_CREDENTIALS` env var or TrueForge dashboard
- Excel/CSV ingestion works identically — agent reads file, infers schema, maps to DB

### 3. `google-classroom` (configured, needs credentials)
```
url: https://mcp.googleapis.com/v1/classroom
tools: @read only
```
- Read-only access to rosters, assignments, and grades
- No credentials needed for read-only browsing
- Could sync classroom rosters to local DB automatically

### 4. `web-search` (configured, needs API key)
```
url: https://mcp.truefoundry.com/web-search
tools: @read only
```
- Research tasks that need external data
- Requires Qodo API key configured in TrueForge

### MCP Tool Approval Flow
```
User asks agent to fix data
    → Agent calls @write tool (blocked)
    → TrueForge pauses: "Approve this write?" modal
    → User approves or rejects
    → Agent executes or aborts
```

---

## How the Agent Uses Tools

### 1. Schema Discovery (sqlite-local @read)
The agent starts by querying the database structure — no assumptions:
```
PRAGMA table_list;           -- list all tables
PRAGMA table_info(students); -- columns + types for one table
PRAGMA foreign_key_list(X);  -- relationships
```
This produces a runtime schema map used for all downstream tasks.

### 2. Validation Scripts (sandbox execution)
The agent runs pure-Python validators in an isolated sandbox:

| Script | What it detects |
|---|---|
| `detect_duplicates.py` | Fuzzy name matches (Levenshtein distance) |
| `detect_range.py` | Values outside valid range (e.g., 0 ≤ mark ≤ 100) |
| `detect_order.py` | Monotonicity violations (e.g., roll numbers out of order) |
| `detect_gaps.py` | Missing sequence numbers |
| `detect_iqr_outliers.py` | Statistical outliers (1.5×IQR fence, 3×IQR extreme) |
| `detect_referential.py` | Orphaned foreign keys |

All return structured JSON. No LLM guessing — deterministic algorithms.

### 3. Data Ingestion Pipeline
```
User drops Excel/CSV file
    → Agent reads file headers + first 100 rows
    → Infers types (string, number, date)
    → Maps to existing DB tables or creates new ones
    → Runs all 5 validators against ingested data
    → Presents Anomaly Report Card (Generative UI)
    → User approves → commits to DB
    → User rejects → discards
```

### 4. Excel / CSV / Google Sheets Support
- **Excel (.xlsx)**: read via `openpyxl` in sandbox
- **CSV**: read via Python `csv` module
- **Google Sheets**: via `google-sheets` MCP → fetches via Sheets API v4
- All ingestion paths go through the same 5-validator pipeline

### 5. PowerPoint / DOCX / PDF — Read-only Support
These formats are **not yet automated** in this demo, but the architecture supports them:
- **PDF**: `pdfplumber` or `PyMuPDF` in sandbox → extract tables → feed to validators
- **DOCX**: `python-docx` → extract text/tables → pattern matching for structured data
- **PowerPoint**: `python-pptx` → extract text from slides → pass to analytics pipeline
- The agent's sandbox can run arbitrary Python, so adding these is a skill/plugin call away

---

## Step-by-Step Testing

### Option A: Full Local (requires Python + Node)
```bash
# 1. Seed the database
cd school-ops-responder
python3 scripts/seed-database.py

# 2. Verify all anomalies are planted
node scripts/verify-anomalies.mjs
# Expected: duplicates=1 out_of_range=1 order_break=1 gaps=3

# 3. Verify agent code
node scripts/verify-agent.mjs
# Expected: agent_ok

# 4. Run gate checks (7 gates, all must pass)
node scripts/gate-check.mjs GATES.md
# Expected: All gates PASSED

# 5. Start TrueForge (if installed)
trueforge dev
# OR start the portal standalone:
cd portal && npm run dev
# Opens: http://localhost:3000

# 6. Check TrueForge health
curl http://localhost:8790/api/v1/capabilities
# Expected: {"sandbox": {"enabled": false}, ...}

# 7. Open browser: http://localhost:3000
#    - Click "Open Chat Workspace"
#    - Type: "Check for anomalies in my data"
#    - Agent returns: anomaly report card with counts
```

### Option B: GitHub Pages (no setup)
```bash
# 1. Go to: https://paulson2dahl.github.io/Codeconstruct/
# 2. Click "Open Chat Workspace"
# 3. Try the quick action buttons
#    - "Check my marks for anomalies" → runs detect_iqr_outliers
#    - "Show duplicate students" → runs detect_duplicates
#    - "Show schema of all tables" → returns 11-table list
```

### Option C: CI Demo (automated)
```bash
# CI runs on every push:
#   lint-gates → python-test → node-test → gate-check → deploy-portal
gh run list --repo paulson2dahl/Codeconstruct --limit 5
```

### Testing individual validators
```bash
# Duplicate detection (fuzzy name match)
python3 sandbox/validation/detect_duplicates.py --db school_ops.db --table students

# Range check (marks 0–100)
python3 sandbox/validation/detect_range.py --db school_ops.db --table marks --column marks_obtained

# IQR outliers (per subject group)
python3 sandbox/validation/detect_iqr_outliers.py --db school_ops.db --table marks --column marks_obtained --group-by subject_id

# Order check (monotonic roll numbers)
python3 sandbox/validation/detect_order.py --db school_ops.db --table students --column roll_number

# Gap detection (missing roll numbers)
python3 sandbox/validation/detect_gaps.py --db school_ops.db --table students --column roll_number

# Referential integrity
python3 sandbox/validation/detect_referential.py --db school_ops.db
```

---

## Example Queries You Can Give the Agent

### Data Validation
| Query | What happens |
|---|---|
| `"Check my marks for anomalies"` | Runs all 5 validators → returns anomaly report card |
| `"Find duplicate student names"` | Fuzzy match (Levenshtein) → shows duplicate groups |
| `"Find out-of-range marks"` | Range check → shows marks < 0 or > 100 |
| `"Show IQR outliers in my data"` | Statistical outlier detection per subject group |
| `"Find gaps in roll numbers"` | Missing sequence detection → lists missing roll numbers |
| `"Check referential integrity"` | Orphaned foreign key detection |

### Schema & Discovery
| Query | What happens |
|---|---|
| `"What tables do I have?"` | PRAGMA query → lists all 11 tables with row counts |
| `"Show the schema for students"` | PRAGMA table_info → columns, types, nullability |
| `"What are the relationships between tables?"` | Foreign key introspection → entity relationship summary |

### Data Ingestion (Excel / CSV / Google Sheets)
| Query | What happens |
|---|---|
| `"Import this CSV file"` | Reads file → infers schema → shows preview → awaits approval |
| `"Sync my Google Sheet"` | MCP call to Sheets API → shows data preview → awaits approval |
| `"Map these columns to the database"` | Column mapping UI → generates CREATE TABLE or INSERT |

### Analytics & Insights
| Query | What happens |
|---|---|
| `"Top 10 students by average mark"` | SQL aggregation → ranked list with averages |
| `"Show attendance by subject"` | GROUP BY query → summary table |
| `"Find correlations between marks and attendance"` | Pearson correlation on numeric columns |

### Optimization & Matching
| Query | What happens |
|---|---|
| `"Create a substitute teacher schedule"` | OR-Tools constraint solver → proposed schedule table |
| `"Match tutors to students"` | Bipartite matching → suggested pairs |
| `"Optimize my exam timetable"` | Constraint solver → conflict-free schedule |

### Code Review
| Query | What happens |
|---|---|
| `"Review my PR"` | Posts to Qodo → returns inline comments |
| `"Show me the bugs Qodo found"` | Lists all 9 bugs across 3 rounds with severity |

---

## File → Tool Mapping

| File format | Read library | Ingestion path |
|---|---|---|
| SQLite (.db) | `sqlite3` (built-in) | sqlite-local MCP |
| CSV | Python `csv` | Sandbox file read |
| Excel (.xlsx) | `openpyxl` | Sandbox file read |
| Google Sheets | Sheets API v4 | google-sheets MCP |
| JSON | Python `json` | Sandbox file read |
| PDF | `pdfplumber` / `PyMuPDF` | Sandbox (planned) |
| DOCX | `python-docx` | Sandbox (planned) |
| PowerPoint | `python-pptx` | Sandbox (planned) |
