# TrueFoundry Platform Documentation — Complete Link Archive

> **Captured:** 24 August 2026 · **Base:** https://docs.truefoundry.com · **Full index:** https://www.truefoundry.com/llms.txt
> **⚠️ Reading guide — do not burn hackathon hours on the wrong section:**
> - 🔥 **Core** — documents the agent-harness concepts our project is built on (human-in-the-loop, sandbox, subagents, SDK, agent manifest). READ these.
> - ℹ️ **Reference** — TrueFoundry's *commercial* AI Gateway / MCP Gateway / platform. The hackathon brief says explicitly: *"Neither is needed for this hackathon."* Consult only if a concept overlaps.
> - ⛔ **Skip** — enterprise platform administration (SSO, SCIM, clusters, Helm upgrades). Irrelevant to us.
> - Note: the pasted Changelog tracks the **TrueFoundry platform** (Helm charts), *not* the open-source TrueForge repo.

---

## 🔥 A. Agent Harness (the concepts TrueForge implements)

- https://docs.truefoundry.com/docs/agent-platform/agent-harness/overview
- https://docs.truefoundry.com/docs/agent-platform/agent-harness/getting-started
- https://docs.truefoundry.com/docs/agent-platform/agent-harness/models
- https://docs.truefoundry.com/docs/agent-platform/agent-harness/mcp-servers
- https://docs.truefoundry.com/docs/agent-platform/agent-harness/skills
- https://docs.truefoundry.com/docs/agent-platform/agent-harness/sandbox
- https://docs.truefoundry.com/docs/agent-platform/agent-harness/human-in-the-loop
- https://docs.truefoundry.com/docs/agent-platform/agent-harness/ask-user-questions
- https://docs.truefoundry.com/docs/agent-platform/agent-harness/generative-ui

## 🔥 B. Context Engineering

- https://docs.truefoundry.com/docs/agent-platform/agent-harness/context-engineering/overview
- https://docs.truefoundry.com/docs/agent-platform/agent-harness/context-engineering/subagents
- https://docs.truefoundry.com/docs/agent-platform/agent-harness/context-engineering/preload-tools *(Defer Loading MCP Server Tools)*
- https://docs.truefoundry.com/docs/agent-platform/agent-harness/context-engineering/code-mode-tool-calling *(Code Mode)*
- https://docs.truefoundry.com/docs/agent-platform/agent-harness/context-engineering/large-tool-call-handling *(Handling Large Tool Response)*

## 🔥 C. SDK

- https://docs.truefoundry.com/docs/agent-platform/agent-harness/sdk/overview
- https://docs.truefoundry.com/docs/agent-platform/agent-harness/sdk/create-agent
- https://docs.truefoundry.com/docs/agent-platform/agent-harness/sdk/use-agent
- https://docs.truefoundry.com/docs/agent-platform/agent-harness/sdk/complete-example

## 🔥 D. SDK Reference

- https://docs.truefoundry.com/docs/agent-platform/agent-harness/sdk/agent-manifest-reference
- https://docs.truefoundry.com/docs/agent-platform/agent-harness/sdk/turn-events-reference
- https://docs.truefoundry.com/docs/agent-platform/agent-harness/sdk/runtime-api-reference

## ℹ️ E. Agent Governance

- https://docs.truefoundry.com/docs/agent-platform/agent-governance/overview
- https://docs.truefoundry.com/docs/agent-platform/agent-governance/key-concepts
- https://docs.truefoundry.com/docs/agent-platform/agent-governance/governance-blueprint
- https://docs.truefoundry.com/docs/agent-platform/agent-governance/truefoundry-implementation
- https://docs.truefoundry.com/docs/agent-platform/agent-governance/agent-registry
- https://docs.truefoundry.com/docs/agent-platform/agent-governance/agent-guardrails
- https://docs.truefoundry.com/docs/agent-platform/agent-governance/agent-observability
- Scenarios: https://docs.truefoundry.com/docs/agent-platform/agent-governance/scenarios/truefoundry-identity-broker · …/scenarios/okta · …/scenarios/microsoft-entra · …/scenarios/spiffe

## ℹ️ F. AI Gateway — Models & APIs *(not needed per brief; consult only for overlap)*

**Get Started / Integrate Models:** intro-to-llm-gateway · quick-start · openai · anthropic · aws-claude-platform · aws-bedrock · aws-bedrock-mantle · aws-sagemaker · google-vertex · google-gemini · azure-openai · databricks-models · cohere · ai21 · deepinfra · groq · elevenlabs · deepgram · cartesia · smallest-ai · mistral · cloudera · openrouter · perplexity-ai · together-ai · xai · sambanova · cerebras · wafer · snowflake-cortex · custom-endpoints · self-hosted-models — all under `https://docs.truefoundry.com/docs/ai-gateway/<slug>`

