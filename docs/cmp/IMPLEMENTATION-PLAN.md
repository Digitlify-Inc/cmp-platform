# CMP Implementation Plan

**Date:** 2025-12-18
**Status:** Phase 0 Complete - Ready for Phase 1
**Based on:** cmp v1.5 + Current KinD Deployment Analysis

---

## 1. Executive Summary

This document outlines the implementation plan to build the Cloud Marketplace Platform (CMP) - an AI Agent Store with credit-based pricing and frictionless buyer experience.

### Key Decisions

| Decision | Value |
|----------|-------|
| Product Name | CMP (Cloud Marketplace Platform) |
| Namespace | `cmp` (single unified namespace) |
| Theme | Stripe-like purple (consistent branding) |
| Code Repository | `GSVDEV/gsv-platform` |
| GitOps Repository | `GSVDEV/gsv-gitops` |
| Naming Convention | Role-based (not vendor-based) |

### Role-Based Naming Convention

| Role Name | Vendor/Technology | Purpose |
|-----------|-------------------|---------|
| `studio` | Langflow | Agent/flow builder (design-time IDE) |
| `runtime` | Langflow | Agent execution (run-time) |
| `rag` | Ragflow | RAG backend |
| `sso` | Keycloak | Authentication/OIDC |
| `vault` | Vault + ESO | Secrets management |
| `storage` | MinIO | Object storage |
| `commerce` | Saleor | Shopping/checkout |
| `cms` | Wagtail | Content management |
| `db` | CNPG | PostgreSQL operator |
| `observability` | Prometheus/Grafana/Loki | Monitoring/logging |

---

## 2. Current State Assessment

### Already Deployed (Keep - Rename to Role-Based)

| Component | Current Namespace | New Namespace | New Name | Notes |
|-----------|-------------------|---------------|----------|-------|
| Langflow (Studio) | `agentstudio` | `studio` | studio | Flow builder IDE |
| Langflow (Runtime) | `agentruntime` | `runtime` | runtime | Agent execution |
| Ragflow | `ragflow` | `rag` | rag | RAG backend |
| Keycloak | `sso` | `sso` | sso | OIDC provider (no change) |
| Vault + ESO | `vault` | `vault` | vault | Secrets management (no change) |
| MinIO | `minio` | `storage` | storage | Object storage |
| Wagtail | `website` | `cmp` | cmp-cms | CMS - move to CMP |
| Prometheus/Grafana | `observability` | `observability` | - | Monitoring (no change) |
| Loki | `observability` | `observability` | - | Logging (no change) |
| CNPG Operator | `cnpg-system` | `db` | db | PostgreSQL (rename) |
| Traefik | `traefik` | `traefik` | - | Ingress (no change) |
| cert-manager | `cert-manager` | `cert-manager` | - | TLS (no change) |

### Deprecated (December 2025)

| Component | Namespace | Status | Replacement |
|-----------|-----------|--------|-------------|
| Waldur | `cmp` | **DEPRECATED** | Saleor (commerce) + Control Plane (resources) |
| Agent Registry | `cmp` | Absorbed | Control Plane |

### To Build (New)

| Component | Namespace | Priority |
|-----------|-----------|----------|
| Control Plane | `cmp` | P0 |
| Gateway | `cmp` | P0 |
| Web App (Next.js) | `cmp` | P0 |
| Commerce (Saleor) | `cmp` | P0 |
| Runner | `cmp` | P1 |
| Connector Gateway | `cmp` | P1 |
| Provisioner | `cmp` | P1 |

---

## 3. Final Repository Structures

### gsv-platform (Code + Docs)

