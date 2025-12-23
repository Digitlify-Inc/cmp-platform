# GSV Agent Store MVP — Implementation Handover Document

**Date:** 2025-12-18
**Purpose:** Complete context transfer for implementation teams starting fresh
**Source:** Analysis session of gsv-agent-store-docs v1.4 (19 documents + OpenAPI specs + registry files + Postman collection + k6 smoke tests)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Architecture Summary](#3-architecture-summary)
4. [Documentation Pack Inventory](#4-documentation-pack-inventory)
5. [Key Design Decisions](#5-key-design-decisions)
6. [Capability Registry](#6-capability-registry)
7. [API Contracts Summary](#7-api-contracts-summary)
8. [Integration Points Map](#8-integration-points-map)
9. [Security Model](#9-security-model)
10. [Error Handling & Retry Policies](#10-error-handling--retry-policies)
11. [Monitoring & Alerting](#11-monitoring--alerting)
12. [Implementation Prerequisites](#12-implementation-prerequisites)
13. [Sprint 0 Checklist](#13-sprint-0-checklist)
14. [Open Questions](#14-open-questions)
15. [File Locations & References](#15-file-locations--references)
16. [Testing Assets (Ready to Use)](#16-testing-assets-ready-to-use)

---

## 1. Executive Summary

### What We're Building

A **single-publisher Agent Store** (marketplace) for AI digital workers with:
- **4 product categories:** Agents, Apps, Assistants, Automations
- **8 value streams:** customer_support, sales_outreach, docs_knowledge, ops_it, marketing_content, recruiting_hr, finance_ops, executive_assistant
- **Credit-based pricing** with wallet/ledger system
- **Frictionless app-store experience** (browse → try → buy → activate → use)

### GTM Scope Constraints (MVP)

- **1-2 offerings** only (one Assistant + one RAG Agent/App)
- **1-2 value streams** only
- **2-3 connectors** max (+ generic HTTP connector)
- **Synchronous credits enforcement** at Gateway (OpenMeter optional/async)
- **Single publisher** (no vendor onboarding in MVP)

### Timeline Options

- **Plan A (2-week thin-slice):** Narrow scope, fast GTM
- **Plan B (3-week buffered):** Adds hardening, better onboarding, incident playbooks

### Success Metrics

- Time-to-first-value: < 3 minutes
- Trial activation: > 25% visitors
- Paid conversion: 3-5% trial → paid
- COGS: shared tier supports $15-$50 plans sustainably

---

## 2. Product Overview

### Categories × Value Streams Matrix

| Category | Description | Example Use Cases |
|----------|-------------|-------------------|
| **Agents** | Autonomous AI workers | Task automation, workflow execution |
| **Apps** | Applications + integrations | Data processing, API integrations |
| **Assistants** | Conversational AI | Customer support, internal helpdesk |
| **Automations** | Workflow automation tools | Scheduled tasks, triggered actions |

### Buyer Journey (Frictionless)

```
Discover → Evaluate → Try → Connect → Buy → Activate → Use → Retain
    │          │        │       │       │        │       │       │
    │          │        │       │       │        │       │       └─ Low credit warnings
    │          │        │       │       │        │       └─ Workspace (wallet, usage, history)
    │          │        │       │       │        └─ Instance created and ready
    │          │        │       │       └─ Plan upgrade or credit pack
    │          │        │       └─ Connector wizard (only when tool required)
    │          │        └─ "Run now" → auto org/project → starter credits
    │          └─ Listing shows connectors + credits + trust notes
    └─ Search + filters (value stream, capabilities, connectors)
```

### Key UX Principles

1. Browse without login
2. Try with free credits
3. Connect apps only when required
4. Upgrade/top-up only when blocked
5. Always show credits/spend
6. One-click activation

---

## 3. Architecture Summary

### Three Planes

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         COMMERCE PLANE                                   │
│  ┌─────────────┐    ┌─────────────┐                                     │
│  │   Saleor    │    │   Wagtail   │                                     │
│  │ (Store/Cart)│    │    (CMS)    │                                     │
│  └──────┬──────┘    └─────────────┘                                     │
└─────────┼───────────────────────────────────────────────────────────────┘
          │ OrderFullyPaid webhook
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        PLATFORM PLANE                                    │
│  ┌─────────────┐    ┌─────────────────────────────────────────────┐     │
│  │ Provisioner │───▶│           Control Plane (Django/DRF)        │     │
│  │    App      │    │  - Org/Project/Team                         │     │
│  └─────────────┘    │  - Offering/Version lifecycle               │     │
│                     │  - Instance lifecycle                        │     │
│                     │  - Wallet/Ledger                             │     │
│                     │  - Connector bindings                        │     │
│                     │  - GitOps commit (desired state)             │     │
│                     └──────────────────┬──────────────────────────┘     │
└────────────────────────────────────────┼────────────────────────────────┘
                                         │ Git commit
                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        EXECUTION PLANE                                   │
│  ┌─────────┐    ┌─────────┐    ┌──────────────┐    ┌─────────────┐     │
│  │ Gateway │───▶│ Runner  │───▶│   Langflow   │───▶│ Connector/  │     │
│  │(Auth/   │    │(Adapter)│    │   Runtime    │    │ MCP Gateway │     │
│  │Credits) │    └─────────┘    └──────────────┘    └──────┬──────┘     │
│  └─────────┘                                              │             │
│       │                                                   ▼             │
│       │         ┌─────────────┐    ┌─────────────┐  ┌─────────┐        │
│       └────────▶│   Ragflow   │───▶│    MinIO    │  │  Vault  │        │
│                 │    (RAG)    │    │    (S3)     │  │(Secrets)│        │
│                 └─────────────┘    └─────────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Design Principles (Non-Negotiable)

1. **Commerce is separate from provisioning** — Saleor sells; it does not provision
2. **Control Plane is source of truth** — Lifecycle, entitlements, wallet, instance state
3. **Execution is gated** — All user calls go through Gateway; runtime never exposed
4. **Secrets never leak** — Flows contain no credentials; Vault + ESO manage secrets
5. **GitOps-only deployments** — Desired state committed to Git; ArgoCD reconciles

### Component Responsibilities

| Component | Owner | Responsibilities |
|-----------|-------|------------------|
| Saleor | Commerce | Catalog, checkout, orders, credit pack sales |
| Wagtail | Marketing | Landing pages, value stream pages, education content |
| Provisioner App | Platform | Webhook validation, idempotency, CP client |
| Control Plane | Platform | Offerings, versions, instances, wallet, billing, GitOps commits |
| Gateway | Execution | Auth, entitlements, credits, routing |
| Flow Runner | Execution | Artifact fetch, hash validation, Langflow adapter |
| Connector/MCP GW | Execution | Vault secret retrieval, policy enforcement, tool execution |
| Langflow Runtime | Execution | Flow execution engine |
| Ragflow | Execution | RAG ingestion and retrieval |
| MinIO | Storage | Artifacts, KB documents |
| Keycloak | Identity | OIDC, social login, service-to-service auth |
| Vault + ESO | Secrets | Secret storage, K8s secret sync |
| ArgoCD | Delivery | GitOps reconciliation |

---

## 4. Documentation Pack Inventory

### Location

```
/workspace/repo/github.com/GSVDEV/gsv-platform/docs/gsv-agent-store-docs/
```

### Files (19 documents + specs + registry + testing assets)

| File | Lines/Size | Purpose |
|------|------------|---------|
| `README.md` | ~40 | Pack overview and what's new |
| `01-PRD.md` | 101 | Product requirements document |
| `02-Architecture.md` | 101 | Component diagram + responsibility matrix |
| `03-Buyer-Journey.md` | 30 | Experience map + minimum screens |
| `04-Capability-Registry.md` | 85 | Registry usage + handler interface |
| `05-Value-Streams-and-Bundles.md` | 18 | 8 value stream slugs |
| `06-Integration-and-Provisioning.md` | 30 | Saleor → CP → GitOps flow |
| `07-Control-Plane-API.md` | 27 | API surface overview (references OpenAPI) |
| `08-Project-Plan.md` | 33 | 2-week and 3-week plans |
| `09-Security-and-Isolation.md` | 20 | Security non-negotiables + isolation model |
| `10-Runbook.md` | 39 | Deployment order + rollback procedures |
| `11-Langflow-Integration.md` | 35 | Artifact lifecycle + invocation contract |
| `12-Connector-and-MCP-Gateway.md` | 23 | Tool invoke API + Vault pattern |
| `13-Metering-and-Credits-MVP.md` | 14 | Sync debit flow |
| `14-Testing-Strategy.md` | 13 | 7 minimum E2E tests |
| `15-Repo-Strategy-and-Migration.md` | 27 | cmp-agentregistry relationship + cutover |
| `16-E2E-Visual-Architecture.md` | 378 | Complete Mermaid diagrams + no-gaps map |
| `17-Ops-Monitoring-and-Alerting.md` | 38 | Alerting thresholds per component |
| `18-Error-Handling-and-Retry-Policies.md` | 172 | Error taxonomy + retry matrices + timeouts |
| `19-Integration-Contracts-Pack-v1.md` | 696 | Copy/paste contracts + test cases |
| `control-plane.openapi.yaml` | 521 | Full Control Plane OpenAPI spec |
| `gateway.openapi.yaml` | 138 | Full Gateway OpenAPI spec |
| `capability-registry.yaml` | 307 | 16 capabilities with schemas |
| `capability-registry.schema.json` | 24 | JSON Schema for registry validation |
| `gsv-agent-store-integration-contracts-v1.postman_collection.json` | 37KB | **Ready-to-import Postman collection** |
| `gsv-agent-store-k6-smoke.js` | 225 | **k6 load test / smoke test script** |

### Reading Order (Recommended)

1. **01-PRD.md** — Understand the product
2. **02-Architecture.md** — Understand the components
3. **16-E2E-Visual-Architecture.md** — See complete integration map
4. **19-Integration-Contracts-Pack-v1.md** — Implementation contracts
5. **control-plane.openapi.yaml** + **gateway.openapi.yaml** — API specs
6. **capability-registry.yaml** — Capability definitions
7. **18-Error-Handling-and-Retry-Policies.md** — Error handling
8. **17-Ops-Monitoring-and-Alerting.md** — Operational readiness
9. **10-Runbook.md** — Deployment and rollback

---

## 5. Key Design Decisions

### 5.1 Credits Enforcement (MVP)

**Decision:** Synchronous at Gateway (not async via OpenMeter)

```
Gateway → CP: POST /billing/authorize (reserve budget)
         ↓
      Run executes
         ↓
Gateway → CP: POST /billing/settle (debit actual usage)
```

**Rationale:** Reduces risk for GTM; OpenMeter can collect events async for dashboards later.

### 5.2 Secrets Management

**Decision:** Zero secrets in Langflow flows; all secrets in Vault

- Flows contain `bindingId` references, not credentials
- Connector Gateway pulls secrets from Vault at execution time
- Path convention: `kv/data/connectors/{orgId}/{projectId}/{bindingId}`

### 5.3 Provisioning

**Decision:** GitOps-only (Control Plane commits desired state)

- CP commits to: `clusters/<env>/instances/<org>/<project>/<instanceId>/`
- ArgoCD reconciles
- Instance moves to ACTIVE when resources are ready

### 5.4 cmp-agentregistry Relationship

**Decision:** Hybrid import/mirror for GTM, converge to CP absorbs registry post-GTM

- **Option A (end-state):** CP absorbs cmp-agentregistry completely
- **Option B:** CP delegates to registry (only if registry is mature)
- **Option C (GTM):** CP is authoritative for activation/billing; optionally imports offerings from registry

### 5.5 Runtime Profiles

**Decision:** Shared tier for MVP; Enterprise (dedicated namespace/vcluster) post-GTM

**Shared tier isolation:**
- Secrets: Vault-scoped per binding
- Data: Ragflow KB scoped by org/project; MinIO prefix-per-project
- Execution: Shared compute with strict limits + rate limiting + timeouts

---

## 6. Capability Registry

### Structure

Each capability defines:
- `id`, `v`, `layer`, `title`, `description`
- `saleor_value`: identifier for Saleor attribute values
- `config_schema`: JSON Schema for UI generation + validation
- `provisioning.handler`: handler identifier for desired state generation
- `metering.dimensions`: usage dimensions for credit debits

### 16 MVP Capabilities (by layer)

| Layer | Capability | Purpose |
|-------|------------|---------|
| intelligence | `prompt_orchestrator` | Base prompt + variables + guardrails |
| integrations | `tool_connectors` | Tool calling via Connector Gateway |
| integrations | `mcp_tools` | MCP servers through proxy |
| experience | `api_endpoint` | Secured API endpoint |
| experience | `chat_ui` | Chat surface with session history |
| experience | `web_widget` | Embeddable website widget |
| modalities_i18n | `multilingual` | Language selection + fallback |
| modalities_i18n | `multimodal_vision` | Image/PDF visual understanding |
| modalities_i18n | `multimodal_audio` | STT/TTS audio |
| knowledge | `rag_knowledgebase` | Tenant-scoped KB via Ragflow |
| governance | `guardrails_policy` | Safety rules + content constraints |
| governance | `audit_trail` | Immutable audit events |
| ops | `scheduler_triggers` | Scheduled runs + webhooks |
| ops | `observability` | Logs/metrics/traces correlation |
| monetization | `credits_wallet` | Credit ledger + depletion policies |

### Effective Config Merge Order

```
effectiveConfig = planDefaults ⊕ offeringDefaults ⊕ instanceOverrides
```

Later layers override earlier layers.

### Handler Interface

Each provisioning handler implements:
- `validate(config) → errors[]`
- `desired_state(instance) → manifests[]` (GitOps)
- `meter(usage) → credit_debit` (maps dims → credits)

---

## 7. API Contracts Summary

### Control Plane Endpoints (from OpenAPI)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/integrations/saleor/order-paid` | POST | Webhook ingestion (via Provisioner) |
| `/orgs/auto` | POST | Auto-create personal org/project/wallet |
| `/offerings` | GET/POST | List/create offerings |
| `/offerings/{offeringId}/versions` | GET/POST | List/create versions |
| `/instances` | GET/POST | List/create instances |
| `/instances/{instanceId}` | GET | Get instance |
| `/instances/{instanceId}/entitlements` | GET | Get computed entitlements |
| `/wallets/{walletId}` | GET | Get wallet |
| `/wallets/{walletId}/topups` | POST | Apply top-up (idempotent) |
| `/billing/authorize` | POST | Authorize run (reserve budget) |
| `/billing/settle` | POST | Settle and debit usage |
| `/connectors/bindings` | POST | Create connector binding |
| `/connectors/bindings/{bindingId}/revoke` | POST | Revoke binding |

### Gateway Endpoints (from OpenAPI)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/runs` | POST | Execute instance run |
| `/v1/widget/session:init` | POST | Initialize widget session |

### Idempotency

All commerce-triggered calls must be idempotent using:
- `Idempotency-Key: saleor:<orderId>:<lineId>`

Same key + same payload → same response
Same key + different payload → `409 IDEMPOTENCY_PAYLOAD_MISMATCH`

---

## 8. Integration Points Map

### Arrow Map (from Doc 16 → Doc 19 Contracts)

| Arrow | From → To | Contract Section (Doc 19) |
|-------|-----------|---------------------------|
| A1 | Buyer UI → Keycloak | §2 (OIDC) |
| A2 | Buyer UI/Widget → Gateway | §3 (runs, widget) |
| A3 | Gateway → Control Plane | §4 (entitlements, billing) |
| A4 | Gateway → Runner | §5 (internal hop) |
| A5 | Runner → Langflow Runtime | §6 (execute flow) |
| A6 | Runtime → Connector/MCP Gateway | §7 (tool invoke) |
| A7 | Connector Gateway → Vault | §8 (secret retrieval) |
| A8 | Buyer UI → Saleor | §9 (storefront) |
| A9 | Saleor → Provisioner App | §10 (webhook) |
| A10 | Provisioner App → Control Plane | §11 (normalized event) |
| A11 | Control Plane → Git | §12 (desired state) |
| A12 | ArgoCD → Cluster resources | §13 (apply + health) |
| A13 | RAG: UI → CP → MinIO → Ragflow | §14 (ingestion) |
| A14 | Credits top-up | §15 (Saleor → Provisioner → CP) |
| A15 | Widget branding session init | §16 (origin allowlist) |

### Key Sequences

**Trial Run Flow:**
```
Buyer → UI → Keycloak (OIDC login)
     → Gateway: POST /v1/workspaces/auto
     → Gateway: POST /v1/instances/autoActivate
     → Gateway: POST /v1/runs
         → CP: POST /billing/authorize
         → Runner: POST /v1/runs
             → Langflow Runtime: execute
             → Connector Gateway: tool invoke
                 → Vault: read secret
                 → External API
         → CP: POST /billing/settle
     → Buyer: response + usage + billing
```

**Purchase Flow:**
```
Buyer → Saleor: Checkout
Saleor → Provisioner: OrderFullyPaid webhook (signed)
Provisioner → CP: POST /integrations/saleor/order-paid
    (idempotency key: saleor:<orderId>:<lineId>)
CP → Git: commit desired state
ArgoCD → Cluster: apply resources
CP: mark instance ACTIVE
```

---

## 9. Security Model

### Non-Negotiables

1. **No secrets in Langflow flows or artifacts**
2. **Runtime is private; Gateway is the chokepoint**
3. **Connector/MCP calls go through Connector Gateway**
4. **Vault+ESO is the only secret store**
5. **Audit trails for runs, tool calls, connector changes**

### Shared Tier Isolation

| Boundary | Mechanism |
|----------|-----------|
| Secrets | Vault-scoped per binding |
| Data | Ragflow KB scoped by org/project |
| Storage | MinIO prefix-per-project |
| Execution | Shared compute + strict limits + rate limiting + timeouts |
| Policies | Gateway policy enforcement |

### Vault Path Convention

```
kv/data/connectors/{orgId}/{projectId}/{bindingId}
```

Vault policies restrict reads to calling service identity AND scope.

---

## 10. Error Handling & Retry Policies

### Canonical Error Response

```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Not enough credits to run this instance.",
    "details": {
      "instanceId": "inst_...",
      "balance": 12,
      "requiredBudget": 25
    },
    "traceId": "..."
  }
}
```

### HTTP Status Mapping

| Code | Meaning |
|------|---------|
| 400 | Invalid request / schema validation |
| 401 | Missing/invalid token |
| 403 | Not entitled OR insufficient credits |
| 404 | Resource not found in scope |
| 409 | Idempotency conflict |
| 422 | Semantically invalid |
| 429 | Rate limited (include `Retry-After`) |
| 500 | Unexpected server error |
| 502/503 | Upstream dependency down |
| 504 | Upstream timeout |

### Retry Matrix Summary

| Caller → Target | Retry On | Max Attempts | Backoff |
|-----------------|----------|--------------|---------|
| Provisioner → CP | 502/503/504, network | 5 | 1s,2s,4s,8s,16s |
| Gateway → CP (authorize) | 502/503/504 | 3 | exponential |
| Gateway → CP (settle) | timeout | 5 | idempotent by reservationId |
| Runner → Runtime | network/timeout | 2 | max 1 retry |
| Connector GW (read APIs) | 502/503/504 | 3 | - |
| Connector GW (write APIs) | none | 0 | unless tool supports idempotency |
| Connector GW → Vault | 503/504 | 2 | fail closed |

### Timeouts (MVP Defaults)

| Path | Timeout |
|------|---------|
| Gateway → Runner | 60s |
| Runner → Runtime | 60s |
| Tool call default | 15s |
| Vault read | 2s |
| Ragflow query | 10s |
| Ragflow ingest | 60s (async recommended) |

### Failure Modes

| Component Down | Behavior |
|----------------|----------|
| CP down | Fail closed (block runs) |
| Vault down | Fail closed for tool calls |
| Connector GW down | Fail closed for tool calls |
| Ragflow down | Return `RAG_UNAVAILABLE` |
| MinIO down | Block artifact fetch + RAG upload; return 503 |

---

## 11. Monitoring & Alerting

### Gateway

| Metric | Threshold |
|--------|-----------|
| 5xx rate | > 1% for 5m |
| p95 latency `/v1/runs` | > 1500ms for 10m |
| Widget init failure rate | > 2% for 10m |
| OIDC verification failures | > 1% for 10m |

### Control Plane

| Metric | Threshold |
|--------|-----------|
| Billing authorize errors | > 0.5% for 10m |
| Billing settle errors | > 0.5% for 10m |
| Instances stuck PROVISIONING | > 3 for 15m |
| DB saturation | > 80% for 10m |

### Runner / Runtime

| Metric | Threshold |
|--------|-----------|
| Run failure rate | > 2% for 10m |
| Timeout rate | > 1% for 10m |
| p95 execution time | > 30s for 10m |

### Connector/MCP Gateway + Vault

| Metric | Threshold |
|--------|-----------|
| Vault read failures | > 0.2% for 10m |
| Connector 5xx | > 2% for 10m |
| Policy deny spike | > 3x baseline for 15m |

### Ragflow + MinIO

| Metric | Threshold |
|--------|-----------|
| RAG ingest failures | > 1% for 15m |
| RAG query p95 latency | > 2000ms for 10m |
| MinIO 5xx | > 0.5% for 10m |
| Disk used | > 80% (ticket), > 90% (page) |

### Business Sanity

| Metric | Threshold |
|--------|-----------|
| Avg debit per run increase | > 2x day-over-day |
| Insufficient-credit blocks spike | > 3x baseline for 30m |

---

## 12. Implementation Prerequisites

### Infrastructure Components

| Component | Purpose | Deploy Order |
|-----------|---------|--------------|
| Keycloak | Identity/OIDC | 1 |
| Vault + ESO | Secrets | 2 |
| MinIO | Object storage | 3 |
| PostgreSQL | Databases | 3 |
| Ragflow | RAG backend | 4 |
| Gateway | Execution entrypoint | 5 |
| Runner | Langflow adapter | 5 |
| Connector Gateway | Tool execution | 5 |
| Control Plane | Platform core | 6 |
| Provisioner App | Webhook handler | 6 |
| Saleor | Commerce | 7 |
| Wagtail | CMS | 8 |
| ArgoCD | GitOps | (before all, to deploy everything) |

### GitOps Repository Structure

```
gsv-gitops/
├── apps/                           # ArgoCD Application definitions
│   ├── infrastructure.yaml
│   ├── platform.yaml
│   └── commerce.yaml
├── clusters/
│   ├── dev/
│   │   ├── infrastructure/         # Keycloak, Vault, MinIO, etc.
│   │   ├── platform/               # CP, Provisioner, Gateway, Runner
│   │   ├── commerce/               # Saleor, Wagtail
│   │   └── instances/              # CP commits here
│   │       └── <orgId>/<projectId>/<instanceId>/
│   │           ├── gatewayroute.yaml
│   │           ├── gatewaypolicy.yaml
│   │           ├── connectorpolicy.yaml
│   │           └── kustomization.yaml
│   └── prod/
│       └── (same structure)
├── base/                           # Shared manifests
└── infrastructure/                 # Helm values, secrets references
```

### Saleor Configuration

| Item | Details |
|------|---------|
| Products | One per offering |
| Variants | One per plan (starter, pro, enterprise) |
| Attributes | VALUE_STREAMS, CAPABILITIES, CONNECTORS, LANGUAGES, MODALITIES |
| Credit packs | Separate products with `creditsAmount` metadata |
| Webhook | Register provisioner app URL for `ORDER_FULLY_PAID` |

### Development Environment

| Tool | Purpose |
|------|---------|
| kind / k3d | Local Kubernetes cluster |
| Tilt / Skaffold | Hot-reload dev loop |
| Docker Compose | Non-K8s local dev option |
| Postman | Import curl examples from doc 19 |

---

## 13. Sprint 0 Checklist

### Week 0 (Setup)

- [ ] Deploy local K8s cluster (kind/k3d)
- [ ] Deploy ArgoCD
- [ ] Create gsv-gitops repo structure
- [ ] Deploy Keycloak + configure realm
- [ ] Deploy Vault + init + unseal + enable KV engine
- [ ] Deploy MinIO + create buckets (artifacts, rag)
- [ ] Deploy PostgreSQL + create databases
- [ ] Deploy Ragflow
- [ ] Configure ArgoCD app-of-apps
- [ ] Create Postman collection from doc 19
- [ ] Set up CI pipeline skeleton

### Week 1 (Core Platform)

- [ ] Control Plane v0
  - [ ] Models: Org, Project, Offering, OfferingVersion, Instance, Wallet, Ledger
  - [ ] Endpoints: /orgs/auto, /offerings, /instances, /wallets, /billing/*
  - [ ] GitOps commit logic
- [ ] Provisioner App
  - [ ] Saleor webhook signature validation
  - [ ] Idempotency store
  - [ ] CP client calls
- [ ] Gateway stub
  - [ ] OIDC/JWT validation
  - [ ] Route to mock runner
- [ ] E2E test: Saleor order → instance created

### Week 2 (Execution)

- [ ] Flow Runner
  - [ ] Artifact fetch from MinIO
  - [ ] Hash validation
  - [ ] Langflow Runtime client
- [ ] Connector Gateway
  - [ ] Vault secret retrieval
  - [ ] Policy enforcement
  - [ ] Tool execution + audit
- [ ] Gateway completion
  - [ ] Entitlements cache
  - [ ] Billing authorize/settle
  - [ ] Route to Runner
- [ ] RAG integration
  - [ ] Presign upload
  - [ ] Ragflow ingest
- [ ] Credits enforcement
  - [ ] Authorize/settle loop
  - [ ] Suspend-on-zero
- [ ] E2E tests: T1-T7 from doc 19 §18

---

## 14. Open Questions

### Technical

1. **Langflow version** — Which version? Self-hosted or cloud?
2. **Ragflow setup** — Existing deployment or new?
3. **Domain names** — What DNS entries for Gateway, CP, Saleor, etc.?
4. **Keycloak realm** — New realm or existing?
5. **Git hosting** — GitHub (GSVDEV) or internal Gitea?
6. **CI/CD** — GitHub Actions, GitLab CI, or ArgoCD-only?

### Product

7. **Trial credits amount** — How many starter credits?
8. **Credit pack denominations** — What SKUs? ($10, $25, $50, $100?)
9. **Plan tiers** — Starter, Pro, Enterprise pricing?
10. **First offerings** — Which Assistant + RAG Agent for launch?

### Operations

11. **On-call rotation** — Who owns what?
12. **Incident runbooks** — Beyond doc 10?
13. **Backup strategy** — PostgreSQL, Vault, MinIO?

---

## 15. File Locations & References

### Documentation

```
/workspace/repo/github.com/GSVDEV/gsv-platform/docs/gsv-agent-store-docs/
```

### Key Files for Implementation

| Purpose | File |
|---------|------|
| Control Plane API | `control-plane.openapi.yaml` |
| Gateway API | `gateway.openapi.yaml` |
| Capability definitions | `capability-registry.yaml` |
| Integration contracts | `19-Integration-Contracts-Pack-v1.md` |
| Error handling | `18-Error-Handling-and-Retry-Policies.md` |
| Monitoring | `17-Ops-Monitoring-and-Alerting.md` |
| E2E architecture | `16-E2E-Visual-Architecture.md` |
| Runbook | `10-Runbook.md` |

### Active Repositories

| Repo | Purpose |
|------|---------|
| `GSVDEV/gsv-platform` | Platform monorepo (this docs pack) |
| `GSVDEV/gsv-gitops` | All-in-one GitOps for dev/test |
| `Digitlify-Inc/cmp-website` | Marketing/CMS site (Wagtail) |

### Commerce Stack (Saleor)

| Component | Purpose |
|-----------|---------|
| `cmp-commerce-api` | Saleor GraphQL API (catalog, checkout, orders) |
| `cmp-commerce-dashboard` | Saleor Dashboard (product management) |
| `cmp-storefront` | Next.js storefront (marketplace UI) |

### Deprecated Repositories (DO NOT USE)

> **WARNING:** The following repositories contain the legacy Waldur codebase and are NOT part of the current platform.

| Repo | Status | Notes |
|------|--------|-------|
| `Digitlify-Inc/cmp-frontend` | **DEPRECATED** | Legacy Waldur HomePort - replaced by cmp-storefront |
| `Digitlify-Inc/cmp-backend` | **DEPRECATED** | Legacy Waldur MasterMind - replaced by Saleor + Control Plane |
| `Digitlify-Inc/cmp-agentregistry` | **DEPRECATED** | Absorbed into Control Plane |

### Workspace Context

```
Platform: Windows + WSL2
Working Directory: /workspace (WSL2)
Git repos: /workspace/repo/github.com/
```

---

## 16. Testing Assets (Ready to Use)

### Postman Collection

**File:** `gsv-agent-store-integration-contracts-v1.postman_collection.json`

A complete Postman collection generated from doc 19 with:

**Folders:**
- `00 - Auth (optional)` — Keycloak token helper
- `01 - Control Plane (CP)` — All CP endpoints
- `02 - Gateway (public execution)` — Widget init + runs
- `03 - Connector/MCP Gateway (optional)` — Tool invoke
- `04 - RAG (optional)` — Presign, upload, ingest

**Variables (configure in Postman):**
```
API_BASE, CP_BASE, KC_BASE, CONN_BASE
USER_JWT, SERVICE_JWT, RUNTIME_JWT
OFFERING_VERSION_ID, PLAN_ID
ORG_ID, PROJECT_ID, WALLET_ID, INSTANCE_ID
CONNECTOR_ID, BINDING_ID, VAULT_PATH
ORIGIN, SALEOR_ORDER_ID, SALEOR_LINE_ID
```

**Features:**
- Pre-request scripts auto-generate `X-Request-Id`
- Test scripts validate responses and set variables
- Idempotency keys auto-generated where required
- Ready for Newman CLI automation

**Import:**
```bash
# Postman GUI: File → Import → select the JSON file
# Or use Newman CLI:
newman run gsv-agent-store-integration-contracts-v1.postman_collection.json \
  --env-var "API_BASE=https://api.example.com" \
  --env-var "CP_BASE=https://cp.example.com" \
  --env-var "USER_JWT=<token>" \
  --env-var "SERVICE_JWT=<token>"
```

---

### k6 Smoke Test

**File:** `gsv-agent-store-k6-smoke.js`

A k6 load testing script that validates the complete E2E flow:

**Test Steps:**
1. Create workspace (org/project/wallet) via `/orgs/auto`
2. Create instance via `/instances`
3. Wait for instance ACTIVE state (GitOps readiness)
4. (Optional) Test billing authorize/settle directly
5. Execute run via Gateway `/v1/runs`
6. (Optional) Create and revoke connector binding
7. (Optional) Test RAG presign flow
8. Test widget session init

**Run:**
```bash
k6 run \
  -e API_BASE="https://api.example.com" \
  -e CP_BASE="https://cp.example.com" \
  -e USER_JWT="<user-access-token>" \
  -e SERVICE_JWT="<service-jwt>" \
  -e OFFERING_VERSION_ID="ov_100" \
  -e PLAN_ID="pro" \
  gsv-agent-store-k6-smoke.js
```

**Optional Toggles:**
```bash
-e USE_COMMERCE_FLOW="1"         # Use Saleor webhook flow instead of direct create
-e RUN_GATEWAY_ONLY="0"          # Also test CP billing endpoints directly
-e CREATE_CONNECTOR_BINDING="1"  # Test connector binding lifecycle
-e TEST_RAG="1"                  # Test RAG presign flow
```

**Success Criteria:**
- All checks pass
- Instance becomes ACTIVE within 60s
- Run completes with `runId` in response
- No 403 INSUFFICIENT_CREDITS errors

---

## Appendix A: Minimum E2E Test Suite

From doc 19 §18:

| Test | Description |
|------|-------------|
| T1 | Order paid → instance created (idempotent) |
| T2 | Instance becomes ACTIVE via GitOps |
| T3 | Run via Gateway → Runner → Runtime |
| T4 | Credits debit; blocked at zero |
| T5 | Top-up unblocks |
| T6 | Connector binding/revoke |
| T7 | RAG cross-tenant isolation |

Additional tests from doc 18:

| Test | Description |
|------|-------------|
| T8 | Settle idempotency: retry returns same ledgerEntryId |
| T9 | Webhook retries: duplicate doesn't create duplicates |
| T10 | Tool call safety: write-tool not retried |
| T11 | Vault outage: tool call fails closed |
| T12 | Rate limiting: 429 + Retry-After |

---

## Appendix B: Copy/Paste Commands

### Start New Thread

When starting a new Claude Code session, provide this context:

```
I'm implementing the GSV Agent Store MVP. Please read:

1. /workspace/repo/github.com/GSVDEV/gsv-platform/docs/gsv-agent-store-docs/HANDOVER.md
2. /workspace/repo/github.com/GSVDEV/gsv-platform/docs/gsv-agent-store-docs/16-E2E-Visual-Architecture.md
3. /workspace/repo/github.com/GSVDEV/gsv-platform/docs/gsv-agent-store-docs/19-Integration-Contracts-Pack-v1.md
4. /workspace/repo/github.com/GSVDEV/gsv-platform/docs/gsv-agent-store-docs/control-plane.openapi.yaml

Then help me with: [your specific task]
```

### Pull Latest Docs

```bash
cd /workspace/repo/github.com/GSVDEV/gsv-platform && git pull origin main
```

### List All Docs

```bash
ls -la /workspace/repo/github.com/GSVDEV/gsv-platform/docs/gsv-agent-store-docs/
```

---

**End of Handover Document**

*Generated: 2025-12-18*
*Source: GSV Agent Store Docs v1.3 analysis session*
