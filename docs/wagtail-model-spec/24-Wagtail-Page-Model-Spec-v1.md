# Wagtail Page Model Spec v1 — Digitlify / GSV Agent Store
_Last updated: 2025-12-19_

This spec defines **exact Wagtail page types + fields + StreamBlocks** for the GTM website and maps every taxonomy field to:

- **Saleor attributes** (discovery + filtering + commerce)
- **Capability Registry IDs** (platform entitlements/config)

It is aligned with your current storefront IA (Home / Marketplace / Solutions / Pricing / Blog) and the “Browse by: Category | Role | Outcome | Capability” pattern visible in your latest UI.  

---

## 0) Architecture assumption (headless CMS)

**Recommended split**
- **Wagtail** = marketing + editorial content (outcomes, roles, capability explainers, docs, blog)
- **Saleor** = product catalog, variants, checkout, orders
- **Control Plane** = wallet/ledger, entitlements, provisioning, effective config
- **Storefront (Next.js)** = single UI consuming **Wagtail + Saleor + CP**

**Implementation note**
- Wagtail exposes content via **Wagtail API v2** (or GraphQL if you prefer). Storefront reads Wagtail by slug and renders blocks exactly as defined below.

---

## 1) Canonical taxonomies (single source of truth)

These keys MUST match exactly across:
- Wagtail (Page fields + Snippets)
- Saleor (attribute values)
- Storefront routes/filters
- Control Plane (entitlements by capability)

### 1.1 Categories (4 A’s)
| key | label |
|---|---|
| `agent` | Agents |
| `app` | Apps |
| `assistant` | Assistants |
| `automation` | Automations |

### 1.2 Roles
| key | label |
|---|---|
| `customer_support` | Customer Support |
| `sales_sdr` | Sales / SDR |
| `marketing` | Marketing |
| `hr` | HR |
| `it_helpdesk` | IT / Helpdesk |
| `operations` | Operations |
| `finance` | Finance |

### 1.3 Outcomes (value streams)
| key | label |
|---|---|
| `customer_support` | Reduce support tickets |
| `sales_outreach` | Send personalized outreach |
| `knowledge_assistant` | Turn documents into answers |
| `meeting_scheduler` | Book meetings automatically |
| `marketing_content` | Create on-brand content |
| `data_extraction` | Extract data from files |
| `monitoring_alerting` | Monitor & alert on changes |
| `hr_ops` | Streamline HR ops |

### 1.4 Capabilities (MVP = 15)
Keys below come from your Capability Registry (`capability-registry.yaml`).  
Use **`saleor_value`** as the Saleor attribute value and **`id`** as the canonical registry ID.

| registry_id | saleor_value | title |
|---|---|---|
| `prompt_orchestrator` | `prompt_orchestrator` | Prompt Orchestrator |
| `tool_connectors` | `tool_connectors` | Tool Connectors |
| `mcp_tools` | `mcp_tools` | MCP Tools |
| `api_endpoint` | `api_endpoint` | API Endpoint |
| `chat_ui` | `chat_ui` | Chat UI |
| `web_widget` | `web_widget` | Web Widget |
| `multilingual` | `multilingual` | Multilingual |
| `multimodal_vision` | `multimodal_vision` | Multimodal Vision |
| `multimodal_audio` | `multimodal_audio` | Multimodal Audio |
| `rag_knowledgebase` | `rag_knowledgebase` | RAG Knowledgebase |
| `guardrails_policy` | `guardrails_policy` | Guardrails & Policies |
| `audit_trail` | `audit_trail` | Audit Trail |
| `scheduler_triggers` | `scheduler_triggers` | Scheduler & Triggers |
| `observability` | `observability` | Observability |
| `credits_wallet` | `credits_wallet` | Credits Wallet |

---

## 2) Saleor attributes (discovery/filtering schema)

Create (or verify) the following **Saleor Product attributes** and enforce them as required for any marketplace offering product.

