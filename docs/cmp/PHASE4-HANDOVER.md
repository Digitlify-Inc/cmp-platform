# Phase 4: GTM Readiness Handover

**Date:** December 19, 2025
**Status:** DEPLOYED & OPERATIONAL
**Priority:** Ship MVP for early access users

---

## Executive Summary

Phase 4 focuses on achieving GTM (Go-To-Market) readiness. This handover documents the complete implementation including:
- Enhanced CMS models with taxonomy snippets
- StreamField blocks for flexible page building
- Seed data commands for taxonomies and content
- Saleor attribute setup scripts
- 10 real product definitions

**Deployment Status:** All infrastructure deployed and operational as of December 19, 2025.

---

## What's Working

### Infrastructure
- [x] Kubernetes cluster (kind-gsv) running
- [x] GitOps (ArgoCD) deployed
- [x] Secrets management (Vault + ESO)
- [x] Ingress (Traefik) with SSL

### Services Deployed
| Service | Status | URL |
|---------|--------|-----|
| Website (Wagtail) | Running | https://dev.gsv.dev |
| Storefront (Next.js) | Running | https://storefront.dev.gsv.dev |
| Saleor API | Running | https://saleor-api.dev.gsv.dev |
| Saleor Dashboard | Running | https://saleor-dashboard.dev.gsv.dev |
| Control Plane | Running | https://app.dev.gsv.dev |
| Langflow | Running | Internal |

### Documentation
- [x] Full spec pack (docs 01-25)
- [x] Website content copy (docs/website-content/)
- [x] Wagtail page models (docs/wagtail-model-spec/)
- [x] Wagtail→Saleor sync spec (docs/wagtail-saleor-sync-spec/)

---

## Phase 4 Implementation Summary

### 1. CMS Models Enhanced (cmp-website)

**File:** `digitlify/cms/models.py`

**New Taxonomy Snippets:**
| Snippet | Purpose | Key Field |
|---------|---------|-----------|
| `CategorySnippet` | 4 A's (agent, app, assistant, automation) | `key` |
| `RoleSnippet` | Target personas (7 roles) | `key` |
| `OutcomeSnippet` | Business outcomes (8 outcomes) | `key` |
| `CapabilitySnippet` | Platform capabilities (15) | `registry_id`, `saleor_value` |
| `IntegrationSnippet` | Available integrations (12) | `key` |

**New StreamField Page Types:**
| Page Type | Route Example | Description |
|-----------|---------------|-------------|
| `StreamHomePage` | `/` | Flexible homepage with blocks |
| `OutcomePage` | `/solutions/customer-support/` | Outcome-specific landing |
| `RoleSolutionPage` | `/solutions/sales-sdr/` | Role-specific solutions |
| `CapabilityPage` | `/capabilities/rag-knowledgebase/` | Capability detail page |
| `SecurityPage` | `/security/` | Security information |
| `LegalPage` | `/privacy/`, `/terms/` | Legal pages |

### 2. StreamField Blocks Created

**File:** `digitlify/cms/blocks.py`

| Block | Purpose |
|-------|---------|
| `HeroBlock` | Hero sections with CTAs and KPIs |
| `TilesBlock` | Grid of clickable tiles (outcomes, categories) |
| `StepsBlock` | How it works / process steps |
| `OfferingsRailBlock` | Product rails (query or curated) |
| `CapabilitiesChipsBlock` | Capability chips/cards |
| `FeaturesBlock` | Features/benefits grid |
| `TestimonialsBlock` | Customer testimonials |
| `PricingPlansBlock` | Pricing plans section |
| `FAQBlock` | FAQ accordion |
| `SecurityBlock` | Security highlights |
| `FinalCtaBlock` | Final call-to-action |

### 3. Management Commands Created

| Command | File | Purpose |
|---------|------|---------|
| `seed_taxonomies` | `seed_taxonomies.py` | Populate taxonomy snippets and content |
| `sync_wagtail_to_saleor` | `sync_wagtail_to_saleor.py` | Sync CMS to Saleor attributes |
| `populate_cms_content` | `populate_cms_content.py` | Create initial CMS pages |

