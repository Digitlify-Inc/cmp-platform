# UI Spec v1 — GSV Agent Store Storefront
_Last updated: 2025-12-18

This spec turns the provided mockups into an implementable v1 storefront for a **credit-first AI Agent Store** using:

- **Saleor** = discovery + pricing + checkout + orders (commerce plane)
- **Control Plane (CP)** = wallet/ledger + entitlements + provisioning + effective config (platform plane)
- **Gateway** = OIDC enforcement + credit authorize/settle + execution entrypoint + widget sessions (runtime edge)

## 1) Assumptions and naming

### Categories (the 4 A’s)
- `agent`
- `app`
- `assistant`
- `automation`

### Core entities
- **Offering**: a sellable item in marketplace (maps to a Saleor **Product**).
- **Plan**: subscription plan variant or dedicated plan variant (maps to Saleor **ProductVariant**).
- **Instance**: a provisioned deployment for a buyer org/project (CP owned).

### IDs
- `offeringId`: Control Plane Offering ID (stable across versions)
- `offeringVersionId`: immutable version ID (points to Langflow artifact hash + capability set)
- `planId`: CP plan/entitlement id (credits grant, caps, deployment mode)
- Saleor product/variant uses metadata to map to CP IDs.

---

## 2) Route map (Next.js App Router)

> Notation: `R:` route, `SSR:` server rendering recommended, `CSR:` client rendering.

### Public marketing + discovery
- **R:** `/` (Home, matches mockups) — SSR
- **R:** `/marketplace` (All offerings + browse modes) — SSR (initial) + CSR (filters)
- **R:** `/marketplace/[category]` (Agents/Apps/Assistants/Automations) — SSR + CSR
- **R:** `/marketplace/[category]/[slug]` (Offering PDP + config + Try/Buy) — SSR + CSR
- **R:** `/solutions` (Role-based solution landing) — SSR
- **R:** `/solutions/[role]` (role page -> curated collections) — SSR
- **R:** `/outcomes/[valueStream]` (value stream page) — SSR
- **R:** `/capabilities/[capKey]` (capability landing + offerings) — SSR
- **R:** `/pricing` (plans + credit packs + gift cards) — SSR
- **R:** `/blog` (Wagtail) — SSR
- **R:** `/docs` (product docs) — SSR

### Auth + account
- **R:** `/login` (redirect to Keycloak)
- **R:** `/account` (profile + org/project selector) — CSR
- **R:** `/account/billing` (wallet, ledger, invoices) — CSR
- **R:** `/account/instances` (list instances) — CSR
- **R:** `/account/instances/[instanceId]` (instance details, config, logs) — CSR
- **R:** `/redeem` (gift card / coupon / credit code redeem) — CSR

### Runtime UI surfaces
- **R:** `/run/[instanceId]` (Run console: chat/app view) — CSR
- **R:** `/widget/preview/[instanceId]` (Widget preview with branding controls) — CSR

---

## 3) Global UI layout + navigation spec

### Header (persistent)
- Logo (home)
- Primary: Marketplace, Solutions, Pricing, Blog, Docs
- Search (marketplace search)
- Right-side:
  - If unauthenticated: Log in, **Get Started Free**
  - If authenticated:
    - **Credits badge** (balance + Top up)
    - Profile menu (Org/Project switch, Billing, Instances, Logout)

### Marketplace browse modes (within /marketplace)
Segment control (sticky below header):
- Browse by **Category** (default) — the 4 A’s tabs
- Browse by **Role**
- Browse by **Outcome** (Value Streams)
- Browse by **Capability**

> Implementation: same listing UI; only “primary facet” changes.

---

## 4) Component inventory (v1)

### 4.1 Layout + shared
- `AppShell`
- `HeaderNav`
- `SearchBar`
- `CreditsBadge`
- `AuthGate` (ensures Keycloak token, otherwise redirect)
- `Toasts`

### 4.2 Marketplace listing
- `BrowseModeSwitcher`
- `FacetRail` (filters)
- `OfferingGrid`
- `OfferingCard`
- `SortDropdown`
- `Pagination` (or infinite scroll v2)

### 4.3 PDP
- `OfferingHero`
- `PlanSelector`
- `CTAGroup` (Try / Buy / Deploy / Contact Sales)
- `CapabilityChips`
- `ValueStreamChips`
- `ConnectorRequirements`
- `ConfigWizard` (capability-driven config UI)
- `CreditsCostEstimator`
- `IsolationOptions` (Shared vs Dedicated)
- `WidgetPreviewPanel` (only when widget capability present)
- `TrustSignals` (Verified, Featured, SLA)
- `FAQBlocks` (Wagtail blocks)
- `Changelog` (Offering version history)

### 4.4 Account
- `OrgProjectSwitcher`
- `InstancesTable`
- `InstanceDetail`
- `WalletPanel`
- `LedgerTable`
- `TopUpCTA`
- `RedeemCodeForm`

### 4.5 Runtime
- `RunConsole`
- `ChatTranscript`
- `RunHistory`
- `UsageSummary` (tokens/tool calls -> credits)
- `BlockedState` (insufficient credits -> top-up)

