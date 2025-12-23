# Deprecation Roadmap

**Date:** December 13, 2024
**Status:** Active

---

## Overview

As part of the **Site Kit** initiative, we are consolidating multiple standalone applications into **CMP-Frontend** (Waldur Homeport). This document tracks what is being deprecated and the migration path.

---

## Deprecation Summary

| Component | Status | Replacement | Timeline |
|-----------|--------|-------------|----------|
| **cmp-portal** | Deprecated | Site Kit (in cmp-frontend) | Q1 2025 |
| **cmp-agentregistry** (standalone) | Deprecated | Integrated into cmp-backend | Q1 2025 |
| **gsv-agentregistry** (standalone) | Deprecated | Integrated into gsv-cmp | Q1 2025 |

---

## What's Being Deprecated

### 1. cmp-portal (Customer/Config Portal)

**Repository:** `Digitlify-Inc/cmp-portal`

**What it does today:**
- Agent configuration (personas, prompts)
- Widget management and embed codes
- API key generation and management
- Training document upload (RAG)
- Basic analytics

**Why deprecating:**
- Separate application requires context switching
- Duplicate authentication flows
- Duplicate UI components and theming
- Maintenance overhead of two React apps

**Migration:**
All features move to **Site Kit** components within cmp-frontend:
- `/organization/:uuid/agents/` - Agent list
- `/organization/:uuid/agents/:id/configure/` - Configuration
- `/organization/:uuid/agents/:id/widgets/` - Widget management
- `/organization/:uuid/agents/:id/keys/` - API key management

### 2. cmp-agentregistry (Standalone Backend)

**Repository:** `Digitlify-Inc/cmp-agentregistry`

**What it does today:**
- Agent registration and versioning
- Access control and API key validation
- Usage tracking and metering
- Runtime integration via MCP

**Why deprecating:**
- Can be integrated directly into cmp-backend (Waldur)
- Eliminates need for separate Django service
- Simplifies deployment and ops
- Better integration with Waldur's permission system

**Migration Options:**

**Option A: Integrate as Waldur Plugin**
```
cmp-backend/
├── src/
│   └── waldur_agentregistry/     # New Waldur app
│       ├── models.py             # Agent, Version, Access models
│       ├── views.py              # REST API endpoints
│       ├── serializers.py
│       ├── tasks.py              # Celery tasks
│       └── mcp_server.py         # MCP protocol handler
```

**Option B: Keep as Microservice (Simplified)**
```
cmp-backend/                      # Waldur (main)
cmp-agentregistry/                # Simplified service
  └── agent_registry/
      ├── api/                    # REST endpoints only
      └── mcp/                    # MCP server
```

**Recommended:** Option A - Full integration into Waldur

### 3. gsv-agentregistry (GSVDEV Version)

**Repository:** `GSVDEV/gsv-agentregistry`

**Same deprecation as cmp-agentregistry** - the tenant copy follows the platform version.

---

## New Architecture

### Before (Current)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  cmp-frontend   │     │   cmp-portal    │     │cmp-agentregistry│
│  (Waldur UI)    │     │  (Config UI)    │     │   (Backend)     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                        cmp-backend (Waldur API)                  │
└─────────────────────────────────────────────────────────────────┘
```

**Problems:**
- 3 separate deployments
- 2 separate frontends
- Auth complexity
- Maintenance overhead

### After (Target)

```
┌─────────────────────────────────────────────────────────────────┐
│                    cmp-frontend + Site Kit                       │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Waldur Core    │  │   Buyer Kit     │  │   Seller Kit    │  │
│  │  (Marketplace,  │  │  (Agent Config, │  │  (Agent CRUD,   │  │
│  │   Billing, Org) │  │   Widgets, Keys)│  │   Versions)     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                 cmp-backend + Agent Registry Plugin              │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐   │
│  │  Waldur Core    │  │      waldur_agentregistry            │   │
│  │  (Customers,    │  │  • Agent/Version models              │   │
│  │   Projects,     │  │  • Access control                    │   │
│  │   Marketplace)  │  │  • Usage tracking                    │   │
│  └─────────────────┘  │  • MCP server                        │   │
│                       │  • Runtime integration               │   │
│                       └─────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Benefits:**
- 1 frontend deployment
- 1 backend deployment
- Unified auth
- Simplified ops

