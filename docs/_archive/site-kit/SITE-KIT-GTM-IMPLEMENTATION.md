# Site Kit GTM Implementation Plan

**Date:** December 13, 2024
**Status:** In Progress
**Priority:** P0 - Critical for GTM

## Overview

This document tracks the implementation of Site Kit features directly in cmp-frontend/cmp-backend (Waldur), providing a **single pane of glass** for both buyers and sellers.

## Architecture

```
+-------------------------------------------------------------------+
|                    CMP-FRONTEND (Waldur)                          |
|                    Single Pane of Glass                           |
+-------------------------------------------------------------------+
|  EXISTING WALDUR        |  NEW SITE KIT FEATURES                  |
|  -----------------      |  --------------------                   |
|  - Marketplace Browse   |  - My Agents (Buyer)                    |
|  - Orders/Checkout      |  - Agent Config (Buyer)                 |
|  - Organizations        |  - API Keys (Buyer)                     |
|  - Projects             |  - Widgets (Buyer)                      |
|  - Billing              |  - Provider Agents (Seller)             |
|  - Teams                |  - Agent Publishing (Seller)            |
+-------------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------------+
|                    CMP-BACKEND (Waldur)                           |
|              Extended marketplace_site_agent module               |
+-------------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------------+
|                    AGENT RUNTIME                                  |
|              (Execution - unchanged)                              |
+-------------------------------------------------------------------+
```

## Deprecation

| Component | Action | Status |
|-----------|--------|--------|
| cmp-agentregistry | Archive after Phase 2 | Pending |
| gsv-agentregistry | Archive after Phase 2 | Pending |
| cmp-portal | Archive immediately | Pending |

## Implementation Phases

### Phase 1: P0 - Core Buyer Features (Week 1-2)

**Goal:** Customer can configure and use purchased agents

#### Backend Changes (cmp-backend)

| Task | File | Status |
|------|------|--------|
| Add AgentApiKey model | marketplace_site_agent/models.py | DONE |
| Add CustomerAgentConfig model | marketplace_site_agent/models.py | DONE |
| Add TrainingDocument model | marketplace_site_agent/models.py | DONE |
| Add AgentUsageRecord model | marketplace_site_agent/models.py | DONE |
| Add customer viewsets | marketplace_site_agent/views.py | DONE |
| Add serializers | marketplace_site_agent/serializers.py | DONE |
| Add URL routes | marketplace_site_agent/urls.py | DONE |
| Create migrations | marketplace_site_agent/migrations/0002_site_kit_models.py | DONE |

#### Frontend Changes (cmp-frontend)

| Task | File | Status |
|------|------|--------|
| Add buyer routes | src/customer/routes.ts | DONE |
| Create agents directory | src/customer/agents/ | DONE |
| CustomerAgentsList | src/customer/agents/CustomerAgentsList.tsx | DONE |
| AgentConfigurePage | src/customer/agents/AgentConfigurePage.tsx | DONE |
| AgentKeysPage | src/customer/agents/AgentKeysPage.tsx | DONE |
| AgentWidgetsPage | src/customer/agents/AgentWidgetsPage.tsx | DONE |
| API client | src/customer/agents/api.ts | DONE |

### Phase 2: P0 - Core Seller Features (Week 2-3)

**Goal:** Provider can publish and manage agents

#### Backend Changes

| Task | File | Status |
|------|------|--------|
| Extend AgentIdentity for publishing | marketplace_site_agent/models.py | TODO |
| Add provider viewsets | marketplace_site_agent/views.py | TODO |
| Add publishing workflow | marketplace_site_agent/views.py | TODO |

#### Frontend Changes

| Task | File | Status |
|------|------|--------|
| Add seller routes | src/marketplace/routes.ts | DONE |
| Create agents directory | src/marketplace/service-providers/agents/ | DONE |
| ProviderAgentsList | src/marketplace/service-providers/agents/ProviderAgentsList.tsx | DONE |
| ProviderAgentDetailsPage | src/marketplace/service-providers/agents/ProviderAgentDetailsPage.tsx | DONE |
| ProviderAgentPublishDialog | src/marketplace/service-providers/agents/ProviderAgentPublishDialog.tsx | DONE |
| ProviderAgentCreateDialog | src/marketplace/service-providers/agents/ProviderAgentCreateDialog.tsx | DONE |
| ProviderAgentActions | src/marketplace/service-providers/agents/ProviderAgentActions.tsx | DONE |
| ProviderAgentAnalytics | src/marketplace/service-providers/agents/ProviderAgentAnalytics.tsx | DONE |
| ProviderAgentVersions | src/marketplace/service-providers/agents/ProviderAgentVersions.tsx | DONE |

### Phase 3: P1 - Integration Features (Week 3-4)

| Feature | Buyer | Seller | Status |
|---------|-------|--------|--------|
| Widget Embed Codes | Y | | DONE |
| Training Document Upload | Y | | DONE |
| Training Document Async Processing | Y | | DONE |
| Usage Dashboard | Y | Y | DONE |
| Version Management | | Y | TODO |

### Phase 4: P1 - Billing Integration (Week 4-5)

| Feature | Status |
|---------|--------|
| Stripe Checkout | DONE |
| Stripe Checkout Frontend | DONE |
| Usage Metering | DONE |
| Subscription Management | DONE |
| Revenue Analytics | DONE |

## Success Criteria

| Metric | Target |
|--------|--------|
| Buyer: Time from purchase to first API call | < 5 minutes |
| Seller: Time from Studio to Marketplace listing | < 10 minutes |
| Single login for all features | Yes (Keycloak SSO) |
| No separate portals/apps | Yes |

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2024-12-13 | Initial plan created | Claude |
| 2024-12-13 | Phase 1 buyer backend complete (models, views, serializers, migrations) | Claude |
| 2024-12-13 | Phase 1 buyer frontend complete (routes, components) | Claude |
| 2024-12-13 | Phase 2 seller frontend complete (routes, components) | Claude |
| 2024-12-14 | Phase 3 training document async processing complete | Claude |
| 2024-12-14 | Phase 4 Stripe payment gateway integration complete (backend) | Claude |
| 2024-12-14 | Phase 4 Stripe checkout frontend integration complete | Claude |
| 2024-12-14 | Revenue analytics fix - actual MRR from Stripe subscriptions | Claude |
