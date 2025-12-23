# Architecture Evolution: Portal → Site Kit

**Date:** December 13, 2024
**Status:** Active Migration

---

## Executive Summary

We are migrating from a **separate portal architecture** to a **Site Kit extension model** where CMP-Frontend (Waldur Homeport) becomes the single pane of glass for all functionality.

---

## Before: Separate Applications

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SEPARATE APPS                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │  cmp-frontend   │    │   cmp-portal    │    │ agentregistry   │     │
│  │  (Waldur)       │    │  (Separate App) │    │  (Backend API)  │     │
│  │                 │    │                 │    │                 │     │
│  │ • Marketplace   │    │ • Agent Config  │    │ • Registration  │     │
│  │ • Billing       │    │ • Widgets       │    │ • Versioning    │     │
│  │ • Org/Project   │    │ • API Keys      │    │ • Access Ctrl   │     │
│  │ • Orders        │    │ • RAG/Training  │    │ • Usage Track   │     │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘     │
│           │                      │                      │               │
│           │         User must switch between apps       │               │
│           │◄─────────────────────┼──────────────────────┤               │
│           │                      │                      │               │
│           ▼                      ▼                      ▼               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Multiple Domains                             │   │
│  │  app.digitlify.com    portal.digitlify.com    api.digitlify.com │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

PROBLEMS:
• Context switching between apps
• Separate authentication flows
• Duplicate navigation/UI patterns
• Maintenance overhead (3 frontends)
• Inconsistent theming
• User confusion
```

---

## After: Site Kit Extension Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      UNIFIED CMP-FRONTEND                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     cmp-frontend (Extended)                      │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────┐ │   │
│  │  │                   Waldur Core                                │ │   │
│  │  │  • Marketplace  • Billing  • Organizations  • Projects      │ │   │
│  │  └─────────────────────────────────────────────────────────────┘ │   │
│  │                              +                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐ │   │
│  │  │                 SITE KIT EXTENSIONS                          │ │   │
│  │  │                                                              │ │   │
│  │  │  ┌─────────────────┐       ┌─────────────────┐              │ │   │
│  │  │  │  Seller Kit     │       │   Buyer Kit     │              │ │   │
│  │  │  │                 │       │                 │              │ │   │
│  │  │  │ • Agent CRUD    │       │ • Agent Config  │              │ │   │
│  │  │  │ • Versions      │       │ • Personas      │              │ │   │
│  │  │  │ • Training Docs │       │ • Widgets       │              │ │   │
│  │  │  │ • Publish       │       │ • API Keys      │              │ │   │
│  │  │  │ • Analytics     │       │ • Usage Stats   │              │ │   │
│  │  │  └─────────────────┘       └─────────────────┘              │ │   │
│  │  │                                                              │ │   │
│  │  └─────────────────────────────────────────────────────────────┘ │   │
│  │                              +                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐ │   │
│  │  │              OPTIONAL: Waldur MCP Server                     │ │   │
│  │  │  • AI-assisted navigation  • Natural language queries       │ │   │
│  │  └─────────────────────────────────────────────────────────────┘ │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│           │                                                              │
│           │         API Calls                                            │
│           ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                  cmp-agentregistry (Backend)                     │   │
│  │  • REST API  • MCP Server  • Waldur Webhooks  • Runtime Bridge  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Single Domain                                │   │
│  │                    app.digitlify.com                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

BENEFITS:
• Single application, single domain
• Unified authentication (Keycloak)
• Consistent UI/UX patterns
• Single codebase to maintain
• Unified theming
• Seamless navigation between features
```

---

## Component Comparison

### Frontend

| Aspect | Before (Portal) | After (Site Kit) |
|--------|-----------------|------------------|
| **Applications** | 2 (cmp-frontend + cmp-portal) | 1 (cmp-frontend extended) |
| **Domains** | 2 (app.x.com + portal.x.com) | 1 (app.x.com) |
| **Auth Flow** | Separate per app | Unified SSO |
| **Navigation** | Cross-app links | In-app routing |
| **Theming** | Duplicate configs | Single config |
| **Maintenance** | 2x effort | 1x effort |
| **Build/Deploy** | 2 pipelines | 1 pipeline |

### Backend

| Aspect | Before | After |
|--------|--------|-------|
| **Agent Registry** | Standalone Django app | Same (unchanged) |
| **API Access** | Direct from portal | Via Site Kit components |
| **MCP Server** | Optional | Optional (can extend Waldur) |

---

## Site Kit Architecture

### What is Site Kit?

Site Kit is a collection of **React components, routes, and API clients** that extend CMP-Frontend (Waldur Homeport) with agent registry functionality.

### Directory Structure

