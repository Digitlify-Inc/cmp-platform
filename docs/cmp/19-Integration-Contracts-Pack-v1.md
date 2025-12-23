# Integration Contracts Pack v1 — Copy/Paste Contracts + Test Cases

**Date:** 2025-12-17  
**Scope:** This document provides concrete payload examples, required headers/idempotency rules, and exact retry matrices so **every integration arrow in `16-E2E-Visual-Architecture.md`** can be implemented and tested with minimal guesswork.

---

## 0) Global conventions (apply everywhere)

### 0.1 Traceability headers (recommended)
All callers should emit **one** of:
- `traceparent: <w3c-trace-context>` (preferred)
- OR `X-Request-Id: <uuid>`

And optionally:
- `X-Correlation-Id: <uuid>` (stable across the whole buyer journey)

### 0.2 Content negotiation
- `Content-Type: application/json`
- `Accept: application/json`

### 0.3 Auth headers
- Service-to-service: `Authorization: Bearer <service-jwt>` (Keycloak client credentials or internal JWT)
- Buyer API: `Authorization: Bearer <user-jwt>` (Keycloak OIDC)

### 0.4 Canonical error envelope
All services return:
```json
{
  "error": {
    "code": "STRING_ENUM",
    "message": "Human readable message",
    "details": {},
    "traceId": "trace/span or request id"
  }
}
```

### 0.5 Idempotency headers (required for all money/provisioning operations)
Use:
- `Idempotency-Key: <string>`

**Rules**
- Same `Idempotency-Key` + same payload → return the same response.
- Same `Idempotency-Key` + different payload → `409 IDEMPOTENCY_PAYLOAD_MISMATCH`.

---

## 1) Arrow map (Doc 16 → Contract sections)

| Doc 16 Arrow | From → To | Contract Section |
|---|---|---:|
| A1 | Buyer UI → Keycloak | §2 |
| A2 | Buyer UI/Widget → Gateway | §3 |
| A3 | Gateway → Control Plane | §4 |
| A4 | Gateway → Runner | §5 |
| A5 | Runner → Langflow Runtime | §6 |
| A6 | Runtime → Connector/MCP Gateway | §7 |
| A7 | Connector Gateway → Vault | §8 |
| A8 | Buyer UI → Saleor | §9 |
| A9 | Saleor → Provisioner App (webhook) | §10 |
| A10 | Provisioner App → Control Plane | §11 |
| A11 | Control Plane → Git (desired state) | §12 |
| A12 | ArgoCD → Cluster resources | §13 |
| A13 | RAG: UI → CP → MinIO → Ragflow | §14 |
| A14 | Credits top-up: Saleor → Provisioner → CP | §15 |
| A15 | Widget branding session init | §16 |

---

## 2) Buyer UI → Keycloak (OIDC)

### 2.1 Goal
User authentication for:
- Storefront browsing (optional)
- Trial run (recommended authenticated)
- Purchase, install, manage instances

### 2.2 Copy/paste (OIDC auth code flow)
**Browser redirects to:**
```
GET https://<keycloak>/realms/<realm>/protocol/openid-connect/auth
  ?client_id=<client>
  &redirect_uri=<https://store.example.com/callback>
  &response_type=code
  &scope=openid%20profile%20email
  &state=<csrf>
  &nonce=<nonce>
```

**Token exchange (server side):**
```bash
curl -X POST "https://<keycloak>/realms/<realm>/protocol/openid-connect/token"   -H "Content-Type: application/x-www-form-urlencoded"   -d "grant_type=authorization_code"   -d "client_id=<client>"   -d "client_secret=<secret>"   -d "redirect_uri=https://store.example.com/callback"   -d "code=<auth_code>"
```

**Expected 200:**
```json
{
  "access_token": "…",
  "expires_in": 300,
  "refresh_token": "…",
  "id_token": "…",
  "token_type": "Bearer"
}
```

### 2.3 Test case
- **Given** a user exists in Keycloak  
- **When** user completes login  
- **Then** UI obtains `access_token` and can call Gateway/Control Plane with `Authorization: Bearer`.

---

## 3) Buyer UI/Widget → Gateway (public execution entrypoint)

### 3.1 Endpoints (MVP)
- `POST /v1/runs`
- `POST /v1/widget/session:init`