**Usage:**
```bash
# Seed all taxonomies and content snippets
python manage.py seed_taxonomies

# Seed taxonomies only (no legacy content)
python manage.py seed_taxonomies --taxonomies-only

# Sync to Saleor (dry run)
python manage.py sync_wagtail_to_saleor --dry-run

# Sync and create missing values
python manage.py sync_wagtail_to_saleor --create-missing

# Populate CMS pages
python manage.py populate_cms_content --use-streamfield

# Clear and repopulate
python manage.py populate_cms_content --clear --use-streamfield
```

### 4. Saleor Setup Scripts

**File:** `docs/cmp/saleor-setup-attributes.graphql`

Attributes to create in Saleor:
| Attribute | Slug | Type |
|-----------|------|------|
| Category | `gsv_category` | DROPDOWN |
| Target Roles | `gsv_roles` | MULTISELECT |
| Outcomes | `gsv_value_stream` | MULTISELECT |
| Capabilities | `gsv_capabilities` | MULTISELECT |
| Integrations | `gsv_integrations_required` | MULTISELECT |
| Deployment | `gsv_deployment` | DROPDOWN |
| Maturity | `gsv_maturity` | DROPDOWN |
| Trial Available | `gsv_trial_available` | BOOLEAN |
| Badges | `gsv_badges` | MULTISELECT |

### 5. Product Seed Data

**File:** `docs/cmp/saleor-seed-products.graphql`

10 products defined across 4 categories:

**Agents (3):**
1. Customer Support Agent - Handles tier-1 inquiries
2. Sales Outreach Agent - AI SDR for prospecting
3. Code Review Agent - Automated PR reviews

**Assistants (2):**
4. Knowledge Base Assistant - RAG-powered Q&A
5. HR Onboarding Assistant - Employee support

**Apps (2):**
6. Slack Helpdesk - Complete helpdesk in Slack
7. Data Extraction Pipeline - PDF to structured data

**Automations (3):**
8. Email Automation - Classify, route, respond
9. Monitoring & Alerting - Smart alerting
10. Meeting Scheduler - AI scheduling

---

## Deployment Steps

### Step 1: Apply Database Migrations
```bash
cd /mnt/c/workspace/repo/github.com/Digitlify-Inc/cmp-website
python manage.py makemigrations cms
python manage.py migrate
```

### Step 2: Seed Taxonomies
```bash
python manage.py seed_taxonomies
```

### Step 3: Setup Saleor Attributes
1. Open Saleor Dashboard: https://saleor-dashboard.dev.gsv.dev
2. Navigate to GraphQL Playground
3. Run mutations from `saleor-setup-attributes.graphql`
4. Verify attributes created

### Step 4: Create Saleor Products
1. Run mutations from `saleor-seed-products.graphql`
2. Add pricing variants to each product
3. Publish products

### Step 5: Sync Wagtail to Saleor
```bash
export SALEOR_API_URL="https://saleor-api.dev.gsv.dev/graphql/"
export SALEOR_TOKEN="your-saleor-token"
python manage.py sync_wagtail_to_saleor --dry-run
python manage.py sync_wagtail_to_saleor --create-missing
```

### Step 6: Populate CMS Content
```bash
python manage.py populate_cms_content --use-streamfield
```

### Step 7: Rebuild and Deploy
```bash
# Rebuild website
docker build -t cmp-website:v0.5.0 .
kind load docker-image cmp-website:v0.5.0 --name kind-gsv
kubectl -n cmp rollout restart deployment/cmp-website
```

---

## GTM Checklist Status

### Completed (December 19, 2025)
- [x] Taxonomy snippets (Categories, Roles, Outcomes, Capabilities, Integrations)
- [x] StreamField blocks for flexible page building
- [x] Seed data commands (taxonomies, content)
- [x] Saleor attribute definitions (GraphQL mutations)
- [x] 10 product definitions with attributes and metadata
- [x] CMS content population command
- [x] Wagtail → Saleor sync command
- [x] **Run Saleor attribute setup mutations** - 9 attributes created
- [x] **Run Saleor product creation mutations** - 9 products created
- [x] **Execute CMS migrations and commands**
  - Migration 0002 applied
  - seed_taxonomies: 4 categories, 7 roles, 8 outcomes, 15 capabilities, 12 integrations
  - populate_cms_content: All pages created