```
gsv-platform/
├── services/
│   ├── control-plane/           # Django/DRF - Source of truth
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── manage.py
│   │   ├── control_plane/
│   │   │   ├── settings.py
│   │   │   ├── urls.py
│   │   │   ├── orgs/            # Org, Project, Team
│   │   │   ├── offerings/       # Offering, Version
│   │   │   ├── instances/       # Instance lifecycle
│   │   │   ├── billing/         # Wallet, Ledger, Credits
│   │   │   ├── connectors/      # Connector bindings
│   │   │   ├── integrations/    # Saleor webhooks
│   │   │   └── gitops/          # Git commit logic
│   │   └── README.md
│   │
│   ├── gateway/                 # FastAPI - Execution entry
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── main.py
│   │   ├── auth/                # OIDC/JWT validation
│   │   ├── billing/             # Credit authorize/settle
│   │   ├── routing/             # Route to Runner
│   │   └── README.md
│   │
│   ├── runner/                  # FastAPI - Langflow adapter
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── main.py
│   │   ├── artifacts/           # MinIO fetch, hash validation
│   │   ├── langflow/            # Runtime client
│   │   └── README.md
│   │
│   ├── connector-gateway/       # FastAPI - Tool execution
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── main.py
│   │   ├── vault/               # Secret retrieval
│   │   ├── tools/               # Tool execution
│   │   ├── mcp/                 # MCP server proxy
│   │   └── README.md
│   │
│   └── provisioner/             # FastAPI - Saleor webhooks
│       ├── Dockerfile
│       ├── requirements.txt
│       ├── main.py
│       ├── webhooks/            # Signature validation
│       ├── idempotency/         # Dedup store
│       └── README.md
│
├── apps/
│   └── web/                     # Next.js 14 - Unified frontend
│       ├── package.json
│       ├── next.config.js
│       ├── src/
│       │   ├── app/             # App router
│       │   │   ├── (marketing)/ # Landing, about, pricing
│       │   │   ├── (store)/     # Marketplace, agent details
│       │   │   ├── (workspace)/ # Dashboard, my agents
│       │   │   └── (checkout)/  # Cart, checkout (Saleor)
│       │   ├── components/      # Shared components
│       │   ├── lib/             # API clients, utils
│       │   └── styles/          # Tailwind, theme (purple)
│       └── README.md
│
├── packages/
│   ├── ui/                      # Shared UI components
│   ├── config/                  # Shared configuration
│   └── types/                   # Shared TypeScript types
│
├── docs/
│   └── cmp/    # Authoritative specs
│
├── .github/workflows/           # CI/CD workflows
├── package.json                 # Turborepo config
├── turbo.json
└── README.md
```

### gsv-gitops (Deployment)

```
gsv-gitops/
├── charts/                      # Vendored Helm charts
│   ├── saleor/                  # NEW - Commerce
│   ├── backstage/, cert-manager/, cnpg-operator/, ...
│
├── platform/
│   ├── base/
│   │   │
│   │   │ # CMP NAMESPACE (All CMP Services)
│   │   ├── cmp-web/             # NEW - Next.js frontend
│   │   ├── cmp-commerce/        # NEW - Saleor
│   │   ├── cmp-cms/             # Wagtail (moved from website)
│   │   ├── cmp-control-plane/   # NEW - Django/DRF
│   │   ├── cmp-gateway/         # NEW - FastAPI
│   │   ├── cmp-runner/          # NEW - FastAPI
│   │   ├── cmp-connector/       # NEW - FastAPI (Connector Gateway)
│   │   ├── cmp-provisioner/     # NEW - FastAPI
│   │   │
│   │   │ # ROLE-BASED NAMESPACES (Renamed from vendors)
│   │   ├── studio/              # Langflow IDE (was: agentstudio)
│   │   ├── runtime/             # Langflow Runtime (was: agentruntime)
│   │   ├── rag/                 # Ragflow (was: ragflow)
│   │   ├── sso/                 # Keycloak (unchanged)
│   │   ├── vault/               # Vault + ESO (unchanged)
│   │   ├── storage/             # MinIO (was: minio)
│   │   ├── db/                  # CNPG (was: cnpg-system)
│   │   ├── observability/       # Prometheus/Grafana/Loki (unchanged)
│   │   ├── backstage/           # Developer portal (unchanged)
│   │   │
│   │   │ # DEPRECATED (Archive) - Waldur replaced by Saleor + Control Plane
│   │   └── _deprecated/
│   │       ├── waldur/          # Deprecated (Dec 2025) - replaced by Saleor
│   │       ├── agent-registry/  # Old custom registry (absorbed into Control Plane)
│   │       └── website/         # Moved to cmp-cms (Wagtail)
│   │
│   ├── apps/dev/, qa/, prod/    # ArgoCD Applications
│   └── overlays/dev/, qa/, prod/
│
├── bom/                         # Bill of Materials
├── tools/e2e/, vendor/          # Testing and vendor tools
├── bootstrap/, clusters/, scripts/
├── Makefile
└── README.md
```

