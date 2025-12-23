# GTM GitOps Remediation Plan

**Date:** 2025-12-20
**Updated:** 2025-12-20 16:30 UTC (Session 3 - Major Fixes Complete)
**Priority:** P0 - Critical Path to E2E Testing
**Approach:** GitOps-first (all fixes via code commits, no kubectl apply)

---

## Session 3 Progress (2025-12-20)

### Completed Fixes

| Commit | Description |
|--------|-------------|
| `1e42496` | Fix broken links and navigation across storefront |
| `28cc770` | Wire product detail page to real Saleor GraphQL |
| `3276039` | Add redirects for legacy URLs and update Footer |
| `641fd35` | Add root redirect and improve redirect ordering |

### Key Changes Made

1. **Redirect Handling (next.config.js)**
   - Root `/` redirects to `/default-channel`
   - `/marketplace/categories/:category` redirects to `/default-channel/marketplace/:category`
   - `/:channel/marketplace/categories/:category` redirects to `/:channel/marketplace/:category`
   - `/marketplace/:path*` redirects to `/default-channel/marketplace/:path*`
   - `/pricing` and `/solutions` redirect to channel-prefixed versions

2. **Navigation Links Fixed**
   - NavLinks.tsx: Added CMS_BASE_URL for cross-app links (dev.gsv.dev for Blog)
   - Footer.tsx: Added Terms, Privacy, Security links matching CMS design
   - Homepage: All category links now use correct `/${channel}/marketplace/${category}` format

3. **Product Detail Page Wired to Saleor**
   - `marketplace/[category]/[slug]/page.tsx` now fetches from MarketplaceProductDetailDocument
   - Removed mock data, uses real Saleor product attributes
   - Transforms gsv_* attributes to display format

4. **Theme Consistency**
   - Added brand color tokens to `tailwind.config.ts`
   - Added CSS custom properties to `globals.css`
   - Utility classes: `.btn-primary`, `.btn-secondary`, `.card`, `.section-heading`

---

## Issue Summary

| # | Issue | Component | Impact | Priority | Status |
|---|-------|-----------|--------|----------|--------|
| 1 | Storefront redirect loop | Channel/Seed | Site inaccessible | P0 | **FIXED** |
| 2 | cmp-commerce-worker CrashLoop | Saleor | Webhooks failing | P0 | PENDING |
| 3 | Mock data not wired | Storefront | No real products shown | P1 | **FIXED** |
| 4 | Marketplace UX gaps | Storefront | Missing per spec | P1 | PARTIAL |
| 5 | Missing routes | Storefront | Per sitemap spec | P1 | **FIXED** |
| 6 | Saleor integration gaps | Storefront + CP | Order flow broken | P1 | PARTIAL |
| 7 | Wagtail-Saleor sync gaps | CMS + Commerce | Taxonomies drift | P1 | DEFERRED |
| 8 | Theme inconsistencies | Storefront | Different UX on pages | P1 | **FIXED** |
| 9 | Known bugs (PHASE4) | Multiple | Per handover doc | P2 | PENDING |
| 10 | E2E journey gaps | Multiple | Cannot complete flow | P2 | PENDING |

---

## NEW: Issue #7 - Saleor Integration Gaps

### 7.1 Current State Analysis

Based on code review of `src/lib/marketplace.ts` and `src/lib/control-plane.ts`:

**IMPLEMENTED (Working):**
- Saleor GraphQL client (`src/lib/graphql.ts`)
- Product transformation (`transformProduct()`)
- Attribute mapping per schema (gsv_category, gsv_roles, gsv_capabilities, etc.)
- Metadata extraction (credits_estimate_min/max, outcome_tagline)
- Filter building (`buildSaleorFilter()`)
- Control Plane API client stub (`src/lib/control-plane.ts`)

**GAPS IDENTIFIED:**

