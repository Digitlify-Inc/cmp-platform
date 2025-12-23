# GTM Gap Analysis - GSV Platform

**Date:** 2025-12-22
**Status:** E2E Testing Readiness Assessment

---

## Executive Summary

This document provides a comprehensive gap analysis between the documented architecture and actual implementation, identifying blockers for Go-To-Market (GTM) readiness and E2E testing.

---

## 1. FQDN Architecture (Corrected)

### Dev Environment FQDNs

| Service | FQDN | Status | Purpose |
|---------|------|--------|---------|
| **Main Site + Marketplace** | `dev.gsv.dev` | Running | Next.js (Saleor storefront + CMS content) |
| **Saleor Commerce API** | `store.dev.gsv.dev` | Running | GraphQL commerce backend |
| **Saleor Dashboard** | `admin.dev.gsv.dev` | Running | Commerce admin UI |
| **Control Plane API** | `cp.dev.gsv.dev` | Running | Django/DRF platform API |
| **Gateway API** | `api.dev.gsv.dev` | Running | FastAPI execution entrypoint |
| **SSO (Keycloak)** | `sso.dev.gsv.dev` | Running | OIDC provider |
| **Langflow Runtime** | `runtime.dev.gsv.dev` | Running | Agent execution engine |
| **Langflow Studio** | `studio.dev.gsv.dev` | Running | Flow builder IDE |
| **RAG (Ragflow)** | `rag.dev.gsv.dev` | CrashLoop | RAG backend (P0 blocker) |

### Architecture Notes

1. **Main Site (`dev.gsv.dev`)**: Next.js serves BOTH:
   - Marketing pages (Home, Pricing, Solutions, Blog) - content from headless CMS (Wagtail)
   - Marketplace (Browse, Product Detail, Cart, Checkout) - data from Saleor GraphQL

2. **CMS is Headless**: Wagtail CMS is NOT directly public-facing. Content is fetched via API and rendered by Next.js routes.

3. **Storefront Rewrites**: Next.js config uses URL rewrites to hide `[channel]` parameter from user-facing URLs.

---

## 2. Critical Gaps (P0 Blockers)

> **UPDATE 2025-12-22 16:30 UTC**: All infrastructure blockers RESOLVED. Only webhook setup remains (manual step).

### 2.1 Ragflow CrashLoopBackOff

**Status:** ✅ RESOLVED
**Impact:** RAG functionality now available

Multi-arch image deployed, pod running normally.

### 2.2 Commerce Worker CrashLoop

**Status:** ✅ RESOLVED
**Impact:** Async Saleor tasks now processing

Worker pod running normally.

### 2.3 Connector/MCP Gateway Not Deployed

**Status:** ✅ RESOLVED
**Impact:** Agents can use external tool connectors

2 replicas running (`cmp-connector-*`).

### 2.4 Saleor → Provisioner Webhook Not Wired

**Status:** ⚠️ MANUAL SETUP REQUIRED
**Impact:** Order completion doesn't trigger instance provisioning

**Flow:**
```
Saleor (ORDER_FULLY_PAID) → Provisioner → Control Plane → Instance Created
```

**Manual Setup Steps:**

1. Go to https://admin.dev.gsv.dev/
2. Login: admin@dev.gsv.dev / Admin123!
3. Navigate: Apps → Create local app
4. App Name: "CMP Provisioner"
5. Add webhook:
   - Event: `ORDER_FULLY_PAID` (async)
   - Target URL: `http://cmp-provisioner.cmp.svc.cluster.local:8000/webhooks/saleor/order-paid`
6. Activate app and save webhook secret

---

## 3. E2E Test Coverage

### 3.1 Test Files Created

| File | Purpose | Tests |
|------|---------|-------|
| `buyer-e2e-journey.spec.ts` | Complete buyer flow | 25+ tests |
| `seller-e2e-journey.spec.ts` | Complete seller flow | 20+ tests |
| `credits-wallet.spec.ts` | Billing system | 15+ tests |
| `webhook-integration.spec.ts` | Saleor → CP flow | 10+ tests |
| `agent-execution.spec.ts` | Gateway → Runner | 15+ tests |
| `tenant-isolation.spec.ts` | Multi-tenant security | 5+ tests |

### 3.2 Minimum E2E Tests (Per Testing Strategy Doc 14)

| # | Test | Status | Blocker |
|---|------|--------|---------|
| T1 | Saleor order paid → instance created | Implemented | Webhook wiring |
| T2 | Instance becomes ACTIVE via GitOps | Implemented | GitOps sync |
| T3 | Run via Gateway → Runner → Langflow | Implemented | Credits enforcement |
| T4 | Credits debit; run blocked at zero | Implemented | Billing config |
| T5 | Credit pack top-up unblocks | Implemented | None |
| T6 | Connector binding works; revoke blocks | Implemented | Connector Gateway |
| T7 | RAG upload → retrieval; tenant isolation | Implemented | Ragflow fix |

### 3.3 Running E2E Tests

```bash
cd services/marketplace

# Install dependencies
pnpm install
pnpm exec playwright install

# Run all tests
pnpm test:e2e

# Run specific journey
pnpm exec playwright test e2e/buyer-e2e-journey.spec.ts

# Run with UI
pnpm test:e2e:ui
```

---

## 4. Buyer Journey Gaps