---

## 4. Namespace Layout

```
+-----------------------------------------------------------------------------+
|                         CMP NAMESPACE (cmp)                                  |
|                    All CMP Services - Single Namespace                       |
+-----------------------------------------------------------------------------+
|                                                                              |
|  PUBLIC-FACING (Stripe-like purple theme)                                   |
|  +-------------+  +-------------+  +-------------+                          |
|  |  cmp-web    |  |cmp-commerce |  |   cmp-cms   |                          |
|  |  (Next.js)  |  |  (Saleor)   |  |  (Wagtail)  |                          |
|  | Store UI    |  | Cart/       |  | Marketing   |                          |
|  | Workspace   |  | Checkout    |  | CMS/Docs    |                          |
|  +-------------+  +-------------+  +-------------+                          |
|                                                                              |
|  PLATFORM SERVICES                                                          |
|  +-----------------------------+  +-----------------------------+           |
|  |    cmp-control-plane        |  |      cmp-provisioner        |           |
|  |      (Django/DRF)           |  |        (FastAPI)            |           |
|  |  - Org/Project/Team         |  |  - Commerce webhook handler |           |
|  |  - Offering/Version         |  |  - Idempotency              |           |
|  |  - Instance lifecycle       |  |  - CP client                |           |
|  |  - Wallet/Ledger            |  |                             |           |
|  |  - GitOps commits           |  |                             |           |
|  +-----------------------------+  +-----------------------------+           |
|                                                                              |
|  EXECUTION PLANE                                                            |
|  +---------------+  +---------------+  +-------------------------------+    |
|  |  cmp-gateway  |->|  cmp-runner   |->|      cmp-connector            |    |
|  |   (FastAPI)   |  |   (FastAPI)   |  |        (FastAPI)              |    |
|  |  Auth/JWT     |  |  Artifact     |  |  Secrets retrieval            |    |
|  |  Credits      |  |  fetch        |  |  Tool execution               |    |
|  |  Routing      |  |  Studio call  |  |  MCP proxy                    |    |
|  +---------------+  +---------------+  +-------------------------------+    |
|                                                                              |
|  Ingress: store.dev.gsv.dev, shop.dev.gsv.dev, www.dev.gsv.dev,            |
|           api.dev.gsv.dev, cp.dev.gsv.dev                                   |
+-----------------------------------------------------------------------------+

+-----------------------------------------------------------------------------+
|                    SUPPORTING NAMESPACES (Role-Based)                        |
+-----------------------------------------------------------------------------+
|  studio (Langflow)     | Agent/flow builder (design-time IDE)               |
|  runtime (Langflow)    | Agent execution runtime                            |
|  rag (Ragflow)         | RAG backend                                        |
|  sso (Keycloak)        | Authentication/OIDC provider                       |
|  vault (Vault+ESO)     | Secrets management                                 |
|  storage (MinIO)       | Object storage for artifacts                       |
|  db (CNPG)             | PostgreSQL operator                                |
|  observability         | Prometheus, Grafana, Loki                          |
|  backstage             | Developer portal                                   |
|  traefik               | Ingress controller                                 |
|  cert-manager          | TLS certificate management                         |
+-----------------------------------------------------------------------------+
```

---

## 5. Implementation Phases

### Phase 0: Foundation (Week 1)

**Objective:** Prepare repositories and infrastructure

| Task | Owner | Status |
|------|-------|--------|
| Archive deprecated components (portal, agent-registry) | DevOps | **DONE** |
| Rename namespaces: agentstudio -> studio | DevOps | **DONE** |
| Rename namespaces: agentruntime -> runtime | DevOps | **DONE** |
| Rename namespaces: ragflow -> rag | DevOps | **DONE** |

| Rename namespaces: minio -> storage | DevOps | Pending |
| Rename namespaces: cnpg-system -> db | DevOps | Pending |
| Move website -> cmp namespace as cmp-cms | DevOps | **DONE** |
| Set up CNPG clusters for new services | DevOps | Pending |
| Create secrets paths for new services | DevOps | Pending |
| Set up CI workflows in gsv-platform | DevOps | **DONE** |
| Vendor Saleor chart | DevOps | Pending |
| Create BOM (versions.yaml) | DevOps | Pending |

