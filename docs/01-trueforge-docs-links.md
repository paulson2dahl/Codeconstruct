# TrueForge Documentation — Links & First-Hand Findings

> **Captured:** 24 August 2026 · **Base:** https://trueforge.dev · **Repo:** https://github.com/truefoundry/trueforge
> **Legend:** ✅ fetched & verified today · ⚠️ slug inferred from sidebar — verify against `/llms.txt` on setup day
> **Full index (fetch when rate-limit clears):** https://trueforge.dev/llms.txt

---

## 1. Verified Core Facts (fetched first-hand today)

### What TrueForge is
Open-source agent harness (**MIT licence**, ~4k stars, 258 forks, pnpm monorepo). Three surfaces: **core server** (runs the agent loop — plans the turn, calls the model, executes tools, streams every step), **HTTP API + TypeScript SDK**, **chat UI + React UI SDK**.

### Deployment modes
| Mode | Command | Storage | UI port |
|------|---------|---------|---------|
| Local | `npx @truefoundry/trueforge@latest` | SQLite, zero infra | http://localhost:8790 |
| Hosted (Compose) | `git clone https://github.com/truefoundry/trueforge && cd trueforge && cp packages/trueforge/.env.example packages/trueforge/.env && docker compose up --build` | Postgres + Redis | http://localhost:8791 |
| Hosted (K8s) | `helm install trueforge oci://tfy.jfrog.io/tfy-helm/trueforge --version <x.y.z>` | Postgres + Redis | per ingress |

- Requires **Node.js ≥ 22.14**.
- Port override: `npx @truefoundry/trueforge --port 3000` or `PORT=3000`.
- SQLite path override: `SQLITE_PATH=~/trueforge/db.sqlite`.
- `PUBLIC_BASE_URL` needed when behind a domain (MCP OAuth callbacks depend on it).

### First-agent walkthrough (7 steps, from Quickstart)
1. **Settings → Models** → pick provider from catalog → Configure → paste API key
2. **Settings → Connectors** → connect MCP server from catalog (e.g. Exa, no-auth)
3. **Settings → Skills** → enable built-in skill (e.g. `web-artifacts-builder`) — skills are *git-backed `SKILL.md` instruction packs loaded on demand*
4. **Settings → Sandbox providers** → Daytona preset → paste Daytona API key
5. Compose in chat: select model → Tools menu → enable connectors/skills/sub-agents
6. **Save Agent** (name + instructions)
7. Find it in **Agents Library** → Try / Edit

### 🔥 Architecture findings that shape OUR project

| Finding | Consequence for us |
|---------|--------------------|
| **Sandbox = Daytona only** ("the only sandbox provider supported today"; more planned) | Participant's local Docker is NOT the harness sandbox → we must create a **free Daytona account** and verify free-tier limits on day 1. Docker still useful for our own services (Postgres etc.) |
| **Sandbox-as-tool** — provisioned only when agent needs code/files/skills/Code-Mode; reused across turns; stopped after idle; secrets never enter sandbox; conversation survives sandbox crash | Cheap Q&A turns; strong judge talking points on isolation |
| **MCP = remote servers only** (catalog: Linear, Notion, GitHub…; auth: none / header / OAuth-DCR; custom remote URLs via *Add MCP Server*) | No stdio/local MCP → our school project's "filesystem + SQLite MCP" plan must adapt: **run our own tiny remote MCP server (streamable-HTTP)** for DB reads/writes, or use Code Mode in sandbox for file+DB work. **Top technical question for setup day** |
| **Human checkpoints are first-class**: tool approval, ask-user-questions, generative UI; per-tool approval configurable | Our approval gate = native harness feature, exactly what judges must see |
| Model providers: OpenAI, Anthropic, Gemini, catalog + **any OpenAI-compatible endpoint** | OpenRouter/Groq (both OpenAI-compatible) will work; local Ollama possible later |
| Context engineering: subagents, deferred tool loading, **Code Mode**, large-tool-response offloading, compaction | Code Mode may be our cleanest path for Excel/pandas work |
| Skills load **in the sandbox** | Skills + sandbox + Code Mode interlock — read `/skills` + `/key-features/code-mode` before designing |