### 2.1 Required attributes
- `gsv_category` (DROPDOWN) — one of: agent, app, assistant, automation
- `gsv_roles` (MULTISELECT) — one or more: customer_support, sales_sdr, marketing, hr, it_helpdesk, operations, finance
- `gsv_outcomes` (MULTISELECT) — one or more: customer_support, sales_outreach, knowledge_assistant, meeting_scheduler, marketing_content, data_extraction, monitoring_alerting, hr_ops
- `gsv_capabilities` (MULTISELECT) — subset of the 15 capability `saleor_value`s
- `gsv_deployment` (DROPDOWN) — `shared|dedicated_namespace|dedicated_vcluster|dedicated_cluster|on_prem`
- `gsv_maturity` (DROPDOWN) — `beta|stable|enterprise`

### 2.2 Optional attributes (badges + merchandising)
- `gsv_badges` (MULTISELECT): `verified|featured|trial_available|new|trending`
- `gsv_trial_available` (BOOLEAN)

### 2.3 Product metadata (recommended)
Saleor attributes don’t natively store structured objects. For credit estimates + CP linking, use **Product metadata**:
- `gsv.credit_estimate = {min_per_run, typical_per_run, max_per_run, notes}`
- `gsv.cp_offering_id = "<uuid-or-slug>"` (maps to Control Plane offering)
- `gsv.listing_rank = <int>` (optional for deterministic sorting)

---

## 3) Wagtail data models

We use **Pages** for routable content and **Snippets** for shared taxonomies/definitions.

### 3.1 Snippets (shared content models)

#### A) `RoleSnippet`
- `key` (slug, unique) — MUST match Saleor value
- `label` (string)
- `icon` (image, optional)
- `short_description` (text, optional)

#### B) `OutcomeSnippet`
- `key` (slug, unique) — MUST match Saleor value
- `label` (string)
- `hero_title` (string, optional override)
- `hero_subtitle` (text, optional override)
- `default_capabilities` (list of `CapabilitySnippet`, optional)
- `featured_products` (list of `SaleorProductRef`, optional)

#### C) `CapabilitySnippet`
- `registry_id` (slug, unique) — MUST match Capability Registry `id`
- `saleor_value` (slug, unique) — MUST match Saleor attribute value
- `title` (string)
- `short_description` (text)
- `group` (choice): `intelligence|integrations|experience|governance|ops|monetization`
- `icon` (image, optional)
- `docs_url` (url, optional)
- `config_ui_hint` (choice): `simple|advanced|hidden` (for future config UI)

#### D) `IntegrationSnippet`
- `key` (slug, unique) — MUST match Saleor integration value (e.g., `slack`)
- `label` (string)
- `kind` (choice): `connector|mcp|webhook|storage`
- `icon` (image, optional)
- `docs_url` (url, optional)

#### E) `SaleorProductRef` (utility snippet or reusable StructBlock)
- `saleor_product_id` (string, required)
- `saleor_slug` (string, required)
- `saleor_channel` (string, default `default-channel`)
- `override_card_title` (string, optional)
- `override_card_blurb` (text, optional)
- `override_card_image` (image, optional)

> **Source-of-truth**: all filterable taxonomy lives in **Saleor**; Wagtail “refs” are for editorial rails.

---

## 4) StreamBlocks (exact JSON shape for the storefront)

All marketing pages use a single `body` StreamField composed of blocks below.

### 4.1 `HeroBlock`
Fields:
- `title` (string)
- `subtitle` (text)
- `primary_cta` = { `label`, `href`, `kind` } where kind in `link|login|trial|marketplace`
- `secondary_cta` (same shape, optional)
- `background_style` (choice): `plain|gradient|image`
- `background_image` (image, optional)
- `kpis` (list of {`label`,`value`}, optional)

### 4.2 `TilesBlock`
Fields:
- `title` (string)
- `subtitle` (text, optional)
- `tiles` (list of Tile):
  - Tile = {`title`,`subtitle`,`href`,`icon`?}
- `layout` (choice): `2x2|3x2|4x2|carousel`

### 4.3 `StepsBlock`
Fields:
- `title` (string)
- `steps` (list of {`title`,`description`,`icon`?})

