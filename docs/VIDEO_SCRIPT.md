# Demo Video Script — School Operations Responder

**Length:** 5:30
**Format:** Screen recording with voiceover
**Resolution:** 1080p minimum
**Tools needed:** OBS Studio / Loom / QuickTime

---

## Pre-Recording Checklist

```bash
# 1. Start TrueForge server
cd /home/buntu1/school-ops-responder
npx @truefoundry/trueforge@latest &

# 2. Wait for it to be ready
sleep 5
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8790
# Should print: 200

# 3. Start React portal
cd portal && npm run dev &

# 4. Open browser tabs in advance:
#    - Tab 1: http://localhost:5173 (portal)
#    - Tab 2: https://github.com/paulson2dahl/Codeconstruct
#    - Tab 3: https://github.com/paulson2dahl/Codeconstruct/pull/1
#    - Tab 4: https://github.com/paulson2dahl/Codeconstruct/actions

# 5. Terminal tabs:
#    - Tab 1: project root
#    - Tab 2: portal/

# 6. Have these commands ready in your history:
#    - `python3 scripts/seed-database.py`
#    - `node scripts/gate-check.mjs GATES.md`
#    - `python3 sandbox/execution/run_validation.py '{"action": "validate_marks", "db_path": "school_ops.db"}'`
```

---

## Section 1: Cold Open (0:00 - 0:15)

**Visual:** Title slide with project name
```
┌─────────────────────────────────────┐
│  School Operations Responder         │
│  TrueForge-powered AI Agent         │
│  Agent Harness Hackathon            │
└─────────────────────────────────────┘
```

**VOICEOVER:**
> "School Operations Responder is an AI agent built on TrueForge that helps schools find data quality issues — without writing a single line of code by hand. Let me show you how it works."

---

## Section 2: The Big Picture (0:15 - 1:00)

**Visual:** Open `docs/ARCHITECTURE.md` in browser, scroll to the ASCII diagram

**VOICEOVER:**
> "The system has three layers. At the top, a React portal gives teachers a chat interface. Behind it, TrueForge's agent harness — running Llama-4-Maverick — orchestrates everything. And under the hood, seventeen pure-Python validators run in an isolated sandbox.
>
> "Why pure Python? Because statistical validation must be deterministic. No LLM guessing whether a mark of 152 is 'probably wrong' — just Tukey's IQR rule: 'outside Q1 - 1.5×IQR, flag it.'"

**Cut to:** Open `portal/src/components/ChatWorkspace.tsx` in editor

**VOICEOVER:**
> "The portal is React 18 with TypeScript and Vite. It streams responses from TrueForge via Server-Sent Events, and renders Generative UI cards inline."

---

## Section 3: Runtime Schema Discovery (1:00 - 2:00)

**Visual:** Open terminal, run:
```bash
python3 -c "
import sqlite3
conn = sqlite3.connect('school_ops.db')
cur = conn.cursor()
cur.execute(\"SELECT name FROM sqlite_master WHERE type='table'\")
for r in cur.fetchall(): print(r[0])
"
```

**VOICEOVER:**
> "The agent never assumes your schema. On first run, it discovers everything: eleven tables, columns, types, foreign keys. No hardcoded 'students' or 'marks' — it works for schools, colleges, coaching centers, even employee databases."

**Cut to:** Open `agent.json` in editor

**VOICEOVER:**
> "Look at the instructions field: 'You are a Generic Data Operations Agent for TrueForge. You work with ANY domain by discovering the user's data structure at runtime.' That's the philosophy — bring your own data."

---

## Section 4: Validation in Action (2:00 - 3:00)

**Visual:** Run the validation in terminal:
```bash
python3 sandbox/execution/run_validation.py '{"action": "validate_marks", "db_path": "school_ops.db"}'
```

**VOICEOVER:**
> "Now the magic. The agent delegates to the sandbox, which runs all five validators in parallel. Each one returns structured JSON."

**Show the JSON output, scroll through:**
- `duplicates: 1` → "Rohan Singh vs Rohan K. Singh at roll 6"
- `out_of_range: 1` → "STU-2024-A-003 got 152 in Math Mid Term, max is 100"
- `gaps: 3` → "Rolls 15, 22, 38 are missing"
- `iqr_outliers: 1` → "152 flagged as medium-severity (1.5×IQR from the quartiles)"

