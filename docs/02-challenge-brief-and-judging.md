# The Challenge — Brief, Tracks, Tools & Judging

> **Event:** The Agent Harness Hackathon · **Captured:** 24 August 2026
> **Source:** official challenge page, pasted verbatim by participant
> **Companion document:** `01-hackathon-rules.md`

---

## 1. The Core Idea: Chatbots Answer, Agents Act

A chatbot answers questions. An agent **acts** on them — it opens the pull request, queries the database, runs the script. Acting is the hard part because it demands three things a chat window never needed:

| # | Requirement | Meaning |
|---|-------------|---------|
| 1 | **A way to reach your systems** | GitHub, databases, internal tools, calendars — connected for real, not mocked |
| 2 | **A safe place to run what it writes** | Generated code must execute somewhere that cannot damage anything if it is wrong |
| 3 | **A way to stay in control** | The agent stops and asks a person before doing anything irreversible |

The layer between the model and everything it touches — handling the loop, the tool calls, the sandbox, and the pause — is the **agent harness**. **TrueForge** is an open-source one; the week is spent on the actual problem instead of building that machinery.

*Illustrative scenario from the brief:* "Investigate the payment-failures alert. Roll back if a deploy caused it." → Grafana MCP query → sandboxed bisect of four deploys → cause found (deploy `4c21` doubled checkout timeouts) → **"Rollback is irreversible. Holding for your approval."** → approved → rollback executes → error rate recovers → session logged.

## 2. TrueForge — The Required Harness

- Built by **TrueFoundry**, whose infrastructure runs AI in production across any model and cloud.
- Open source, **no account required**.
- Driven three ways: **chat UI**, **HTTP API**, or **TypeScript library**.
- Runs on any model provider — OpenAI, another provider, or a local model.
- Two ingredients turn a running harness into an agent: a **model** to think with and **MCP servers** defining the tools it may reach. Without the second it can talk but not act.
- Note: TrueFoundry's paid AI Gateway / MCP Gateway (cost tracking, audit, permissions) are **not needed** for this hackathon.

### Installation paths

```bash
# Standalone — one command, nothing to clone ("run this tonight")
npx @truefoundry/trueforge

# Production-ready — full stack under Docker Compose
git clone git@github.com:truefoundry/trueforge.git
cd trueforge && docker compose up
```

## 3. Qodo — The Code Reviewer (Best Code Quality track)

- AI code review platform used by NVIDIA, Intel, Walmart, Intuit; free for open-source projects.
- Reviews whole-repository context — structure, dependencies, history — not just the diff lines.
- Works in VS Code / JetBrains, on GitHub pull requests, and from the CLI.
- Supports all major languages.

### How to win the Qodo track (per organisers)

1. **Install Qodo on the repo at the start** — installing it the night before the deadline defeats the point.
2. **Work through pull requests** — nothing straight to main; unreviewed work earns nothing.
3. **Resolve findings before merging** — fix real problems; state reasoning where you disagree.

Judges read the pull-request history; the review trail *is* the evidence. A single PR opened an hour before deadline will not win.

## 4. OpenAI — Model Partner

- $50 credits for in-person San Francisco attendees (29 August).
- Online participants bring their own key; TrueForge is provider-agnostic.

## 5. Six Suggested Agent Archetypes

| Archetype | What it does | Reaches | Difficulty note |
|-----------|--------------|---------|-----------------|
| Approval-gated assistant | Drafts email / files tickets / books travel; nothing irreversible without approval | Gmail or Slack | Easiest start |
| Analytics agent | Answers plain-English questions by writing SQL itself, running it, explaining results | Your database | — |
| Code review agent | Reads a PR, runs tests in a sandbox, comments on findings | GitHub | — |
| Research desk | Sends subagents across the web on one question; merges answers with sources | Web search | — |
| Incident responder | Investigates alerts read-only; asks a human before restarts/rollbacks | Your cloud | "Hero project" |
| Untrusted code runner | Executes third-party-submitted code in an isolated sandbox, returns result safely | The sandbox | — |

These are starting points, not quotas — the domain is open.

## 6. Best Practices (organisers' five rules)

1. **The harness has to be doing real work** — the qualifying criterion. If it would work as well in a chat box, change the project.
2. **Pick one job an agent can finish** — narrow and complete beats broad and half-built.
3. **Open pull requests from the first commit** — Qodo installed day one; judges read the trail.
4. **Put the approval gate in the demo** — control & safety is a scored criterion nobody usually films; show where code ran and the moment it stops to ask.
5. **Ship a repo a judge can run** — public repo, working README on someone else's machine, only permitted connections, keys/personal data excluded from repo *and* video.

## 7. Judging Criteria (six, equally weighted)

| # | Criterion | Question the judges ask |
|---|-----------|------------------------|
| 1 | Potential impact | Does it do a clear, useful job someone would actually hand over? |
| 2 | Creativity & originality | Is the job inventive, or the way of doing it? |
| 3 | Technical excellence | Complete, reliable, well-structured implementation? |
| 4 | Use of sponsor tools | Is TrueForge central rather than a thin wrapper? Did Qodo review the PRs? |
| 5 | Control & safety | Safe execution environment + human approval before irreversible steps? |
| 6 | Presentation | Does the demo explain problem, agent at work, and harness role clearly? |

## 8. Submission Checklist

- [ ] Agent running on TrueForge with visibly real harness work (tool reached, code sandboxed, pause before irreversible action)
- [ ] Qodo installed from the start + reviewed pull requests
- [ ] Only owned/permitted tools, data, accounts connected; keys & personal data out of repo and video
- [ ] Public repository with a stranger-proof README
- [ ] ~3-minute demo video showing the agent working
- [ ] Write-up: what the agent does + how it uses TrueForge
- [ ] Blog post link (only if entering that prize)

---

## Strategic Read (working notes)

1. **Two criteria are self-inflicted wins:** Control & Safety and Use of Sponsor Tools are fully within our control regardless of idea quality — approval gates and genuine harness usage must be first-class features, not garnish.
2. **The six archetypes are what every other team will build.** Our anti-slop instinct says: take an archetype's *mechanics* into an unusual domain, or invent a job worth handing to an agent that isn't on this list. Originality is ⅙ of the score and impact another ⅙ — the idea choice directly controls two of six criteria.
3. **Rule 6 (own your connections) shapes feasibility:** the agent's reachable systems must be ones we actually control — our GitHub, our database, our cloud account, public APIs. Problem selection should start from *what we can genuinely connect*, then find the painful job inside it.
4. **The demo format (3 min) caps scope:** one loop, shown cleanly — task given → tool reached → code executed safely → human approval moment → outcome verified.