## 2. Documentation Page Map (trueforge.dev)

### Getting Started
- ✅ Introduction — https://trueforge.dev/introduction
- ✅ Quickstart — https://trueforge.dev/quickstart

### TrueForge Harness — Initial Setup
- ⚠️ Overview — https://trueforge.dev/initial-setup
- ⚠️ Models — https://trueforge.dev/models
- ✅ MCP Servers — https://trueforge.dev/mcp-servers
- ⚠️ Skills — https://trueforge.dev/skills
- ✅ Sandbox — https://trueforge.dev/sandbox
- ⚠️ Create an Agent — https://trueforge.dev/create-an-agent
- ⚠️ Agents Library — https://trueforge.dev/agents-library

### Harness Capabilities
- ⚠️ Overview — https://trueforge.dev/key-features
- ⚠️ Subagents — https://trueforge.dev/key-features/subagents
- ⚠️ Deferred Tool Loading — https://trueforge.dev/key-features/deferred-tool-loading *(path pattern confirmed by link on MCP page)*
- ⚠️ Code Mode — https://trueforge.dev/key-features/code-mode
- ⚠️ Large Tool Responses — https://trueforge.dev/key-features/large-tool-responses
- ⚠️ Setup Login — https://trueforge.dev/setup-login
- ⚠️ Benchmarking — https://trueforge.dev/benchmarking

### SDK
- ⚠️ Quickstart — https://trueforge.dev/sdk/quickstart
- ⚠️ Concepts — https://trueforge.dev/sdk/concepts
- ⚠️ Use an Agent — https://trueforge.dev/sdk/use-an-agent

### UI Chat
- ⚠️ Overview — https://trueforge.dev/ui-chat/overview
- ⚠️ Quickstart — https://trueforge.dev/ui-chat/quickstart

### Frontend Customisation
- ⚠️ Layout, Theming & Branding — https://trueforge.dev/frontend-customisation/layout-theming-branding
- ⚠️ Agent modes — https://trueforge.dev/agent-modes
- ⚠️ Custom Theme — https://trueforge.dev/custom-theme
- ⚠️ Troubleshooting — https://trueforge.dev/troubleshooting

### API Reference
- ⚠️ TrueForgeUI — https://trueforge.dev/api-reference/trueforge-ui
- ⚠️ Theme — https://trueforge.dev/api-reference/theme
- ⚠️ Containers — https://trueforge.dev/api-reference/containers
- ⚠️ Atoms — https://trueforge.dev/api-reference/atoms
- ⚠️ Hooks — https://trueforge.dev/api-reference/hooks
- ⚠️ Server — https://trueforge.dev/api-reference/server
- ⚠️ Streaming events — https://trueforge.dev/api-reference/streaming-events
- ⚠️ Settings catalog — https://trueforge.dev/api-reference/settings-catalog

### Project
- ⚠️ Roadmap — https://trueforge.dev/roadmap
- ✅ GitHub repository — https://github.com/truefoundry/trueforge *(README verified today)*

### Repo internals (for deep dives)
- Packages: `packages/trueforge` (server), `trueforge-sdk`, `trueforge-ui`, `trueforge-core`
- Helm chart: `charts/trueforge/` · Compose: `docker-compose.yml`, `docker-compose.dev.yml`
- Benchmark suite vs Claude Managed Agents & deepagents: `benchmark/`
- Community: `CONTRIBUTING.md`, `SECURITY.md`, `AGENTS.md`, `CLAUDE.md`

## 3. Open Questions for Setup Day
1. Enumerate exact slugs via https://trueforge.dev/llms.txt (rate-limited today).
2. Daytona free-tier limits (concurrent sandboxes, hours) — create account and test.
3. Remote-MCP-only constraint: prototype a minimal streamable-HTTP MCP server for SQLite, **or** confirm Code Mode covers file+DB work without custom MCP.
4. Which OpenRouter/Groq model IDs appear in TrueForge's model catalog vs need custom-endpoint config.
