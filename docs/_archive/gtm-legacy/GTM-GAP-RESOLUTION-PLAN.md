# GTM Gap Resolution Plan

> **Purpose**: Actionable execution plan to close all GTM gaps in logical order
> **Created**: 2024-12-13
> **Status**: Active

---

## Executive Summary

Based on analysis of GTM-MASTER-HANDOVER.md and related documentation, the platform is at **~45% GTM readiness**. The Site Kit UI/API layer is 95% complete, but the **integration layer is 0%**.

This document provides a logical, dependency-aware execution plan to achieve GTM readiness.

---

## Current State

| Component | Status | Latest Commit |
|-----------|--------|---------------|
| cmp-backend (Site Kit API) | Code Complete | 8bf945c |
| cmp-frontend (Site Kit UI) | Code Complete | 36cd043 |
| Studio Integration | Not Started | - |
| Runtime Integration | Not Started | - |
| Stripe Integration | Not Started | - |
| Widget JS | Not Started | - |

---

## Dependency Graph

Phase 1: Foundation (Deployments)
    |
    +-- Deploy cmp-backend (8bf945c)
    +-- Deploy cmp-frontend (36cd043)
    |
    v
Phase 2: Core Integrations (P0)
    |
    +-- Studio-to-CMP Flow Import (Seller can publish)
    |       |
    |       v
    +-- CMP-to-Runtime Provisioning (Buyer gets agent instance)
    |       |
    |       v
    +-- Runtime API Key Validation (Agent can be called)
    |       |
    |       v
    +-- Widget JS Bundle (Agent can be embedded)
    |
    v
Phase 3: Revenue (P1)
    |
    +-- Stripe Payment Integration (Can collect money)
    +-- Usage Tracking Pipeline (Can bill usage)
    |
    v
Phase 4: Validation
    |
    +-- E2E Seller Journey Test
    +-- E2E Buyer Journey Test
    +-- Load Testing

---

## Phase 1: Foundation (Deployments)

### 1.1 Deploy Latest cmp-backend

**Objective**: Get Site Kit API endpoints live

**Current Status**:
- Code committed: 8bf945c feat(site-agent): Add Provider (Seller) API endpoints for GTM
- Includes buyer + seller endpoints in marketplace_site_agent

**Endpoints to Verify**:
| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/customer-agent-configs/ | GET/POST | Buyer configurations |
| /api/agent-api-keys/ | GET/POST | API key management |
| /api/training-documents/ | GET/POST | RAG documents |
| /api/provider-agents/ | GET/POST | Seller agents |

### 1.2 Deploy Latest cmp-frontend

**Objective**: Get Site Kit UI components live

**Routes to Verify**:
- /organizations/{uuid}/agents - Buyer agent list
- /organizations/{uuid}/agents/{id}/configure - Agent configuration
- /marketplace/service-providers/agents - Seller dashboard

---

## Phase 2: Core Integrations (P0)

### 2.1 Studio-to-CMP Flow Import

**Objective**: Allow sellers to publish flows from Langflow Studio to CMP

**Recommended for GTM**: Manual JSON Export/Import (MVP)
- Seller exports flow JSON from Studio
- Seller pastes JSON in CMP Provider Agent form
- CMP validates and stores flow_definition

### 2.2 CMP-to-Runtime Provisioning

**Objective**: When buyer subscribes to agent, provision a runtime instance