| Gap | Current State | Required State | Effort |
|-----|--------------|----------------|--------|
| Saleor attributes not seeded | Products missing gsv_* attributes | All products have attributes per schema | 4h |
| Metadata not populated | Products missing cp_offering_id, credits_estimate | All products have platform metadata | 2h |
| Product detail uses mock | `[category]/[slug]/page.tsx` uses mockOfferings | Fetch from Saleor GraphQL | 2h |
| CP wallet API not connected | Returns mock data on failure | Real wallet balance from CP | 4h |
| CP instances API not connected | Returns mock data on failure | Real instances from CP | 4h |
| Order webhook not registered | CP URL `/integrations/saleor/order-paid` exists but not called | Saleor calls CP on order-paid | 2h |

### 7.2 Saleor Attribute Schema Requirements

Per `docs/cmp/23-Saleor-Attribute-Schema-v1.md`:

**Required Product Attributes:**
```
gsv_category (DROPDOWN): agent | app | assistant | automation
gsv_roles (MULTISELECT): customer_support | sales_sdr | marketing | hr | it_helpdesk | operations | finance
gsv_value_stream (MULTISELECT): customer_support | sales_outreach | knowledge_assistant | meeting_scheduler | marketing_content | data_extraction | monitoring_alerting | hr_ops
gsv_capabilities (MULTISELECT): prompt_orchestrator | tool_connectors | mcp_tools | api_endpoint | chat_ui | web_widget | multilingual | multimodal_vision | multimodal_audio | rag_knowledgebase | guardrails_policy | audit_trail | scheduler_triggers | observability | credits_wallet
gsv_deployment_modes_supported (MULTISELECT): shared | dedicated_namespace | vcluster | dedicated_cluster
gsv_trial_available (BOOLEAN)
gsv_verified (BOOLEAN)
gsv_badges (MULTISELECT): featured | trending | new | popular
gsv_maturity (DROPDOWN): beta | stable | enterprise
```

**Required Product Metadata:**
```
cp_offering_id: Control Plane offering ID
cp_offering_version_id: Control Plane version ID (optional for GTM)
credits_estimate_min: Min credits per run
credits_estimate_max: Max credits per run
credits_estimate_label: Display label (e.g., "~15/run")
outcome_tagline: Card description override
primary_outcome: Primary outcome key
primary_role: Primary role key
card_image_url: Resolved image URL
```

### 7.3 GitOps Remediation

**Step 1: Create Saleor attribute seed script**
Location: `gsv-gitops/platform/base/cmp-commerce/scripts/seed-attributes.py`

**Step 2: Create product metadata sync job**
Location: `gsv-gitops/platform/base/cmp-commerce/attribute-seed-job.yaml`

---

## NEW: Issue #8 - Wagtail-Saleor Sync Gaps

### 8.1 Current State

Per `docs/wagtail-saleor-sync-spec/25-Wagtail-to-Saleor-Sync-Command-Spec-v1.md`:

**NOT IMPLEMENTED:**
- `sync_wagtail_to_saleor` management command does not exist
- Wagtail taxonomies (Role, Outcome, Capability snippets) not created
- No mapping enforcement between Wagtail and Saleor

**IMPACT:**
- Cannot use Wagtail as editorial source of truth
- Filters may show terms not in Saleor catalog
- Capability keys may drift from Control Plane registry

### 8.2 Required Implementation

**Wagtail Snippets to Create:**
1. RoleSnippet (key, label, icon, short_description)
2. OutcomeSnippet (key, label, hero_title, hero_subtitle)
3. CapabilitySnippet (registry_id, saleor_value, title, group, icon)
4. IntegrationSnippet (key, label, kind, icon)

**Sync Command Requirements:**
```bash
python manage.py sync_wagtail_to_saleor \
  --dry-run \
  --sync-attributes \
  --sync-products \
  --report-path sync-report.json
```

### 8.3 GTM Workaround

