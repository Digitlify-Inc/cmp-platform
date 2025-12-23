# E2E Visual Architecture — GSV Agent Store (No-Gaps Integration Map)

**Date:** 2025-12-17  
**Audience:** platform engineering, product engineering, security, GTM ops  
**Goal:** provide a complete, implementation-ready, end-to-end visual map of the platform/app store, including **every integration point** across: commerce, CMS, control plane, provisioning, runtime execution, connectors/MCP, RAG, branding/widget, metering/credits, and day‑2 lifecycle.

> Key rule: **Saleor sells**. **Control Plane provisions/controls**. **Gateway executes**. **Secrets live only in Vault**.

---

## 0) Legend (used in all diagrams)
- **Solid arrows** = synchronous API call (HTTP/gRPC)
- **Dashed arrows** = async event (webhook/event bus/log)
- **Locks** = auth boundary (OIDC/JWT/API Key)
- **Vault icon** = secrets boundary (no secrets in flows)
- **GitOps icon** = desired state commit + reconcile

Identifiers (used consistently):
- `orgId`, `projectId`, `teamId`, `userId`
- `offeringId` (stable product), `offeringVersionId` (immutable release)
- `instanceId` (tenant activation of an offering version)
- `runId` (execution), `bindingId` (connector secret binding), `kbId` (knowledge base)

---

## 1) Big picture: Platform planes and trust boundaries

```mermaid
flowchart TB
  subgraph Edge["Edge / Internet"]
    Buyer["Buyer (browser / API client)"]
    VendorSite["Marketing site (Wagtail)"]
    Storefront["Storefront (Saleor)"]
    WidgetHost["Customer website embedding Widget"]
  end

  subgraph Platform["Platform (cluster / private network)"]
    GW["API Gateway (auth+entitlements+credits+routing)"]
    CP["Control Plane (Django/DRF)"]
    ProvApp["Saleor Provisioner App (webhook bridge)"]
    Runner["Flow Runner (Langflow adapter)"]
    LFRT["Langflow Runtime (internal)"]
    ConnGW["Connector + MCP Gateway"]
    Ragflow["Ragflow RAG backend"]
    MinIO["MinIO (S3)"]
    OpenMeter["OpenMeter (optional/parallel)"]
  end

  subgraph IdentitySecrets["Identity & Secrets"]
    KC["Keycloak (OIDC/social)"]
    Vault["Vault"]
    ESO["External Secrets Operator"]
  end

  subgraph Delivery["GitOps / Delivery"]
    Git["Internal Git (desired state)"]
    Argo["ArgoCD"]
    K8s["Kubernetes"]
  end

  Buyer --> VendorSite
  Buyer --> Storefront
  Buyer --> GW
  WidgetHost --> GW

  Storefront -. "OrderFullyPaid webhook" .-> ProvApp --> CP

  CP --> Git --> Argo --> K8s

  GW --> Runner --> LFRT
  Runner --> ConnGW
  ConnGW --> Ragflow --> MinIO

  Buyer --> KC
  GW --> KC
  CP --> KC

  ESO --> Vault
  CP --> Vault
  ConnGW --> Vault
  K8s --> ESO

  GW -. "usage events" .-> OpenMeter
  GW --> CP
```

**Non-negotiable boundaries:**
- Buyer never talks to LFRT / Ragflow / MinIO directly.
- Langflow flows never contain credentials; tool calls go to **ConnGW**, which pulls secrets from **Vault**.
- Provisioning happens by **desired state** committed by CP and reconciled by **ArgoCD**.

---

## 2) E2E Integration Points Map (with auth + payload ownership)

```mermaid
flowchart LR
  Buyer["Buyer / Widget"]
  KC["Keycloak"]
  Saleor["Saleor"]
  Wagtail["Wagtail"]
  Prov["Provisioner App"]
  CP["Control Plane"]
  GW["API Gateway"]
  Runner["Flow Runner"]
  LF["Langflow Runtime"]
  CGW["Connector/MCP Gateway"]
  Vault["Vault"]
  Rag["Ragflow"]
  S3["MinIO (S3)"]
  Git["Internal Git"]
  Argo["ArgoCD"]

  Buyer -- "OIDC login (PKCE)" --> KC
  Buyer -- "Browse listings" --> Wagtail
  Buyer -- "Browse/buy" --> Saleor

  Saleor -. "OrderFullyPaid (signed webhook)" .-> Prov
  Prov -- "POST /instances or /wallet/topup (idempotent)" --> CP

  Buyer -- "Run / chat / upload docs" --> GW
  GW -- "JWT verify / introspect" --> KC

  GW -- "POST /billing/authorize + /settle" --> CP
  CP -- "commit desired state" --> Git --> Argo

  GW -- "POST /v1/runs" --> Runner -- "internal execute" --> LF
  LF -- "tool invoke" --> CGW
  CGW -- "read secrets (kv/...)" --> Vault
  CGW -- "RAG calls" --> Rag -- "objects" --> S3
```