### 3.2 Run request (copy/paste)
```bash
curl -X POST "https://api.example.com/v1/runs"   -H "Authorization: Bearer <user_jwt>"   -H "Content-Type: application/json"   -H "X-Request-Id: 6f7e2a38-3b4f-4a12-9c4b-30b0f3d4d7a2"   -d '{
    "instanceId": "inst_123",
    "input": {
      "query": "Hello, help me reset my password."
    },
    "metadata": {
      "channel": "web",
      "locale": "en-US"
    }
  }'
```

**Expected 200:**
```json
{
  "runId": "run_abc",
  "output": { "text": "Sure — I can help with that. ..." },
  "usage": { "llm_tokens_in": 120, "llm_tokens_out": 220, "tool_calls": 1, "requests": 1 },
  "billing": { "debited": 12, "balance": 88 }
}
```

### 3.3 Gateway run test cases
1) **Entitlement deny**
   - run with capability not in plan → **403** `ENTITLEMENT_DENIED`
2) **Credits blocked**
   - balance=0 → **403** `INSUFFICIENT_CREDITS` (no call to Runner)
3) **Idempotent settle**
   - simulate settle retry (Gateway internal) returns same ledger entry

---

## 4) Gateway → Control Plane (entitlements + billing)

### 4.1 Read entitlements (copy/paste)
```bash
curl -X GET "https://cp.example.com/instances/inst_123/entitlements"   -H "Authorization: Bearer <service_jwt>"   -H "Accept: application/json"   -H "X-Request-Id: 8df0e51e-78b7-4db9-8ff5-8c1a0f3dcb5d"
```

### 4.2 Billing authorize (copy/paste)
```bash
curl -X POST "https://cp.example.com/billing/authorize"   -H "Authorization: Bearer <service_jwt>"   -H "Content-Type: application/json"   -H "Idempotency-Key: run:inst_123:run_abc:authorize"   -d '{
    "instanceId": "inst_123",
    "requestedBudget": 25
  }'
```

**Expected 200:**
```json
{
  "allowed": true,
  "reservationId": "res_001",
  "budget": 25,
  "balance": 100
}
```

### 4.3 Billing settle (copy/paste; idempotent by reservationId)
```bash
curl -X POST "https://cp.example.com/billing/settle"   -H "Authorization: Bearer <service_jwt>"   -H "Content-Type: application/json"   -H "Idempotency-Key: res_001"   -d '{
    "reservationId": "res_001",
    "instanceId": "inst_123",
    "usage": {
      "llm_tokens_in": 120,
      "llm_tokens_out": 220,
      "tool_calls": 1,
      "requests": 1,
      "rag_queries": 0,
      "rag_ingestion_mb": 0
    }
  }'
```

**Expected 200:**
```json
{
  "debited": 12,
  "balance": 88,
  "ledgerEntryId": "led_777",
  "status": "settled"
}
```

### 4.4 Test cases
1) **Authorize deny** → returns `allowed=false` and Gateway must not call Runner  
2) **Settle retry** (timeout then retry) → returns same `ledgerEntryId` and same debit  
3) **Idempotency mismatch** (same key, different usage) → 409 `IDEMPOTENCY_PAYLOAD_MISMATCH`

---

## 5) Gateway → Runner (internal execution hop)

### 5.1 Contract
- transport: internal HTTP or gRPC (choose one; keep request/response identical)
- auth: internal mTLS or service JWT
- timeout: 60s default

### 5.2 Request shape (copy/paste JSON)
```json
{
  "runId": "run_abc",
  "instanceId": "inst_123",
  "offeringVersionId": "ov_100",
  "artifact": { "s3Key": "artifacts/ov_100/flow.json", "sha256": "<64hex>" },
  "effectiveConfig": { "...": "non-secret" },
  "input": { "query": "Hello..." },
  "entitlements": { "capabilities": [{"id":"web_widget"}] },
  "connectorBindings": [{ "bindingId":"b1","connectorId":"zendesk","status":"active" }]
}
```

### 5.3 Test case
- Runner rejects if artifact hash mismatch → 500 `ARTIFACT_HASH_MISMATCH`

---

## 6) Runner → Langflow Runtime (execute flow)

### 6.1 Contract
- Runner calls Langflow Runtime “execute” endpoint (your chosen adapter).
- Runner passes:
  - `runId` (for dedupe)
  - `flow.json` content or artifact reference
  - `effectiveConfig` (non-secret)
  - buyer input

### 6.2 Request (copy/paste, generic)
```json
{
  "runId": "run_abc",
  "flow": { "...": "langflow-exported-json" },
  "input": { "query": "Hello..." },
  "context": {
    "instanceId": "inst_123",
    "orgId": "org_1",
    "projectId": "proj_1",
    "locale": "en-US"
  },
  "effectiveConfig": { "...": "non-secret" }
}
```

