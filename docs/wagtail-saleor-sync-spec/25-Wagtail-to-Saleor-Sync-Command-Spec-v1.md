# 25 — One-time Sync Command Spec v1
_Wagtail → Saleor attribute enforcement + product metadata alignment_  
_Last updated: 2025-12-19_

This spec defines a **one-time** (but re-runnable) sync command that ensures:

1) **Wagtail editorial taxonomies cannot drift** from Saleor catalog filters.  
2) Saleor products always have the **correct attribute values** for discovery.  
3) Saleor products always have required **platform metadata** (e.g., `cp_offering_id`, credit estimates).

> Scope: GTM v1. Single vendor (your own offerings). Multi-vendor later.

---

## 1) Why this exists (the “no guessing” rule)

You have two sources:
- **Wagtail**: editorial pages, outcome/role/capability copy, curated rails.
- **Saleor**: catalog + attributes for filtering + checkout.

If these drift, you get:
- broken filters (UI shows terms that don’t match catalog)
- wrong badges / missing “Trial available”
- missing or stale `cp_offering_id` / credit estimate shown on cards
- inconsistent browse-by modes (Outcome/Role/Capability/Category)

This command makes **Wagtail the canonical taxonomy** and enforces Saleor to match.

---

## 2) Core assumptions

### Wagtail modeling assumptions
- Taxonomies are stored as **Snippets** (Role, Outcome, Capability, Integration, Language, Badge, etc.)
- Each Wagtail “Offering” editorial page stores a reference to its Saleor product via one of:
  - `saleor_product_id` (preferred) or
  - `saleor_product_slug`

### Saleor modeling assumptions
- Offerings are Saleor **Products** with:
  - attribute values set (filters)
  - metadata set (platform IDs + estimates)
- Pricing is owned by Saleor **Variants** (plans)
- Credit Packs and Gift Cards are also Saleor products (separate product types)

---

## 3) Command interface

### Command name
`sync_wagtail_to_saleor`

### Location
- Prefer a Django management command inside the Wagtail project:
  - `cms/management/commands/sync_wagtail_to_saleor.py`
- Alternative: standalone script (same logic), but mgmt command is better for DB access and CI.

### CLI flags
- `--dry-run` (default true in dev)
- `--strict` (fail if anything missing; no auto-create)
- `--create-missing` (create missing attribute *values* in Saleor if absent)
- `--sync-attributes` (ensure attributes exist + assigned to product types)
- `--sync-products` (apply attribute values + metadata to products)
- `--limit <N>` (only sync first N offerings)
- `--only-slugs slug1,slug2`
- `--report-path <file>` (JSON report output)

### Env vars
- `SALEOR_API_URL`
- `SALEOR_TOKEN` (app token with product+attribute management permissions)
- `SALEOR_CHANNEL_SLUG` (optional; only needed if writing channel-specific metadata)

---

## 4) The mapping contract (canonical)

The following is the **single source of truth** mapping between Wagtail taxonomies and Saleor attributes.

> Naming assumes your existing Saleor schema file (`23-Saleor-Attribute-Schema-v1.md`) created these keys.

### 4.1 Saleor Attribute Keys (filters)
| Browse/Filter | Wagtail field | Saleor attribute key | Value type |
|---|---|---|---|
| Category | `offering.category` | `gsv_category` | enum |
| Role | `offering.roles[]` | `gsv_roles` | multi enum |
| Outcome | `offering.outcomes[]` | `gsv_value_stream` | multi enum |
| Capability | `offering.capabilities[]` | `gsv_capabilities` | multi enum |
| Integrations | `offering.integrations[]` | `gsv_integrations_required` | multi enum |
| Languages | `offering.languages[]` | `gsv_languages_supported` | multi enum |
| Modalities | `offering.modalities[]` | `gsv_modalities` | multi enum |
| Deployment | `offering.deployment_modes[]` | `gsv_deployment_modes_supported` | multi enum |
| Trial | `offering.trial_available` | `gsv_trial_available` | boolean |
| Verified | `offering.verified` | `gsv_verified` | boolean |
| Badges | `offering.badges[]` | `gsv_badges` | multi enum |
| Maturity | `offering.maturity` | `gsv_maturity` | enum |

### 4.2 Saleor Product Metadata Keys (platform)
These are written to **Saleor product metadata** (not attributes).

