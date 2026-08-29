# Demo: Trigger Qodo Code Review on an Agent-Generated PR

This script demonstrates the **headline moment** of the project — a TrueForge agent opens a PR, Qodo reviews it, and the human gets a complete, audit-ready diff with AI feedback. This is the **Best Code Quality** track's qualifying demo.

## What it does

1. **Creates a feature branch** with a deliberately-buggy SQL query (simulating agent output)
2. **Commits the change** with a structured message
3. **Pushes to GitHub** (using `gh` auth)
4. **Opens a PR** with title/body describing what the agent did
5. **Polls for the Qodo bot comment** to confirm the review fired
6. **Prints the PR URL** so judges can see the full review

## Prerequisites

```bash
# gh CLI authenticated as repo owner
gh auth status

# Qodo GitHub App installed on the repo
# Get QODO_TOKEN from https://qodo.ai and add to repo secrets:
gh secret set QODO_TOKEN
```

## Run it

```bash
cd /home/buntu1/school-ops-responder
bash scripts/demo-qodo-pr.sh
```

## What judges should see

After running, you'll have a PR open at https://github.com/paulson2dahl/Codeconstruct/pulls
with:
- A diff showing a real code change (e.g., new validation rule)
- A Qodo review comment analyzing correctness, security, and style
- All CI checks green (lint, python-test, node-test, gate-check)
- This is the **complete closed loop**: TrueForge agent → human approval → PR → Qodo review → merge