### 6.3 Response
```json
{
  "output": { "text": "..." },
  "usage": {
    "llm_tokens_in": 120,
    "llm_tokens_out": 220,
    "tool_calls": 1
  }
}
```

### 6.4 Test case
- If runtime is down → Runner returns 503 to Gateway (Gateway returns 503 to buyer)

---

## 7) Runtime → Connector/MCP Gateway (tool calls)

### 7.1 Contract (enforced by Connector Gateway)
- required headers:
  - `X-Instance-Id`
  - `X-Org-Id`
  - `X-Project-Id`
  - `X-Run-Id`
  - `Authorization: Bearer <runtime-service-jwt>`
- must pass `bindingId` (not secrets)

### 7.2 Invoke tool (copy/paste)
```bash
curl -X POST "https://conn.example.com/v1/tools/zendesk:createTicket:invoke"   -H "Authorization: Bearer <runtime_service_jwt>"   -H "Content-Type: application/json"   -H "X-Run-Id: run_abc"   -H "X-Instance-Id: inst_123"   -H "X-Org-Id: org_1"   -H "X-Project-Id: proj_1"   -d '{
    "bindingId": "bind_zendesk_1",
    "args": {
      "subject": "Password reset",
      "body": "User cannot login",
      "priority": "high"
    }
  }'
```

### 7.3 Response
```json
{
  "result": { "ticketId": "ZD-1001" },
  "audit": { "connectorId": "zendesk", "bindingId": "bind_zendesk_1", "status": "ok" }
}
```

### 7.4 Test cases
- disallowed tool by policy → 403 `TOOL_NOT_ALLOWED`
- binding revoked → 403 `BINDING_REVOKED`
- write-tool retry disabled → platform must not auto-retry writes unless tool supports idempotency

---

## 8) Connector Gateway → Vault (secret retrieval)

### 8.1 Contract
- Vault path convention:
  - `kv/data/connectors/<orgId>/<projectId>/<bindingId>`
- Vault policy must restrict reads to the calling service identity AND scope.

### 8.2 Pseudocode (Python-ish)
```python
path = f"kv/data/connectors/{orgId}/{projectId}/{bindingId}"
secret = vault.read(path)   # short timeout
# never log secret values
```

### 8.3 Test case
- attempt cross-tenant path access → 403 deny (Vault policy), and connector gateway returns `403 VAULT_POLICY_DENY`

---

## 9) Buyer UI → Saleor (storefront + checkout)

### 9.1 Product/variant mapping
- Each paid “offering plan” purchase must include metadata/attributes that identify:
  - `offeringVersionId`
  - `planId`
- Credit packs are separate products that map to:
  - `creditsAmount`
  - `walletId` (or resolve by org/project membership)

### 9.2 Test case
- ensure the same cart line produces the same `lineId` in webhook payload (for idempotency key composition)

---

## 10) Saleor → Provisioner App (OrderFullyPaid webhook)

### 10.1 Required webhook headers
Saleor sends (at minimum):
- `Saleor-Event: ORDER_FULLY_PAID`
- `Saleor-Domain: <saleor-domain>`
- `Saleor-Api-Url: https://<saleor>/graphql/`
- `Saleor-Signature: <signature>`

> Some deployments may still emit legacy `X-Saleor-*` headers; accept both.

### 10.2 Signature validation (two modes)
Saleor provides a signature in `Saleor-Signature`:
- If webhook secretKey is set → HMAC-SHA256 over the raw body (deprecated mode)
- If secretKey is not set → JWS (RS256, detached payload) verified via Saleor JWKS

**Implementation recommendation:** use Saleor App SDK verifier when possible; otherwise:
- capture raw body bytes (disable JSON parsing until signature verified)
- verify HMAC or JWS depending on header format

### 10.3 Sample webhook payload (representative)
```json
{
  "issuedAt": "2025-12-17T10:25:30.000Z",
  "version": "3.x",
  "order": {
    "id": "T3JkZXI6MTIz",
    "number": "1000123",
    "status": "UNFULFILLED",
    "total": {
      "gross": { "amount": 29.0, "currency": "USD" }
    },
    "user": { "email": "buyer@example.com" },
    "lines": [
      {
        "id": "T3JkZXJMaW5lOjQ1",
        "productName": "Customer Support Assistant",
        "quantity": 1,
        "variant": { "sku": "assistant-custsupport-pro" }
      }
    ],
    "metadata": [
      { "key": "offeringVersionId", "value": "ov_100" },
      { "key": "planId", "value": "pro" }
    ]
  }
}
```