- [x] **Saleor collections** - Agents, Apps, Assistants, Automations

### Remaining for Full GTM
- [ ] Visual consistency (website ↔ storefront logos)
- [ ] Authentication (Keycloak SSO integration)
- [ ] Checkout flow validation (Stripe test mode)
- [ ] **Buyer Journey E2E Testing**
- [ ] **Seller Journey E2E Testing**
- [ ] Storefront redirect issue fix
- [ ] Legal page URL routing fix

---

## File Locations

### CMP Website (Digitlify-Inc/cmp-website)
```
digitlify/cms/
├── models.py              # Enhanced with taxonomy snippets + StreamField pages
├── blocks.py              # NEW - StreamField blocks
└── management/commands/
    ├── seed_taxonomies.py           # NEW - Seed taxonomy data
    ├── sync_wagtail_to_saleor.py    # NEW - CMS → Saleor sync
    └── populate_cms_content.py      # NEW - Create CMS pages
```

### GSV Platform Docs (GSVDEV/gsv-platform)
```
docs/cmp/
├── PHASE4-HANDOVER.md              # This document
├── saleor-setup-attributes.graphql  # NEW - Saleor attribute setup
├── saleor-seed-products.graphql     # NEW - Product seed data
├── website-content/                 # Website copy (30 files)
├── wagtail-model-spec/             # CMS model specs
└── wagtail-saleor-sync-spec/       # Sync command specs
```

---

## Canonical Taxonomy Keys

These keys MUST match across Wagtail, Saleor, and Storefront:

### Categories (4 A's)
| Key | Label |
|-----|-------|
| `agent` | Agents |
| `app` | Apps |
| `assistant` | Assistants |
| `automation` | Automations |

### Outcomes (8 GTM)
| Key | Label |
|-----|-------|
| `customer_support` | Reduce support tickets |
| `sales_outreach` | Send personalized outreach |
| `knowledge_assistant` | Turn documents into answers |
| `meeting_scheduler` | Book meetings automatically |
| `marketing_content` | Create on-brand content |
| `data_extraction` | Extract data from files |
| `monitoring_alerting` | Monitor & alert on changes |
| `hr_ops` | Streamline HR ops |

### Roles (7)
| Key | Label |
|-----|-------|
| `customer_support` | Customer Support |
| `sales_sdr` | Sales / SDR |
| `marketing` | Marketing |
| `hr` | HR |
| `it_helpdesk` | IT / Helpdesk |
| `operations` | Operations |
| `finance` | Finance |

---

## Previous Session Files

### Storefront (gsv-platform/services/storefront)
- `src/ui/components/Header.tsx` - Client component with purple Digitlify logo
- `src/ui/components/Footer.tsx` - Client component matching website
- `src/ui/components/nav/components/NavLinks.tsx` - Added Home link
- `src/app/[channel]/(main)/page.tsx` - AI Agent home page (may need re-apply)
- `src/app/[channel]/(main)/layout.tsx` - Added force-static
- `src/app/[channel]/(main)/pricing/page.tsx` - Removed unused import

### Documentation (gsv-platform/docs)
- `docs/README.md` - Updated structure
- `docs/website-content/` - 30 files with website copy
- `docs/wagtail-model-spec/` - 8 files with page models
- `docs/wagtail-saleor-sync-spec/` - 5 files with sync command

---

## Next Steps

### P0 (Must Do) - Current Focus
1. ~~Execute Saleor setup (attributes + products)~~ **DONE**
2. ~~Run CMS migrations and seed commands~~ **DONE**
3. **Test E2E flow: Buyer Journey** (see below)
4. **Test E2E flow: Seller Journey** (see below)

