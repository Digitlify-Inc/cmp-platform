# Error Handling & Retry Policies — MVP (No-Gaps)

**Date:** 2025-12-17  
**Goal:** define predictable, implementation-ready rules for errors, retries, idempotency, timeouts, and recovery across the full E2E platform.

> Principle: **fail safely** (no cross-tenant exposure, no secret leaks, no double charges), and keep the buyer journey smooth.

---

## 1) Error taxonomy (canonical)
All services must use the same top-level error shape.

### 1.1 Canonical error response
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

### 1.2 Standard HTTP mapping
- **400** invalid request / schema validation
- **401** missing/invalid token
- **403** authenticated but not entitled (capability/plan/role) OR insufficient credits (use `code`)
- **404** instance/offering/binding not found in scope
- **409** idempotency conflict / already exists (with different payload)
- **422** semantically invalid (e.g., connector binding missing required fields)
- **429** rate limited (must include `Retry-After`)
- **500** unexpected server error
- **502/503** upstream dependency down/unavailable
- **504** upstream timeout

---

## 2) Idempotency rules (mandatory for commerce + provisioning)

### 2.1 Idempotency key format
- `saleor:<orderId>:<lineId>` (primary key for commerce-triggered operations)
- For buyer-initiated operations (optional):
  - `ui:<userId>:<instanceId>:<clientRunId>`

### 2.2 Storage behavior
Each idempotent endpoint stores:
- request hash
- response body
- created resource IDs (instanceId, ledgerEntryId)
- firstSeenAt, lastSeenAt

### 2.3 Conflict behavior
If the same idempotency key is reused with a **different** payload hash:
- return **409** with `IDEMPOTENCY_PAYLOAD_MISMATCH`

---

## 3) Retry policy (by integration point)

## 3.1 Saleor → Provisioner App (webhook)
- **Saleor will retry** webhooks when non-2xx is returned.
- Provisioner App must:
  1) validate signature
  2) compute `idempotencyKey = saleor:<orderId>:<lineId>`
  3) call Control Plane with that key
  4) return **2xx** only when CP accepted OR CP returned idempotent “already processed”

**Provisioner App retry guidance (calling CP):**
- retry on **502/503/504** and network errors
- exponential backoff: 1s, 2s, 4s, 8s, 16s (max 5 attempts)
- then return **500** to Saleor so webhook retries later

## 3.2 Provisioner App → Control Plane
Endpoints:
- `/integrations/saleor/order-paid`
- `/instances` (if called directly)
- `/wallets/<walletId>/topups`

**Retry:**
- retry on **502/503/504**
- do **not** retry on 4xx (except 429 after `Retry-After`)

## 3.3 Buyer/Widget → Gateway
- retry is client-specific; server must be safe.
- Gateway should return:
  - `429 + Retry-After` for rate limits
  - use **403** with code `INSUFFICIENT_CREDITS`
  - `503` if execution plane is down

**Widget UX recommendation:**
- if `INSUFFICIENT_CREDITS` show “Upgrade/Top-up” CTA
- if `INSTANCE_PAUSED` show “Resume” CTA

## 3.4 Gateway → Control Plane billing (authorize/settle)
Critical: avoid **double charges**.

### Authorize
- if CP returns **allowed=false** → do not call Runner
- CP returns `reservationId` and reserved `budget`
- retries allowed on 502/503/504 with the same request body

### Settle
- settle must be **idempotent** using `reservationId`
- if settle call times out:
  - Gateway retries settle with the same payload
  - CP returns the same `ledgerEntryId` if already settled

## 3.5 Gateway → Runner → Runtime
- Runner retries to Langflow Runtime only on transport errors:
  - max 1 retry (to prevent duplicate tool calls)
- Runner must attach `runId` so execution can be de-duplicated if runtime supports it.

## 3.6 Runtime → Connector/MCP Gateway (tool calls)
- enforce per-instance allowlist + binding status
- Retry policy depends on tool type:
  - **Read-only APIs**: up to 2 retries on 502/503/504
  - **Write APIs**: no automatic retries unless tool supports idempotency keys

## 3.7 Connector Gateway → Vault
- retry on 503/504 (1–2 retries)
- if Vault down: return `503 VAULT_UNAVAILABLE` (do not run tools)

## 3.8 RAG ingestion pipeline
- presigned URL upload to MinIO is client-driven; MinIO returns 4xx/5xx.
- CP ingestion request to Ragflow:
  - retry on 502/503/504 (up to 3)
- If Ragflow down:
  - mark ingestion job as `RETRY_PENDING`
  - expose status to user and retry asynchronously

---

## 4) Timeouts (MVP defaults)
- Gateway → Runner: **60s** (tune per offering)
- Runner → Runtime: **60s**
- Tool call default: **15s** (configurable per tool)
- Vault read: **2s**
- Ragflow query: **10s**
- Ragflow ingest: **60s** (async recommended)

---

## 5) Rate limiting & abuse control
- Per instance: requests/min, concurrent runs, tool calls/min
- Per widget origin: session init/min, chat/min
- Return **429** with `Retry-After`

---

## 6) Failure modes & expected safe behavior
1) **CP down**:
   - paid plans: fail closed (block runs)
   - trial: optional soft-fail but cap concurrency and reconcile later
2) **Vault down**: fail closed for any tool requiring secrets
3) **Connector Gateway down**: fail closed for tool calls
4) **Ragflow down**: return `RAG_UNAVAILABLE` for RAG flows
5) **MinIO down**: block artifact fetch and RAG upload; return 503

---

## 7) Add these to the “minimum E2E test suite”
- settle idempotency: retry settle with same reservationId returns same ledgerEntryId
- webhook retries: duplicate OrderFullyPaid does not create duplicates
- tool call safety: “write” tool is not retried; “read” tool is retried
- Vault outage: tool call fails closed (no secret leakage)
- rate limiting: 429 + Retry-After + UI behavior
