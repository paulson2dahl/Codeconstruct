# School Operations Responder — Generic Data Operations Agent

A **TrueForge-based** generic data operations platform that works with **ANY domain** (school, college, university, coaching center, employee business, tuition center, etc.) by discovering schema at runtime. No hardcoded tables, columns, or domain concepts.

## 🎯 Core Philosophy

> **Bring Your Own Data** — The agent discovers your data structure at runtime, whether it's in Excel/CSV files, Google Sheets, Google Classroom, or a local SQLite database. It adapts to your domain automatically.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      TrueForge Agent Harness                    │
├─────────────────────────────────────────────────────────────────┤
│  Generic Data Operations Agent (Llama-4-Maverick)              │
│  ├── Schema Discovery (Runtime)                                 │
│  ├── Data Ingestion (Excel/CSV/Google Sheets)                  │
│  ├── Validation & Anomaly Detection                            │
│  ├── Analytics & Insights                                      │
│  └── Matching & Optimization (OR-Tools)                        │
├─────────────────────────────────────────────────────────────────┤
│  MCP Servers                                                    │
│  ├── sqlite-local (local database)                             │
│  ├── google-sheets (spreadsheets)                              │
│  ├── google-classroom (rosters/assignments/grades)             │
│  └── web-search (research)                                     │
├─────────────────────────────────────────────────────────────────┤
│  Sandbox (Code Mode - Deterministic Execution)                 │
│  ├── discover_schema.py                                        │
│  ├── ingest_excel.py                                           │
│  ├── detect_outliers.py / detect_duplicates.py                 │
│  ├── detect_gaps.py / detect_referential.py                    │
│  ├── compute_analytics.py                                      │
│  ├── solve_matching.py                                         │
│  ├── web_search.py                                             │
│  └── process_multimodal.py                                     │
├─────────────────────────────────────────────────────────────────┤
│  @truefoundry/trueforge-ui React Portal (School Theme)         │
│  ├── Chat Workspace (Multimodal)                               │
│  ├── Anomaly Report Cards                                      │
│  ├── Schema Explorer                                           │
│  ├── Diff Tables (Approval Gates)                              │
│  └── Chart Widgets                                             │
└─────────────────────────────────────────────────────────────────┘
```

## ✨ Features

### 🔍 **Generic Schema Discovery**
- Discovers ALL tables, columns, types, primary keys, foreign keys at runtime
- Works with SQLite, PostgreSQL, Excel, CSV, Google Sheets
- Infers semantic types: identifier, numeric, date, categorical, text, boolean
- Zero hardcoded assumptions about your data

### 📥 **Data Ingestion Pipeline**
- **Excel/CSV**: Drag & drop or specify path → auto schema inference → anomaly detection → human approval → commit
- **Google Sheets**: OAuth2 → read/write sheets with approval gates
- **Anomaly Report Cards**: Generative UI showing errors/warnings/info with sample rows
- **Human-in-the-loop**: Every write pauses for approval

### ✅ **Comprehensive Validation**
- **Numeric**: Outliers (IQR, Z-score), range violations, null analysis
- **Text**: Duplicates (exact/fuzzy), format inconsistencies, whitespace, case issues
- **Date**: Gaps, future dates, invalid ranges
- **Relational**: Orphaned foreign keys, referential integrity, missing references
- All deterministic — runs in sandbox, not LLM reasoning

### 📊 **Analytics & Insights**
- Rankings (top-N by any metric, grouped by any category)
- Summaries (min/max/mean/median/stdev/sum)
- Trends (time-series with linear regression)
- Correlations (Pearson between any numeric columns)
- Grouped statistics (pivot tables by categorical columns)
- All rendered as Generative UI charts (line, bar, area, pie, scatter)

### ⚡ **Matching & Optimization**
- **Assignment**: Min-cost bipartite matching (Hungarian via OR-Tools SAT)
- **Scheduling**: CP-SAT with availability constraints
- **Allocation**: Proportional or priority-based resource distribution
- Solutions presented as diff tables for human approval

### 🌐 **Multimodal Support**
- **Images**: Upload → analyze (dimensions, format, OCR-ready)
- **Files**: PDF, Excel, CSV, text → extract, preview, process
- **Links**: Fetch metadata, extract content, download
- **Web Search**: DuckDuckGo-based search in sandbox with web access

### 🎨 **School-Themed React Portal**
- Built with `@truefoundry/trueforge-ui` + React 18 + TypeScript + Vite
- Chalkboard-inspired dark theme (customizable)
- Real-time chat with streaming responses
- Generative UI components: Anomaly Cards, Diff Tables, Charts, Approval Gates
- Schema Explorer with relationships
- Approval Gate dashboard

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- TrueForge server running (`npx @truefoundry/trueforge@latest`)
- OpenRouter API key (for Llama-4-Maverick)

### Installation

```bash
# Clone and setup
cd school-ops-responder

# Install portal dependencies
cd portal && npm install && cd ..

# Install Python dependencies for sandbox scripts
pip install pandas openpyxl ortools pillow requests

# Start TrueForge server (in separate terminal)
npx @truefoundry/trueforge@latest

# Start portal dev server
cd portal && npm run dev
```

### Configuration

1. **Environment Variables** (`.env`):
```bash
TRUEFORGE_BASE_URL=http://localhost:8790
OPENROUTER_API_KEY=your_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

2. **MCP Server Setup**:
```bash
# SQLite Local (auto-starts with agent)
# Google Sheets/Classroom: Configure OAuth in Google Cloud Console
# Web Search: Uses TrueForge hosted endpoint
```