**Supported APIs:** chat-completions-overview · chat-completions-multimodal · chat-completions-tools · chat-completions-structured-outputs · chat-completions-advanced · chat-completions-extended-thinking · embed · batch-predictions-with-truefoundry-llm-gateway · finetune · responses-api · image-generation · image-edit · image-variation · text-to-speech · audio-translation · audio-transcription · live-api · live-api-code-snippets · live-api-tool-calling · file-endpoints · rerank · moderation · compaction · messages-overview · proxy-api — same base pattern.

**Making LLM Requests:** making-llm-requests-via-gateway · authentication · request-headers · native-sdk-support · model-discovery · playground-overview
**Virtual Models:** virtual-model · virtual-model-advanced · auto-routing · gateway-access-control
**Policies:** ratelimiting · budget-limiting-v2 · budgetlimiting · logging-config · load-balancing-overview · caching · cost-tracking
**Extras:** session-management · feedback-for-traces · anthropic-stream-overload-fallback

## ℹ️ G. MCP Registry & Gateway

- https://docs.truefoundry.com/docs/ai-gateway/mcp/mcp-overview
- https://docs.truefoundry.com/docs/ai-gateway/mcp/mcp-server-getting-started
- https://docs.truefoundry.com/docs/ai-gateway/mcp/mcp-protocol-support
- https://docs.truefoundry.com/docs/ai-gateway/mcp/mcp-gateway-auth-security
- https://docs.truefoundry.com/docs/ai-gateway/mcp/mcp-server-auth-overrides
- **https://docs.truefoundry.com/docs/ai-gateway/mcp/mcp-tool-approval** ← *approval-policy concept worth reading once (maps to our gate story)*
- https://docs.truefoundry.com/docs/ai-gateway/mcp/connect-mcp-from-ide
- https://docs.truefoundry.com/docs/ai-gateway/mcp/tfy-managed-mcp-server
- https://docs.truefoundry.com/docs/ai-gateway/mcp/virtual-mcp-server
- https://docs.truefoundry.com/docs/ai-gateway/mcp/openapi-mcp-server ← *pattern: auto-wrap an OpenAPI spec as MCP — possibly useful for our custom school API*
- https://docs.truefoundry.com/docs/ai-gateway/mcp/stdio-mcp-server
- https://docs.truefoundry.com/docs/ai-gateway/mcp/create-calculator-mcp-server ← *tutorial for building a custom MCP server — directly relevant to our SQLite server plan*

## ℹ️ H. Skills & Prompt Registries

- https://docs.truefoundry.com/docs/ai-gateway/skills/skills-registry
- https://docs.truefoundry.com/docs/ai-gateway/skills/getting-started
- https://docs.truefoundry.com/docs/ai-gateway/prompt-management

## ℹ️ I. Guardrails & Security

**TFY-managed:** guardrails-overview · guardrails-getting-started · guardrails-configuration · truefoundry-guardrails · secrets-detection · code-safety-linter · sql-sanitizer ← *SQL sanitizer concept relevant to our DB-writing agent* · regex-pattern-matching · tfy-prompt-injection · tfy-pii · tfy-content-moderation · metadata-validation · cedar-guardrails · opa-guardrails — all under `https://docs.truefoundry.com/docs/ai-gateway/<slug>`

**External providers (catalog only, skip unless curious):** openai-moderations · bedrock-guardrails · azure-pii · azure-content-safety · azure-prompt-shield · enkrypt-ai · palo-alto-airs · crowdstrike · cisco-ai-defense · f5-calypsoai · patronus · fiddler · google-model-armor · grayswan-cygnal · akto · trojai · noma-security · pillar-security · nvidia-nemo · guardrails-ai · coreweave-weave-guardrails · lasso-security · arthur-ai · verra · hiddenlayer · custom-guardrails

## ℹ️ J. Observability

analytics · request-logging · data-access · data-routing · export-opentelemetry-data · prometheus-grafana-integration · fetch-model-metrics · fetch-mcp-metrics · fetch-guardrail-metrics · fetch-cache-metrics · fetch-routing-metrics · fetch-agent-metrics · fetch-request-logs · fetch-request-logs-trace-inspection · fetch-request-logs-filtering · fetch-request-logs-use-cases · fetch-request-logs-use-cases-advanced · fetch-request-logs-span-attributes · fetch-request-logs-span-attributes-genai — all under `https://docs.truefoundry.com/docs/ai-gateway/<slug>`

## ⛔ K. Platform, IAM, SSO, Deployment & Admin

