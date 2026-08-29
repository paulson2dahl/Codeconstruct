# Six Archetypes Explained & Mapped to Our Ideas

> **Project:** The Agent Harness Hackathon · **Date:** 24 August 2026
> **Purpose:** resolve confusion — what each official archetype means, whether it fits our constraints, and how the recommended project combines them
> **Companions:** `01-rules` · `02-challenge-brief` · `03-problem-candidates`

---

## Concept Correction 1 — "Fine-Tuning" vs Agentic Engineering

Participant instinct: *agents that truly learn how/what/why to do, without underlying changes.* Correct goal — wrong label.

| Term | Reality | Verdict for us |
|------|---------|----------------|
| Fine-tuning | Modifying model **weights** via training; GPUs, datasets, days of risk | ❌ Not needed; not judged; would sink a solo 6-day timeline |
| Agentic engineering | Fixed model made reliable via system prompts, **tools/MCP**, sandboxed execution with verification, session memory, self-correction loops | ✅ Exactly what the hackathon judges |

Brief's own framing: *"a model for it to think with, and the tools it is allowed to reach."* Reliability is engineered **around** the model, never inside it.

## Concept Correction 2 — Incident Responder Is a Pattern, Not a Job Title

Strip the DevOps costume: **wrongness observed → read-only investigation → cause found → fix proposed → human approval → act → verify recovery → log session.**

Applies wherever mistakes are expensive:
- Software: bad deploy → bisect → approved rollback (brief's example)
- Education: impossible mark in a sheet → investigate typo/duplicate/column-shift → teacher approves correction ← *our project wearing this hat*
- Healthcare: abnormal lab value → medication-history cross-check → pharmacist approves

## Archetype-by-Archetype Mapping

| # | Archetype | Meaning | Our asset fit | Verdict |
|---|-----------|---------|---------------|---------|
| 1 | Approval-gated assistant | Drafts actions; irreversible steps wait for human OK | Pattern inside our project | Mechanism to reuse |
| 2 | Analytics agent | English question → self-written SQL → run → explain | Literally inside School Ops | Mechanism to reuse |
| 3 | Code review agent | Reads PRs, runs tests, comments | GitHub available | **Skip — competes with sponsor's Qodo** |
| 4 | Research desk | Subagents search web, merge sourced answers | Generic | Crowded; weak demo drama |
| 5 | Incident responder | Investigate→approve→act loop | = our anomaly loop; = AWS Janitor | Pattern to reuse |
| 6 | Untrusted code runner | Execute third-party code isolated | Docker yes, niche audience | Skip |

**Winning reframe:** School Ops = archetypes **1 + 2 + 5 fused in an untouched domain**. Three kinds of visible harness work; originality from domain, not tech-stacking.

## Feasibility Proof — TrueForge Anatomy in the School Scenario

```
TEACHER (chat UI): "Ingest Class-8 exam sheet, check it, update records"

TRUEFORGE HARNESS (all judge-visible):
 ├─ filesystem MCP   → reads Class8_Marks.xlsx
 ├─ SANDBOX (Docker) → runs validate.py → 4 anomalies found:
 │     duplicate "Ravi Kumar" · Science=152/100 · order break rows 14→15
 │     · 3 students missing Maths marks
 ├─ SQLite MCP       → read-only preview of proposed inserts
 ├─ APPROVAL GATE    → "Writing final marks is irreversible.
 │                      Approve 42 corrections? [Approve][Reject]"
 ├─ approved → writes commit → rank list generated → session logged
 └─ follow-up analytics: agent writes own SQL → "why did Science dip?"
```

Infrastructure mapping: model = Groq/OpenRouter key · sandbox = participant's Docker · database = built fresh by team (Rule-6 clean) · every arrow = visible harness work satisfying Rule 3 by design.

## On "Too Simple" — Organisers Disagree

Brief states twice: *"One narrow job done end to end scores better than a platform with three half-finished features."* Six equally-weighted criteria include **no complexity axis**. Simplicity costs nothing; incompleteness forfeits Technical Excellence, Control & Safety, and Presentation at once. Originality lives in domain choice — nobody else builds school-clerk tooling.

## Online vs San Francisco

Identical portal, deadline, judges, criteria. In-person adds only credits and community. Scoring is criterion-relative, not crowd-relative — zero online disadvantage.

## Idea Placement Map

| Idea | Placement |
|------|-----------|
| School Operations Assistant | ★ Hackathon MVP |
| Hindi OCR | Day-5 stretch: photo-of-sheet ingestion into the same review-and-approve pipeline (approval gate makes OCR errors safe) |
| Multi-agent split (Validator + Reporter) | Only if days 1–4 stay clean; each agent must earn existence |
| Health records keeper | Post-hackathon product, same skeleton |
| Local forms copilot | Post-hackathon personal tool, same skeleton |

## Open Decision

Lock School Operations Assistant as the submission? → then: verify TrueForge docs/repo first-hand → scaffold → Qodo install → PR #1.
