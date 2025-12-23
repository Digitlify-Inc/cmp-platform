# CMP GTM Master Document

**Document Version:** 2.0
**Created:** December 15, 2025
**Last Updated:** December 15, 2025
**Status:** ACTIVE - Single Source of Truth
**Goal:** Production-ready CMP with agents, apps, assistants, automations by end of week

---

## Table of Contents

0. [Infrastructure Tasks](#0-infrastructure-tasks)
1. [Executive Summary](#1-executive-summary)
2. [Tech Stack & Components](#2-tech-stack--components)
3. [Architecture Overview](#3-architecture-overview)
4. [Product Categories](#4-product-categories)
5. [E2E Journey Maps](#5-e2e-journey-maps)
6. [Menu Structure & Screens](#6-menu-structure--screens)
7. [Integration Points](#7-integration-points)
8. [Critical Gaps & Status](#8-critical-gaps--status)
9. [Sample Content for GTM](#9-sample-content-for-gtm)
10. [Implementation Tasks](#10-implementation-tasks)
11. [API Reference](#11-api-reference)
12. [Session Log](#12-session-log)

---

## 0. Infrastructure Tasks

### 0.1 RAGFlow Deployment

**Status:** NEEDS DEPLOYMENT - P0 CRITICAL

RAGFlow is required for document processing, chunking, embeddings, and retrieval. The `ragflow_client.py` in cmp-backend expects RAGFlow to be running.

**Deployment Options:**

| Option | Effort | Recommendation |
|--------|--------|----------------|
| Docker Compose (dev) | Low | For local development |
| Kubernetes (prod) | Medium | For production |
| Managed Service | N/A | Not available |

**Required Configuration:**
```yaml
# Environment variables for cmp-backend
RAGFLOW_API_KEY: "<api-key>"
RAGFLOW_BASE_URL: "http://ragflow.cmp.svc.cluster.local:9380"
```

**GitOps Task - Create RAGFlow Application:**
```
Location: gsv-gitops/platform/
Files to create:
  - platform/base/ragflow/kustomization.yaml
  - platform/base/ragflow/namespace.yaml
  - platform/base/ragflow/deployment.yaml
  - platform/base/ragflow/service.yaml
  - platform/base/ragflow/configmap.yaml
  - platform/base/ragflow/pvc.yaml (for Elasticsearch/MinIO data)
  - platform/apps/dev/ragflow.yaml (ArgoCD Application)

Add to kustomization.yaml:
  - ragflow.yaml
```

**RAGFlow K8s Deployment Template:**
```yaml
# platform/base/ragflow/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ragflow
  namespace: ragflow
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ragflow
  template:
    metadata:
      labels:
        app: ragflow
    spec:
      containers:
      - name: ragflow
        image: infiniflow/ragflow:v0.14.1
        ports:
        - containerPort: 9380
        - containerPort: 80
        env:
        - name: RAGFLOW_API_KEY
          valueFrom:
            secretKeyRef:
              name: ragflow-secrets
              key: api-key
        volumeMounts:
        - name: ragflow-data
          mountPath: /ragflow/data
      volumes:
      - name: ragflow-data
        persistentVolumeClaim:
          claimName: ragflow-data-pvc
```

**Docker Compose (for local dev):**
```yaml
# docker-compose.ragflow.yaml
version: '3.8'
services:
  ragflow:
    image: infiniflow/ragflow:v0.14.1
    container_name: ragflow
    ports:
      - "9380:9380"
      - "8080:80"
    environment:
      - RAGFLOW_API_KEY=${RAGFLOW_API_KEY:-ragflow-dev-key}
    volumes:
      - ragflow_data:/ragflow/data
    restart: unless-stopped

volumes:
  ragflow_data:
```

### 0.2 ARC (Actions Runner Controller) Removal

**Status:** TO BE REMOVED - Cleanup Task

ARC files exist but are NOT in the active kustomization.yaml. These should be cleaned up to avoid confusion.

**Files to Remove:**
```
gsv-gitops/platform/apps/dev/arc-base.yaml
gsv-gitops/platform/apps/dev/arc-controller.yaml
gsv-gitops/platform/apps/dev/arc-runners-digitlify.yaml
gsv-gitops/platform/apps/dev/arc-runners-gsvdev.yaml
gsv-gitops/platform/base/arc-runners/ (entire directory)
```

**Reason:** GitHub Actions self-hosted runners are not needed for GTM. Using GitHub-hosted runners is sufficient. Can be re-added post-launch if required for cost optimization.

**GitOps Cleanup Task:**
```bash
cd /workspace/repo/github.com/GSVDEV/gsv-gitops

# Remove ARC files
rm -f platform/apps/dev/arc-*.yaml
rm -rf platform/base/arc-runners/

# Commit and push
git add -A
git commit -m "chore: Remove ARC (GitHub Actions Runner Controller) - not needed for GTM"
git push origin main
```

### 0.3 Infrastructure Status Matrix

| Component | GitOps File | Deployed | Running | Required for GTM |
|-----------|-------------|----------|---------|------------------|
| CMP (Waldur) | cmp.yaml | YES | YES | **YES** |
| CMP Foundation | cmp-foundation.yaml | YES | YES | **YES** |
| AgentStudio (Langflow) | agentstudio.yaml | YES | YES | **YES** |
| AgentRuntime (Langflow) | agentruntime.yaml | YES | YES | **YES** |
| Keycloak SSO | sso.yaml | YES | YES | **YES** |
| SSO Operator | sso-operator.yaml | YES | YES | **YES** |
| PostgreSQL (CNPG) | cnpg-*.yaml | YES | YES | **YES** |
| **RAGFlow** | **NOT EXISTS** | **NO** | **NO** | **YES - CREATE** |
| Vault | vault.yaml | YES | YES | YES (secrets) |
| External Secrets | external-secrets.yaml | YES | YES | YES |
| Prometheus Stack | prometheus-stack.yaml | YES | YES | YES (monitoring) |
| Loki Stack | loki-stack.yaml | YES | YES | YES (logging) |
| Backstage | backstage.yaml | YES | YES | No (nice-to-have) |
| Website | website.yaml | YES | YES | No (nice-to-have) |
| ARC | arc-*.yaml | NO | NO | **NO - REMOVE FILES** |
| Crossplane | crossplane.yaml | YES | YES | No |
| Kyverno | kyverno.yaml | YES | YES | No |

### 0.4 Infrastructure Action Items

| Priority | Task | Effort | Status |
|----------|------|--------|--------|
| **P0** | Deploy RAGFlow to Kubernetes | 4 hours | NOT STARTED |
| **P0** | Configure RAGFlow secrets in Vault | 1 hour | NOT STARTED |
| **P0** | Update cmp-backend env with RAGFlow URL | 30 min | NOT STARTED |
| **P2** | Remove ARC files from gsv-gitops | 15 min | NOT STARTED |
| **P2** | Clean up unused ArgoCD apps | 30 min | NOT STARTED |

---

## 1. Executive Summary

### What We're Building

A **Cloud Marketplace Platform (CMP)** where:
- **Sellers** (Providers) create AI agents/apps in Studio, publish to marketplace, earn revenue
- **Buyers** (Customers) browse marketplace, subscribe to agents/apps, configure and deploy them
- **Operators** manage the marketplace, billing, and infrastructure

### Architecture Decision: Site Kit

All functionality consolidated into **Waldur CMP**:
- `cmp-frontend` - Waldur UI + Site Kit buyer/seller features
- `cmp-backend` - Waldur API + `marketplace_site_agent` + `marketplace_ai` modules
- `cmp-studio` - Langflow for flow development
- `cmp-runtime` - Langflow for flow execution
- **RAGFlow** - Document processing and RAG retrieval

### GTM Readiness Score

| Component | Status | Score | Blocking? |
|-----------|--------|-------|-----------|
| CMP Frontend (UI) | COMPLETE | 95% | No |
| CMP Backend (API) | COMPLETE | 95% | No |
| Studio (Langflow) | OPERATIONAL | 90% | No |
| Runtime (Langflow) | OPERATIONAL | 90% | No |
| RAGFlow Client Code | COMPLETE | 100% | No |
| **RAGFlow Deployment** | **NOT DEPLOYED** | **0%** | **YES** |
| **Studio → CMP Flow Import** | **MISSING** | **0%** | **YES** |
| **CMP → Runtime Provisioning** | **MISSING** | **0%** | **YES** |
| **Runtime → CMP Auth** | **MISSING** | **0%** | **YES** |
| **Runtime → CMP Usage** | **MISSING** | **0%** | **YES** |
| **Stripe Payments** | **MISSING** | **0%** | **YES** |
| **Widget JS** | **MISSING** | **0%** | **YES** |
| Sample Agents/Apps | PARTIAL | 30% | YES |
| **OVERALL** | **~45%** | - | - |

---

## 2. Tech Stack & Components

### Core Platform

| Component | Technology | Repository | Status |
|-----------|------------|------------|--------|
| **CMP Frontend** | React 18 + TypeScript + Vite | `Digitlify-Inc/cmp-frontend` | ACTIVE |
| **CMP Backend** | Django 4.2 + DRF + Celery | `Digitlify-Inc/cmp-backend` | ACTIVE |
| **CMP Studio** | Langflow (forked) | `Digitlify-Inc/cmp-studio` | ACTIVE |
| **CMP Runtime** | Langflow (forked) | `Digitlify-Inc/cmp-runtime` | ACTIVE |
| **SSO** | Keycloak 22+ | `Digitlify-Inc/sso-theme` | ACTIVE |
| **Website** | Wagtail CMS | `Digitlify-Inc/cmp-website` | ACTIVE |
| **GitOps** | ArgoCD + Kustomize | `GSVDEV/gsv-gitops` | ACTIVE |

### AI/ML Stack

| Component | Technology | Purpose | Status |
|-----------|------------|---------|--------|
| **RAGFlow** | RAGFlow v0.14.1 | Document processing, chunking, retrieval | **NEEDS DEPLOYMENT** |
| **Vector Store** | RAGFlow internal (Elasticsearch + Infinity) | Embeddings storage | Via RAGFlow |
| **Embeddings** | OpenAI text-embedding-3-small | Document embeddings | CONFIGURED |
| **LLM** | OpenAI GPT-4o / Claude | Agent responses | CONFIGURED |

### Infrastructure

| Component | Technology | Purpose | GitOps |
|-----------|------------|---------|--------|
| **Database** | PostgreSQL 15 (CNPG) | Primary data store | cnpg-*.yaml |
| **Cache** | Redis | Celery broker, caching | Built into apps |
| **Storage** | MinIO / S3 | File storage | Part of backup-dr |
| **Orchestration** | Kubernetes | Container orchestration | N/A |
| **GitOps** | ArgoCD | Deployment automation | bootstrap/ |
| **Secrets** | Vault + External Secrets | Secret management | vault.yaml |
| **Monitoring** | Prometheus + Grafana | Observability | prometheus-stack.yaml |
| **Logging** | Loki + Promtail | Log aggregation | loki-stack.yaml |

### Key Backend Modules

| Module | Location | Purpose |
|--------|----------|---------|
| `marketplace` | `waldur_mastermind/marketplace/` | Core marketplace (offerings, orders, resources) |
| `marketplace_site_agent` | `waldur_mastermind/marketplace_site_agent/` | Site Kit (buyer config, API keys, widget) |
| `marketplace_ai` | `waldur_mastermind/marketplace_ai/` | RAG + Workflows (knowledge bases, documents) |

### Key Frontend Modules

| Module | Location | Purpose |
|--------|----------|---------|
| `marketplace` | `src/marketplace/` | Marketplace UI (browse, order, manage) |
| `customer/agents` | `src/customer/agents/` | Buyer agent management |
| `service-providers/agents` | `src/marketplace/service-providers/agents/` | Seller agent management |
| `marketplace-ai` | `src/marketplace-ai/` | Knowledge bases, workflows UI |

---

## 3. Architecture Overview

### Domain Structure

| Domain | Component | Purpose |
|--------|-----------|---------|
| `app.digitlify.com` | CMP Frontend + Backend | Main platform |
| `studio.digitlify.com` | CMP Studio | Agent development |
| `runtime.digitlify.com` | CMP Runtime | Agent execution |
| `sso.digitlify.com` | Keycloak | Authentication |
| `ragflow.digitlify.com` | RAGFlow | RAG backend |
| `www.digitlify.com` | Website | Marketing |

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SELLER FLOW                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐           │
│  │   CMP-STUDIO     │    │       CMP        │    │   CMP-RUNTIME    │           │
│  │   (Langflow)     │    │  (Waldur+SiteKit)│    │   (Langflow)     │           │
│  │                  │    │                  │    │                  │           │
│  │  Build flows     │───►│  Import flow     │───►│  Deploy agent    │           │
│  │  Test locally    │    │  Create offering │    │  Execute calls   │           │
│  │  Export JSON     │    │  Set pricing     │    │  Track usage     │           │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘           │
│         │                        │                       │                       │
│         │ 1. Export              │ 2. Provision          │ 3. Execute            │
│         ▼                        ▼                       ▼                       │
│  ┌──────────────────────────────────────────────────────────────────────┐       │
│  │                     INTEGRATION LAYER                                 │       │
│  │  POST /api/flows/import/     POST /api/runtime/deploy/               │       │
│  │  [GAP 1: MISSING]            [GAP 2: MISSING]                        │       │
│  └──────────────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BUYER FLOW                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐           │
│  │  MARKETPLACE     │    │    CONFIGURE     │    │     DEPLOY       │           │
│  │                  │    │                  │    │                  │           │
│  │  Browse agents   │───►│  Persona/brand   │───►│  Widget embed    │           │
│  │  Compare plans   │    │  Training docs   │    │  API keys        │           │
│  │  Checkout        │    │  API keys        │    │  Chat/use        │           │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘           │
│         │                        │                       │                       │
│         │ Waldur                 │ Site Kit              │ Widget + Runtime      │
│         │ [DONE]                 │ [DONE]                │ [GAP 6: MISSING]      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RAG FLOW                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐           │
│  │   UPLOAD DOCS    │    │   RAGFLOW        │    │   RUNTIME        │           │
│  │                  │    │                  │    │                  │           │
│  │  PDF, DOCX, etc  │───►│  Chunk + Embed   │───►│  Retrieve        │           │
│  │  Via CMP UI      │    │  Store vectors   │    │  Augment prompt  │           │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘           │
│         │                        │                       │                       │
│         │ marketplace_ai        │ ragflow_client        │ langflow_client       │
│         │ [DONE]                │ [CLIENT DONE]         │ [DONE]                │
│         │                        │ [DEPLOY NEEDED]       │                       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Product Categories

### Four Product Types

| Category | Icon | Description | Examples |
|----------|------|-------------|----------|
| **Agents** | Robot | AI agents for automation and assistance | Customer Support Agent, Code Review Agent |
| **Apps** | Grid | Applications and integrations | Slack Integration, Analytics Dashboard |
| **Assistants** | Message | Conversational AI assistants | General Knowledge, Domain Expert |
| **Automations** | Zap | Workflow automation tools | Email Responder, Data Sync |

### Capability-Based Configuration

Each product has capabilities that drive the UI:

| Capability | Config Options | Applies To |
|------------|----------------|------------|
| **Chat Interface** | Widget position, theme, greeting | Agents, Assistants |
| **API Access** | API keys, rate limits, quotas | All |
| **Knowledge Base** | Documents, Q&A pairs, URLs | Agents, Assistants |
| **Persona** | Tone, avatar, name, behavior | Agents, Assistants |
| **Branding** | Colors, logo, welcome message | All |
| **Integrations** | Webhooks, external services | Apps, Automations |
| **Scheduling** | Cron, interval, triggers | Automations |

### Pricing Models

| Model | Description | Use Case |
|-------|-------------|----------|
| **Subscription** | Fixed monthly fee | Basic access |
| **Usage-Based** | Per API call / token | High-volume users |
| **Tiered** | Multiple plans (Starter, Pro, Enterprise) | All products |
| **Bundle** | Multiple products together | Cross-sell |

---

## 5. E2E Journey Maps

### 5.1 Buyer Journey: Browse → Buy → Configure → Use

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         BUYER JOURNEY                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  PHASE 1: DISCOVER                                                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │  Landing │───►│  Browse  │───►│  Search  │───►│  Filter  │                   │
│  │  Page    │    │ Category │    │  Agents  │    │ by Type  │                   │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                   │
│       │               │               │               │                          │
│   /marketplace/   /marketplace-   /marketplace/   /marketplace/                 │
│                   category/:uuid  ?search=        ?category=                    │
│                                                                                  │
│  PHASE 2: EVALUATE                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │  Agent   │───►│  Compare │───►│  Read    │───►│  Try     │                   │
│  │  Details │    │  Plans   │    │  Reviews │    │  Demo    │                   │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                   │
│       │                                                                          │
│   /marketplace-public-offering/:uuid/                                           │
│                                                                                  │
│  PHASE 3: PURCHASE                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │  Select  │───►│  Login/  │───►│  Payment │───►│  Order   │                   │
│  │  Plan    │    │  Register│    │  (Stripe)│    │  Confirm │                   │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                   │
│       │               │               │               │                          │
│   /resource/:uuid/  /login/      [GAP 5]       /marketplace-order/             │
│   deploy/                                                                        │
│                                                                                  │
│  PHASE 4: CONFIGURE                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │  My      │───►│  Agent   │───►│  Train   │───►│  Brand   │                   │
│  │  Agents  │    │  Persona │    │  (Docs)  │    │  (Colors)│                   │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                   │
│       │               │               │               │                          │
│   /organizations/  /.../:uuid/    /.../:uuid/    /.../:uuid/                   │
│   :uuid/agents/    configure/     training/      branding/                      │
│                                                                                  │
│  PHASE 5: DEPLOY                                                                │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │  API     │───►│  Widget  │───►│  Test    │───►│  Go      │                   │
│  │  Keys    │    │  Embed   │    │  Chat    │    │  Live    │                   │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                   │
│       │               │               │                                          │
│   /.../:uuid/     /.../:uuid/    [GAP 6]                                        │
│   keys/           widget/                                                        │
│                                                                                  │
│  PHASE 6: MANAGE                                                                │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │  Usage   │───►│  Billing │───►│  Upgrade │───►│  Cancel  │                   │
│  │  Stats   │    │  History │    │  Plan    │    │  Sub     │                   │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                   │
│       │               │                                                          │
│   /.../:uuid/     /organizations/:uuid/billing/                                 │
│   usage/                                                                         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Seller Journey: Build → Publish → Sell → Earn

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         SELLER JOURNEY                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  PHASE 1: BUILD (in Studio)                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │  Login   │───►│  Create  │───►│  Add     │───►│  Test    │                   │
│  │  Studio  │    │  Flow    │    │  RAG     │    │  Flow    │                   │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                   │
│       │                                               │                          │
│   studio.digitlify.com                           Export JSON                    │
│                                                                                  │
│  PHASE 2: PUBLISH (in CMP)                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │  Export  │───►│  Import  │───►│  Create  │───►│  Set     │                   │
│  │  Flow    │    │  to CMP  │    │  Offering│    │  Pricing │                   │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                   │
│                       │                                                          │
│                  [GAP 1]                                                         │
│                  /providers/:uuid/agents/create/                                │
│                                                                                  │
│  PHASE 3: CONFIGURE                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │  Add     │───►│  Upload  │───►│  Set     │───►│  Publish │                   │
│  │  Details │    │  Assets  │    │  Plans   │    │  Listing │                   │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                   │
│       │                                               │                          │
│   /providers/:uuid/offerings/:uuid/              /.../:uuid/publish/            │
│                                                                                  │
│  PHASE 4: MONITOR                                                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │  View    │───►│  Customer│───►│  Usage   │───►│  Revenue │                   │
│  │  Orders  │    │  List    │    │  Stats   │    │  Reports │                   │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                   │
│       │               │               │               │                          │
│   /providers/     /providers/     /providers/     /providers/                   │
│   :uuid/orders/   :uuid/          :uuid/agents/   :uuid/revenue/               │
│                   organizations/  :uuid/analytics/                              │
│                                                                                  │
│  PHASE 5: EARN                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                                   │
│  │  Payout  │───►│  Tax     │───►│  Reports │                                   │
│  │  Setup   │    │  Forms   │    │  Download│                                   │
│  └──────────┘    └──────────┘    └──────────┘                                   │
│       │                                                                          │
│   [GAP 5 - Stripe Connect]                                                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Operator Journey: Configure → Monitor → Support

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         OPERATOR JOURNEY                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  DAILY OPERATIONS                                                                │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │  Review  │───►│  Approve │───►│  Monitor │───►│  Handle  │                   │
│  │  Orders  │    │  Listings│    │  Health  │    │  Support │                   │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                   │
│       │               │               │               │                          │
│   Django Admin    Django Admin   Grafana         Support Desk                   │
│   /admin/         /admin/        /grafana/                                      │
│                                                                                  │
│  CONFIGURATION                                                                   │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │  Manage  │───►│  Set     │───►│  Config  │───►│  Manage  │                   │
│  │  Users   │    │  Pricing │    │  Billing │    │  Payouts │                   │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                   │
│       │               │               │               │                          │
│   Waldur Admin    Django Admin    Stripe         Stripe                         │
│                                   Dashboard      Dashboard                       │
│                                                                                  │
│  MONITORING                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │  System  │───►│  Usage   │───►│  Revenue │───►│  Alerts  │                   │
│  │  Health  │    │  Metrics │    │  Reports │    │  & Logs  │                   │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                   │
│       │               │               │               │                          │
│   Grafana         Grafana         Stripe          Alertmanager                  │
│                                   Dashboard       + PagerDuty                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Menu Structure & Screens

### 6.1 Buyer (Customer) Menu

```
Organization Dashboard
│
├── [Home] Dashboard
│   └── Overview, quick stats, recent activity
│   └── Route: /organizations/:uuid/
│
├── [Store] Marketplace
│   ├── Browse All     → /marketplace/
│   ├── Agents         → /marketplace/?category=agents
│   ├── Apps           → /marketplace/?category=apps
│   ├── Assistants     → /marketplace/?category=assistants
│   └── Automations    → /marketplace/?category=automations
│
├── [Robot] My Agents                    ← Main buyer section
│   ├── List of subscribed agents        → /organizations/:uuid/agents/
│   └── [Agent Name]
│       ├── Overview                     → /organizations/:uuid/agents/:uuid/
│       ├── Configure
│       │   ├── Persona                  → /organizations/:uuid/agents/:uuid/persona/
│       │   ├── Training                 → /organizations/:uuid/agents/:uuid/training/
│       │   └── Branding                 → /organizations/:uuid/agents/:uuid/branding/
│       ├── API Keys                     → /organizations/:uuid/agents/:uuid/keys/
│       ├── Widget                       → /organizations/:uuid/agents/:uuid/widget/
│       └── Usage                        → /organizations/:uuid/agents/:uuid/usage/
│
├── [Credit Card] Subscriptions          → /organizations/:uuid/resources/
│   ├── Active subscriptions
│   ├── Billing history
│   └── Payment methods
│
├── [Receipt] Orders                     → /organizations/:uuid/orders/
│
├── [Users] Team                         → /organizations/:uuid/team/
│
└── [Settings] Settings                  → /organizations/:uuid/settings/
```

### 6.2 Seller (Provider) Menu

```
Provider Dashboard
│
├── [Home] Dashboard                     → /providers/:uuid/dashboard/
│
├── [Package] My Offerings               → /providers/:uuid/offerings/
│   └── [Offering Name]
│       ├── Overview                     → /providers/:uuid/offerings/:uuid/
│       ├── Plans                        → /providers/:uuid/offerings/:uuid/plans/
│       └── Analytics                    → /providers/:uuid/offerings/:uuid/analytics/
│
├── [Robot] My Agents                    → /providers/:uuid/agents/
│   ├── Create Agent                     → /providers/:uuid/agents/create/  [GAP 1]
│   └── [Agent Name]
│       ├── Details                      → /providers/:uuid/agents/:uuid/
│       ├── Versions                     → /providers/:uuid/agents/:uuid/versions/
│       ├── Analytics                    → /providers/:uuid/agents/:uuid/analytics/
│       └── Publish/Unpublish            → POST .../publish/ or .../unpublish/
│
├── [Receipt] Orders                     → /providers/:uuid/orders/
│
├── [Users] Customers                    → /providers/:uuid/organizations/
│
├── [Chart] Revenue                      → /providers/:uuid/revenue/  [GAP 5]
│
└── [Settings] Settings                  → /providers/:uuid/settings/
```

### 6.3 Key Screens Status

| Screen | Route | Status | Gap? |
|--------|-------|--------|------|
| Marketplace Landing | `/marketplace/` | DONE | No |
| Category View | `/marketplace-category/:uuid/` | DONE | No |
| Offering Detail | `/marketplace-public-offering/:uuid/` | DONE | No |
| Checkout | `/resource/:uuid/deploy/` | PARTIAL | GAP-5 (Stripe) |
| My Agents List | `/organizations/:uuid/agents/` | DONE | No |
| Agent Config | `/organizations/:uuid/agents/:uuid/configure/` | DONE | No |
| Agent API Keys | `/organizations/:uuid/agents/:uuid/keys/` | DONE | No |
| Agent Widget | `/organizations/:uuid/agents/:uuid/widget/` | DONE | GAP-6 (Widget JS) |
| Provider Dashboard | `/providers/:uuid/dashboard/` | DONE | No |
| Provider Agents | `/providers/:uuid/agents/` | DONE | No |
| Create Agent | `/providers/:uuid/agents/create/` | PARTIAL | GAP-1 (Flow Import) |
| Agent Analytics | `/providers/:uuid/agents/:uuid/analytics/` | DONE | No |

---

## 7. Integration Points

### 7.1 Integration Matrix

| Source | Target | API | Status |
|--------|--------|-----|--------|
| Studio | CMP | `POST /api/flows/import/` | **GAP-1: MISSING** |
| CMP | Runtime | `POST /api/v1/deploy/` | **GAP-2: MISSING** |
| Runtime | CMP | `POST /api/runtime/auth/` | **GAP-3: MISSING** |
| Runtime | CMP | `POST /api/runtime/usage/` | **GAP-4: MISSING** |
| CMP | Stripe | Stripe SDK | **GAP-5: MISSING** |
| Widget | Runtime | HTTP + WebSocket | **GAP-6: MISSING** |
| CMP | RAGFlow | `ragflow_client.py` | DONE |
| CMP | Langflow | `langflow_client.py` | DONE |
| CMP | Keycloak | OIDC | DONE |

### 7.2 Existing Integrations

| Integration | Client | Location | Status |
|-------------|--------|----------|--------|
| RAGFlow | `RAGFlowClient` | `marketplace_ai/ragflow_client.py` | DONE |
| Langflow | `LangflowClient` | `marketplace_ai/langflow_client.py` | DONE |
| Keycloak SSO | Waldur OIDC | Built-in | DONE |
| Waldur Marketplace | Native | Built-in | DONE |
| Waldur Billing | Native | Built-in | DONE |

---

## 8. Critical Gaps & Status

### 8.1 Gap Summary

| Gap # | Name | Severity | Status | Effort | Dependencies |
|-------|------|----------|--------|--------|--------------|
| **GAP-0** | RAGFlow Deployment | P0 | **DONE** | 4 hrs | None |
| **GAP-1** | Flow Import API | P0 | **DONE** | 2-3 days | None |
| **GAP-2** | Runtime Provisioning | P0 | **DONE** | 3-4 days | GAP-1 |
| **GAP-3** | Runtime Auth API | P0 | **DONE** | 1-2 days | None |
| **GAP-4** | Usage Ingest API | P0 | **DONE** | 1-2 days | GAP-3 |
| **GAP-5** | Stripe Integration | P0 | **DONE** | 5-7 days | None |
| **GAP-6** | Widget JS Bundle | P0 | **DONE** | 5-7 days | GAP-3 |
| **GAP-7** | Sample Agent Flows | P1 | IN PROGRESS | 2-3 days | GAP-1 |
| **INFRA** | Remove ARC Files | P2 | **DONE** | 15 min | None |

### 8.2 Gap Details

#### GAP-0: RAGFlow Deployment (INFRASTRUCTURE)

**Problem:** RAGFlow is not deployed. The `ragflow_client.py` exists but has no server to connect to.

**Solution:** Deploy RAGFlow to Kubernetes via ArgoCD.

**Files to create in gsv-gitops:**
```
platform/base/ragflow/
├── kustomization.yaml
├── namespace.yaml
├── deployment.yaml
├── service.yaml
├── configmap.yaml
├── secret.yaml (ExternalSecret)
└── pvc.yaml

platform/apps/dev/ragflow.yaml (ArgoCD Application)
```

---

#### GAP-1: Studio → CMP Flow Import API

**Problem:** Sellers cannot publish flows from Studio to CMP.

**Implementation:**
```python
# POST /api/flows/import/
{
    "flow_json": {...},
    "name": "Customer Support",
    "description": "...",
    "category": "agents",
    "provider_uuid": "..."
}
# Response: {"offering_uuid": "...", "agent_uuid": "...", "status": "created"}
```

**Files to modify:**
- `marketplace_site_agent/views.py` - Add `FlowImportView`
- `marketplace_site_agent/serializers.py` - Add `FlowImportSerializer`
- `marketplace_site_agent/urls.py` - Register endpoint

---

#### GAP-2: CMP → Runtime Provisioning

**Problem:** When buyer purchases agent, nothing gets deployed.

**Implementation:**
```python
# marketplace_site_agent/handlers.py
@receiver(post_save, sender=marketplace_models.Resource)
def provision_agent_on_purchase(sender, instance, created, **kwargs):
    if created and is_agent_resource(instance):
        # 1. Get AgentIdentity for offering
        # 2. Create CustomerAgentConfig
        # 3. Call Runtime API to deploy
        # 4. Store runtime_endpoint
```

---

#### GAP-3: Runtime → CMP Authentication

**Problem:** Runtime cannot validate API keys from widget/API calls.

**Implementation:**
```python
# POST /api/runtime/auth/
{"api_key": "ar_sk_live_..."}
# Response: {"valid": true, "config_uuid": "...", "config": {...}}
```

---

#### GAP-4: Runtime → CMP Usage Ingestion

**Problem:** Usage metrics not tracked for billing.

**Implementation:**
```python
# POST /api/runtime/usage/
{"config_uuid": "...", "api_calls": 1, "tokens_input": 150, "tokens_output": 300}
# Response: {"status": "recorded"}
```

---

#### GAP-5: Stripe Payment Gateway

**Problem:** Cannot collect payments from buyers.

**Implementation:**
- Stripe Checkout session creation
- Webhook handlers for payment events
- Subscription management
- Metered billing for usage

---

#### GAP-6: Widget JS Bundle

**Problem:** Buyers cannot embed chat widget.

**Implementation:**
- React chat component
- Build as standalone JS bundle (`gsv-widget.js`)
- Cross-domain support (CORS)
- Theme customization

---

## 9. Sample Content for GTM

### 9.1 Required Products (Minimum Viable)

| Category | Product | Description | Flow Status | Listing Status |
|----------|---------|-------------|-------------|----------------|
| **Agents** | Customer Support Agent | FAQs, troubleshooting | NOT CREATED | NOT LISTED |
| **Agents** | Code Review Agent | PR reviews | NOT CREATED | NOT LISTED |
| **Apps** | Slack Integration | Connect to Slack | NOT CREATED | NOT LISTED |
| **Assistants** | General Knowledge | Claude Q&A | NOT CREATED | NOT LISTED |
| **Automations** | Email Responder | Auto-reply | NOT CREATED | NOT LISTED |

### 9.2 Categories to Create

```json
{
  "categories": [
    {"name": "Agents", "slug": "agents", "icon": "robot", "color": "#3B82F6"},
    {"name": "Apps", "slug": "apps", "icon": "grid", "color": "#10B981"},
    {"name": "Assistants", "slug": "assistants", "icon": "message-circle", "color": "#8B5CF6"},
    {"name": "Automations", "slug": "automations", "icon": "zap", "color": "#F59E0B"}
  ]
}
```

### 9.3 Pricing Template

```json
{
  "plans": [
    {"name": "Starter", "price_cents": 2900, "monthly_quota": 1000},
    {"name": "Professional", "price_cents": 9900, "monthly_quota": 10000},
    {"name": "Enterprise", "price_cents": 29900, "monthly_quota": 100000}
  ]
}
```

---

## 10. Implementation Tasks

### 10.1 This Week's Sprint

| Day | Task | Owner | Deliverable | Status |
|-----|------|-------|-------------|--------|
| **Mon** | GAP-0: Deploy RAGFlow | Infra | RAGFlow running in K8s | NOT STARTED |
| **Mon** | GAP-1: Flow Import API | Backend | `POST /api/flows/import/` | NOT STARTED |
| **Mon** | GAP-3: Runtime Auth API | Backend | `POST /api/runtime/auth/` | NOT STARTED |
| **Tue** | GAP-4: Usage Ingest API | Backend | `POST /api/runtime/usage/` | NOT STARTED |
| **Tue** | GAP-2: Provision Handler | Backend | Signal on Resource | NOT STARTED |
| **Wed** | GAP-5: Stripe Checkout | Backend | Checkout + webhooks | NOT STARTED |
| **Wed** | Create sample flows | Content | 2 agent flows | NOT STARTED |
| **Thu** | GAP-6: Widget JS | Frontend | `gsv-widget.js` | NOT STARTED |
| **Thu** | Create categories | Content | 4 categories | NOT STARTED |
| **Fri** | E2E Testing | QA | Full journeys | NOT STARTED |
| **Fri** | Bug fixes | All | Resolve blockers | NOT STARTED |

### 10.2 Detailed Implementation Checklist

- [ ] **Infrastructure**
  - [ ] Create RAGFlow K8s manifests
  - [ ] Deploy RAGFlow via ArgoCD
  - [ ] Configure RAGFlow secrets in Vault
  - [ ] Update cmp-backend env vars
  - [ ] Remove ARC files from gsv-gitops

- [ ] **GAP-1: Flow Import API**
  - [ ] Create `FlowImportSerializer`
  - [ ] Create `FlowImportView`
  - [ ] Register URL route
  - [ ] Create Offering from flow
  - [ ] Create AgentIdentity
  - [ ] Test with sample flow

- [ ] **GAP-2: Provision Handler**
  - [ ] Create signal handler
  - [ ] Create CustomerAgentConfig
  - [ ] Call Runtime deploy API
  - [ ] Store runtime_endpoint
  - [ ] Test purchase flow

- [ ] **GAP-3: Runtime Auth API**
  - [ ] Create `RuntimeAuthView`
  - [ ] Hash lookup for API key
  - [ ] Return config if valid
  - [ ] Track last_used
  - [ ] Test with curl

- [ ] **GAP-4: Usage Ingest API**
  - [ ] Create `UsageIngestView`
  - [ ] Create/update AgentUsageRecord
  - [ ] Aggregate daily stats
  - [ ] Test with curl

- [ ] **GAP-5: Stripe Integration**
  - [ ] Install stripe Python SDK
  - [ ] Create checkout session endpoint
  - [ ] Create webhook handler
  - [ ] Handle payment_succeeded
  - [ ] Handle subscription events
  - [ ] Test with Stripe CLI

- [ ] **GAP-6: Widget JS**
  - [ ] Create React chat component
  - [ ] Create Vite build config
  - [ ] Build standalone bundle
  - [ ] Test embed code
  - [ ] Test cross-domain

- [ ] **Sample Content**
  - [ ] Create Customer Support flow in Studio
  - [ ] Create Code Review flow in Studio
  - [ ] Import flows to CMP
  - [ ] Create 4 categories
  - [ ] Set up pricing plans

---

## 11. API Reference

### 11.1 Existing APIs

#### Buyer APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/customer-agent-configs/` | GET | List buyer's agents |
| `/api/customer-agent-configs/:uuid/` | GET/PATCH | Get/update config |
| `/api/customer-agent-configs/:uuid/keys/` | GET/POST | Manage API keys |
| `/api/customer-agent-configs/:uuid/usage/` | GET | Get usage stats |
| `/api/customer-agent-configs/:uuid/widget/` | GET | Get embed code |
| `/api/customer-agent-configs/:uuid/training_documents/` | GET/POST | Manage docs |

#### Seller APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/provider-agents/` | GET/POST | List/create agents |
| `/api/provider-agents/:uuid/` | GET/PATCH/DELETE | Manage agent |
| `/api/provider-agents/:uuid/publish/` | POST | Publish |
| `/api/provider-agents/:uuid/unpublish/` | POST | Unpublish |
| `/api/provider-agents/:uuid/analytics/` | GET | Analytics |

#### RAG APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/marketplace-ai-knowledge-bases/` | GET/POST | Manage KBs |
| `/api/marketplace-ai-knowledge-documents/` | GET/POST | Manage docs |
| `/api/marketplace-ai-workflows/` | GET/POST | Manage workflows |

### 11.2 APIs To Implement

| Endpoint | Method | Purpose | Gap |
|----------|--------|---------|-----|
| `/api/flows/import/` | POST | Import flow | GAP-1 |
| `/api/runtime/auth/` | POST | Validate key | GAP-3 |
| `/api/runtime/usage/` | POST | Ingest usage | GAP-4 |
| `/api/stripe/checkout/` | POST | Checkout | GAP-5 |
| `/api/stripe/webhook/` | POST | Webhooks | GAP-5 |

---

## 12. Session Log

### Session: December 15, 2025

**Work Completed:**
1. Deep analysis of all repositories
2. Identified 6 critical integration gaps + 1 infrastructure gap (RAGFlow)
3. Documented complete tech stack and architecture
4. Created E2E journey maps with screen routes
5. Documented menu structure
6. Created this master GTM document
7. Added RAGFlow deployment requirements
8. Added ARC removal task

**Key Findings:**
- RAGFlow client code is COMPLETE but RAGFlow is NOT DEPLOYED
- Site Kit consolidation is correct architecture
- 6 integration APIs are MISSING (blocking GTM)
- ARC files exist but are not in kustomization (should be cleaned up)

**Files Created:**
- `gsv-platform/docs/GTM-MASTER-2025-12-15.md` (this document)

**Next Session Priorities:**
1. Deploy RAGFlow to Kubernetes
2. Implement GAP-1: Flow Import API
3. Implement GAP-3: Runtime Auth API
4. Remove ARC files from gsv-gitops

---

## Quick Reference Card

### What's Working
- SSO/Authentication (Keycloak)
- Marketplace browsing
- Buyer agent config UI
- Seller agent management UI
- API key management
- Training document upload
- Widget embed code generation
- RAGFlow client code
- Langflow client code

### What's NOT Working
- RAGFlow deployment (needs K8s deploy)
- Creating agents from Studio flows (GAP-1)
- Agent provisioning on purchase (GAP-2)
- Runtime auth validation (GAP-3)
- Usage tracking (GAP-4)
- Payment processing (GAP-5)
- Actual chat widget (GAP-6)
- Sample agents in marketplace

### Critical Path
```
GAP-0 (RAGFlow) ─┐
                 ├─► GAP-1 ─► GAP-2 ─► E2E Seller Test
GAP-3 ───────────┘       │
  │                      │
  └─► GAP-4 ─► GAP-6 ───►├─► E2E Buyer Test
                         │
GAP-5 ───────────────────┘
                         │
                    Sample Content
                         │
                    GTM LAUNCH
```

---

*This document is the single source of truth for GTM.*
*UPDATE THIS DOCUMENT at the start and end of every session.*
*Last updated: December 15, 2025*
