# Provider Portal Design Document

**Date:** December 11, 2024
**Status:** GTM Gap - Design Phase
**Priority:** CRITICAL for Full GTM

## Overview

The Provider Portal is a dedicated UI for agent providers (sellers) to:
1. Create and manage agent offerings
2. Publish agents to the marketplace
3. Monitor usage and revenue
4. Manage agent versions and updates

## Current State

**No dedicated Provider Portal exists.** Providers must use:
- Waldur Admin UI (limited, poor UX)
- Direct API calls to Agent Registry
- Manual processes

## GTM Impact

| Phase | Impact | Mitigation |
|-------|--------|------------|
| Soft Launch | MEDIUM | Admin team publishes agents on behalf of providers |
| Full GTM | CRITICAL | Must have self-service provider portal |

## Architecture

### Option A: Standalone Portal (Recommended)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Provider Portal                              │
│                   (New Next.js App)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Dashboard  │  │   Agents    │  │  Analytics/Revenue      │  │
│  │             │  │  Management │  │                         │  │
│  │ - Overview  │  │ - Create    │  │ - Usage by agent        │  │
│  │ - Revenue   │  │ - Edit      │  │ - Revenue by period     │  │
│  │ - Alerts    │  │ - Publish   │  │ - Customer insights     │  │
│  └─────────────┘  │ - Versions  │  └─────────────────────────┘  │
│                   └─────────────┘                                │
│                                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │   Agent Registry    │
                │       API           │
                │                     │
                │ POST /api/v1/agents │
                │ POST /api/v1/publish│
                │ GET /api/v1/revenue │
                └─────────────────────┘
```

### Option B: Integrated into cmp-portal

Add provider routes to existing cmp-portal:
- `/provider/dashboard`
- `/provider/agents`
- `/provider/analytics`

**Pros:** Faster development, shared auth
**Cons:** Mixed concerns, larger bundle

## Proposed Repository

**Name:** `cmp-provider-portal` (Digitlify-Inc) / `gsv-provider-portal` (GSVDEV)

### Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14+ |
| Language | TypeScript |
| Auth | NextAuth + Keycloak |
| UI | Tailwind CSS + shadcn/ui |
| API Client | Axios / TanStack Query |
| State | React Context / Zustand |

### Pages Structure

```
/dashboard              - Provider overview
/agents                 - Agent list
/agents/new             - Create agent wizard
/agents/[id]            - Agent details
/agents/[id]/edit       - Edit agent
/agents/[id]/publish    - Publish to marketplace
/agents/[id]/versions   - Version management
/analytics              - Usage and revenue
/analytics/revenue      - Revenue breakdown
/settings               - Provider settings
```

## Agent Registry API Requirements

### New Endpoints Needed

```yaml
# Provider-specific endpoints
POST   /api/v1/provider/agents              # Create agent as provider
GET    /api/v1/provider/agents              # List provider's agents
PUT    /api/v1/provider/agents/{id}         # Update agent
DELETE /api/v1/provider/agents/{id}         # Delete agent

POST   /api/v1/provider/agents/{id}/publish # Publish to Waldur
POST   /api/v1/provider/agents/{id}/unpublish
POST   /api/v1/provider/agents/{id}/version # Create new version

GET    /api/v1/provider/analytics/overview  # Dashboard stats
GET    /api/v1/provider/analytics/usage     # Usage by agent
GET    /api/v1/provider/analytics/revenue   # Revenue by period
```

### Authentication

Providers authenticated via Keycloak with `provider` role:
- OIDC token verification
- Role-based access control
- Provider <-> Organization mapping via Waldur Service Provider

## Key Features

### 1. Agent Creation Wizard

```
Step 1: Basic Info
- Name, description, category
- Tags and keywords

Step 2: Configuration
- Runtime settings
- Model selection
- System prompt template

Step 3: Pricing Plans
- Plan tiers (Free, Basic, Pro, Enterprise)
- Usage limits
- Pricing per unit

Step 4: Review & Save
- Preview listing
- Save as draft or publish
```

### 2. Marketplace Publishing

```
┌─────────────────────────────────────────────────────────────┐
│                    Publishing Flow                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Provider Portal          Agent Registry        Waldur CMP   │
│  ┌─────────────┐         ┌─────────────┐      ┌───────────┐ │
│  │ Click       │────────▶│ Validate    │─────▶│ Create    │ │
│  │ "Publish"   │         │ Agent       │      │ Offering  │ │
│  └─────────────┘         └─────────────┘      └───────────┘ │
│                                                      │       │
│                                               ┌──────▼─────┐ │
│                                               │ Live in    │ │
│                                               │ Marketplace│ │
│                                               └────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3. Analytics Dashboard

Key metrics:
- Total agents published
- Active subscriptions
- Monthly recurring revenue (MRR)
- Usage by agent (API calls, tokens)
- Customer breakdown

## Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Design | 1 week | This document, wireframes, API spec |
| MVP | 2 weeks | Basic CRUD, publish flow, auth |
| Analytics | 1 week | Dashboard, revenue reports |
| Polish | 1 week | UX improvements, testing |
| **Total** | **5 weeks** | Full provider portal |

## Interim Solution (GTM Soft Launch)

Until Provider Portal is built:

1. **Admin-Assisted Publishing**
   - Providers submit agents via form/email
   - Admin team creates offerings in Waldur
   - Admin publishes via Agent Registry scripts

2. **Simple Admin UI**
   - Add basic provider functions to Django Admin
   - Custom admin actions for publish/unpublish

3. **API Documentation**
   - Document Agent Registry provider APIs
   - Provide Postman collection for manual testing

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Agent Registry Provider APIs | PARTIAL | Need enhancement |
| Waldur Service Provider setup | REQUIRED | Must configure SP |
| Keycloak provider role | REQUIRED | Add role mapping |
| Studio export format | REQUIRED | Define JSON schema |

## Related Documentation

- [GTM Comprehensive Analysis](../GTM-COMPREHENSIVE-ANALYSIS-2024-12-11.md)
- [Architecture](./ARCHITECTURE.md)
- [Customer Portal (cmp-portal)](../../repo/github.com/Digitlify-Inc/cmp-portal/README.md)
