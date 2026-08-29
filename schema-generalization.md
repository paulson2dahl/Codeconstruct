# Schema Generalization & Deployment Guide

> **Purpose:** This document explains how the School Operations Responder's database schema and architecture generalize cleanly across different types of educational institutions and deployment scale.

## Why No Hardcoded Values?

The agent and validation scripts **never** hardcode student counts, roll numbers, exam names, or subject lists inside system prompts or agent instructions. Instead, all data is driven by:

1. **The database schema itself** — counts, structures, and constraints are queried at runtime via SQL.
2. **The `SEED_CONFIG` dictionary** in `scripts/seed-database.py` — a single source of truth for domain-specific test data.
3. **Dynamic schema queries** — scripts read `max_marks`, subject lists, and exam metadata from tables, not from constants.

This means the same agent code works across schools, colleges, or universities by changing the `tenant_id` and seed configuration.

## Terminology Mapping Across Institutional Types

The relational schema uses abstract entities that map to concrete terms in different institutional contexts:

| Abstract Schema Noun | School Entity | University / College Entity | Multi-Campus Trust Entity |
| :--- | :--- | :--- | :--- |
| **`Organisation / Tenant`** | Lucknow Secondary School | Faculty of Engineering | St. Paul's Trust Group |
| **`Section / Batch`** | Class 8A | Course Section B | Lucknow Campus Section A |
| **`Course`** | Mathematics | Data Structures (CS-301) | standard maths |
| **`Staff`** | Teacher | Professor / Lecturer | Lucknow Campus Teacher |
| **`Incident Authority`** | Academic Coordinator | Department Head (HOD) | Trust Operations Director |
| **`Supervisory Head`** | Principal | Dean / Director | Chief Trust Officer |

## Database Schema Overview

The core schema uses **multi-tenant isolation** via `org_id` (or `tenant_id`) fields on every table, ensuring data from different institutions never mixes:

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    org_type VARCHAR(50), -- 'school', 'college', 'university'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE classes (
    id UUID PRIMARY KEY,
    org_id UUID REFERENCES organizations(id),
    name VARCHAR(100),
    section VARCHAR(10),
    academic_year VARCHAR(20),
    UNIQUE(org_id, name, section)
);

-- All other tables (subjects, teachers, students, timetable, marks, etc.)
-- follow the same org_id pattern for tenant isolation.
```

## Deployment Modes

### Local Mode (Development & Hackathon)

- **Runtime:** `npx @truefoundry/trueforge`
- **Database:** SQLite file (local)
- **Authentication:** None (localhost only — never expose to internet)
- **Use Case:** Personal development, agent harness hackathon submissions
- **Trade-off:** Fast iteration, no login required, but no multi-user support

### Hosted Mode (Team / Shared Deployment)

- **Runtime:** Kubernetes or Docker Compose cluster
- **Database:** PostgreSQL (centralized, multi-tenant)
- **Cache/Pub-Sub:** Redis (for real-time session state syncing)
- **Authentication:** OIDC (Google, Okta, Azure AD) with Role-Based Access Control
- **Use Case:** Shared team access, coordinator + teacher + principal roles
- **Trade-off:** Requires infrastructure setup, but supports multiple users with secure login

### Commercial Gateway (Enterprise Production)

- **Runtime:** TrueFoundry managed platform
- **Database:** Managed PostgreSQL with automated backups
- **Gateways:** AI Gateway + MCP Gateway (centralized policy enforcement)
- **Authentication:** SSO + fine-grained RBAC across all connected services
- **Features:** Semantic caching, PII redaction, cost tracking, SQL injection sanitizers
- **Use Case:** Multi-campus universities, district-wide school deployments
- **Trade-off:** Paid commercial tier, but eliminates all infrastructure management

## Scaling Path

1. **Local → Hosted:** Replace SQLite with PostgreSQL for shared session state. Add Redis for pub-sub across server replicas behind a load balancer.
2. **Hosted → Commercial Gateway:** Add AI Gateway (semantic caching, cost tracking, PII redaction) and MCP Gateway (centralized credential management, SQL sanitizers, policy enforcement).

## Model Configuration

The agent manifest uses OpenRouter as the model gateway:

```
openrouter/meta/llama-4-maverick
```

This routes through OpenRouter's multi-model gateway, which can be swapped to any other OpenRouter-compatible model without changing agent code.

## Key Design Principles

1. **Sandbox-as-a-Tool:** Daytona containers are provisioned on-demand only when Code Mode execution is needed; the orchestration server remains lightweight.
2. **Dynamic Subagents:** Tasks are delegated to specialized worker agents with narrow tool scopes to keep the main context window lean.
3. **Human-in-the-Loop Gates:** Every database write or notification send is paused for human approval via TrueForge's checkpoint system.
4. **Code Mode for Determinism:** All mathematical calculations, aggregations, and constraint-solving run as Python scripts in the sandbox — never probabilistic text generation.
5. **Context Hygiene:** Large tool responses are offloaded to disk files; long conversations are auto-compacted by TrueForge's middleware.

---

*Last Updated: August 29, 2026*