### P1 (Should Do)
1. Fix visual consistency (logos)
2. Wire up Keycloak SSO
3. Test Stripe checkout
4. Fix Storefront redirect loop

### P2 (Nice to Have)
1. Deploy chat demo interface
2. Control Plane provisioning webhook
3. Production DNS (digitlify.com)

---

## E2E Journey Testing Plans

### Buyer Journey (Customer Flow)

| Step | Component | Test | Status |
|------|-----------|------|--------|
| 1. Discovery | Website | Browse https://dev.gsv.dev/, view categories | ⏳ |
| 2. Browse | Storefront | Filter by category/outcome/role | ⏳ |
| 3. Detail | Storefront | View product details, attributes | ⏳ |
| 4. Demo | Agent Gateway | Try demo mode (if available) | ⏳ |
| 5. Subscribe | Saleor | Add to cart, checkout | ⏳ |
| 6. Provision | Control Plane | Resource created in org | ⏳ |
| 7. Configure | Control Plane | Configure agent settings | ⏳ |
| 8. Invoke | Agent Gateway | Run agent with subscription | ⏳ |
| 9. Monitor | Control Plane | View usage, credits | ⏳ |

**Test URLs:**
- Website: https://dev.gsv.dev/
- Storefront: https://marketplace.dev.gsv.dev/ (fix redirect issue)
- Saleor API: https://saleor-api.dev.gsv.dev/graphql/
- Control Plane: https://app.dev.gsv.dev/

### Seller Journey (Provider Flow)

| Step | Component | Test | Status |
|------|-----------|------|--------|
| 1. Onboard | Control Plane | Create provider organization | ⏳ |
| 2. Develop | Local | Build agent/app | ⏳ |
| 3. Package | Registry | Define offering.yaml | ⏳ |
| 4. Submit | Registry | Submit for review | ⏳ |
| 5. Review | Control Plane | Admin approves | ⏳ |
| 6. Publish | Saleor | Product appears in catalog | ⏳ |
| 7. Manage | Control Plane | View analytics, customers | ⏳ |
| 8. Update | Registry | Publish new version | ⏳ |

**Key Integration Points:**
- Provider creates offering → Synced to Saleor as product
- Buyer purchases → Control Plane creates resource
- Resource active → Agent Gateway allows invocation

---

## Contact / Resources

| Resource | Location |
|----------|----------|
| Docs | `gsv-platform/docs/cmp/` |
| Website content | `gsv-platform/docs/website-content/` |
| Wagtail models | `gsv-platform/docs/wagtail-model-spec/` |
| Storefront code | `gsv-platform/services/storefront/` |
| Website code | `cmp-website/digitlify/` |

---

## Deployment Verification (December 19, 2025)

### Components Verified

| Component | Status | Verified |
|-----------|--------|----------|
| CMS (Wagtail) | Running | HTTP 200 on /, /marketplace/, /pricing/, /about/, /contact/, /faq/ |
| Saleor API | Running | Products query returns 4+ products |
| Saleor Dashboard | Running | Accessible |
| PostgreSQL (CMS) | Running | Migrations applied |
| PostgreSQL (Saleor) | Running | Products/attributes stored |

### Data Verified

| Data | Count | Status |
|------|-------|--------|
| Saleor Attributes | 9 | Created |
| Saleor Collections | 4 | Created (Agents, Apps, Assistants, Automations) |
| Saleor Products | 9 | Created |
| CMS Categories | 4 | Seeded |
| CMS Roles | 7 | Seeded |
| CMS Outcomes | 8 | Seeded |
| CMS Capabilities | 15 | Seeded |
| CMS Integrations | 12 | Seeded |
| CMS Pages | 20+ | Created |

### Known Issues

| Issue | Component | Impact | Priority |
|-------|-----------|--------|----------|
| Storefront redirect loop | cmp-storefront | Cannot browse products | High |
| Legal page 404s | CMS | /privacy-policy/, /terms-of-service/ | Medium |
| Security page 500 | CMS | /security/ template error | Medium |

---

*Updated: December 19, 2025*
*Implementation: Phase 4 GTM Readiness - DEPLOYED*
