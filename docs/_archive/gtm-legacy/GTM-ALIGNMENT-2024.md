# GTM Alignment - Platform Architecture Consolidation

**Date**: 2024-12
**Status**: In Progress
**Author**: Platform Team

## Executive Summary

This document captures the architectural consolidation required for GTM readiness. The primary issue was **duplication of functionality** between the custom cmp-portal and Waldur CMP.

## Problem Statement

The platform had two parallel paths for customer-facing functionality:

| Function | Was In | Should Be In | Status |
|----------|--------|--------------|--------|
| Marketplace | cmp-portal (custom) | Waldur CMP | CONSOLIDATED |
| Billing | cmp-portal (custom) | Waldur CMP | CONSOLIDATED |
| Organizations | cmp-portal (custom) | Waldur CMP | CONSOLIDATED |
| Projects | cmp-portal (custom) | Waldur CMP | CONSOLIDATED |
| Team Members | cmp-portal (custom) | Waldur CMP | CONSOLIDATED |
| Agent Config | cmp-portal | cmp-portal | KEEP |
| Widgets | cmp-portal | cmp-portal | KEEP |
| Training Docs | cmp-portal | cmp-portal | KEEP |
| API Keys | cmp-portal | cmp-portal | KEEP |

## Corrected Architecture

### Component Responsibilities

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           WALDUR CMP                                      │
│  (cmp-frontend / cmp-backend)                                            │
│                                                                          │
│  ✓ Marketplace / Catalog                                                 │
│  ✓ Offerings & Plans                                                     │
│  ✓ Orders & Subscriptions                                                │
│  ✓ Billing & Invoices                                                    │
│  ✓ Organizations (Customers)                                             │
│  ✓ Projects                                                              │
│  ✓ Team Members & Permissions                                            │
│  ✓ Usage Reporting (aggregated)                                          │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                    Webhooks (order.created, etc.)
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        AGENT REGISTRY                                    │
│  (gsv-agentregistry / cmp-agentregistry)                                │
│                                                                          │
│  ✓ Receives Waldur order webhooks                                       │
│  ✓ Creates AgentAccess records                                          │
│  ✓ Generates API keys                                                   │
│  ✓ Reports usage back to Waldur                                         │
│  ✓ Publishes agents as Waldur offerings                                 │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                        API calls
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     AGENT CONFIG PORTAL                                  │
│  (cmp-portal - RENAMED PURPOSE)                                         │
│                                                                          │
│  ✓ Agent Persona configuration                                          │
│  ✓ Widget management & embed codes                                      │
│  ✓ Training document upload                                             │
│  ✓ API key management                                                   │
│  ✓ Usage statistics (detailed, per-agent)                               │
│                                                                          │
│  ✗ NO Marketplace (redirects to Waldur)                                 │
│  ✗ NO Billing (redirects to Waldur)                                     │
│  ✗ NO Org/Team management (redirects to Waldur)                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. Customer browses marketplace → Waldur CMP
2. Customer orders agent → Waldur CMP creates order
3. Waldur sends webhook → Agent Registry creates AgentAccess
4. Customer configures agent → Agent Config Portal
5. Customer uses agent → Agent Runtime
6. Agent Registry reports usage → Waldur CMP
7. Waldur bills customer
```

## Changes Made

### 1. cmp-portal Navigation (layout.tsx)

**Before:**
- Internal marketplace page
- Internal billing page
- Internal settings page

**After:**
- Dashboard (internal)
- My Agents (internal)
- Marketplace → External link to Waldur
- Billing → External link to Waldur
- Organization → External link to Waldur

### 2. Redirect Pages

All duplicate pages now redirect to Waldur CMP:

- `/marketplace` → `{WALDUR_URL}/marketplace/`
- `/marketplace/[slug]` → `{WALDUR_URL}/marketplace/?q={slug}`
- `/billing` → `{WALDUR_URL}/billing/`
- `/settings` → `{WALDUR_URL}/profile/`

### 3. API Client (api.ts)

**Removed:**
- `getMarketplaceAgents()` - now throws error with redirect message
- `getMarketplaceAgent()` - now throws error with redirect message
- `getSubscriptions()` - now throws error with redirect message
- `getOrganizations()` - now throws error with redirect message
- `getTeamMembers()` - now throws error with redirect message
- All billing APIs (checkout, subscriptions, etc.)

**Kept:**
- Agent configuration APIs (persona, widgets, training, API keys)
- Usage statistics API
- Basic user profile

### 4. Agent Registry Integration (Already Existed)

The Agent Registry already has proper Waldur integration:

- `WaldurClient` - API client for Waldur operations
- `WaldurOfferingService` - Publishes agents to Waldur marketplace
- `WaldurUsageService` - Reports usage for billing
- Webhook handlers for orders, customers, projects

## Environment Variables

### cmp-portal

```env
NEXT_PUBLIC_WALDUR_URL=https://app.digitlify.com
NEXT_PUBLIC_API_URL=https://agent-registry.digitlify.com
```

### Agent Registry

```env
WALDUR_API_URL=http://waldur-mastermind-api.cmp.svc.cluster.local
WALDUR_API_TOKEN=<service-account-token>
WALDUR_WEBHOOK_SECRET=<webhook-signing-secret>
```

## GTM Checklist

### Completed
- [x] Identify duplicate functionality
- [x] Update cmp-portal navigation
- [x] Create redirect pages for marketplace/billing/settings
- [x] Update API client to remove duplicate functions
- [x] Document architecture alignment

### Remaining
- [ ] Configure Waldur webhook endpoints in production
- [ ] Set up SSO integration (Keycloak) between portals
- [ ] Test end-to-end order flow
- [ ] Validate usage reporting
- [ ] Update documentation across all repos

## Repository Naming Clarification

Per CLAUDE.md:

| Deprecated Name | Correct Name | Purpose |
|-----------------|--------------|---------|
| `cmp-portal` | Agent Config Portal | Agent-specific configuration UI |
| `gsv-agents` | `gsv-agentregistry` | Lifecycle management |
| `cmp-frontend` | Waldur HomePort | CMP UI (catalog, billing, org) |
| `cmp-backend` | Waldur Mastermind | CMP API |

**Note:** `cmp-portal` should potentially be renamed to `cmp-agent-config` or similar to clarify its purpose.

## Testing Requirements

Before GTM, the following E2E tests must pass:

1. **Order Flow**
   - Customer browses Waldur marketplace
   - Customer orders agent
   - Webhook creates AgentAccess in Agent Registry
   - Customer can configure agent in Agent Config Portal

2. **Usage & Billing**
   - Agent usage is tracked in Agent Registry
   - Usage is reported to Waldur
   - Customer sees usage in Waldur billing

3. **Multi-tenancy**
   - Tenant A cannot see Tenant B's agents
   - Tenant A cannot access Tenant B's configuration

## References

- `docs/gsv-platform/ARCHITECTURE.md` - Platform architecture
- `docs/waldur-e2e-process-flow.md` - Waldur integration flow
- `docs/digital_partners_docs/multi_tenancy_design_langflow.md` - Multi-tenancy design