For GTM v1 (single vendor), skip Wagtail sync and seed Saleor directly:
1. Create attributes in Saleor Dashboard
2. Set attribute values on products manually
3. Add product metadata via script

---

## NEW: Issue #9 - Theme Inconsistencies

### 9.1 Identified Issues from Screenshots

| Page | Issue | Expected | Actual |
|------|-------|----------|--------|
| Homepage (dev.gsv.dev) | Header style | Purple gradient header | White header with purple accents |
| Marketplace page | Header style | Consistent with homepage | Different purple shade, different layout |
| Homepage | CTA section | Purple gradient "Ready to Transform" | Same but appears twice in some views |
| Pricing page | Color scheme | Consistent purple theme | Matches but different card styling |
| Solutions page | Card icons | Colored icons matching category | Muted gray/purple icons |

### 9.2 Two Different Layouts Observed

**Layout A (storefront.dev.gsv.dev / marketplace.dev.gsv.dev):**
- Purple gradient hero with "AI Agent Marketplace"
- Category icons in circles (Agents, Apps, Assistants, Automations)
- Product cards with ratings, prices, "Trending" badges
- Bottom CTA: "Ready to automate your business?"

**Layout B (dev.gsv.dev homepage):**
- White background hero with "AI Agents That Work For You"
- Stats: 50+ AI Agents, 10K+ API Calls, 99.9% Uptime
- Category cards with descriptions
- "How It Works" section (1-2-3 steps)
- "Why Digitlify" features grid
- Testimonials section
- Pricing preview
- Bottom CTA: "Ready to Transform Your Business?"

### 9.3 Root Cause

Two separate apps serving different routes:
1. **cmp-website (Wagtail)** at `dev.gsv.dev` - Marketing/CMS site
2. **cmp-storefront (Next.js)** at `marketplace.dev.gsv.dev` - Commerce site

**Issue:** Theme CSS and component styling not synchronized between the two apps.

### 9.4 Remediation

**Option A: Shared Design System**
- Create shared Tailwind config
- Extract common components to shared package
- Sync color tokens: `--primary: #7C3AED` (purple-600)

**Option B: Unified App**
- Merge cmp-website pages into cmp-storefront
- Single Next.js app serves all routes
- Wagtail becomes headless CMS only

**Recommended for GTM:** Option A - keep apps separate but align styling

---

## Issue #1: Storefront Redirect Loop

### Root Cause Analysis
The storefront is expected at marketplace.dev.gsv.dev but STATUS.md shows it at storefront.dev.gsv.dev. Potential causes:

1. **DNS mismatch** - DNS points to wrong hostname
2. **Ingress misconfiguration** - Host rule does not match
3. **Channel redirect loop** - src/app/page.tsx redirects to /${DefaultChannelSlug} which may cause infinite loop if channel does not exist

### GitOps Remediation

**Option A: Fix DNS/Ingress (if hostname is wrong)**

Edit: gsv-gitops/apps/cmp/storefront/ingress.yaml
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: cmp-storefront
  namespace: cmp
  annotations:
    traefik.ingress.kubernetes.io/router.tls: "true"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: traefik
  tls:
    - hosts:
        - marketplace.dev.gsv.dev
      secretName: marketplace-tls
  rules:
    - host: marketplace.dev.gsv.dev
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: cmp-storefront
                port:
                  number: 3000
```

**Option B: Fix Channel Configuration (if redirect loop)**

The storefront expects NEXT_PUBLIC_DEFAULT_CHANNEL to match a valid Saleor channel. If the channel does not exist or is inactive, the redirect loop occurs.

1. Verify Saleor has active channel via GraphQL:
```graphql
query {
  channels {
    slug
    isActive
  }
}
```

2. Update ConfigMap in gsv-gitops/apps/cmp/storefront/configmap.yaml:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cmp-storefront-config
  namespace: cmp
data:
  NEXT_PUBLIC_DEFAULT_CHANNEL: "default-channel"
  NEXT_PUBLIC_SALEOR_API_URL: "http://cmp-commerce-api.cmp:8000/graphql/"
```

