# Qodo Code Reviewer — Complete Setup & Workflow Guide

> **Project:** The Agent Harness Hackathon · **Captured:** 24 August 2026 · **Sources:** docs.qodo.ai pages fetched first-hand today
> **Status:** Fetched + saved · **Purpose:** everything the participant needs to know about Qodo before Task #2 starts

---

## 0. Executive Summary — The 3 Mandatory Steps

| Step | When | Action | Key link |
|---|---|---|---|
| **01** | Day 1, 5 min | Install Qodo on your GitHub repo (one teammate with admin) | `app.qodo.ai/signin` → Integrations → GitHub → Add installation |
| **02** | Every PR | Qodo reviews automatically; fix High-severity findings, dismiss wrong ones with reason | `/agentic_review` comment if it doesn't auto-start |
| **03** | In README | Link to ≥1 reviewed merged PR; state what Qodo surfaced and what you changed/dismissed | Proof of "built real software, not a hackathon demo" |

---

## 1. Account Creation & Login

- **Sign in**: [app.qodo.ai/signin](https://app.qodo.ai/signin) — Google, GitHub, or email
- **Team invite (if applicable):** open the email with subject **"Join your team – enjoy Qodo"**, click **"Accept the invite"**, then sign in with the same email address.
- **Source:** [docs.qodo.ai/get-started](https://docs.qodo.ai/get-started)

---

## 2. Installing Qodo on the Repo (Multi-Tenant GitHub Cloud)

**One-time setup** — one teammate with admin access does this. One installation covers the whole team (teammates don't need individual accounts). 14-day trial, no card required.

1. Log in to the Qodo portal → select **Integrations** → **SaaS** tab → click **Add installation** on the GitHub card.
2. Wizard shows an install guide preview; click **"Connect your organization"** to redirect to GitHub.
3. Authorize the installation, confirm repository access, click **Install** → redirected back to Qodo.
4. Wizard confirms **"AI code review, auto rule generation, and codebase context are enabled"** → click **Finish installation**.
5. (Optional) Manage which repos Qodo reviews via the **Repositories page** in the portal.

**Setup wizard steps** (from get-started page):
- Step 1: **Link your Git account** (GitHub/GitLab/Bitbucket/Azure DevOps)
- Step 2: **Install the Qodo app** on repositories
- Step 3: **Connect task management** (Jira, Linear, Azure DevOps) — *recommended but not required; can skip and start using Qodo right away*

**Source:** [docs.qodo.ai/install-and-configure/install/github/qodo-multi-tenant](https://docs.qodo.ai/install-and-configure/install/github/qodo-multi-tenant) + [docs.qodo.ai/get-started](https://docs.qodo.ai/get-started)

---

## 3. PR Review Workflow

### Trigger Methods

| Method | When it runs | How to enable |
|---|---|---|
| **Automatic (default)** | When PR opens, reopens, or marked ready for review (+every commit if "Review every push" is enabled) | Default — no action needed |
| **Manual** | On-demand. Comment `/agentic_review` on the PR. Qodo reacts with 👀 then posts findings. | Set "Code review trigger" to "Manual only" to disable automatic runs |

### Process

1. You open a PR in a configured repo → Qodo triggers automatically.
2. If it doesn't start, comment `/agentic_review` on the PR.
3. During processing, Qodo posts a temporary **"review in progress"** comment (typically minutes; admins can disable via "In-progress comment" setting).
4. Once done, Qodo posts findings directly on the PR.
5. **Previous findings** auto-strikethrough when resolved by code changes.
6. **Manual dismissal** is available — click the finding, explain reasoning, dismiss.

### Configuration

- **Portal** → team/repo-level settings
- **`.pr_agent.toml`** file in the repo root (version-controlled config)

**Source:** [docs.qodo.ai/code-review/use-qodo-in-prs](https://docs.qodo.ai/code-review/use-qodo-in-prs)

---

## 4. Finding Anatomy — What a Qodo Finding Looks Like

Each finding in the PR thread contains these structured elements:

| Element | What it is |
|---|---|
| **Description** | Clear, human-readable explanation of the issue + its potential impact |
| **Code references** | A snippet showing where the issue occurs + direct links to the relevant lines |
| **Relevance** (beta) | Historical context linking to previous PRs with similar findings: ⭐⭐⭐ High = typically accepted/fixed, ⭐⭐ Medium = mixed, ⭐ Low = typically ignored |
| **Evidence** | The specific rule that triggered + linked requirements/tickets (when applicable) |
| **Quality impact label** | Which quality dimension is affected (security, correctness, maintainability, etc.) |

---

## 5. Severity Levels — The Rule for the Uninitiated

Qodo uses **three** severity levels (not four):

| Severity | Internal key | Internal key | What to do with it |
|---|---|---|---|
| **High** | `action_required` | Red icon | **Must fix.** Blocking issue — security/compliance violation, sensitive data exposure, critical correctness problem. Do not merge with High findings open. |
| **Medium** | `remediation_recommended` | Orange icon | **Fix what you can.** Non-blocking but improves quality/maintainability/consistency. Your engineering call. |
| **Low** | `informational` | Blue icon | **Optional guidance.** Lower-impact context. Your call. |

> **The hackathon rule (doc 07 §41):** *"Fix every valid High-severity finding. If a High finding is wrong, deferred, or intentional, dismiss it in the Qodo thread and record the reason. Medium and Low are your engineering call."*

### Inline Comment Severity Threshold

Controls which findings appear as **inline comments** vs. only in the summary:

| Threshold | Inline comments show |
|---|---|
| **3 (default)** | High only |
| **2** | High + Medium |
| **1** | High + Medium + Low |

**Summary comment** always shows all findings regardless of threshold.

**Config in `.pr_agent.toml`:**
```toml
[review_agent.comments_routing]
action_required = "both"           # High → inline + summary
remediation_recommended = "inline" # Medium → inline only
informational = "summary"          # Low → summary only
```

Valid routing values: `"inline"`, `"summary"`, `"both"`, `"drop"`.

**Source:** [docs.qodo.ai/code-review/comment-anatomy](https://docs.qodo.ai/code-review/comment-anatomy), [Severity Thresholds](https://docs.qodo.ai/code-review/severity-thresholds)

---

## 6. Qodo Agent Skills — Fixing Findings with a Coding Agent

**Installation** (one command, per repo):
```bash
npx skills add qodo-ai/qodo-skills
```

**Two core skills:**

| Skill | What it does | When to run |
|---|---|---|
| `qodo-get-rules` | Retrieves only **relevant** rules via semantic matching. Returns rules with severity levels: `ERROR` (High), `WARNING` (Medium), `RECOMMENDATION` (Low). | **Before code generation** — align your code with team standards upfront |
| `qodo-pr-resolver` | Fetches open review findings from GitHub/GitLab/Bitbucket/Azure DevOps. Supports **interactive issue review** or **batch auto-fix** modes. Handles inline comments, creates automated commits, posts PR/MR summary comments. | **After PR review** — batch-resolve findings, apply fixes, verify summaries |

**Workflow:**
1. Before writing code: run `qodo-get-rules` to see which standards apply.
2. Write your code with those rules in mind.
3. Open the PR → Qodo reviews automatically.
4. After Qodo posts findings: invoke `qodo-pr-resolver` → interactively review each finding or let it auto-fix all.
5. Review proposed fixes, run tests, approve or defer each with a reason.
6. Push the fixes → GitHub shows fix commits, thread replies, Fix Summary. Should trigger follow-up review; if not, comment `/agentic_review`.

**Source:** [docs.qodo.ai/agent-skills](https://docs.qodo.ai/agent-skills)

---

## 7. README Evidence Section — What Judges See

Per the hackathon brief and judging criterion #4 ("Use of sponsor tools"): your README must contain a **"Qodo Code Review Evidence" section**:

```markdown
## Qodo Code Review Evidence

- **Representative PR**: [link to a merged PR with meaningful hackathon code](https://github.com/youruser/your-repo/pull/1)
- **What Qodo surfaced**: e.g., "High-severity: unused `open()` without `with` context manager on line 42; Medium: inconsistent type hinting in validation engine"
- **What I changed**: e.g., "fixed context manager, added type hints, added `.gitignore` for the SQLite file"
- **What I intentionally dismissed**: e.g., "Qodo suggested async pattern for DB calls — dismissed; synchronous is simpler for a 42-row test dataset and avoids async/await complexity we don't have time to fully test"
- **PR history**: shows completed review → my decisions → follow-up review against final code
```

**Public PR link is required evidence.** Screenshots add context but cannot replace it. Judges may inspect other substantive merges.

---

## 8. Additional Tutorial Links (fetched index)

| URL | Purpose |
|---|---|
| [docs.qodo.ai/install-and-configure/install/github/qodo-multi-tenant](https://docs.qodo.ai/install-and-configure/install/github/qodo-multi-tenant) | GitHub multi-tenant install steps |
| [app.qodo.ai/home](https://app.qodo.ai/home) | Qodo portal home |
| [docs.qodo.ai/code-review/use-qodo-in-prs](https://docs.qodo.ai/code-review/use-qodo-in-prs) | Core PR review workflow |
| [docs.qodo.ai/code-review/comment-anatomy](https://docs.qodo.ai/code-review/comment-anatomy) | Finding structure + severity levels |
| [docs.qodo.ai/get-started](https://docs.qodo.ai/get-started) | Account creation + first repo connection |
| [docs.qodo.ai/code-review](https://docs.qodo.ai/code-review) | Code review docs overview |
| [docs.qodo.ai/agent-skills](https://docs.qodo.ai/agent-skills) | Agent skills (qodo-get-rules, qodo-pr-resolver) |
