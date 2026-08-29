# Setting up Qodo Code Review on this repo

Qodo is a **GitHub App**, not a GitHub Action. It auto-reviews every PR based on `.pr_agent.toml` in this repo.

## One-time setup (5 minutes)

### Step 1: Sign up at Qodo portal

1. Go to https://app.qodo.ai/signin
2. Create an account (free tier works for public repos)
3. Confirm your email

### Step 2: Install Qodo GitHub App on `paulson2dahl/Codeconstruct`

1. In the Qodo portal, left nav → **Integrations**
2. Click the **SaaS** tab
3. Click **GitHub** card → **Add installation**
4. The setup wizard opens — click **Connect your organization**
5. GitHub opens — authorize the Qodo App
6. **Repository access**: choose "Only select repositories" → select `paulson2dahl/Codeconstruct`
7. Click **Install**
8. Back in Qodo wizard → **Finish installation**

### Step 3: Verify the installation

Open a new PR (e.g., re-run `bash scripts/demo-qodo-pr.sh`) and Qodo should automatically:
- Post a "review in progress" comment within 30 seconds
- Then post a full review with findings within 1-2 minutes
- For private repos, you can also trigger manually with `/agentic_review` PR comment

## How this repo configures Qodo

The `.pr_agent.toml` in this repo tells Qodo:

- **Model**: `openrouter/anthropic/claude-sonnet-4-6` (with GPT-4o-mini + Gemini fallbacks)
- **Focus areas**: marks validation correctness, SQL injection safety, privacy, approval gating, sandbox usage
- **Auto-review**: triggered on PR open/reopen/ready_for_review (Qodo default)
- **Persistent comments**: enabled (Qodo updates the review on new commits)
- **Diff excludes**: `*.db`, `node_modules/*`, `*.log`, `__pycache__/*`, `*.pyc`

## Verifying Qodo is working

After the App is installed, the next PR you open will get a Qodo review. The first run takes ~2 min; subsequent runs are faster.

Checklist:
- [ ] Qodo GitHub App installed on `paulson2dahl/Codeconstruct`
- [ ] `.pr_agent.toml` committed to the repo (already done)
- [ ] New PR auto-triggers review (no manual command needed)
- [ ] Review comment appears within 2 minutes
- [ ] Findings cite specific lines and suggest fixes

## Troubleshooting

**Qodo not commenting on a PR?**
- Confirm the App is installed on the repo (Settings → Integrations → Applications)
- Check `.pr_agent.toml` syntax (TOML)
- The PR author must not be the Qodo bot itself (skip self-reviews)
- For private repos, the Qodo plan must include private-repo support

**Want to trigger manually?**
- Comment `/agentic_review` on any PR
- Comment `/agentic_describe` for a PR summary only
- Comment `/agentic_ask <question>` to ask the Qodo bot anything

## Related docs

- [Qodo install on GitHub](https://docs.qodo.ai/install-and-configure/install/github/qodo-multi-tenant)
- [Trigger a code review](https://docs.qodo.ai/code-review/use-qodo-in-prs)
- [Configuration reference](https://docs.qodo.ai/install-and-configure/configuration-overview)