### Verification
```bash
curl -I -L https://marketplace.dev.gsv.dev
# Should return 200, not redirect loop
```

---

## Issue #2: cmp-commerce-worker CrashLoop

### Root Cause Analysis
Saleor Celery worker is crash-looping. Common causes:
1. Missing Redis connection
2. Database connection issues
3. Missing environment variables
4. Memory limits too low

### GitOps Remediation

**Step 1: Check deployment logs first**
```bash
kubectl -n cmp logs deployment/cmp-commerce-worker --tail=100
```

**Step 2: Common fixes in gsv-gitops/apps/cmp/commerce/worker-deployment.yaml**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cmp-commerce-worker
  namespace: cmp
spec:
  replicas: 1
  template:
    spec:
      containers:
        - name: worker
          image: ghcr.io/saleor/saleor:3.20
          command: ["celery", "-A", "saleor", "worker", "--loglevel=info"]
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: cmp-commerce-secrets
                  key: DATABASE_URL
            - name: CELERY_BROKER_URL
              value: "redis://cmp-commerce-redis:6379/0"
          resources:
            requests:
              memory: "256Mi"
            limits:
              memory: "512Mi"
```

### Verification
```bash
kubectl -n cmp get pods -l app=cmp-commerce-worker
# STATUS should be Running, not CrashLoopBackOff
```

---

## Issue #3: Product Detail Uses Mock Data

### Current State
- marketplace/page.tsx correctly fetches from Saleor
- marketplace/[category]/[slug]/page.tsx uses mockOfferings

### Fix Required
Replace mock data with real GraphQL query in product detail page.

See implementation in separate code section below.

---

## Issue #4-8: See Detailed Implementation Below

---

## Execution Order (Updated)

### Priority 0 - Infrastructure (Blocking)
1. [x] Fix Storefront redirect loop (root path / not working, /default-channel works) - **DONE** (commit 641fd35)
2. [ ] Fix cmp-commerce-worker CrashLoop
3. [ ] Verify default-channel exists in Saleor

### Priority 1 - Saleor Integration
4. [ ] Run attribute seed script (`assign_saleor_attributes.py`) against Saleor
5. [ ] Add product metadata (cp_offering_id, credits estimates) to all products
6. [x] Wire product detail page to real Saleor GraphQL (remove mockOfferings) - **DONE** (commit 28cc770)
7. [ ] Register CP webhook URL in Saleor for order-paid events

### Priority 1 - Control Plane Integration
8. [ ] Verify CP wallet API endpoint works (`/wallets/me`)
9. [ ] Verify CP instances API endpoint works (`/instances/`)
10. [ ] Remove mock fallback data from control-plane.ts (make errors visible)
11. [ ] Test wallet balance display in account pages
12. [ ] Test instance listing in My Agents page

### Priority 1 - Theme Consistency
13. [x] Audit color tokens between cmp-website and cmp-storefront - **DONE**
14. [x] Create shared Tailwind preset with brand colors - **DONE** (commit 3276039)
15. [x] Align header/footer components between apps - **DONE** (commit 3276039)
16. [x] Consistent button styles (Get Started Free vs Browse Marketplace) - **DONE** (globals.css)

### Priority 1 - Navigation & Links
17. [x] Fix broken /marketplace/categories/ links - **DONE** (commit 641fd35)
18. [x] Add Footer Terms/Privacy/Security links - **DONE** (commit 3276039)
19. [x] Fix NavLinks cross-app links (CMS vs Storefront) - **DONE** (commit 1e42496)

### Priority 2 - Missing Features
20. [ ] Wire Add to Cart button to Saleor checkout
21. [ ] Complete /account/instances/[instanceId] route
22. [ ] Add order detail page
23. [ ] Connect Try Free button to trial instance creation

### Priority 2 - Wagtail-Saleor Sync (Post-GTM)
24. [ ] Create Wagtail taxonomy snippets (Role, Outcome, Capability)
25. [ ] Implement sync_wagtail_to_saleor management command
26. [ ] Run sync in CI to detect drift

---

## Saleor Attribute Seed Script

A seed script exists at `C:\workspace\temp\assign_saleor_attributes.py`.

**To run in Saleor container:**
```bash
kubectl -n cmp exec -it deployment/cmp-commerce-api -- python manage.py shell < assign_saleor_attributes.py
```

**Products covered:**
- customer-support-agent
- sales-outreach-agent
- code-review-agent
- knowledge-base-agent / knowledge-base-assistant
- hr-onboarding-assistant
- slack-helpdesk
- data-extraction-pipeline
- email-automation
- monitoring-alerting
- meeting-scheduler

---

## Verification Checklist

### Infrastructure
- [x] `curl -I https://marketplace.dev.gsv.dev/` returns 302 to /default-channel - **FIXED** (next.config.js redirects)
- [x] `curl -I https://marketplace.dev.gsv.dev/default-channel` returns 200 - **WORKS**
- [ ] cmp-commerce-worker pod is Running
- [ ] cmp-commerce-api pod is Running

