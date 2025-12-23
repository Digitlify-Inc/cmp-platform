# PRD — GSV Agent Store MVP (GTM)

**Date:** 2025-12-17  
**Product:** Single-publisher Agent Store for **Agents / Apps / Assistants / Automations**  
**Commerce:** Saleor (Day 1)  
**CMS:** Wagtail (marketing/content only)  
**Control Plane:** Django/DRF (new)  
**Authoring:** Langflow Studio (internal creators)  
**Execution:** Gateway + Flow Runner + Langflow Runtime  
**RAG:** Ragflow  
**Object storage:** MinIO (S3 compatible)  
**Identity:** Keycloak (SSO/OIDC + social)  
**Secrets:** Vault + External Secrets Operator (ESO)  
**Metering:** MVP synchronous debit; OpenMeter optional/parallel (post-GTM)  
**Delivery:** GitOps + ArgoCD, internal repos only (vendored upstreams)

---

## 1. Problem Statement
Current OSS marketplace platforms are optimized for “cloud resources + invoice workflows” rather than a frictionless “app store” experience for digital workers (agents/assistants/apps/automations). We need a **fast GTM** marketplace where offerings are **capability-configurable**, **usage-metered**, and sold with **credit-based plans**.

---

## 2. Goals
### 2.1 Business goals
- Launch quickly with a **stable buyer journey** and low operational risk.
- Provide a modern **app store** experience (search, filter, install/activate, run).
- Enable **credit-based pricing** with top-ups and plan tiers.
- Keep architecture robust for long-term expansion:
  - more agent frameworks later
  - more runtime profiles (shared → namespace → vcluster → cluster)
  - later multi-vendor onboarding & vendor stores

### 2.2 Product goals
- 4 product categories: **Agents, Apps, Assistants, Automations**
- 8 GTM Value Streams (store packaging)
- Capability-based configuration and enforcement:
  - config UI generation
  - provisioning steps
  - runtime wiring
  - entitlements + limits
  - metering dimensions → credit debits

### 2.3 Technical goals
- Secrets never embedded in flow artifacts.
- Runtime not exposed directly; all calls go through Gateway.
- GitOps-only provisioning.
- Tenant isolation for shared tiers via gateways + data boundaries.

---

## 3. Non-Goals (post-GTM)
- Service provider onboarding, payouts, revenue share.
- Backstage portal (post-GTM).
- Full TMF Open APIs / ODA (post-GTM).
- Dedicated clusters per tenant (enterprise later).

---

## 4. Functional Requirements (MVP)
### 4.1 Storefront (Saleor)
- Products represent offerings; variants represent plans.
- Attributes: VALUE_STREAMS, CAPABILITIES, CONNECTORS, LANGUAGES, MODALITIES.
- Credit pack products for wallet top-ups.

### 4.2 CMS (Wagtail)
- Landing pages for value streams and categories.
- Buyer education: “How credits work”, security posture, connectors list.

### 4.3 Control Plane (new)
- Org/Project/Team + roles
- Offering lifecycle (draft → published → paused → EOS/EOL)
- Offering versioning (immutable artifacts)
- Capability registry loader + schema validation
- Instance lifecycle (requested → provisioning → active → paused → terminated)
- Wallet + ledger (immutable accounting)
- Provisioning orchestration via GitOps/ArgoCD
- Day-2 ops: pause/resume, rotate secrets, upgrade version, terminate

### 4.4 Execution plane
- Gateway enforces auth/entitlements/credits, routes to runner/runtime.
- Connector/MCP Gateway executes connectors using Vault secrets.
- Ragflow provides RAG ingestion and retrieval.
- MinIO stores documents/artifacts for KB and uploads.

---

## 5. Non-Functional Requirements
- Security: Zero secrets in flow artifacts; Vault+ESO everywhere.
- Isolation: enforce tenant boundaries for data, connectors, and policies.
- Reliability: idempotent provisioning, retryable jobs, immutable versions.
- Observability: correlate usage, logs, instance id, tenant id.

---

## 6. Success Metrics (GTM)
- **Time-to-first-value**: < 3 minutes (landing → first result)
- **Trial activation**: > 25% visitors run a trial
- **Paid conversion**: 3–5% trial → paid plan/top-up
- **Cost**: shared tier COGS supports $15–$50 plans sustainably
