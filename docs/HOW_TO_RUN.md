# How to Run — Complete Guide

> Three options depending on what you want to do.

---

## Option 1: Quick Demo (No TrueForge, No Chat UI)

**Best for:** Video recording, showing the validators work, taking screenshots
**Time:** 30 seconds
**Needs:** Just Node.js + Python 3.12

```bash
cd /home/buntu1/school-ops-responder

# Step 1: Seed the database (creates school_ops.db with 40 students, 600 marks, 4 planted anomalies)
python3 scripts/seed-database.py

# Step 2: Run all 5 validation detectors at once
python3 sandbox/execution/run_validation.py \
  '{"action": "validate_marks", "db_path": "school_ops.db"}'

# Expected output:
# Total anomalies: 6
#   duplicates: 1
#   out_of_range: 1
#   order_breaks: 0
#   gaps: 3
#   iqr_outliers: 1

# Step 3 (optional): Run individual validators
python3 sandbox/validation/detect_iqr_outliers.py \
  --db school_ops.db --table marks --column marks_obtained --group-by subject_id

python3 sandbox/validation/detect_duplicates.py \
  '{"action": "detect_duplicates", "db_path": "school_ops.db", "table": "students", "column": "roll_number"}'

# Step 4: Verify all 7 gates pass
node scripts/gate-check.mjs GATES.md
```

---

## Option 2: Full Local Setup (TrueForge + Chat UI)

**Best for:** Live demo, judges who want to interact
**Time:** 5 minutes
**Needs:** Node.js + Python 3.12 + `socat` + `bwrap` (Linux)

### A. Install Linux Sandbox Dependencies (one-time)

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y socat bwrap ripgrep

# Verify
which socat bwrap rg
# Should print paths for all three
```

### B. Start TrueForge Server (Terminal 1)

```bash
cd /home/buntu1/school-ops-responder
npx @truefoundry/trueforge@latest --port 8790
```

**Expected output:**
```
████████╗██████╗ ██╗   ██╗███████╗███████╗...
TrueForge v0.1.4  ·  standalone
Agent server listening on http://localhost:8790
```

**Verify:**
```bash
curl http://localhost:8790/healthz
# Should print: OK!
```

### C. Start React Portal (Terminal 2)

```bash
cd /home/buntu1/school-ops-responder/portal
npm install        # only first time
npm run dev
```

**Expected output:**
```
VITE v5.4.21  ready in 179 ms
➜  Local:   http://localhost:5173/
```

**Open in browser:** http://localhost:5173

### D. Run the Agent CLI (Terminal 3, optional)

```bash
cd /home/buntu1/school-ops-responder
npx tsx tf-client.ts
```

Type messages at the prompt:
```
> Check my marks data for anomalies
> Find the top 5 students in Class 8 by average marks
> Show attendance trends for last month
> Find duplicate student names
```

When the agent calls a write tool, it will prompt:
```
Tool: sqlite.execute_query
Input: UPDATE marks SET ...
Approve? (y/n):
```
Type `y` to approve, `n` to deny.

---

## Option 3: GitHub Pages (Deployed Already)

**Best for:** Sharing with judges who don't want to run anything
**URL:** Check your repo's Settings → Pages

```bash
# Check if deployed
gh api repos/paulson2dahl/Codeconstruct/pages 2>&1
```

The portal is auto-deployed on every push to main via `.github/workflows/deploy-portal.yml`.

---

## Step-by-Step for Your Video Recording

```bash
# Terminal 1 — Open and stay
cd /home/buntu1/school-ops-responder
npx @truefoundry/trueforge@latest --port 8790

# Terminal 2 — Open and stay
cd /home/buntu1/school-ops-responder/portal
npm run dev

# Terminal 3 — Run commands as you record
cd /home/buntu1/school-ops-responder
python3 scripts/seed-database.py
python3 sandbox/execution/run_validation.py \
  '{"action": "validate_marks", "db_path": "school_ops.db"}'
node scripts/gate-check.mjs GATES.md
```

**Browser tabs to open in advance:**
- `http://localhost:5173` (React portal — chat UI)
- `http://localhost:8790/api/v1/docs` (TrueForge API docs)
- `https://github.com/paulson2dahl/Codeconstruct` (repo)
- `https://github.com/paulson2dahl/Codeconstruct/pull/1` (Qodo review)
- `https://github.com/paulson2dahl/Codeconstruct/actions` (CI/CD)

---

## What Each Script Does (Quick Reference)

| Script | What It Does | Output |
|--------|--------------|--------|
| `scripts/seed-database.py` | Creates school_ops.db with 40 students, 600 marks, 4 planted anomalies | `Database ready at: school_ops.db` |
| `scripts/verify-seed.mjs` | Checks row counts are correct | `seed_ok` |
| `scripts/verify-anomalies.mjs` | Confirms all 4 anomaly classes are detectable | `duplicates=1 out_of_range=1 order_break=1 gaps=3` |
| `scripts/verify-schema.mjs` | Confirms 11 tables + 6 indexes exist | `schema_ok` |
| `scripts/verify-agent.mjs` | Confirms agent.json matches TrueForge spec | `agent_ok` |
| `scripts/gate-check.mjs` | Runs all 7 gates with evidence | `All gates PASSED` |
| `sandbox/execution/run_validation.py` | Orchestrates all 5 validators | JSON with 6 anomalies |
| `sandbox/validation/detect_iqr_outliers.py` | IQR-based outlier detection | `{"outliers": [...], "count": N}` |
| `sandbox/validation/detect_duplicates.py` | Finds duplicate values | `{"duplicate_groups": N, ...}` |
| `sandbox/validation/detect_range.py` | Checks values are in valid range | `{"out_of_range_found": N, ...}` |
| `sandbox/validation/detect_order.py` | Detects sequence breaks | `{"order_issues_found": N, ...}` |
| `sandbox/validation/detect_gaps.py` | Finds missing values in sequence | `{"gap_issues_found": N, ...}` |

---

## Troubleshooting

### "Cannot find module 'sqlite3'"
```bash
cd /home/buntu1/school-ops-responder
npm install
```

### "TrueForge not reachable"
```bash
# Check if server is running
curl http://localhost:8790/healthz
# If not, start it:
npx @truefoundry/trueforge@latest --port 8790
```

### "sandbox: enabled: false"
TrueForge in standalone mode needs `socat` and `bwrap` on Linux. Install with:
```bash
sudo apt-get install -y socat bwrap ripgrep
```

### "Port 8790 already in use"
```bash
# Kill any process on 8790
lsof -ti:8790 | xargs kill -9
# Or use a different port
npx @truefoundry/trueforge@latest --port 8800
```

### "Portal shows blank page"
```bash
# Check Vite output for errors
cd portal
npm run dev -- --port 5173
# Should show "ready in 179 ms"
```

---

## What to Show in Your Video

1. **Open terminal** → run `python3 sandbox/execution/run_validation.py ...` → show 6 anomalies detected
2. **Open browser** → http://localhost:5173 → show React portal with chat UI
3. **Open browser** → http://localhost:8790/api/v1/docs → show TrueForge API
4. **Open browser** → GitHub Actions → show all green CI runs
5. **Open browser** → PR #1 → show Qodo's code review with 9 bugs found
6. **Open file** → `agent.json` → show the agent spec
7. **Open file** → `sandbox/validation/detect_iqr_outliers.py` → walk through the IQR algorithm

Total demo time: 3-5 minutes. Use the script in `docs/VIDEO_SCRIPT.md`.