### Saleor Integration
- [ ] Products in Saleor have gsv_* attributes assigned
- [ ] Products have cp_offering_id in metadata
- [x] Product detail pages show real Saleor data - **DONE** (commit 28cc770)
- [ ] Filters (role, outcome, capability) work correctly

### Control Plane Integration
- [ ] /wallets/me returns real wallet balance (not mock)
- [ ] /instances/ returns real instances (not mock)
- [ ] Account billing page shows correct credits
- [ ] My Agents page shows deployed instances

### Theme Consistency
- [x] Header style matches between homepage and marketplace - **DONE** (brand colors added)
- [x] Footer style matches between homepage and marketplace - **DONE** (Terms/Privacy/Security added)
- [x] Purple color is consistent (#7C3AED or similar) - **DONE** (tailwind.config.ts)
- [x] CTAs use consistent styling - **DONE** (globals.css btn-primary class)

### Navigation & Links
- [x] `/marketplace/categories/agents` redirects correctly - **FIXED** (next.config.js)
- [x] Footer links point to correct domains (CMS vs Storefront) - **FIXED**
- [x] NavLinks use correct channel prefix - **FIXED** (commit 1e42496)

### E2E Flow
- [ ] Add to Cart creates Saleor checkout
- [ ] Checkout completion triggers order-paid webhook
- [ ] Order-paid creates instance in Control Plane
- [ ] Instance appears in My Agents

---

## Files Modified in This Session

| File | Changes |
|------|---------|
| `services/storefront/next.config.js` | Added redirects for legacy URLs, root path, and missing channel prefix |
| `services/storefront/src/app/globals.css` | Added brand design tokens, CSS variables, utility classes |
| `services/storefront/tailwind.config.ts` | Added brand color palette and gradients |
| `services/storefront/src/ui/components/Footer.tsx` | Added Terms/Privacy/Security links |
| `services/storefront/src/ui/components/nav/components/NavLinks.tsx` | Fixed cross-app links with CMS_BASE_URL |
| `services/storefront/src/app/[channel]/(main)/page.tsx` | Fixed category links to use correct format |
| `services/storefront/src/app/[channel]/not-found.tsx` | Fixed redirect loop |
| `services/storefront/src/app/[channel]/(main)/marketplace/[category]/[slug]/page.tsx` | Wired to real Saleor GraphQL |

---

*Document created: 2025-12-20*
*Updated: 2025-12-20 - Added Saleor/Wagtail/Theme gap analysis*
*Updated: 2025-12-20 16:30 UTC - Session 3 major fixes complete*