overview · architecture · control-plane-architecture · gateway-plane-architecture · compute-plane-architecture · user-team-account-management · user-management · team-management · virtual-account-management · generating-truefoundry-api-keys · identity-providers · external-identity · manage-user-roles-and-permissions · sso/* (entra, okta, google, jumpcloud, onelogin, auth0, keycloak, adfs, pingone, rippling, custom-saml, custom-oidc) · setup-cli · repositories · deployment-overview · infrastructure/* (aws/gcp/azure/generic compute-plane) · deploy-gateway-plane · deploy-control-plane-and-gateway-plane · deploy-control-and-compute-plane · aws/gcp/azure/generic/openshift-control-plane · customize-build-workflow · customizing-cicd-templates · customizing-workbench-images · controlplane-monitoring · controlplane-multitenant · control-plane-upgrade · security-and-compliance · support · disaster-recovery — all under `https://docs.truefoundry.com/docs/…` or `https://docs.truefoundry.com/docs/…` per pasted list.

## ℹ️ L. Integrations

integrations-overview · integration-provider-aws · integration-provider-gcp · integration-provider-azure · github-integration-set-up · gitlab-integration-set-up · bitbucket-integration-set-up · pagerduty-integration · ms-teams-integration · slack-bot-integration · email-integration · hashicorp · setup-gitops-using-truefoundry · platform/audit-logging · interact-with-tfy-using-ai

## ⛔ M. AI Deployment (model/job/service/workflow deployment — separate product)

ai-deployment-overview · key-concepts · model-deployment-introduction · launch-notebooks · model-registry · model-deployment/* · service deployment set (dockerize-code, autoscaling, rollout-strategy, …) · job deployment set · LLM deployment set · mcp-server-deployment/* (deploy-from-code, deploy-from-npx-uvx) · workflow set · async-service set · volumes · experiment-tracking · manage-secrets · applying-custom-policies · deploy-helm-charts · deploy-kubernetes-manifests — full list as pasted; base `https://docs.truefoundry.com/docs/…`

## ℹ️ N. IDE / Framework / Tool Integration pages

**Claude:** claude · claude-code · claude-code-hooks · anthropic-inference-hooks · claude-code-max · claude-desktop · mcp/enterprise-security-claude
**IDEs:** cline · cursor · gemini-cli · github-copilot · goose · grok-build · **opencode** ← *participant holds an OpenCode key* · openai-codex-cli · qwen-cli · roo-code
**Frameworks:** agno · crewai · dspy · instructor · langchain · langroid · openai-agents-sdk · openai-swarm · phidata · pydantic-ai · strands
**Apps:** anythingllm · dify · flowise · jan · langflow · librechat · livekit · n8n · open-webui

## ℹ️ O. MCP Server Catalog pages (per-vendor guides)

tavily · exa · browserbase · linear · notion · firecrawl · slack · looker · hubspot · databricks · neo4j · **github** ← *candidate for our PR workflow* · smartsheet · atlassian-rovo · google-workspace · microsoft-365 · crowdstrike-falcon · salesforce · zoom · honeycomb · dbt · gong · pagerduty · zendesk · quickbooks · snowflake · firebase-crashlytics · airtable · incident-io · mongodb · dx · omni-analytics · netsuite · datadog · ironclad · ramp — pattern: `https://docs.truefoundry.com/docs/ai-gateway/mcp/<name>-mcp-server`

## ℹ️ P. Public API Reference (platform)

agent/* · agent-skills/* · applications/* · metrics/* · apply/* · artifacts/* · audit-logs · clusters/* · jobs/* · llm-gateway-budgets/* · logs/* · mcp-registry/* · mcp-servers-v2/* · mlrepos/* · model-deployments/* · models/* · personal-access-tokens/* · prompts/* · provider-integrations · scim-v2/* · secret-groups/* · secrets/* · teams/* · traces · users/* · virtual-accounts/* · role-bindings/* · workspaces/* · provider-accounts/* — pattern: `https://docs.truefoundry.com/docs/api-reference/<group>/<endpoint>`

## ℹ️ Q. SDK / CLI (platform)

truefoundry_sdk · setup-cli · using-tfy-apply · using-tfy-delete · apply-api-create-models · apply-api-secret-management

## ℹ️ R. Changelog & Announcements

- https://docs.truefoundry.com/docs/changelog *(platform releases — latest 0.166.8, Aug 21 2026)*
- Change announcements (19 pages): deprecation-of-truefoundry-below-0.17-and-api-ml · python-3.10-minimum-truefoundry-cli-v0.17.0 · budget-limiting-v2-v0.158.0 · deprecation-of-mcp-servers-v1-apis · deprecation-of-images-and-plots-in-job-runs-v0.156.0 · moving-to-eso-for-secret-management-v0.151.5 · mcp-dcr-client-id-validation-v0.148 · deprecation-of-routing-config · identity-and-access-revamp-v0.143 · refactoring-of-ai-gateway-metrics · deprecation-of-mcp-servers-in-prompts · deprecation-of-common-tools-v0-135-0 · routing-config-header-removal-v0.133 · simplified-gitops-cicd-v0.132 · legacy-mcp-oauth-routes-removal · mcp-gateway-url-transport-v0.130 · gemini-cli-model-registration-v0.118 · guardrails-yaml-schema-change-v0.116 · mcp-server-groups-removal-v0.112

### Changelog nuggets relevant to us (from pasted content)
- **MCP tool-approval policies** now support flexible validity (once / time-windowed; all-tools or destructive-only) — concept mirrors our approval-gate story.
- **OpenRouter models can use the Responses API through the gateway** — confirms OpenRouter is a first-class citizen in the TrueFoundry ecosystem.
- Groq keys are auto-detected/redacted by the secrets-detection guardrail — good hygiene note since we hold Groq keys.