### 4.1 Documented Flow vs Implementation

| Phase | Documented | Implemented | Gap |
|-------|-----------|-------------|-----|
| Browse | Anonymous marketplace access | Yes | None |
| Evaluate | Product detail with pricing | Yes | None |
| Try | "Run now" with auto workspace | Partial | startTrial action exists, needs CP endpoint |
| Connect | Connector wizard | No | Not in MVP scope |
| Buy | Checkout with payment | Partial | Checkout fixed, payment gateway pending |
| Activate | Instance provisioning | Partial | Webhook not wired |
| Use | Workspace with run console | Yes | Needs credits enforcement |
| Retain | Low credit warnings | No | Not implemented |

### 4.2 Critical Buyer Journey Issues

1. **Checkout 404 (FIXED)**: CheckoutLink now uses channel-aware routing
2. **Try Free Button**: Works but needs CP `/instances/trial` endpoint to respond
3. **Instance Provisioning**: Blocked by webhook wiring
4. **Credits Display**: CreditsBadge component exists, needs wallet API integration

---

## 5. Seller Journey Gaps

### 5.1 Current Scope

Per PRD, MVP is **single-publisher only**. Multi-vendor seller onboarding is explicitly post-GTM.

### 5.2 What Works

- Saleor Dashboard access for admin
- Product creation via dashboard
- Product attributes (9 GSV attributes defined)
- Products appear in marketplace

### 5.3 What's Missing (Post-GTM)

- Vendor self-service registration
- Revenue share configuration
- Vendor dashboard with analytics
- Payout workflows

---

## 6. Documentation Gaps

### 6.1 Updated Documentation

| Document | Status | Notes |
|----------|--------|-------|
| STATUS.md | Current | Updated 2025-12-22 |
| P0-GTM-FIXES.md | Current | 4 blockers identified |
| HANDOVER.md | Current | Complete context |
| test-fixtures.ts | Updated | Correct FQDNs |
| .env.example | Updated | Complete env reference |

### 6.2 Documentation to Update

| Document | Required Update |
|----------|-----------------|
| 02-Architecture.md | Update FQDN table |
| 16-E2E-Visual-Architecture.md | Verify endpoint URLs |
| 19-Integration-Contracts-Pack-v1.md | Verify API URLs |

---

## 7. Code Issues Fixed

### 7.1 URL Consistency

**Before:** Multiple fallback URLs for same service
```
- lib/control-plane.ts: https://api.dev.gsv.dev
- api/wallet/route.ts: https://cp.dev.gsv.dev
- account/settings/page.tsx: https://control-plane.dev.gsv.dev
```

**After:** Consistent fallback to `cp.dev.gsv.dev` everywhere

### 7.2 Checkout Routing

**Before:** `/checkout` without channel prefix → 404
**After:** `/${channel}/checkout` with proper routing

### 7.3 Cart-to-Checkout Flow

**Before:** addToCartAndCheckout redirected to `/cart`
**After:** Redirects to `/checkout?checkout=${checkoutId}`

---

## 8. GTM Checklist

### Must Have (P0)

- [ ] Fix Ragflow CrashLoop (ARM64 → AMD64)
- [ ] Fix Commerce Worker CrashLoop
- [ ] Deploy Connector Gateway
- [ ] Wire Saleor webhooks to Provisioner
- [ ] Configure billing enforcement in Gateway
- [ ] Run E2E test suite (T1-T7 minimum)

### Should Have (P1)

- [ ] Complete checkout payment integration
- [ ] Wire OfferingCard to Saleor products (replace mock data)
- [ ] Implement browse mode state management
- [ ] Connect FacetRail filters to Saleor GraphQL

### Nice to Have (P2)

- [ ] Implement /solutions, /outcomes, /capabilities routes
- [ ] Create sample Langflow flows
- [ ] Add low credit warnings

---

## 9. UAT Test Plan

### Buyer UAT Scenarios

1. **Anonymous Browse**
   - Visit dev.gsv.dev
   - Navigate to /marketplace
   - Browse categories (Agents, Apps, Assistants, Automations)
   - View product detail page
   - Expected: All pages load, products display

2. **Authenticated Purchase**
   - Sign in via SSO
   - Add product to cart
   - Proceed to checkout
   - Complete payment (test mode)
   - Expected: Order created, instance provisioned

3. **Instance Usage**
   - Access /account/instances
   - Select active instance
   - Run agent via console
   - Expected: Credits debited, response returned

### Seller UAT Scenarios

1. **Dashboard Access**
   - Navigate to admin.dev.gsv.dev
   - Sign in with admin credentials
   - View products list
   - Expected: Dashboard accessible, products visible

2. **Product Visibility**
   - Create/edit product in dashboard
   - Set GSV attributes
   - Expected: Product appears in marketplace

---

## 10. Next Steps

### Immediate (Today)

1. Apply P0-GTM-FIXES to gsv-gitops
2. Sync ArgoCD applications
3. Verify service health
4. Run E2E smoke tests

### This Week

1. Complete webhook wiring
2. Configure payment gateway
3. Run full E2E test suite
4. Perform UAT scenarios

### Before Launch

1. All P0 blockers resolved
2. E2E tests passing (T1-T7)
3. UAT scenarios completed
4. Performance benchmarks met

---

*Generated: 2025-12-22*
*Author: Claude Code*