---

## 3) Buyer Journey sequences (no gaps)

### 3.1 Browse → Trial “Run now”
```mermaid
sequenceDiagram
  participant B as Buyer
  participant KC as Keycloak
  participant UI as Store UI (Wagtail/Saleor)
  participant GW as API Gateway
  participant CP as Control Plane
  participant R as Runner
  participant LF as Langflow Runtime

  B->>UI: Browse listing (capabilities/connectors/credits)
  B->>UI: Click "Run now"
  UI->>KC: OIDC login (PKCE)
  KC-->>B: access_token (JWT)
  B->>GW: POST /v1/workspaces/auto (JWT)
  GW->>CP: create org/project + grant trial credits
  CP-->>GW: orgId, projectId, walletBalance
  B->>GW: POST /v1/instances/autoActivate (offeringVersionId)
  GW->>CP: POST /instances (idempotent)
  CP-->>GW: instanceId (PROVISIONING)
  B->>GW: POST /v1/runs (instanceId)
  GW->>CP: POST /billing/authorize
  GW->>R: POST /v1/runs
  R->>LF: execute(flow.json, effectiveConfig)
  LF-->>R: output + usage
  R-->>GW: output + usage
  GW->>CP: POST /billing/settle
  GW-->>B: response
```

### 3.2 Purchase → Provision/Top-up
```mermaid
sequenceDiagram
  participant B as Buyer
  participant S as Saleor
  participant P as Provisioner App
  participant CP as Control Plane

  B->>S: Checkout plan or credit pack
  S-->>P: OrderFullyPaid webhook (signed)
  alt Plan purchase (offering)
    P->>CP: POST /instances (idempotent by orderId:lineId)
    CP-->>P: instanceId
  else Credit pack
    P->>CP: POST /wallet/topup (idempotent by orderId:lineId)
    CP-->>P: new balance
  end
```

---

## 4) Provisioning pipeline (GitOps) — exact handoffs

### 4.1 What Control Plane commits per instance (minimum)
- `GatewayRoute` (host/path → instanceId)
- `GatewayPolicy` (capability allowlists, rate limits, payload caps)
- `ConnectorPolicy` (allowed tools/MCP servers)
- Optional: `RagflowKB` + S3 prefix policy
- Optional: `SchedulerJob` (automations)

### 4.2 Instance lifecycle
```mermaid
stateDiagram-v2
  [*] --> REQUESTED
  REQUESTED --> PROVISIONING: CP commits desired state
  PROVISIONING --> ACTIVE: Argo applied + readiness ok
  ACTIVE --> PAUSED: manual pause or wallet depleted
  PAUSED --> ACTIVE: resume or top-up
  ACTIVE --> TERMINATED: cancel / EOL enforced
  TERMINATED --> [*]
```

---

## 5) Execution with connectors + Vault (no secrets in flows)
```mermaid
sequenceDiagram
  participant GW as Gateway
  participant CP as Control Plane
  participant R as Runner
  participant LF as Langflow Runtime
  participant CGW as Connector/MCP Gateway
  participant V as Vault
  participant Ext as External API

  GW->>CP: billing.authorize(instanceId)
  GW->>R: run(instanceId, offeringVersionId, input)
  R->>LF: execute(flow.json, effectiveConfig)
  LF->>CGW: tool.invoke(toolId, bindingId, params)
  CGW->>V: read(kv/.../bindingId)
  V-->>CGW: token/secret
  CGW->>Ext: external call (scoped + policy checked)
  Ext-->>CGW: response
  CGW-->>LF: tool result
  LF-->>R: output + usage
  R-->>GW: output + usage
  GW->>CP: billing.settle(reservationId, usage)
```

---