---

## Migration Timeline

### Phase 1: Parallel Operation (Current)
- Site Kit components built in cmp-frontend
- cmp-portal still operational
- cmp-agentregistry still operational
- Users can use either

### Phase 2: Soft Deprecation (Q1 2025)
- Site Kit feature complete
- Deprecation notices in cmp-portal
- Redirect links to new locations
- New users directed to Site Kit

### Phase 3: Hard Deprecation (Q2 2025)
- cmp-portal redirects to cmp-frontend
- cmp-agentregistry integrated into cmp-backend
- Old URLs return 301 redirects
- Documentation updated

### Phase 4: Removal (Q3 2025)
- cmp-portal archived
- cmp-agentregistry archived
- DNS entries removed
- Historical docs maintained

---

## Feature Migration Matrix

### Portal Features → Site Kit

| Portal Feature | Site Kit Location | Status |
|---------------|-------------------|--------|
| Agent list | `/organization/:uuid/agents/` | Planned |
| Agent config (persona) | `.../agents/:id/configure/` | Planned |
| System prompt | `.../agents/:id/configure/` | Planned |
| Welcome message | `.../agents/:id/configure/` | Planned |
| Widget embed code | `.../agents/:id/widgets/` | Planned |
| Widget styling | `.../agents/:id/widgets/` | Planned |
| API key list | `.../agents/:id/keys/` | Planned |
| Create API key | `.../agents/:id/keys/` | Planned |
| Revoke API key | `.../agents/:id/keys/` | Planned |
| Usage stats | `.../agents/:id/usage/` | Planned |
| Training docs | `.../agents/:id/training/` | Planned |

### Agent Registry Features → Waldur Plugin

| Registry Feature | Waldur Plugin | Status |
|-----------------|---------------|--------|
| Agent model | `waldur_agentregistry.models.Agent` | Planned |
| Version model | `waldur_agentregistry.models.AgentVersion` | Planned |
| Access model | `waldur_agentregistry.models.AgentAccess` | Planned |
| API key validation | `waldur_agentregistry.auth` | Planned |
| Usage tracking | `waldur_agentregistry.metering` | Planned |
| MCP server | `waldur_agentregistry.mcp` | Planned |
| Runtime bridge | `waldur_agentregistry.runtime` | Planned |
| Webhook handlers | `waldur_agentregistry.webhooks` | Planned |

---

## API Compatibility

### REST API Migration

Old endpoints (cmp-agentregistry):
```
GET  /api/v1/agents/
GET  /api/v1/agents/{id}/
POST /api/v1/agents/{id}/access/
```

New endpoints (Waldur plugin):
```
GET  /api/agents/
GET  /api/agents/{uuid}/
POST /api/agents/{uuid}/access/
```

**Migration:** Provide 301 redirects from old to new endpoints for 6 months.

### MCP Protocol

MCP server moves from standalone to Waldur:
```
Old: wss://api.digitlify.com/mcp/
New: wss://app.digitlify.com/api/mcp/
```

**Migration:** Update Runtime configuration to new endpoint.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Feature parity gap | Users blocked | Build Site Kit fully before deprecating |
| API breaking changes | Integration failures | Version APIs, provide migration period |
| Performance regression | User experience | Load test Waldur plugin |
| Data migration issues | Data loss | Backup before migration, test thoroughly |

---

## Success Criteria

- [ ] All portal features available in Site Kit
- [ ] All registry APIs available in Waldur plugin
- [ ] Zero user-reported blocking issues
- [ ] < 5% increase in support tickets
- [ ] Reduced deployment complexity
- [ ] Improved page load times

---

## Communication Plan

1. **Announcement** (2 weeks before soft deprecation)
   - Blog post
   - In-app banner
   - Email to active users

2. **Migration Guide** (at soft deprecation)
   - Step-by-step migration docs
   - API mapping reference
   - FAQ

3. **Reminder** (1 month before hard deprecation)
   - Email reminder
   - In-app countdown
   - Support availability

4. **Completion** (at removal)
   - Final email
   - Archive announcement
   - Redirect notice page

---

*Document maintained by GSV Platform Team*