### 4.4 `OfferingsRailBlock`
Fields:
- `title` (string)
- `mode` (choice): `query|curated`
- If `query`:
  - `saleor_filter` (object): {
      `category`?, `roles`?, `outcomes`?, `capabilities`?, `integrations`?, `deployment`?, `badges`?
    }
  - `sort` (choice): `trending|new|rating|a_z|credits_low_high`
  - `limit` (int, default 6)
- If `curated`:
  - `products` (list of `SaleorProductRef`)
- `show_try_button` (bool, default true)

> The storefront executes `saleor_filter` using Saleor GraphQL with attributes listed in §2.

### 4.5 `CapabilitiesChipsBlock`
Fields:
- `title` (string)
- `capabilities` (list of `CapabilitySnippet` refs OR list of `saleor_value`s)
- `mode` (choice): `chips|cards`

### 4.6 `RichTextBlock`
Fields:
- `title` (string, optional)
- `body` (rich text)

### 4.7 `FAQBlock`
Fields:
- `items` (list of {`q`,`a`})

### 4.8 `PricingPlansBlock`
Fields:
- `title` (string)
- `plans` (list of `SaleorProductRef`)  *(subscription plans as products OR a single “Plans” product with variants)*
- `show_credits_badge` (bool, default true)

### 4.9 `TopupsBlock`
Fields:
- `title` (string)
- `topup_products` (list of `SaleorProductRef`) *(credit packs as products)*

### 4.10 `GiftCardsBlock`
Fields:
- `title` (string)
- `giftcard_products` (list of `SaleorProductRef`)

---

## 5) Page types (Wagtail Pages)

All pages share common SEO fields:
- `seo_title` (string)
- `search_description` (text)
- `og_image` (image, optional)
- `canonical_url` (url, optional)
- `noindex` (bool, default false)

### 5.1 `HomePage`
Route: `/`
Fields:
- `body` (StreamField) — typically: `HeroBlock` + `TilesBlock(outcomes)` + `StepsBlock` + `OfferingsRailBlock` + `PricingPlansBlock` + `CapabilitiesChipsBlock` + `RichTextBlock(security)` + CTA.

**Mapping**
- Outcome tiles MUST use Outcome keys from §1.3
- Capability chips MUST use capability `saleor_value` from §1.4

### 5.2 `MarketplaceLandingPage` (optional)
Route: `/marketplace`
Purpose: Marketing wrapper around the Saleor-powered marketplace experience.
Fields:
- `hero_title`, `hero_subtitle` (or via `body`)
- `body` (StreamField) — include “Browse by” explainer + featured rails

**NOTE**: Actual product grid is driven by Saleor (storefront route `/default-channel/marketplace`).

### 5.3 `SolutionsIndexPage`
Route: `/solutions`
Fields:
- `hero` (via `body`)
- `role_cards` (via `TilesBlock`) referencing Role keys

### 5.4 `RoleSolutionPage`
Route: `/solutions/<roleKey>`
Fields:
- `role` (FK to `RoleSnippet`, required)
- `body` (StreamField) implementing the “6 golden questions” narrative:
  - WHY, WHAT, WHO, HOW, HOW MUCH, WHAT NEXT
- `recommended_rail` (OfferingsRailBlock) using `gsv_roles=<roleKey>`

**Mapping**
- Role key MUST equal `gsv_roles` value in Saleor.

### 5.5 `OutcomePage`
Route: `/outcomes/<outcomeKey>`
Fields:
- `outcome` (FK to `OutcomeSnippet`, required)
- `body` (StreamField)
- `recommended_bundles` (OfferingsRailBlock) filter `gsv_outcomes=<outcomeKey>`
- `capabilities` (CapabilitiesChipsBlock, optional)

**Mapping**
- Outcome key MUST equal `gsv_outcomes` value in Saleor.

### 5.6 `CapabilityIndexPage`
Route: `/capabilities`
Fields:
- `body` (StreamField) — groups/categorizes capabilities
- `featured_capabilities` (list of `CapabilitySnippet`)