### Phase 1: Control Plane MVP (Week 2-3)

**Objective:** Build source of truth

| Task | Owner | Status |
|------|-------|--------|
| Django project setup with DRF | Backend | Pending |
| Models: Organization, Project, Team | Backend | Pending |
| Models: Offering, OfferingVersion | Backend | Pending |
| Models: Instance, Wallet, LedgerEntry | Backend | Pending |
| API: `/orgs/auto` (auto-create workspace) | Backend | Pending |
| API: `/offerings`, `/offerings/{id}/versions` | Backend | Pending |
| API: `/instances`, `/instances/{id}` | Backend | Pending |
| API: `/wallets/{id}`, `/billing/authorize`, `/billing/settle` | Backend | Pending |
| Idempotency middleware | Backend | Pending |
| K8s manifests and deployment | DevOps | Pending |
| Integration tests | QA | Pending |

### Phase 2: Gateway + Runner (Week 3-4)

**Objective:** Enable agent execution

| Task | Owner | Status |
|------|-------|--------|
| Gateway: FastAPI project setup | Backend | Pending |
| Gateway: OIDC/JWT validation (SSO) | Backend | Pending |
| Gateway: Billing authorize/settle integration | Backend | Pending |
| Gateway: Rate limiting | Backend | Pending |
| Gateway: Route to Runner | Backend | Pending |
| Runner: FastAPI project setup | Backend | Pending |
| Runner: Storage artifact fetch | Backend | Pending |
| Runner: Studio runtime client | Backend | Pending |
| Runner: Timeout management | Backend | Pending |
| K8s manifests and deployments | DevOps | Pending |
| E2E tests: Run agent flow | QA | Pending |

### Phase 3: Commerce + Frontend (Week 4-5)

**Objective:** Enable buying flow

| Task | Owner | Status |
|------|-------|--------|
| Deploy Commerce (Saleor) in cmp namespace | DevOps | Pending |
| Configure Commerce products/variants for offerings | Backend | Pending |
| Provisioner: Commerce webhook handler | Backend | Pending |
| Provisioner: Idempotency store | Backend | Pending |
| Web App: Next.js 14 project setup | Frontend | Pending |
| Web App: Store/marketplace pages | Frontend | Pending |
| Web App: Agent detail page with demo | Frontend | Pending |
| Web App: Workspace/dashboard | Frontend | Pending |
| Web App: Commerce cart/checkout integration | Frontend | Pending |
| Apply purple theme (Stripe-like) | Frontend | Pending |
| K8s manifests and deployments | DevOps | Pending |

### Phase 4: Connector Gateway + Polish (Week 5-6)

**Objective:** Complete execution plane

| Task | Owner | Status |
|------|-------|--------|
| Connector: FastAPI project setup | Backend | Pending |
| Connector: Secrets retrieval | Backend | Pending |
| Connector: Tool execution | Backend | Pending |
| Connector: MCP server proxy | Backend | Pending |
| Connector: Audit logging | Backend | Pending |
| Control Plane: GitOps commit logic | Backend | Pending |
| Control Plane: Connector bindings API | Backend | Pending |
| Widget embed functionality | Frontend | Pending |
| API key management UI | Frontend | Pending |
| K8s manifests and deployments | DevOps | Pending |
| Full E2E test suite | QA | Pending |

### Phase 5: Launch Prep (Week 6-7)

**Objective:** Production readiness

| Task | Owner | Status |
|------|-------|--------|
| Load testing (k6) | QA | Pending |
| Security audit | Security | Pending |
| Documentation review | All | Pending |
| Monitoring dashboards | DevOps | Pending |
| Alerting rules | DevOps | Pending |
| Runbook updates | DevOps | Pending |
| Seed launch agents (1-2) | Product | Pending |
| UAT with stakeholders | QA | Pending |
| Go/No-Go decision | All | Pending |

---

## 6. Domain Mapping