```
cmp-frontend/src/
├── core/                    # Waldur core
├── marketplace/             # Waldur marketplace
├── customer/                # Waldur customer features
│   └── agents/              # ← SITE KIT: Buyer features
│       ├── CustomerAgentsList.tsx
│       ├── AgentConfigurePage.tsx
│       ├── AgentWidgetsPage.tsx
│       └── AgentKeysPage.tsx
├── marketplace/
│   └── service-providers/
│       └── agents/          # ← SITE KIT: Seller features
│           ├── ProviderAgentsList.tsx
│           ├── AgentCreateDialog.tsx
│           ├── AgentDetailsPage.tsx
│           ├── AgentVersionsPage.tsx
│           └── AgentTrainingPage.tsx
└── api/
    └── agentRegistry.ts     # ← SITE KIT: API client
```

### Routes Added

**Buyer Routes (Customer context):**
```
/organization/:uuid/agents/                    → CustomerAgentsList
/organization/:uuid/agents/:access_uuid/configure/  → AgentConfigurePage
/organization/:uuid/agents/:access_uuid/widgets/    → AgentWidgetsPage
/organization/:uuid/agents/:access_uuid/keys/       → AgentKeysPage
```

**Seller Routes (Provider context):**
```
/marketplace-provider/:uuid/agents/            → ProviderAgentsList
/marketplace-provider/:uuid/agents/:agent_uuid/     → AgentDetailsPage
/marketplace-provider/:uuid/agents/:agent_uuid/versions/  → AgentVersionsPage
/marketplace-provider/:uuid/agents/:agent_uuid/training/  → AgentTrainingPage
```

---

## Optional: Waldur MCP Server

For AI-enhanced experiences, we can add MCP (Model Context Protocol) support:

### Use Cases

1. **Natural Language Navigation**
   - "Show me my agents"
   - "What's my API usage this month?"
   - "Create a new support agent"

2. **AI-Assisted Configuration**
   - "Set up a friendly customer service persona"
   - "Generate a welcome message for e-commerce"

3. **Intelligent Search**
   - "Find agents related to customer support"
   - "Show top-rated chatbots"

### Architecture with MCP

```
┌─────────────────┐         ┌─────────────────┐
│  CMP-Frontend   │         │  LLM Provider   │
│  + Chat Widget  │◄───────►│  (Claude/GPT)   │
└────────┬────────┘         └─────────────────┘
         │                           │
         │ User Query                │ Tool Calls
         ▼                           ▼
┌─────────────────────────────────────────────┐
│              Waldur MCP Server              │
│                                             │
│  Tools:                                     │
│  • list_agents      • configure_agent       │
│  • get_usage        • create_api_key        │
│  • search_marketplace  • place_order        │
└─────────────────────────────────────────────┘
         │
         │ API Calls
         ▼
┌─────────────────┐    ┌─────────────────┐
│  Waldur API     │    │ Agent Registry  │
│  (cmp-backend)  │    │      API        │
└─────────────────┘    └─────────────────┘
```

### Implementation Priority

| Priority | Feature | Rationale |
|----------|---------|-----------|
| P1 | Site Kit UI | Core functionality |
| P2 | Agent Registry API | Backend for Site Kit |
| P3 | Waldur MCP Server | Nice-to-have, AI enhancement |

---

## Migration Plan

### Phase 1: Build Site Kit (Current)
1. Create API client for Agent Registry
2. Add buyer routes and components
3. Add seller routes and components
4. Test integration

### Phase 2: Deprecate Portal
1. Announce deprecation to users
2. Add redirects from portal.x.com → app.x.com
3. Monitor for issues
4. Remove portal from GitOps

### Phase 3: Archive Portal
1. Archive cmp-portal repository
2. Update documentation
3. Remove portal DNS entries

---

## cmp-portal Deprecation Status

| Feature | Current Location | New Location | Status |
|---------|------------------|--------------|--------|
| Agent Config | cmp-portal | Site Kit (Buyer) | Planned |
| Widget Embed | cmp-portal | Site Kit (Buyer) | Planned |
| API Keys | cmp-portal | Site Kit (Buyer) | Planned |
| Agent Upload | cmp-portal (limited) | Site Kit (Seller) | Planned |
| Marketplace Browse | Redirects to Waldur | Waldur native | Done |
| Billing | Redirects to Waldur | Waldur native | Done |

---

## Benefits Summary

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Apps to maintain | 2 | 1 | 50% less |
| Domains to manage | 2 | 1 | 50% less |
| User context switches | Many | Zero | 100% |
| Auth complexity | Moderate | Low | Simpler |
| Deploy pipelines | 2 | 1 | 50% less |
| Theme configs | 2 | 1 | 50% less |

---

## Summary

**Old Model:**
- cmp-portal = Separate React app for agent config
- Requires switching between apps
- Duplicate maintenance

**New Model:**
- Site Kit = Components integrated into cmp-frontend
- Everything in one place
- Single source of truth

**The Agent Registry backend remains the same** - only the frontend architecture changes.

---

*Document maintained by GSV Platform Team*