### 10.4 Webhook handler response
Provisioner must respond quickly:
```json
{ "success": true }
```

### 10.5 Test cases
1) invalid signature → 401 `INVALID_SIGNATURE`  
2) duplicate webhook delivery → do not double-provision (idempotency)  
3) mismatched payload for same idempotency key → 409  

---

## 11) Provisioner App → Control Plane (normalized order event)

### 11.1 Endpoint
`POST /integrations/saleor/order-paid`

### 11.2 Required headers
- `Authorization: Bearer <service_jwt>`
- `Idempotency-Key: saleor:<orderId>:<lineId>`
- `Content-Type: application/json`
- `X-Request-Id`

### 11.3 Normalized payload (copy/paste)
This is the payload Provisioner sends to Control Plane (matches CP OpenAPI schema `SaleorOrderPaidEvent`):

```json
{
  "orderId": "T3JkZXI6MTIz",
  "occurredAt": "2025-12-17T10:25:30.000Z",
  "customerId": "buyer@example.com",
  "idempotencyKey": "saleor:T3JkZXI6MTIz:T3JkZXJMaW5lOjQ1",
  "lines": [
    {
      "lineId": "T3JkZXJMaW5lOjQ1",
      "kind": "offering_plan",
      "offeringVersionId": "ov_100",
      "planId": "pro"
    }
  ]
}
```

### 11.4 Expected 200 response
```json
{
  "processed": true,
  "actions": ["instance_created:inst_123", "wallet_granted_trial:false"]
}
```

### 11.5 Test cases
- replay same idempotency key → same response, no duplicates  
- CP temporarily down → Provisioner returns non-2xx so Saleor retries later  

---

## 12) Control Plane → Git (desired state commit)

### 12.1 Commit path (copy/paste convention)
```
clusters/<env>/instances/<orgId>/<projectId>/<instanceId>/
  gatewayroute.yaml
  gatewaypolicy.yaml
  connectorpolicy.yaml
  ragflowkb.yaml               # optional
  schedulerjob.yaml            # optional
  kustomization.yaml
```

### 12.2 Sample GatewayRoute (illustrative)
```yaml
apiVersion: gsv.dev/v1
kind: GatewayRoute
metadata:
  name: inst-123
spec:
  host: "inst-123.api.example.com"
  pathPrefix: "/"
  target:
    instanceId: "inst_123"
```

### 12.3 Test cases
- commit created after instance activation  
- ArgoCD sync applies resources and instance becomes ACTIVE  

---

## 13) ArgoCD → Cluster resources (apply + health)

### 13.1 Readiness contract
Instance moves to ACTIVE when:
- route/policy resources exist and are ready
- (optional) Ragflow KB provisioned and ready

### 13.2 Test case
- break manifest then fix and resync → instance transitions to ACTIVE after reconcile

---

## 14) RAG ingestion: UI → CP → MinIO → Ragflow

### 14.1 Presign request (UI → CP)
`POST /instances/<id>/rag/uploads:presign`
```json
{
  "filename": "kb.pdf",
  "contentType": "application/pdf",
  "sizeBytes": 1048576
}
```

### 14.2 Presign response (CP → UI)
```json
{
  "uploadId": "up_001",
  "putUrl": "https://minio.../bucket/prefix?...",
  "headers": {
    "Content-Type": "application/pdf"
  }
}
```

### 14.3 UI upload (UI → MinIO)
```bash
curl -X PUT "<putUrl>" -H "Content-Type: application/pdf" --data-binary "@kb.pdf"
```

### 14.4 Ingest request (UI → CP)
`POST /instances/<id>/rag/uploads/<uploadId>:ingest`
```json
{ "chunking": { "strategy": "semantic", "maxTokens": 800 } }
```

### 14.5 Test cases
- cross-tenant download/read blocked  
- ingestion status progresses: PENDING → INGESTING → READY  

---

## 15) Credits top-up flow (Saleor → Provisioner → CP)

### 15.1 Saleor credit pack line normalization
Provisioner sends:
```json
{
  "orderId": "T3JkZXI6MTIz",
  "occurredAt": "2025-12-17T10:40:00.000Z",
  "idempotencyKey": "saleor:T3JkZXI6MTIz:T3JkZXJMaW5lOjQ2",
  "lines": [
    {
      "lineId": "T3JkZXJMaW5lOjQ2",
      "kind": "credit_pack",
      "walletId": "wal_1",
      "creditsAmount": 500
    }
  ]
}
```