| Service | Dev Domain | Prod Domain |
|---------|------------|-------------|
| Web App (Store) | `store.dev.gsv.dev` | `store.digitlify.com` |
| Commerce | `shop.dev.gsv.dev` | `shop.digitlify.com` |
| CMS (Website) | `www.dev.gsv.dev` | `www.digitlify.com` |
| Gateway (API) | `api.dev.gsv.dev` | `api.digitlify.com` |
| Control Plane | `cp.dev.gsv.dev` | `cp.digitlify.com` |
| SSO | `sso.dev.gsv.dev` | `sso.digitlify.com` |
| Studio | `studio.dev.gsv.dev` | `studio.digitlify.com` |
| Runtime | `runtime.dev.gsv.dev` | `runtime.digitlify.com` |
| RAG | `rag.dev.gsv.dev` | `rag.digitlify.com` |
| ArgoCD | `argocd.dev.gsv.dev` | (internal) |
| Grafana | `grafana.dev.gsv.dev` | (internal) |

---

## 7. Image Registry

All images published to GHCR under `ghcr.io/gsvdev/`:

| Service | Image |
|---------|-------|
| Control Plane | `ghcr.io/gsvdev/cmp-control-plane:TAG` |
| Gateway | `ghcr.io/gsvdev/cmp-gateway:TAG` |
| Runner | `ghcr.io/gsvdev/cmp-runner:TAG` |
| Connector | `ghcr.io/gsvdev/cmp-connector:TAG` |
| Provisioner | `ghcr.io/gsvdev/cmp-provisioner:TAG` |
| Web App | `ghcr.io/gsvdev/cmp-web:TAG` |

---

## 8. Dependencies Between Components

```
                    +-------------+
                    |  Commerce   |
                    |  (Saleor)   |
                    +------+------+
                           | ORDER_FULLY_PAID webhook
                           v
                    +-------------+
                    | Provisioner |
                    +------+------+
                           | POST /integrations/commerce/order-paid
                           v
+-------------+     +-------------+     +-------------+
|   Web App   |---->|Control Plane|---->|  Git Repo   |
|  (Next.js)  |     |(Django/DRF) |     | (gsv-gitops)|
+------+------+     +------+------+     +------+------+
       |                   |                   |
       |                   |                   v
       |                   |            +-------------+
       |                   |            |   ArgoCD    |
       |                   |            +------+------+
       |                   |                   |
       | POST /v1/runs     |                   v
       v                   v            +-------------+
+-------------+     +-------------+     |  K8s Apply  |
|   Gateway   |---->|   Runner    |     +-------------+
+------+------+     +------+------+
       |                   |
       |                   v
       |            +-------------+     +-------------+
       |            |   Studio    |---->|  Connector  |
       |            |  (Langflow) |     |   Gateway   |
       |            +-------------+     +------+------+
       |                                       |
       |                                       v
       |                                +-------------+
       +------------------------------->|    Vault    |
         (authorize/settle via CP)      |   (Vault)   |
                                        +-------------+
```

---

## 9. Success Criteria

### MVP Launch Criteria

- [ ] User can browse agent marketplace without login
- [ ] User can try agent with demo credits (5 free messages)
- [ ] User can sign up via SSO (Keycloak OIDC)
- [ ] User gets auto-created workspace with starter credits
- [ ] User can subscribe to agent (one-click)
- [ ] User receives API key instantly
- [ ] User can make API calls to agent
- [ ] User can see usage and credit balance
- [ ] Credits are debited per usage
- [ ] 1-2 launch agents available

### Performance Targets

| Metric | Target |
|--------|--------|
| Time-to-first-value | < 3 minutes |
| Agent response p95 | < 1500ms |
| Checkout completion | < 30 seconds |
| Uptime | 99.5% |

---

## 10. Open Questions

1. **Credit amounts** - How many starter credits? What is the free tier monthly allowance?
2. **Launch agents** - Which 1-2 agents for launch? Customer Support? Knowledge Base?
3. **Pricing tiers** - Confirm: Free ($0), Plus ($19.9), Pro ($99.9)?
4. **Commerce** - Use Saleor or build simpler checkout?
5. **Domain ownership** - Confirm domain names for prod (digitlify.com)?

---

## 11. Next Steps

1. **Review this plan** - Confirm architecture and phases
2. **Assign owners** - Backend, Frontend, DevOps, QA
3. **Start Phase 0** - Archive deprecated, rename namespaces
4. **Begin Control Plane** - Core models and APIs

---

*Last Updated: 2025-12-18*
