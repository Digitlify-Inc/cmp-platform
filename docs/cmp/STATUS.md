# CMP Implementation Status

**Last Updated:** 2025-12-22 18:05 UTC
**Phase:** 4 - Marketplace UI (IN PROGRESS)
**Completed:** Phase 1 (Control Plane), Phase 2 (Commerce + Runner), Phase 3 (Storefront + Branding), GTM Fixes

---

## P0 Blockers (Must Fix Before Launch)

| # | Blocker | Status | Impact |
|---|---------|--------|--------|
| 1 | Ragflow CrashLoopBackOff | ✅ RESOLVED | RAG pod running |
| 2 | Commerce Worker CrashLoop | ✅ RESOLVED | Worker pod running |
| 3 | Connector/MCP Gateway Not Deployed | ✅ RESOLVED | 2 replicas running |
| 4 | Saleor → Provisioner Webhook Not Wired | ✅ RESOLVED | "CMP Provisioner" app with "Order Paid Handler" webhook active |

**All P0 blockers resolved.** System ready for E2E testing.

### Webhook Configuration (Completed)

**App**: CMP Provisioner
**Webhook**: Order Paid Handler (Active)
**Permissions**: MANAGE_CHECKOUTS, MANAGE_USERS, MANAGE_ORDERS
**Target**: `http://cmp-provisioner.cmp.svc.cluster.local:8000/webhooks/saleor/order-paid`

Note: There's a duplicate "CMP Provisioner" app that can be deleted.

---

## GTM Fixes (2025-12-22)

### Completed

- Commerce provisioning endpoints added to Control Plane
  - `POST /integrations/commerce/provision`
  - `POST /integrations/commerce/add-credits`
- Saleor setup script created: `scripts/saleor-setup.py`
  - Supports `--email`/`--password` or `--token` authentication
  - Added `--insecure` flag for dev SSL certificates
- CommerceProvisioningService for Provisioner integration
- Marketplace already wired to Saleor GraphQL
- Saleor seed data verified:
  - Product Type: `Offering` with 9 GSV attributes
  - 4 Collections: Agents, Apps, Assistants, Automations
  - 15 Products seeded (Customer Support Agent, Knowledge Base Assistant, etc.)
- Admin password reset to documented credentials
- **Checkout 404 Fix**: CheckoutLink now uses channel-aware routing
- **URL Standardization**: All hardcoded URLs updated to correct FQDNs
- **E2E Test Suite**: Comprehensive tests created for buyer/seller journeys
- **GitHub Actions Workflow**: Manual trigger E2E test workflow added
- **Marketplace Image Update**: Deployed new image `202512221700-2fe1b86-checkout-fix` with checkout route fix

### Saleor Setup Script Usage

```bash
# With email/password (recommended):
python scripts/saleor-setup.py \
  --url https://store.dev.gsv.dev/graphql/ \
  --email admin@dev.gsv.dev \
  --password 'Admin123!' \
  --seed \
  --insecure

# Or generate token from cluster and use:
python scripts/saleor-setup.py \
  --url https://store.dev.gsv.dev/graphql/ \
  --token <SALEOR_API_TOKEN> \
  --seed \
  --insecure
```

---

## Executive Summary

Phase 4 in progress. Marketplace UI components added per IA spec (doc 22). Major components:
- Commerce Plane: Saleor with products and webhooks
- Platform Plane: Control Plane with offerings and instances
- Execution Plane: Gateway -> Runner -> Langflow pipeline
- Storefront: Full marketplace UI with browse modes, filters, and offering cards

---

## FQDN Architecture

**Note:** Main site AND marketplace are served from `dev.gsv.dev` (Next.js). CMS (Wagtail) is headless.

| Service | FQDN | Purpose |
|---------|------|---------|
| **Main Site + Marketplace** | `dev.gsv.dev` | Next.js (Saleor storefront + CMS content) |
| **Saleor Commerce API** | `store.dev.gsv.dev` | GraphQL commerce backend |
| **Saleor Dashboard** | `admin.dev.gsv.dev` | Commerce admin UI |
| **Control Plane API** | `cp.dev.gsv.dev` | Django/DRF platform API |
| **Gateway API** | `api.dev.gsv.dev` | FastAPI execution entrypoint |
| **SSO (Keycloak)** | `sso.dev.gsv.dev` | OIDC provider |
| **Langflow Runtime** | `runtime.dev.gsv.dev` | Agent execution engine |
| **Langflow Studio** | `studio.dev.gsv.dev` | Flow builder IDE |
| **RAG (Ragflow)** | `rag.dev.gsv.dev` | RAG backend |

---

## Services Running