---

## 5) Data contracts — by component

Conventions:
- All calls are HTTPS.
- All CP & Gateway calls include:
  - `Authorization: Bearer <USER_JWT>` (user-level)
  - `X-Org-Id`, `X-Project-Id` when multi-project selection is enabled (optional in MVP if CP infers from token).
- Idempotent writes include `Idempotency-Key`.

### 5.1 `CreditsBadge`
**Purpose:** show current credit balance + quick top-up entry.

**Props**
```ts
type CreditsBadgeProps = { compact?: boolean }
```

**Data sources**
- CP: `GET /wallets/me`

**Response shape (minimum)**
```json
{
  "walletId": "wal_123",
  "balance": 1240,
  "currency": "CREDITS",
  "renewalAt": "2026-01-01T00:00:00Z",
  "plan": {"planId":"pro","name":"Pro","monthlyCredits":10000}
}
```

**Error states**
- 401 -> show “Log in”
- 503 -> show badge with “—” and tooltip “Billing unavailable”

---

### 5.2 `OfferingGrid`
**Purpose:** render offer cards, supports filters and search.

**Primary data source**
- Saleor GraphQL: products + attributes + variants pricing (for display)

**Optional enrichment (recommended)**
- CP: `POST /offerings/enrich` (batch) returning:
  - `trialAvailable`, `startingCreditsEstimate`, `requiresAuth`, `deploymentModes`

**Saleor query (minimum)**
```graphql
query Products($first:Int!, $filter:ProductFilterInput, $sortBy:ProductOrder) {
  products(first:$first, filter:$filter, sortBy:$sortBy) {
    edges { node {
      id slug name description
      thumbnail { url alt }
      attributes { attribute { slug } values { slug name } }
      variants { id name pricing { price { gross { amount currency } } } metadata { key value } }
      metadata { key value }
    } }
  }
}
```

**Contract: how filters map to Saleor**
- Capability filters -> Saleor product attribute `gsv_capabilities`
- Value streams -> `gsv_value_stream`
- Roles -> `gsv_roles`
- Category tabs -> product type or attribute `gsv_category`

---

### 5.3 `OfferingCard`
**Props**
```ts
type OfferingCard = {
  product: SaleorProductSummary,
  enrich?: {
    startingCreditsEstimate?: number,
    trialAvailable?: boolean,
    deploymentModes?: string[],
    verified?: boolean
  }
}
```

**UI requirements**
- Show Category badge (Agents/Apps/Assistants/Automations)
- Show chips: top 3 capabilities + “+N more”
- Show price: “from $X/mo” (Saleor)
- Show credit estimate: “~Y credits / run” (if available)
- CTAs:
  - Try (if trialAvailable)
  - View details

**Navigation**
- Click card -> `/marketplace/[category]/[slug]`

---

### 5.4 `PlanSelector` (PDP)
**Data sources**
- Saleor: variants (plans) for the product
- CP: `GET /offerings/{offeringId}/versions/{offeringVersionId}/plans` (optional; CP authoritative on entitlements)

**Saleor variant metadata mapping (required)**
- Each plan variant must include metadata:
  - `cp.planId`
  - `cp.offeringId`
  - `cp.offeringVersionId`

Example variant metadata:
```json
[
  { "key":"cp.offeringId", "value":"off_support_agent" },
  { "key":"cp.offeringVersionId", "value":"ov_2026_01_001" },
  { "key":"cp.planId", "value":"pro_shared" }
]
```

---

### 5.5 `CTAGroup` (Try / Buy / Deploy)
**Try flow (credit-first)**
1) Ensure auth
2) CP: `POST /orgs/auto`
3) CP: `POST /instances` (trial/shared)
4) Navigate to `/run/[instanceId]`

**Contracts**
- `POST /orgs/auto`
```json
{ "source":"storefront", "defaultProjectName":"Default" }
```

Response:
```json
{ "orgId":"org_1","projectId":"proj_1","walletId":"wal_1" }
```

- `POST /instances`
```json
{
  "offeringVersionId":"ov_2026_01_001",
  "planId":"trial_shared",
  "displayName":"Customer Support Agent (Trial)",
  "mode":"shared"
}
```

Response:
```json
{ "instanceId":"inst_123","state":"PROVISIONING" }
```

**Buy flow**
- UI calls Saleor checkout (see 5.10)
- After payment, Saleor webhook -> Provisioner -> CP provisions instance.
- UI shows “Provisioning…” and polls CP instance state.

---

### 5.6 `ConfigWizard` (capability-driven)
**Purpose:** render config UI dynamically from Capability Registry + effective entitlements.

**Inputs**
- Capability registry: static JSON Schema bundle (build-time) or CP: `GET /capabilities`
- CP: `GET /instances/{instanceId}/entitlements`
- CP: `GET /instances/{instanceId}/config`