**VOICEOVER:**
> "Total: six anomalies detected in milliseconds. Zero LLM inference — pure SQL queries and IQR arithmetic. The portal renders this as an Anomaly Report Card with severity badges."

---

## Section 5: Human-in-the-Loop (3:00 - 3:45)

**Visual:** Show `tf-client.ts` code snippet for approval

**VOICEOVER:**
> "Here's the part that matters for trust. The agent can't write to the database without approval. Look at this code — when a write tool is called, the harness pauses and asks."

**Cut to:** Show the approval prompt in the terminal:
```
Tool: sqlite.execute_query
Input: UPDATE marks SET marks_obtained = 100 WHERE ...
Approve? (y/n):
```

**VOICEOVER:**
> "The user types 'y' to approve, 'n' to deny. Every decision is logged to the session_log table with timestamp and approval status. That's the audit trail."

---

## Section 6: CI/CD Pipeline (3:45 - 4:30)

**Visual:** Open `https://github.com/paulson2dahl/Codeconstruct/actions` in browser

**VOICEOVER:**
> "Every push runs four CI jobs. Lint-gates, Python tests, Node tests, and a final gate-check that verifies all seven slices of the agent harness."

**Scroll through green checkmarks:**
- ✅ lint-gates (4s)
- ✅ python-test (16s)
- ✅ node-test (11s)
- ✅ gate-check (10s)

**VOICEOVER:**
> "All green in under a minute. The code is validated before it ever reaches main."

---

## Section 7: Qodo Code Review (4:30 - 5:15)

**Visual:** Open `https://github.com/paulson2dahl/Codeconstruct/pull/1` in browser

**VOICEOVER:**
> "Now the killer feature — Qodo. This is PR number one, where the agent added IQR outlier detection. Qodo automatically reviewed it and found nine bugs across three rounds."

**Scroll to Qodo's comment, show the summary:**
- 🐞 4 bugs in Round 1
- 🐞 4 new bugs in Round 2 (after fixes)
- 🐞 1 new bug in Round 3

**Click into one bug:**
> "Look at this — Qodo flagged a SQL injection risk. The `table` and `column` parameters from the user request were being interpolated directly into SQL. It also caught that the high-severity fence was using 2.5×IQR instead of the documented 3×IQR."

**VOICEOVER:**
> "The agent fixed all nine bugs. Qodo re-reviewed and marked each one resolved. The PR merged clean. That's the closed loop: agent writes, Qodo reviews, agent fixes, Qodo re-reviews."

**Click "Merge" status (already merged):**
> "Merged. Now anyone who clones this repo gets a code-quality-enforced agent."

---

## Section 8: Closing (5:15 - 5:30)

**Visual:** Back to the architecture diagram in `docs/ARCHITECTURE.md`

**VOICEOVER:**
> "School Operations Responder: TrueForge for the data layer, Qodo for code quality, React for the UI, and you in the loop for every approval. Built for the Agent Harness Hackathon. Thanks for watching."

**Fade to black with text:**
```
┌─────────────────────────────────────┐
│  github.com/paulson2dahl/Codeconstruct │
│  Built with TrueForge | Reviewed by Qodo │
└─────────────────────────────────────┘
```

---

## Recording Tips

1. **Audio:** Use a quiet room, speak clearly, ~150 words/minute
2. **Cursor:** Use a highlighter or zoom in on important code
3. **Pace:** Don't rush — let the JSON output sit for 2-3 seconds so viewers can read it
4. **Transitions:** Use simple cuts, not fancy effects
5. **Branding:** Show the TrueForge and Qodo logos in the opening

## Post-Production

- Add closed captions (auto-generated is fine for hackathon)
- Upload to YouTube as unlisted
- Add to README.md under "Demo Video" section
- Update Hackathon Submission table with video URL

## Alternative: Live Demo (No Editing)

If short on time, record in one take:
- 0:00-0:30 → Architecture overview (show diagram)
- 0:30-1:30 → Run validation, show output
- 1:30-2:00 → Show approval gate code
- 2:00-2:30 → Show CI green
- 2:30-3:30 → Show Qodo review
- 3:30-4:00 → Closing

Total: 4 minutes. Acceptable for hackathon.