### 5.7 `CapabilityPage`
Route: `/capabilities/<capabilitySaleorValue>` *(or `/capabilities/<registryId>` — pick one and keep consistent)*
Fields:
- `capability` (FK to `CapabilitySnippet`, required)
- `body` (StreamField)
- `offerings_using_this` (OfferingsRailBlock) filter `gsv_capabilities includes <capability.saleor_value>`

**Mapping**
- Use `CapabilitySnippet.saleor_value` for Saleor filtering.
- Use `CapabilitySnippet.registry_id` for Control Plane entitlements.

### 5.8 `PricingPage`
Route: `/pricing`
Fields:
- `body` (StreamField) including:
  - `PricingPlansBlock` (subscription plans)
  - `TopupsBlock`
  - `GiftCardsBlock`
  - `RichTextBlock` (credits explanation)

**Mapping**
- All items in plan/topup/gift blocks are **Saleor products**.

### 5.9 `DocsLandingPage`
Route: `/docs`
Fields:
- `body` (StreamField)

### 5.10 `IntegrationsPage`
Route: `/integrations`
Fields:
- `integrations` (list of `IntegrationSnippet`)
- `body` (StreamField)

**Mapping**
- Integration keys should match Saleor attribute values in `gsv_integrations`.

### 5.11 `TemplatesPage`
Route: `/templates`
Fields:
- `body` (StreamField)
- `templates_rail` (OfferingsRailBlock) — you can implement templates as:
  - Saleor Collection `templates`, OR
  - Saleor badge `gsv_badges includes template` (if you add that value)

### 5.12 `SecurityPage`, `AboutPage`, `ContactPage`, `FAQPage`, `ChangelogPage`
Routes: `/security`, `/about`, `/contact`, `/faq`, `/changelog`
Fields:
- `body` (StreamField)
Changelog can optionally pull `ChangelogEntry` snippets.

### 5.13 Blog
- `BlogIndexPage` route `/blog`
- `BlogPostPage` route `/blog/<slug>`
Standard Wagtail blog fields + StreamField body.

### 5.14 Legal pages
- `LegalPage` (base) with `legal_kind` choice: `privacy|terms|aup`

---

## 6) Mapping matrix (no guessing)

### 6.1 “Browse by” tabs → Saleor filters
| UI filter | Saleor field |
|---|---|
| Category | `gsv_category` |
| Role | `gsv_roles` |
| Outcome | `gsv_outcomes` |
| Capability | `gsv_capabilities` |

### 6.2 Left filters (as in your mock UI)
| Checkbox/filter | Saleor mapping |
|---|---|
| Verified | `gsv_badges includes verified` |
| Featured | `gsv_badges includes featured` |
| Trial Available | `gsv_trial_available = true` OR `gsv_badges includes trial_available` |
| Deployment | `gsv_deployment` |
| Integrations | `gsv_integrations` |
| Capabilities list | `gsv_capabilities` values from §1.4 |

### 6.3 Offering card fields (grid)
| Card UI | Source |
|---|---|
| title, description | Saleor product `name`, `description` |
| category badge | `gsv_category` |
| capability chips | `gsv_capabilities` → display labels via `CapabilitySnippet` |
| “from $X/mo” | Saleor pricing (variants / plans product) |
| “~15/run” | Saleor product metadata `gsv.credit_estimate.typical_per_run` |
| “Try Free” | if `gsv_trial_available=true` OR badge, call CP “trial instance create” flow |

---

## 7) How Wagtail stays aligned with Saleor + Capability Registry

**Hard rule:** Wagtail stores only **keys**, never free-form tags.

- Roles/outcomes/capabilities/integrations are selected from Snippets with canonical keys.
- Storefront uses these keys to build Saleor GraphQL attribute filters.
- Control Plane uses `CapabilitySnippet.registry_id` to compute entitlements + effective config.

---

## Appendix A — Seed JSON (copy/paste)
Files provided in the zip:
- `taxonomies.categories.json`
- `taxonomies.roles.json`
- `taxonomies.outcomes.json`
- `capabilities.from-registry.json`
- `saleor.attributes.concrete.json`

