# Saleor Attribute Schema v1 — Agent Store Discovery + Commerce Mapping
_Last updated: 2025-12-18

This schema defines **exact** Saleor attributes, product types, and metadata mapping required by the storefront.

## 1) Saleor Product Types (recommended)
Create these Saleor product types:

1. `offering` — for marketplace listings (Agents/Apps/Assistants/Automations)
2. `plan` — (optional) if you want plans as separate products; otherwise use variants of offering
3. `credit_pack` — top-ups (one-time)
4. `gift_card_product` — gift cards (redeem codes)

**MVP recommendation:** Use `offering` with plan variants, plus separate products for credit packs and gift cards.

## 2) Product-level attributes (discovery facets)

> Attribute types use Saleor’s attribute input types:
- `DROPDOWN`
- `MULTISELECT`
- `BOOLEAN`
- `RICH_TEXT` (or store content in Wagtail)

### 2.1 Category + taxonomy
1) `gsv_category` (DROPDOWN) — required
- Values: `agent`, `app`, `assistant`, `automation`

2) `gsv_roles` (MULTISELECT)
- Values: `customer_support`, `sales`, `marketing`, `hr`, `it_helpdesk`, `ops`, `finance`

3) `gsv_value_stream` (MULTISELECT) — required for GTM curation
- Values (8): `customer_support`, `sales_outreach`, `hr_ops`, `marketing_content`, `knowledge_assistant`, `meeting_scheduler`, `data_extraction`, `monitoring_alerting`

### 2.2 Capability tags (maps to Capability Registry keys)
4) `gsv_capabilities` (MULTISELECT) — required
- Values MUST match capability keys exactly (examples):
  - `rag.knowledge_base`
  - `web_widget.branding`
  - `integrations.mcp_tools`
  - `multilingual.i18n`
  - `multimodal.vision_audio`
  - `governance.audit_logging`
  - `ops.scheduling`
  - `security.tenant_isolation`
  - `billing.credits_wallet`

### 2.3 Integrations + compatibility
5) `gsv_integrations_required` (MULTISELECT)
- Values are connector IDs, e.g.: `slack`, `zendesk`, `salesforce`, `gmail`, `google_calendar`, `jira`, `confluence`, `mcp.generic`

6) `gsv_modalities` (MULTISELECT)
- Values: `text`, `image`, `audio`, `video`

7) `gsv_languages_supported` (MULTISELECT)
- Values: ISO-ish codes: `en`, `hi`, `es`, `fr`, ...

### 2.4 Deployment + trust signals
8) `gsv_deployment_modes_supported` (MULTISELECT)
- Values: `shared`, `dedicated_namespace`, `vcluster`, `dedicated_cluster`

9) `gsv_trial_available` (BOOLEAN)
- Values: true/false

10) `gsv_verified` (BOOLEAN)
- Values: true/false

11) `gsv_badges` (MULTISELECT) — optional UI rails
- Values: `featured`, `trending`, `new`, `popular`

12) `gsv_maturity` (DROPDOWN)
- Values: `beta`, `stable`, `enterprise`

## 3) Variant-level attributes (plan details)
Use variants to represent plans for an offering.

1) `gsv_plan_kind` (DROPDOWN) — required
- Values: `subscription`, `topup`, `gift`

2) `gsv_billing_period` (DROPDOWN) — for subscriptions
- Values: `monthly`, `yearly`

3) `gsv_credits_grant` (DROPDOWN or numeric metadata)
- Prefer metadata for numeric credit amounts:
  - metadata key: `cp.creditsGrant`
  - value: integer string (e.g., `"10000"`)

4) `gsv_deployment_mode` (DROPDOWN)
- Values: `shared`, `dedicated_namespace`, `vcluster`, `dedicated_cluster`

## 4) Required Saleor metadata keys (bridge to Control Plane)

### 4.1 Product metadata (offering mapping)
On the Saleor product, set:
- `cp.offeringId` = Control Plane offering ID

Example:
```json
[{ "key":"cp.offeringId","value":"off_customer_support_agent" }]
```

### 4.2 Variant metadata (plan mapping)
On each variant, set:
- `cp.offeringId`
- `cp.offeringVersionId`
- `cp.planId`

Example:
```json
[
  { "key":"cp.offeringId","value":"off_customer_support_agent" },
  { "key":"cp.offeringVersionId","value":"ov_2026_01_001" },
  { "key":"cp.planId","value":"pro_shared" }
]
```

### 4.3 Credit pack product mapping
For top-ups, set on variant:
- `cp.creditPackId` (e.g., `topup_5000`)
- `cp.creditsGrant` (e.g., `5000`)

### 4.4 Gift card mapping
If using CP-issued redeem codes (recommended), set on variant:
- `cp.giftSku` (e.g., `gift_10000_1y`)
- `cp.redeemType` = `credits` or `membership_pass`
- `cp.expiresDays` (e.g., `365`)

## 5) How storefront filters map to Saleor API
- Category tabs -> filter by `gsv_category`
- Browse by Role -> filter by `gsv_roles`
- Browse by Outcome -> filter by `gsv_value_stream`
- Browse by Capability -> filter by `gsv_capabilities`
- “Trial only” -> filter by `gsv_trial_available=true`
- “Verified” -> filter by `gsv_verified=true`
- Integrations filter -> `gsv_integrations_required`

## 6) Operational note: capability truth
Saleor attributes are for discovery. **Control Plane entitlements are authoritative**.
Storefront must always fetch CP entitlements before showing editable config or running.