| Purpose | Key | Source |
|---|---|---|
| Control Plane offering id | `cp_offering_id` | Wagtail field `cp_offering_id` |
| Control Plane offering version | `cp_offering_version_id` | Wagtail field `cp_offering_version_id` (optional in GTM) |
| Credit estimate (min) | `credits_estimate_min` | Wagtail field `credits_estimate_min` |
| Credit estimate (max) | `credits_estimate_max` | Wagtail field `credits_estimate_max` |
| Credit estimate label | `credits_estimate_label` | Wagtail derived (e.g., "~15/run") |
| Short outcome tagline | `outcome_tagline` | Wagtail `card_tagline` |
| Primary outcome key | `primary_outcome` | Wagtail `primary_outcome.key` |
| Primary role key | `primary_role` | Wagtail `primary_role.key` |
| Card image URL | `card_image_url` | Wagtail resolved rendition URL |

> **Invariant:** The Storefront listing card uses metadata for **credit estimate** and image, but uses **attributes for filtering**.

---

## 5) Sync steps (deterministic)

### Step A — Build canonical taxonomies from Wagtail
From Snippets:
- Roles
- Outcomes (value streams)
- Capabilities (must match Capability Registry keys)
- Integrations
- Languages
- Modalities
- Deployment modes
- Badges
- Maturity levels

Each snippet must have:
- `key` (stable slug, lowercase, snake_case)
- `label` (display name)
- optional `description`

### Step B — Ensure Saleor attributes exist and are assigned (optional but recommended)
If `--sync-attributes`:
1. Verify attribute definitions exist by **slug** (e.g., `gsv_capabilities`).
2. Verify attribute input type matches expectation (multi enum vs boolean).
3. Verify attributes are assigned to the correct product types:
   - `Offering`
   - `CreditPack`
   - `GiftCard`

> In `--strict` mode: fail if anything is missing.  
> In `--create-missing` mode: only create **attribute values**, not new attributes (creating attributes is usually a one-time infra action).

### Step C — Ensure Saleor attribute values exist (enforcement)
For each Wagtail taxonomy entry, ensure a corresponding Saleor attribute value exists.

Rules:
- Saleor attribute value slug MUST equal Wagtail `key`.
- Saleor attribute value name MUST equal Wagtail `label`.

If missing:
- strict: fail and report
- create-missing: create it

### Step D — Sync each Offering page → Saleor product
For each Wagtail OfferingPage:
1. Resolve Saleor product:
   - Use `saleor_product_id` if present; otherwise lookup by `saleor_product_slug`.
2. Compute expected attribute values from Wagtail fields using mapping table.
3. Upsert product attribute assignments to exactly match expected values.
4. Upsert product metadata keys (cp ids + credit estimates + tagline).
5. Report drift (before vs after).

### Step E — Drift detection rules (guardrails)
The command should error (or warn) when:
- Wagtail references a taxonomy key not present in registry (capability) or snippet set
- Offering has no `cp_offering_id`
- Saleor product is missing or duplicated
- Saleor attributes contain values not present in Wagtail taxonomy (optional warning)

---

## 6) Retry / idempotency

This is not a webhook; it’s a sync job. Still, it must be safe to rerun.

Idempotency rules:
- Creating attribute values: guarded by slug equality.
- Updating product metadata: overwrite if different.
- Updating product attribute assignments: set to the exact desired set.

Retry policy:
- For Saleor GraphQL calls, retry on `429/5xx` with exponential backoff:
  - attempts: 5
  - base: 0.5s, max: 8s
- Fail fast on `4xx` validation errors.

---

## 7) Report output (machine + human)

Produce a JSON report with:
- `created_attribute_values[]`
- `updated_products[]` (with before/after diffs)
- `missing_products[]`
- `missing_taxonomies[]`
- `errors[]`
- `warnings[]`

Also print a concise summary to stdout.

---

## 8) Test plan (minimum)

### 8.1 Unit tests (local)
- mapping table produces correct Saleor payloads
- unknown capability key triggers strict failure
- credit estimate label derivation works

### 8.2 Integration tests (dev)
- `--dry-run` produces report without writes
- `--create-missing` creates new attribute values
- `--sync-products` updates product attributes + metadata

---

## 9) Operational usage pattern

### One-time bootstrap
1) Create Saleor attributes (infra step)  
2) Populate Wagtail taxonomies + offering pages  
3) Run sync command (dry-run)  
4) Fix errors (missing cp ids, mismatched keys)  
5) Run sync command (write)  
6) Lock schema (CI check or periodic drift scan)

### Optional drift check in CI (recommended)
- run in `--dry-run --strict`
- fail build if drift detected

---

## 10) Appendix: canonical key rules
- all keys lowercase
- snake_case
- stable forever (labels may change; keys must not)
- capability keys must match Capability Registry `id`