## 6) RAG (Ragflow + MinIO) — ingestion & query
```mermaid
sequenceDiagram
  participant B as Buyer
  participant GW as Gateway
  participant CP as Control Plane
  participant S3 as MinIO
  participant Rag as Ragflow

  B->>GW: uploads:init(kbId)
  GW->>CP: validate rag entitlement + create upload session
  CP-->>GW: preSignedPutUrl + objectKey
  B->>S3: PUT object (preSigned)
  B->>GW: ingest(kbId, objectKey)
  GW->>CP: record ingest request
  CP->>Rag: ingest(kbId, s3ref)
  Rag->>S3: read object
  Rag-->>CP: status
  CP-->>GW: status
  GW-->>B: status
```

---

## 7) Branding + Web Widget (customer support websites)

### 7.1 Widget session + theming
```mermaid
sequenceDiagram
  participant Site as Customer Website
  participant W as Widget JS
  participant GW as Gateway
  participant CP as Control Plane

  Site->>W: load widget script
  W->>GW: widget/session:init(origin, instanceId)
  GW->>CP: validate ACTIVE + allowed_domains + fetch branding config
  CP-->>GW: widgetConfig + sessionClaims
  GW-->>W: signed widget token + config
  W->>GW: chat/run requests (widget token)
  GW-->>W: responses
```

### 7.2 Source of truth for branding
- Stored as part of **instance effective config** (capability `web_widget.branding`).
- Defaults can be applied per offering/plan; customers override per instance.

Recommended fields:
- `brand_name`, `logo_url`, `avatar_url`
- `primary_color`, `accent_color`, `font_family`
- `launcher_text`, `position`, `allowed_domains`

> This is reflected in `capability-registry.yaml` under `web_widget.branding` in v1.2.

---

## 8) Metering & credits (MVP “sync debit”)
```mermaid
sequenceDiagram
  participant GW as Gateway
  participant CP as Control Plane
  participant R as Runner

  GW->>CP: /billing/authorize(instanceId)
  CP-->>GW: allowed, reservationId, budget
  GW->>R: run(...)
  R-->>GW: usage dims
  GW->>CP: /billing/settle(reservationId, usage)
  CP-->>GW: new balance, ledgerEntryId
```

---

## 9) Integration contracts (explicit)

### 9.1 Saleor → Provisioner App
- `OrderFullyPaid` webhook (signed)
- Idempotency: `saleor:orderId:lineId`
- Maps:
  - offering line → `offeringVersionId` + `planId`
  - credit pack line → `creditsAmount`

### 9.2 Provisioner App → Control Plane
- `POST /integrations/saleor/order-paid`
- `POST /instances` (idempotent)
- `POST /wallet/topup` (idempotent)

### 9.3 Gateway → Control Plane
- `POST /billing/authorize`
- `POST /billing/settle`
- `GET /instances/{id}/entitlements`
- `POST /connectors/bindings`
- `POST /connectors/bindings/{id}/revoke`

### 9.4 Langflow → Connector Gateway
- `POST /v1/tools/{toolId}:invoke`

### 9.5 Connector Gateway → Vault
- `kv/data/connectors/{orgId}/{projectId}/{bindingId}`

### 9.6 Control Plane → GitOps
- commit desired state under:
  - `clusters/<env>/instances/<org>/<project>/<instanceId>/...`
- ArgoCD applies; CP marks ACTIVE on readiness

---

## 10) Shared vs Enterprise isolation (visual)
```mermaid
flowchart TB
  subgraph Shared["Shared Tier (MVP)"]
    GW1["Gateway (tenant-aware)"]
    Runner1["Runner"]
    LF1["Langflow Runtime Pool"]
    CGW1["Connector Gateway"]
    Rag1["Ragflow"]
    S31["MinIO prefixes per project"]
  end

  subgraph Enterprise["Enterprise Tier"]
    NS["Dedicated Namespace or vcluster"]
    GW2["Gateway"]
    Runner2["Runner"]
    LF2["Langflow Runtime (dedicated)"]
    CGW2["Connector Gateway (dedicated)"]
    Rag2["Ragflow (dedicated or scoped)"]
    S32["MinIO bucket per org"]
  end
```

---

## 11) “No-guesswork” checklist (thin slice)
1) Provisioner App: signature validation + idempotency store + mapping rules  
2) Control Plane: offering version upload (hash) + instance state machine + wallet ledger + billing endpoints  
3) Gateway: OIDC + entitlements cache + authorize/settle + routing + widget session init (origin allowlist)  
4) Runner: fetch artifact from MinIO + validate hash + execute + normalize usage  
5) Connector Gateway: allowlists + Vault secret read + audit logs + timeouts/retries  
6) RAG: KB provision + upload/init + ingest + query  
