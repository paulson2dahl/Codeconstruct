# UI Strategy — Modify TrueForge's UI, Never Rebuild It

> **Project:** The Agent Harness Hackathon · **Date:** 24 August 2026
> **Question answered:** "Should we BUILD a UI, or MODIFY the one TrueForge provides?"
> **Companions:** `02-challenge-brief` (Best UI track) · `04-archetypes-deep-dive` · `Links/01-trueforge-docs-links.md`

---

## The Verdict

**Modify and extend.** TrueForge ships a complete chat UI plus official customisation surfaces. Rebuilding a chat client from scratch is the single worst trade available to a solo team in six days.

## What TrueForge Gives Us for Free (verified 24 Aug)

| Asset | What it is | Customisation surface |
|-------|-----------|----------------------|
| Chat UI | Full agent interface at `localhost:8790` — streaming, tool-call visualisation, approvals, Agents Library | Theming & branding |
| React UI SDK | `@truefoundry/trueforge-ui` — embeddable, componentised | Layout, Theme, Containers, Atoms, Hooks |
| **Generative UI** | The agent renders **custom UI components inside the chat** | Our main canvas |
| Native approval flow | Pause-and-approve is a built-in UI moment | Feed it rich payloads |

## Three-Layer Plan

### Layer 0 — Theme & Brand (hours, do first)
Custom theme: school-domain identity — name, palette, logo, fonts. Cheap, makes the product feel *ours* on video from minute one.

### Layer 1 — Generative-UI Domain Components (main effort) ★
This is where the Best UI track is won. Instead of the agent *describing* findings in prose, it renders purpose-built components in chat:

- **Anomaly Report Card** — each validation error as a card: row, field, wrong value → proposed value, plain-language reason ("Science mark 152 exceeds maximum 100 — likely column shift")
- **Approval Panel** — proposed corrections as a reviewable diff table with Approve / Reject / Approve-selected buttons. The judge *sees* the human-checkpoint moment as real product UI
- **Rank List / Class Summary tables** — generated after approved writes
- **Ingestion progress** — file parsed → N students → M subjects → validating…

One signature element (per `frontend-design` skill discipline): the **Approval Panel** — it embodies the project's soul (irreversible action held for a human) and doubles as our Control & Safety evidence on screen.

### Layer 2 — Optional Standalone Page (only if days 1–4 ran clean)
A single dashboard/report page (class health, term trends) via the UI SDK. Cut without mercy if core is not flawless.

## Why NOT Build From Scratch

1. **Rule 3 dies with a custom UI.** Judges must *see the harness doing real work* — tool calls, sandbox runs, approval pauses. The stock chat UI surfaces all of it natively; a hand-rolled client hides the evidence we're graded on.
2. **Solo × 6 days.** A chat client (streaming, sessions, markdown, tool-call rendering, auth) is weeks of work. Every hour stolen from it is an hour stolen from the agent itself.
3. **Judging maths.** Best UI rewards a *polished product*, not a bespoke shell. Themed harness + rich domain components reads more professional than a half-finished custom client — and the same components also score Use of TrueForge and Control & Safety. One effort, three criteria.

## Design Discipline (from `frontend-design` skill, stored in `skills/`)

- Distinctive, subject-grounded aesthetic — no template defaults; avoid the known "AI-look" clusters (cream+serif+terracotta, near-black+acid-green, broadsheet hairlines)
- Typography carries personality; one signature element; everything else quiet
- Copy as design material: active voice, controls say what they do ("Approve 42 corrections", never "Submit")
- Quality floor: responsive, visible keyboard focus, reduced-motion respected
- Interface vocabulary stays consistent through the whole flow (Approve → Approved)

## Open Items

- Read `trueforge.dev` Frontend Customisation + Generative UI pages before Layer 1 (slugs in `Links/01`)
- Confirm generative-UI payload format from API reference (Streaming events / Containers / Atoms)
- Theme tokens finalised after project lock and naming