**Update**
- CP: `PUT /instances/{instanceId}/config` (idempotent by configHash)
```json
{
  "config": {
    "web_widget": { "branding": { "primaryColor":"#6D28D9", "logoUrl":"...", "allowedDomains":["https://example.com"] } },
    "rag": { "kbId":"kb_123" },
    "languages": ["en","hi"]
  }
}
```

Response:
```json
{ "instanceId":"inst_123","configVersion":"cv_002","state":"ACTIVE" }
```

**Validation**
- UI validates against JSON Schema for each capability before submitting.
- CP re-validates and rejects with structured errors:
```json
{
  "error":"CONFIG_VALIDATION_FAILED",
  "details":[{"path":"/web_widget/branding/allowedDomains/0","message":"must be https"}]
}
```

---

### 5.7 `WidgetPreviewPanel` (branding + embed)
**Presence rule**
- Show only if capability `web_widget.branding` is enabled and entitled.

**Session contract**
- UI -> Gateway: `POST /v1/widget/session`
```json
{
  "instanceId":"inst_123",
  "origin":"https://example.com",
  "mode":"preview"
}
```

Response:
```json
{ "widgetToken":"jwt...", "embedUrl":"https://api.yourdomain.com/widget.js" }
```

**Embed snippet (rendered)**
```html
<script src="https://api.yourdomain.com/widget.js" async></script>
<script>
  DigitlifyWidget.init({
    instanceId: "inst_123",
    token: "jwt...",
    position: "bottom-right"
  })
</script>
```

---

### 5.8 `RunConsole` (execute)
**Run**
- UI -> Gateway: `POST /v1/runs`
```json
{
  "instanceId":"inst_123",
  "input": {
    "message":"Hello, I need help with my order",
    "locale":"en-US",
    "channel":"web"
  }
}
```

Response (stream or poll):
```json
{
  "runId":"run_001",
  "status":"RUNNING"
}
```

**Usage summary**
- UI -> CP: `GET /runs/{runId}/usage` (optional), or Gateway returns usage in final response:
```json
{
  "runId":"run_001",
  "status":"SUCCEEDED",
  "output": { "message":"Sure—what is your order id?" },
  "usage": {
    "tokensIn": 420,
    "tokensOut": 180,
    "toolCalls": 2,
    "ragQueries": 1,
    "creditsDebited": 28
  }
}
```

**Blocked state**
- If Gateway returns:
```json
{ "error":"INSUFFICIENT_CREDITS", "required": 10, "balance": 0 }
```
UI must show Top-up CTA (links to `/pricing#topups` or direct cart).

---

### 5.9 `WalletPanel` + `LedgerTable`
- CP: `GET /wallets/{walletId}`
- CP: `GET /wallets/{walletId}/ledger?limit=50`

Ledger row:
```json
{
  "entryId":"led_001",
  "type":"DEBIT",
  "amount": 28,
  "reason":"RUN",
  "ref": { "runId":"run_001","instanceId":"inst_123" },
  "createdAt":"..."
}
```

---

### 5.10 Checkout (Saleor)
For MVP you can use Saleor’s storefront integration and direct checkout redirect.

**Flow**
1) UI creates checkout with selected variant
2) UI redirects to payment / completes checkout
3) On payment: Saleor sends webhook to Provisioner App
4) UI polls CP instance state

**Saleor mutation (minimum)**
```graphql
mutation CheckoutCreate($lines:[CheckoutLineInput!]!, $email:String) {
  checkoutCreate(input: { lines:$lines, email:$email }) {
    checkout { id token }
    errors { field message }
  }
}
```

Line input uses variant ID:
```json
{ "lines":[{ "variantId":"UHJvZHVjdFZhcmlhbnQ6MTIz", "quantity":1 }] }
```

---

## 6) Mapping: Saleor discovery ↔ Capability Registry ↔ CP entitlements

### 6.1 Saleor attributes store “what it is”
- Category, role, outcome/value stream, capabilities, integrations, deployment modes, languages, modalities

### 6.2 CP entitlements store “what buyer gets”
- trial credits, monthly credits, caps, allowlists, limits, policies (hard enforcement)

### 6.3 Rule: UI should render config based on CP effective entitlements
Even if Saleor lists a capability, only CP decides if it’s enabled for the buyer plan.

---

## 7) Non-functional requirements (v1)
- **Fast discovery**: SSR list + client filters; cache Saleor product list (60–120s)
- **No secrets in frontend**: tokens only; no connector secrets
- **Idempotency**: all provisioning/billing writes must include idempotency keys
- **Accessibility**: keyboard nav, proper contrast, readable pricing
- **Internationalization**: UI strings ready for i18n; offerings have supported locales attribute

---

## 8) Acceptance criteria (v1)
- Browse by Category/Role/Outcome/Capability works and is facet-consistent.
- PDP shows: capabilities, connector requirements, pricing, Try, Buy.
- Try creates trial instance + runs successfully; credits debit shown.
- Buy provisions instance via Saleor webhook; instance becomes ACTIVE.
- Wallet/ledger visible; blocked at zero credits; top-up unblocks.
- Widget preview shows branding changes and generates embed snippet.