**Architecture**:
1. Waldur Order Approved -> Webhook to marketplace_site_agent
2. Create CustomerAgentConfig (buyer's instance)
3. Call Runtime API to deploy flow
4. Store runtime_endpoint in CustomerAgentConfig

### 2.3 Runtime API Key Validation

**Objective**: Runtime validates API keys against CMP before processing requests

**Recommended**: JWT-based Keys
- CMP issues JWT with embedded permissions (including tenant_id)
- Runtime validates JWT signature locally
- Latency: +1-2ms per request

### 2.4 Widget JS Bundle

**Objective**: Provide embeddable JavaScript for buyers to add chat widget to their sites

---

## Phase 3: Revenue (P1)

### 3.1 Stripe Payment Integration

**GTM Simplification**: For initial GTM with single provider (Digitlify):
- Skip Stripe Connect (no seller payouts needed)
- Focus on Stripe Checkout for buyer payments

### 3.2 Usage Tracking Pipeline

**Architecture**:
Runtime Request -> Usage Event (async) -> RabbitMQ -> CMP Consumer -> AgentUsageRecord

---

## Tenant Isolation Requirements

> **Reference**: See docs/architecture/MULTI_TENANCY.md for full design spec

### Isolation Principles

All GTM implementations MUST ensure tenant isolation at four layers:

1. **Control Plane Isolation** - What objects a tenant can see and manage
2. **Compute Isolation** - How flows are deployed and where they run
3. **Data Isolation** - Where customer data is stored and separated
4. **Network & IAM Isolation** - How requests and credentials are scoped

### Isolation Requirements by Component

#### CMP Backend (marketplace_site_agent)

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| All API queries filter by tenant | ViewSet.get_queryset() filters by user org | DONE |
| CustomerAgentConfig scoped to customer | customer_uuid foreign key | DONE |
| API keys bound to specific tenant + agent | AgentApiKey model includes tenant scope | DONE |
| Provider cannot see buyer configs | Separate viewsets with role-based access | DONE |

#### Runtime Gateway

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| API key validates tenant scope | JWT contains tenant_id claim | TODO |
| Request rejected if key tenant != agent tenant | Gateway middleware validation | TODO |
| Flow config resolved from Registry, not client | Gateway fetches from CMP | TODO |
| Usage events tagged with tenant_id | tenant_id in usage event payload | TODO |

#### Runtime (Langflow)

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Shared Mode: Gateway resolves config | Client never provides flow IDs | TODO |
| Shared Mode: Rate limits per tenant | Redis-based rate limiting | TODO |
| Dedicated Mode: Namespace per tenant | ten-{tenant_id} namespace | TODO |
| Dedicated Mode: NetworkPolicy isolation | Only gateway can reach tenant namespace | TODO |

#### Data Storage (RAG / Vector DB)

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Collection names include tenant_id | tenant_{tenant_id}_agent_{agent_id} | TODO |
| Tenant cannot access other collections | Runtime only uses resolved collection name | TODO |
| Object storage prefix by tenant | tenants/{tenant_id}/agents/{agent_id}/ | TODO |

### GTM Minimum Viable Isolation

For GTM with **Shared Runtime** mode:

Critical (Must Have):
- API keys scoped to tenant + agent
- Gateway validates tenant scope
- Gateway resolves flow config (not from client)
- Usage events tagged with tenant_id
- API queries always filter by tenant

Important (Should Have):
- Rate limiting per tenant/key
- Collection names include tenant_id
- Audit logging with tenant context

### Security Considerations

1. **Never trust client input for tenant/flow resolution**
   - Flow IDs come from Registry lookup
   - Collection names come from Registry lookup
   - Tenant ID comes from validated JWT

2. **Fail closed on ambiguity**
   - If tenant cannot be resolved: 401 Unauthorized
   - If agent doesnt belong to tenant: 403 Forbidden
   - If rate limit exceeded: 429 Too Many Requests

3. **Audit all access attempts**
   - Log successful invocations with tenant context
   - Log failed auth attempts
   - Log cross-tenant access attempts (security event)

---

## Execution Timeline

| Phase | Items | Effort | Dependencies |
|-------|-------|--------|--------------|
| 1.1 | Deploy cmp-backend | 2h | CI/CD complete |
| 1.2 | Deploy cmp-frontend | 2h | CI/CD complete |
| 2.1 | Studio-to-CMP (Manual) | 2-3 days | Phase 1 |
| 2.2 | CMP-to-Runtime | 3-5 days | Phase 2.1 |
| 2.3 | API Key Validation | 2-3 days | Phase 2.2 |
| 2.4 | Widget JS | 3-5 days | Phase 2.3 |
| 3.1 | Stripe Checkout | 1 week | Phase 2 |
| 3.2 | Usage Pipeline | 3-5 days | Phase 2.2 |
| 4.x | E2E Testing | 1 week | All above |

**Total Estimated**: 4-6 weeks to full GTM readiness

---

*Document created: 2024-12-13*
*Updated: 2024-12-13 - Added tenant isolation requirements*