## 📁 Project Structure

```
school-ops-responder/
├── agent.json                    # Agent specification (generic)
├── tf-client.ts                  # TrueForge SDK client
├── README.md
├── portal/                       # @truefoundry/trueforge-ui React app
│   ├── src/
│   │   ├── components/           # ChatWorkspace, AnomalyCard, DiffTable, ChartWidget, etc.
│   │   ├── hooks/                # useSession, useMultimodal
│   │   ├── lib/                  # trueforge-sdk.ts wrapper
│   │   ├── theme/                # School theme tokens
│   │   └── App.tsx / main.tsx
│   ├── package.json
│   └── vite.config.ts
├── sandbox/
│   ├── execution/                # Runtime scripts (Code Mode)
│   │   ├── discover_schema.py
│   │   ├── ingest_excel.py
│   │   ├── web_search.py
│   │   └── process_multimodal.py
│   ├── validation/               # Anomaly detection
│   │   ├── detect_outliers.py
│   │   ├── detect_duplicates.py
│   │   ├── detect_gaps.py
│   │   └── detect_referential.py
│   ├── analytics/
│   │   └── compute_analytics.py
│   └── matching/
│       └── solve_matching.py
├── skills/                       # Subagent skill definitions
│   ├── data-ingestion.md
│   ├── data-validation.md
│   ├── data-analytics.md
│   └── matching-optimization.md
├── mcp-servers/                  # MCP server configurations
│   ├── sqlite-local/
│   │   ├── server.py
│   │   └── mcp.json
│   ├── google-sheets/mcp.json
│   ├── google-classroom/mcp.json
│   └── web-search/mcp.json
└── .github/workflows/ci.yml      # CI/CD pipeline
```

## 💡 Usage Examples

### Ingest Excel File & Check Anomalies
```bash
# Via portal: Upload file in chat
# Or via CLI:
npx tsx tf-client.ts "Ingest /sandbox/marks.xlsx and check for anomalies"
```

### Run Validation on All Tables
```bash
npx tsx tf-client.ts "Run full validation on the database and show anomaly report"
```

### Get Analytics
```bash
npx tsx tf-client.ts "Rank students by average marks per class"
npx tsx tf-client.ts "Show attendance trend for Class 8 over last month"
npx tsx tf-client.ts "Correlate study hours with exam scores"
```

### Solve Matching Problem
```bash
npx tsx tf-client.ts "Find best substitute teachers for absent teachers today"
npx tsx tf-client.ts "Create timetable for next week respecting availability"
```

### Web Search
```bash
npx tsx tf-client.ts "Search for latest CBSE curriculum changes 2024"
```

## 🔧 MCP Server Details

### sqlite-local
- **Type**: stdio (Python)
- **Tools**: execute, query, list_tables, describe_table
- **Resources**: schema://tables
- **Approval**: Required for write operations

### google-sheets
- **Type**: HTTP (Google APIs)
- **Auth**: OAuth2 (sheets.readonly + sheets)
- **Tools**: read_sheet, write_sheet, append_sheet, list_sheets, create_sheet
- **Approval**: Required for write/append/create

### google-classroom
- **Type**: HTTP (Google Classroom API)
- **Auth**: OAuth2 (rosters, courses, coursework.readonly)
- **Tools**: list_courses, get_course, list_students, list_teachers, list_coursework, list_student_submissions, get_grades
- **Approval**: None (read-only)

### web-search
- **Type**: HTTP (TrueForge hosted)
- **Auth**: API Key
- **Tools**: search, fetch, search_news
- **Approval**: None

## 🛡️ Security & Approval

| Operation | Approval Required | UI Rendered |
|-----------|-------------------|-------------|
| SELECT queries | No | Results table |
| INSERT/UPDATE/DELETE | Yes | Diff Table |
| Google Sheets write | Yes | Diff Table |
| Schema changes | Yes | Diff Table |
| Notifications | Yes | Approval Card |
| External API calls | Yes | Approval Card |

## 🧪 Testing

```bash
# Run validation scripts directly
python3 sandbox/validation/detect_outliers.py '{"action": "detect_all_outliers"}'
python3 sandbox/execution/discover_schema.py '{"action": "discover_schema", "db_path": "/sandbox/user_data.db"}'

# Portal tests
cd portal && npm run lint && npm run build
```

## 📝 CI/CD Pipeline

The `.github/workflows/ci.yml` includes:
1. **Gate Lint**: Structural validation
2. **Python Tests**: Seed DB, verify schema, run anomaly detection
3. **Node Tests**: Verify seed, anomalies, agent spec
4. **Qodo Code Review**: Automated code quality
5. **Gate Check**: Final verification all gates pass

## 🎨 Customization

### Theme
Edit `portal/src/theme/school-theme.ts` for colors, fonts, spacing.

### Agent Behavior
Modify `agent.json` instructions and MCP server configs.

### Sandbox Scripts
Add new scripts in `sandbox/execution/`, `sandbox/validation/`, etc.

### Subagent Skills
Edit `skills/*.md` for custom subagent prompts.

## 📄 License

MIT License — Feel free to use, modify, and distribute.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit PR with description

## 🔗 Links

- [TrueForge Documentation](https://truefoundry.com/docs)
- [TrueForge SDK](https://github.com/truefoundry/trueforge-sdk)
- [OR-Tools](https://developers.google.com/optimization)
- [Recharts](https://recharts.org)

---

**Built with TrueForge** — The agent framework for reliable, auditable AI operations.