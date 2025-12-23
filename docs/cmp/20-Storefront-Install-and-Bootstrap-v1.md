# 20 — Storefront Install & Bootstrap v1 (Saleor + Wagtail + Storefront)
_Last updated: 2025-12-18

This runbook covers **what to deploy** and the **minimum bootstrap steps** to get the v1 storefront working end-to-end with:
- Saleor (commerce)
- Wagtail (CMS)
- Storefront (Next.js)
- Control Plane + Gateway (platform/runtime edge)

> Scope: **GTM/MVP** (single vendor). Multi-vendor onboarding comes later.

---

## 1) Environments

### Recommended environments
- `dev` (local docker compose or kind)
- `staging` (k8s via ArgoCD)
- `prod` (k8s via ArgoCD)

### Domains (example)
- Storefront: `https://digitlify.com`
- Marketplace: `https://digitlify.com/marketplace`
- Saleor API: `https://saleor.digitlify.com/graphql/`
- Saleor Dashboard: `https://dashboard.digitlify.com`
- Wagtail: `https://cms.digitlify.com`
- Control Plane: `https://cp.digitlify.com`
- Gateway: `https://api.digitlify.com`
- Keycloak: `https://sso.digitlify.com`

---

## 2) Required components (platform BOM)

### 2.1 Storefront (Next.js)
- Node.js LTS
- Next.js App Router project
- Env vars (see §5)

### 2.2 Saleor++ (Commerce plane)
Minimum:
- Saleor API (GraphQL)
- Saleor Dashboard
- PostgreSQL (Saleor DB)
- Redis
- Webhook signing secret
- **Provisioner App** (your bridge: Saleor -> Control Plane)

### 2.3 Wagtail (CMS plane)
Minimum:
- Wagtail app
- PostgreSQL (Wagtail DB)
- Media storage (S3/MinIO or PVC)

### 2.4 Platform plane (already in your program)
Minimum:
- Control Plane (Django/DRF) + Postgres
- Gateway (OIDC + billing authorize/settle + execution)
- Keycloak (OIDC)
- Vault/OpenBao + External Secrets Operator (ESO)
- GitOps (ArgoCD) wired to your vendored repos

---

## 3) Bootstrap order (no-gaps)

### Step 0 — Verify auth first
1. Deploy Keycloak realm + clients:
   - `storefront` (public client or confidential with PKCE)
   - `gateway` (resource server)
   - `control-plane` (resource server)
2. Confirm login from browser returns a usable JWT.

### Step 1 — Bring up Saleor API + Dashboard
1. Deploy Saleor API + dependencies.
2. Create superuser/admin.
3. Open Dashboard and verify `graphql/` responds.

### Step 2 — Create discovery schema in Saleor (attributes)
Create the attributes and values from **23-Saleor-Attribute-Schema-v1.md**:
- `gsv_category` (+ values agent/app/assistant/automation)
- `gsv_roles`
- `gsv_value_stream`
- `gsv_capabilities`
- `gsv_integrations_required`
- `gsv_modalities`
- `gsv_languages_supported`
- `gsv_deployment_modes_supported`
- `gsv_trial_available`
- `gsv_verified`
- `gsv_badges`
- `gsv_maturity`

> Gate: You can filter products in GraphQL by these attributes.

### Step 3 — Create products (Offerings) + plan variants
For each offering product:
1. Set product metadata:
   - `cp.offeringId = <control-plane offering id>`
2. Attach attributes:
   - category, roles, value streams, capabilities, etc.
3. Create variants (plans):
   - Set variant metadata:
     - `cp.offeringId`
     - `cp.offeringVersionId`
     - `cp.planId`
   - Set pricing (monthly/yearly)

Also create:
- Credit pack products (top-ups) with `cp.creditPackId` and `cp.creditsGrant`
- Gift card products (if using CP-issued redemption codes) with `cp.giftSku`, `cp.redeemType`, `cp.expiresDays`

### Step 4 — Configure Saleor webhooks
In Saleor Dashboard:
1. Register the Provisioner App (or configure webhook endpoints directly).
2. Subscribe to:
   - `ORDER_FULLY_PAID` (required)
   - `ORDER_CANCELLED` (optional)
   - `ORDER_REFUNDED` (optional)
3. Configure signing secret and verify signatures in the Provisioner App.

**Idempotency requirement (hard):**
- Provisioner must call CP using `Idempotency-Key = saleor:<orderId>:<lineId>`.

### Step 5 — Deploy Provisioner App (Saleor bridge)
Provisioner responsibilities:
- Validate Saleor webhook signature.
- Normalize payload to your CP contract.
- Idempotent call to CP:
  - `POST /integrations/saleor/order-paid`
- Log correlation IDs:
  - `X-Request-Id`, `X-Saleor-Event-Id`.

### Step 6 — Deploy Wagtail (CMS)
1. Publish:
   - Home page sections (hero, 4 A’s, testimonials, etc.)
   - Role pages `/solutions/{role}`
   - Outcome pages `/outcomes/{valueStream}`
   - Capability explainers `/capabilities/{capKey}`
2. Ensure images/media work on your chosen storage backend.

### Step 7 — Deploy Storefront (Next.js)
Implement routes and components as per **21-UI-Spec-v1.md** and **22-Storefront-IA-and-Sitemap-v1.md**.
Verify:
- Marketplace list renders from Saleor products.
- PDP renders variants (plans) and attributes (capabilities/roles/outcomes).
- “Try” button hits CP (`/orgs/auto`, `/instances`) and redirects to `/run/{instanceId}`.
- “Buy” creates a Saleor checkout.

---

## 4) Minimal E2E “happy path” checklist

1. Anonymous browse `/marketplace` works.
2. Login via Keycloak works; header shows credits badge.
3. “Try” creates trial instance and run succeeds.
4. Checkout a plan; payment succeeds; Saleor webhook triggers CP provisioning.
5. Instance becomes ACTIVE and runs from `/run/{instanceId}`.
6. Credits debit; blocked at zero; top-up unblocks.

---

## 5) Storefront env vars (minimum)

Create `.env.local` in the Next.js storefront:

```bash
# Saleor
NEXT_PUBLIC_SALEOR_API_URL=https://saleor.digitlify.com/graphql/

# CMS
NEXT_PUBLIC_WAGTAIL_BASE_URL=https://cms.digitlify.com

# Platform
NEXT_PUBLIC_CP_BASE_URL=https://cp.digitlify.com
NEXT_PUBLIC_GATEWAY_BASE_URL=https://api.digitlify.com

# Auth (Keycloak)
NEXT_PUBLIC_KC_ISSUER=https://sso.digitlify.com/realms/<realm>
NEXT_PUBLIC_KC_CLIENT_ID=storefront

# Optional
NEXT_PUBLIC_BRAND_NAME=Digitlify
NEXT_PUBLIC_SUPPORT_EMAIL=support@digitlify.com
```

---

## 6) Operational notes (MVP)

### Keep the boundaries clean
- Storefront never talks to Langflow directly.
- Secrets never go to the browser.
- CP is the source of truth for entitlements and wallet/ledger.

### Caching
- Cache Saleor product list for 60–120 seconds.
- Never cache wallet/ledger responses.

### Rollback (storefront)
- Storefront deploy rollback is safe (stateless).
- Provisioner changes must remain backward compatible with webhook contracts.

---

## 7) “Done when” gates
- Saleor attribute schema is created and can filter products correctly.
- A sample offering with 2 plan variants exists and renders in the storefront.
- Provisioner app receives `ORDER_FULLY_PAID` and provisions idempotently.
- Try/Run/Buy/Top-up flows pass smoke tests.