| Service | Replicas | Status | Endpoint |
|---------|----------|--------|----------|
| cmp-marketplace | 1 | ✅ Running | dev.gsv.dev |
| cmp-control-plane | 2 | ✅ Running | cp.dev.gsv.dev |
| cmp-gateway | 2 | ✅ Running | api.dev.gsv.dev |
| cmp-runner | 2 | ✅ Running | internal |
| cmp-provisioner | 2 | ✅ Running | internal |
| cmp-connector | 2 | ✅ Running | internal |
| cmp-commerce-api | 2 | ✅ Running | store.dev.gsv.dev |
| cmp-commerce-dashboard | 1 | ✅ Running | admin.dev.gsv.dev |
| cmp-commerce-worker | 1 | ✅ Running | internal |
| cmp-commerce-redis | 1 | ✅ Running | internal |
| cmp-commerce-postgres | 1 | ✅ Running | PostgreSQL 16 |
| cmp-cms | 1 | ✅ Running | (headless - API only) |
| rag | 1 | ✅ Running | rag.dev.gsv.dev |
| rag-elasticsearch | 1 | ✅ Running | internal |
| rag-mysql | 1 | ✅ Running | internal |
| rag-redis | 1 | ✅ Running | internal |

*Last verified: 2025-12-22 17:55 UTC*

---

## Storefront Details

### Technology Stack
- Framework: Next.js 16 with App Router
- React: 19.x
- Node.js: 22
- UI Components: shadcn/ui (Radix UI primitives)
- Styling: Tailwind CSS with CSS variables
- API: GraphQL with TypeScript codegen

### Branding
| Element | Value |
|---------|-------|
| Company Name | Digitlify |
| Primary Color | #8b5cf6 (violet-600) |
| Gradient | linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%) |
| Logo | Hexagon with D + gradient text |

### Agent Categories
| Category | Icon | Description |
|----------|------|-------------|
| Agents | Bot | AI agents |
| Apps | Zap | Applications |
| Assistants | Sparkles | Conversational AI |
| Automations | Workflow | Workflow tools |

### Key Files
- tailwind.config.ts - Brand colors + shadcn theme
- src/app/globals.css - CSS variables
- src/lib/utils.ts - cn() utility
- src/components/ui/* - shadcn components
- src/components/agents/* - Agent store components
- src/ui/components/Logo.tsx - Digitlify logo
- src/app/api/health/route.ts - Health endpoint

### Marketplace Components (Phase 4)
| Component | Location | Purpose |
|-----------|----------|---------|
| BrowseModeSwitcher | src/ui/components/marketplace/ | Category tabs + browse mode selector |
| FacetRail | src/ui/components/marketplace/ | Filter sidebar (roles, outcomes, capabilities) |
| OfferingCard | src/ui/components/marketplace/ | Product card with trust signals |
| CreditsBadge | src/ui/components/nav/ | Balance + top-up in header |

### Routes (Phase 4)
| Route | File | Description |
|-------|------|-------------|
| /marketplace | src/app/[channel]/(main)/marketplace/page.tsx | Main listing with all offerings |
| /marketplace/[category] | src/app/[channel]/(main)/marketplace/[category]/page.tsx | Category-filtered listing |
| /marketplace/[category]/[slug] | src/app/[channel]/(main)/marketplace/[category]/[slug]/page.tsx | Offering detail page (PDP) |

### Navigation
Primary nav updated to: Marketplace, Solutions, Pricing, Blog, Docs
- Logged out: Login + "Get Started Free" buttons
- Logged in: CreditsBadge (balance + top-up) + UserMenu (Instances, Billing, Orders)

### Docker Build
```bash
docker build   --build-arg SALEOR_SCHEMA_URL=https://storefront1.saleor.cloud/graphql/   --build-arg NEXT_PUBLIC_DEFAULT_CHANNEL=default-channel   --build-arg NEXT_PUBLIC_SALEOR_API_URL=http://cmp-commerce-api.cmp:8000/graphql/   -t cmp-storefront:v0.2.2 .
```

**Important:** NEXT_PUBLIC_* vars must be build-time args, not runtime env.

---

## Saleor Commerce

### Admin Access
- URL: https://admin.dev.gsv.dev/
- Email: admin@dev.gsv.dev
- Password: Admin123\!

---

## Remaining Work (Phase 4)

1. Wire OfferingCard to Saleor products (replace mock data)
2. Implement browse mode state management (Role/Outcome/Capability views)
3. Connect FacetRail filters to Saleor GraphQL
4. Implement /solutions, /outcomes, /capabilities routes per IA spec
5. Create sample Langflow flows
6. Test ORDER_FULLY_PAID webhook
7. Configure payment integration

---

*Last Updated: 2025-12-22 17:55 UTC*