### 15.2 CP applies top-up idempotently
- `POST /wallets/<walletId>/topups` with `Idempotency-Key: saleor:<orderId>:<lineId>`

### 15.3 Test cases
- top-up unblocks previously blocked instance run  
- duplicate webhook does not double-credit  

---

## 16) Widget branding session init (origin allowlist + theming)

### 16.1 Request
```bash
curl -X POST "https://api.example.com/v1/widget/session:init"   -H "Content-Type: application/json"   -d '{
    "instanceId": "inst_123",
    "origin": "https://customer-website.com"
  }'
```

### 16.2 Response
```json
{
  "widgetToken": "wjt_...",
  "expiresInSec": 3600,
  "config": {
    "brand_name": "Acme Support",
    "logo_url": "https://cdn.../logo.png",
    "avatar_url": "https://cdn.../bot.png",
    "primary_color": "#1A73E8",
    "accent_color": "#FFB300",
    "font_family": "Inter",
    "launcher_text": "Chat with us",
    "position": "bottom-right"
  }
}
```

### 16.3 Test cases
- invalid origin (not in allowed_domains) → 403 `ORIGIN_NOT_ALLOWED`
- widgetToken expiry enforces re-init

---

## 17) Retry matrices (exact, per caller)

> “Exact” here means: status codes, attempts, and backoff are explicitly defined for each caller. Tune post-GTM if needed, but implement these defaults first.

### 17.1 Saleor worker → Provisioner App (webhook delivery)
- retries: max 5
- backoff: 10 * (2**retries) seconds
- retry on: non-2xx response or timeout

### 17.2 Provisioner App → Control Plane
| Condition | Retry? | Attempts | Backoff |
|---|---:|---:|---|
| network error | yes | 5 | 1s,2s,4s,8s,16s |
| 502/503/504 | yes | 5 | 1s,2s,4s,8s,16s |
| 429 | yes | 3 | wait Retry-After |
| 4xx (except 429) | no | 0 | — |

### 17.3 Gateway → Control Plane
| Call | Retry? | Attempts | Notes |
|---|---:|---:|---|
| entitlements GET | yes | 2 | safe read |
| authorize | yes | 3 | idempotency key run:...:authorize |
| settle | yes | 5 | idempotent by reservationId; must not double-debit |

### 17.4 Runner → Runtime
| Condition | Retry? | Attempts | Notes |
|---|---:|---:|---|
| network/timeout | yes | 2 | 1 retry max to avoid duplicate tool calls |
| 4xx | no | 0 | treat as flow error |

### 17.5 Runtime → Connector Gateway
| Tool type | Retry? | Attempts | Notes |
|---|---:|---:|---|
| read-only | yes | 3 | on 502/503/504 |
| write | no | 0 | unless tool supports idempotency keys |

### 17.6 Connector Gateway → Vault
| Condition | Retry? | Attempts | Notes |
|---|---:|---:|---|
| 503/504 | yes | 2 | fail closed if still failing |
| 403 policy deny | no | 0 | security event |

### 17.7 Control Plane → Ragflow
| Condition | Retry? | Attempts | Backoff |
|---|---:|---:|---|
| 502/503/504 | yes | 3 | 2s, 5s, 10s |
| 4xx | no | 0 | config/data error |

---

## 18) “Copy/paste” E2E test suite (minimum)

### T1 — Order paid → instance created (idempotent)
- Simulate webhook payload → Provisioner → CP
- Assert instanceId returned
- Replay same webhook → same instanceId, no duplicates

### T2 — Instance becomes ACTIVE via GitOps
- Assert CP committed desired state path exists
- Assert ArgoCD sync succeeded
- Assert instance.state == ACTIVE

### T3 — Run via Gateway → Runner → Runtime
- Call /v1/runs
- Assert output present, usage recorded

### T4 — Credits debit; blocked at zero
- drain wallet
- run returns 403 INSUFFICIENT_CREDITS (no execution)

### T5 — Top-up unblocks
- apply credit pack webhook
- rerun succeeds

### T6 — Connector binding/revoke
- bind connector
- tool call works
- revoke binding → tool call denied

### T7 — RAG cross-tenant isolation
- upload KB in tenant A
- attempt access from tenant B → denied

---

## Appendix A — What to copy into Postman
- All curl blocks above can be imported as raw HTTP requests.
- Recommend setting environment vars:
  - API_BASE, CP_BASE, KC_BASE, CONN_BASE
  - USER_JWT, SERVICE_JWT
