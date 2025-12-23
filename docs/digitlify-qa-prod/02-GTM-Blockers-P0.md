# GTM Blockers (P0) — Fix Before QA

This is the “stop-ship” list. If any item is not done, QA will produce false negatives or buyers cannot complete a basic journey.

## P0-01 — Customer Console is missing core capability management
**Symptom:** Buyer cannot configure their subscribed agent/app (training, branding, widget, channels, connectors).  
**Evidence:** Instance pages exist but key tabs are placeholders:
- `marketplace/src/app/[channel]/(main)/account/instances/[instanceId]/configuration/page.tsx` → “coming soon”
- `.../connectors/page.tsx` → “coming soon”
- `.../usage/page.tsx` → “coming soon”

**Fix (MVP):**
- Implement the minimal “Customer Console” tabs for an Instance:
  1) Overview
  2) Data & Training (RAG sources)
  3) Channels: Widget + API + MCP keys
  4) Branding
  5) Connectors (CRM etc)
  6) Usage & limits
- Backed by CP endpoints (new app `instance_config` + `knowledge_bases`), and Gateway endpoints (API key auth + widget session).

**Acceptance:** A buyer can complete onboarding + see embed snippet + create API key + upload/ingest a data source + test chat.

---

## P0-02 — Gateway/Runner metering is stubbed (credits remain inaccurate)
**Symptom:** `usage` always returns zeros; billing uses a constant per-run charge.  
**Evidence:** Runner builds usage with zeros and `requests:1`; Gateway billing is not driven by actual token usage.

**Fix (MVP):**
- Implement a consistent **Usage Event** emitted per run:
  - `tenant_id, org_id, instance_id, run_id, model, tokens_in, tokens_out, duration_ms, tool_calls, status`
- Integrate OpenMeter (or at minimum, a “billing export hook” that emits to Kafka/HTTP).

**Acceptance:** Each run produces a usage event and decrements credits accurately; wallet shows correct balance.

---

## P0-03 — API key auth path is missing (widget + API usage without SSO)
**Symptom:** Gateway requires JWT SSO for `/v1/runs` and `/v1/widget/session:init`.  
**Fix (MVP):**
- Add an API key auth mode:
  - Header: `X-API-Key: <key>`
  - Validate against CP `instances/<id>/api_keys` (or a dedicated endpoint for key introspection).
  - Map key → `tenant_id/org_id/instance_id` + entitlements.
- Keep JWT mode for “console UI” and admin actions.

**Acceptance:** Widget and API calls work for end-users without Keycloak login.

---

## P0-04 — External Secrets / Vault key paths likely incorrect
**Symptom:** Multiple ExternalSecrets use Vault keys like `secret/data/...` while ClusterSecretStore is configured with `path: secret` and `version: v2`.  
**Impact:** Secrets may not sync; apps fail at runtime.

**Fix:** Standardize `remoteRef.key` to **v2 relative keys** (e.g., `runtime/oauth2`, `studio/env`, etc.) and set `property:` for fields.

**Acceptance:** ESO status `Synced=True` for all ExternalSecrets in QA.

---

## P0-05 — “My Agents” navigation is confusing + brittle
**Symptom:** “My Agents” links to a demo “subscriptions” page; real management should be per Instance.  
**Fix (MVP):**
- Rename “My Agents” → “My Subscriptions” or “My Instances”
- Link to `/account/instances`
- Replace demo data with CP-backed instances listing.

**Acceptance:** Buyer sees real purchased instances and can open them.

---

## P0-06 — Payments not enabled (Stripe)
**Symptom:** Stripe not configured in GitOps; checkout/payment cannot be validated end-to-end.  
**Fix (Fast GTM options):**
- QA: use Saleor Dummy payments or manual “mark as paid” flow to validate provisioning.
- Prod: enable Stripe via Saleor payment app/plugin; configure webhooks; store secrets in Vault.

**Acceptance:** A paid order triggers CP provisioning webhook and creates an instance + entitlements.

---

## P0-07 — E2E tests hard-code dev.gsv.dev URLs
**Impact:** QA/prod runs require editing code → drift.  
**Fix:** Parameterize Playwright URLs via env (`E2E_BASE_URL`, `E2E_CP_URL`, etc.).

**Acceptance:** `ENV=qa` runs E2E suite against QA hostnames without code changes.

