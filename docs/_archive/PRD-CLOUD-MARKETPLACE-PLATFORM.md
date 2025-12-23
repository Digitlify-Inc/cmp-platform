# Cloud Marketplace Platform (CMP) - Product Requirements Document

**Document Version:** 1.0
**Status:** Draft
**Last Updated:** December 13, 2024
**Owner:** GSV Platform Team

---

## Executive Summary

The Cloud Marketplace Platform (CMP) is a unified platform for creating, managing, and monetizing AI agents, applications, assistants, and automations. Built on open-source foundations (Waldur, Langflow, Keycloak, Backstage), it provides a complete value chain from **Concept → Code → Cash**.

### Vision Statement

> **"Single pane of glass for every role, every use case"**

CMP serves as the unified interface for:
- **Sellers (Providers)**: Create, publish, and monetize AI solutions
- **Buyers (Customers)**: Discover, subscribe, configure, and use AI solutions
- **Platform Operators**: Manage infrastructure, billing, and compliance
- **Developers**: Build and extend platform capabilities

---

## Platform Architecture

### High-Level Flow

```
┌─────────────┐     ┌─────────────────────┐     ┌─────────────┐     ┌─────────────┐
│   STUDIO    │────▶│   AGENT REGISTRY    │────▶│   RUNTIME   │────▶│     CMP     │
│             │     │                     │     │             │     │             │
│ Development │     │ Lifecycle Mgmt      │     │ Execution   │     │ Marketplace │
│ Environment │     │ - Registration      │     │ Environment │     │ - Catalog   │
│             │     │ - Versioning        │     │             │     │ - Billing   │
│ Create:     │     │ - Config/Personas   │     │ Execute:    │     │ - Metering  │
│ - Agents    │     │ - RAG/Training      │     │ - Agents    │     │ - Multi-    │
│ - Apps      │     │ - Branding          │     │ - Apps      │     │   tenancy   │
│ - Flows     │     │ - API Keys          │     │ - Workflows │     │ - Payments  │
│             │     │ - Access Control    │     │             │     │             │
└─────────────┘     └─────────────────────┘     └─────────────┘     └─────────────┘
      │                      │                        │                    │
      │                      │                        │                    │
      └──────────────────────┴────────────────────────┴────────────────────┘
                                       │
                                       ▼
                            ┌─────────────────────┐
                            │    CMP-FRONTEND     │
                            │  (Single Pane of    │
                            │       Glass)        │
                            │                     │
                            │ - Unified UI        │
                            │ - All Roles         │
                            │ - All Use Cases     │
                            │ - Theming           │
                            └─────────────────────┘
```

### Component Mapping

| Generic Name | OSS Foundation | Purpose |
|--------------|----------------|---------|
| **Studio** | Langflow (+ future: n8n, Dify) | Visual agent/app development |
| **Agent Registry** | Custom Django + MCP | Lifecycle management hub |
| **Runtime** | Langflow Runtime (+ future) | Execution environment |
| **CMP** | Waldur | Marketplace, billing, multi-tenancy |
| **CMP-Frontend** | Waldur Homeport | Unified UI (extended with Site Kit) |
| **SSO** | Keycloak | Authentication, identity |
| **IDP** | Backstage | Developer portal, software catalog |

---

## Product Components

### 1. Studio (Development Environment)

**Current:** Langflow
**Future:** Add n8n, Dify, custom builders

**Capabilities:**
- Visual flow-based agent creation
- Component library (APIs, MCPs, models)
- Testing and debugging
- Version control integration
- Export to Runtime

**User Roles:**
- Agent Developers
- Solution Architects
- AI Engineers

### 2. Agent Registry (Lifecycle Management Hub)

**The "Missing Piece"** - bridges Studio, Runtime, and CMP

**Capabilities:**

| Category | Features |
|----------|----------|
| **Registration** | Register agents/apps from Studio |
| **Versioning** | Semantic versioning, rollback support |
| **Configuration** | Personas, system prompts, behavior settings |
| **RAG/Training** | Document upload, knowledge base management |
| **Branding** | Custom names, icons, colors per customer |
| **Widgets** | Embed code generation, chat window config |
| **API Keys** | Generate, rotate, revoke access keys |
| **MCP Keys** | Model Context Protocol key management |
| **Access Control** | Permission management, sharing |
| **Analytics** | Usage statistics, performance metrics |

**Interfaces:**
- **Seller UI (Site Kit)**: Manage owned agents
- **Buyer UI (Site Kit)**: Configure purchased agents
- **MCP Server**: Programmatic access for automation
- **Waldur Webhooks**: Sync with marketplace events

### 3. Runtime (Execution Environment)

**Current:** Langflow Runtime
**Future:** Add specialized runtimes for different workloads

**Capabilities:**
- Agent/app execution
- Auto-scaling based on demand
- Multi-tenancy (shared/dedicated)
- Usage metering
- Health monitoring

**Tenancy Models:**

| Model | Use Case | Isolation |
|-------|----------|-----------|
| **Shared** | Budget plans ($29-99/mo) | API key + data tagging |
| **Dedicated** | Enterprise ($500+/mo) | Namespace isolation |

### 4. CMP (Cloud Management Platform)

**Foundation:** Waldur
**Extension:** Site Kit components in CMP-Frontend

**Capabilities:**

| Category | Features |
|----------|----------|
| **Marketplace** | Catalog, categories, search, filtering |
| **Listings** | Agent details, screenshots, documentation |
| **Plans** | Pricing tiers, feature comparison |
| **Subscriptions** | Monthly/yearly billing cycles |
| **Usage/Metering** | API calls, tokens, compute time |
| **Billing** | Invoices, statements, tax handling |
| **Payments** | Credit/wallet, cards, invoicing |
| **Multi-tenancy** | Organizations, projects, teams |
| **RBAC** | Role-based access control |

---

## CMP-Frontend: Single Pane of Glass

### Design Principle

> **One application, all roles, all use cases**

CMP-Frontend (Waldur Homeport) is extended with **Site Kit** to serve every user type without separate applications.

### Role-Based Views

```
CMP-Frontend
├── Public (Anonymous)
│   ├── Marketplace Browse
│   ├── Agent/App Details
│   ├── Provider Profiles
│   └── Pricing Information
│
├── Buyer (Customer)
│   ├── Dashboard
│   ├── My Agents (purchased)
│   │   ├── Configuration
│   │   ├── Widgets/Embed
│   │   ├── API Keys
│   │   └── Usage Stats
│   ├── Organization Management
│   │   ├── Projects
│   │   ├── Team
│   │   └── Billing
│   ├── Orders & Subscriptions
│   └── Invoices
│
├── Seller (Provider)
│   ├── My Agents (owned)
│   │   ├── Create/Edit
│   │   ├── Versions
│   │   ├── Training Docs
│   │   ├── Publish to Marketplace
│   │   └── Analytics
│   ├── Offerings Management
│   ├── Revenue Dashboard
│   └── Customer Insights
│
└── Platform Admin
    ├── All Organizations
    ├── All Users
    ├── All Offerings
    ├── System Configuration
    └── Audit Logs
```

### Site Kit Components

**Seller Site Kit** (Provider Features):
- `ProviderAgentsList` - List owned agents
- `AgentCreateDialog` - Create new agent
- `AgentDetailsPage` - View/edit agent
- `AgentVersionsPage` - Version management
- `AgentTrainingPage` - RAG document upload
- `AgentAnalyticsPage` - Usage dashboard
- `OfferingPublishWizard` - Publish to marketplace

**Buyer Site Kit** (Customer Features):
- `CustomerAgentsList` - List purchased agents
- `AgentConfigurePage` - Persona, prompts, behavior
- `AgentWidgetsPage` - Embed code, chat config
- `AgentKeysPage` - API/MCP key management
- `AgentUsagePage` - Usage statistics

---

## User Journeys

### Seller Journey (Provider)

```
1. Create Agent in Studio
   ↓
2. Register in Agent Registry
   ↓
3. Configure Agent
   - Set persona/prompts
   - Upload training docs
   - Configure RAG
   ↓
4. Test Agent
   ↓
5. Create Marketplace Offering
   - Set pricing plans
   - Write description
   - Upload screenshots
   ↓
6. Publish to Marketplace
   ↓
7. Monitor & Iterate
   - View analytics
   - Respond to feedback
   - Release updates
```

### Buyer Journey (Customer)

**Frictionless Flow:**
```
1. Browse Marketplace (anonymous)
   ↓
2. Select Agent/Plan
   ↓
3. Checkout (register if new)
   - Auto-create org/project if needed
   - Payment (credit/card/invoice)
   ↓
4. Access Agent Dashboard
   ↓
5. Configure (optional)
   - Customize persona
   - Set welcome message
   - Brand with logo
   ↓
6. Get Integration Code
   - Widget embed
   - API key
   ↓
7. Use Agent
```

**Entry Points:**

| Entry | Flow | Auto-Actions |
|-------|------|--------------|
| Direct registration | Sign up → Dashboard | Create org + default project |
| Invitation | Accept → Join org | Inherit permissions |
| Marketplace browse | Browse → Checkout | Create org + project at checkout |

---

## Payment & Billing Models

### 1. Credit/Wallet System
- Prepaid credits
- Usage deducted from balance
- Low balance alerts
- Auto-top-up option

### 2. Subscription Plans

| Tier | Monthly | Yearly | Includes |
|------|---------|--------|----------|
| Starter | $29 | $290 (-17%) | 1,000 API calls |
| Pro | $99 | $990 (-17%) | 10,000 API calls |
| Enterprise | Custom | Custom | Unlimited + SLA |

### 3. Usage-Based (Pay-per-Use)
- Post-paid billing
- Per API call / per token pricing
- Monthly invoicing

### 4. Bundled Plans
- Agent bundles (multiple agents at discount)
- Feature bundles
- Partner bundles

---

## Theming & Branding

### Unified Theme System

All components share consistent theming:

| Component | Theme Source | Customizations |
|-----------|--------------|----------------|
| CMP-Frontend | Waldur theme config | Logo, colors, sidebar |
| Keycloak | SSO theme (sso-theme repo) | Login pages, emails |
| Website | CMS theme | Marketing pages |
| Agent Widgets | Per-customer config | Chat window styling |

### Brand Elements

```yaml
theme:
  brand_color: "#7c3aed"  # Primary purple
  site_name: "Digitlify CMP"
  site_logo: "/icons/site_logo/"
  sidebar_logo: "/icons/sidebar_logo/"
  sidebar_style: "blue-gradient"
  favicon: "/icons/favicon/"

  # Customer-facing text
  footer_text: "Simplify IT. Amplify IT. Digitlify IT."
  tagline: "The AI Agent Marketplace"
```

---

## Technical Architecture

### Repository Structure

**Platform Development (GSVDEV org):**
```
gsv-platform/      # Monorepo: templates, docs, shared
gsv-gitops/        # GitOps for dev/test
gsv-agentregistry/ # Agent Registry source
gsv-idp/           # Backstage IDP
gsv-website/       # GSV org website
```

**Tenant Implementation (Digitlify-Inc org):**
```
cmp-frontend/      # Waldur frontend (extended)
cmp-backend/       # Waldur backend (extended)
cmp-agentregistry/ # Agent Registry (tenant copy)
cmp-portal/        # Legacy (deprecating → Site Kit)
cmp-website/       # Tenant marketing site
cmp-gitops/        # Production GitOps
sso-theme/         # Keycloak theme
```

### Integration Points

```
┌─────────────┐     Webhooks      ┌─────────────────┐
│   Waldur    │◄──────────────────│ Agent Registry  │
│   (CMP)     │                   │                 │
│             │  REST API         │                 │
│             │──────────────────►│                 │
└─────────────┘                   └────────┬────────┘
                                           │
                                    MCP Protocol
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │    Runtime      │
                                  │   (Langflow)    │
                                  └─────────────────┘
```

**Webhook Events (Waldur → Agent Registry):**
- `marketplace_order_created` → Provision agent access
- `customer_creation_succeeded` → Create tenant
- `project_creation_succeeded` → Create project
- `resource_terminated` → Revoke access

**API Calls (Agent Registry → Waldur):**
- Publish offerings to marketplace
- Report usage for billing
- Sync customer data

---

## Implementation Phases

### Phase 0: Foundation (Complete)
- [x] Waldur CMP deployed
- [x] Keycloak SSO integrated
- [x] Organization auto-approval
- [x] Anonymous marketplace browsing

### Phase 1: Frictionless Onboarding
- [ ] Auto-create default project on org creation
- [ ] Streamlined checkout (inline org/project creation)
- [ ] Post-creation redirect to marketplace
- [ ] Payment gateway integration (Stripe)

### Phase 2: Site Kit - Buyer Features
- [ ] Agent Registry API client in frontend
- [ ] Buyer routes (`/organization/:uuid/agents/`)
- [ ] Agent configuration UI
- [ ] Widget management UI
- [ ] API key management UI

### Phase 3: Site Kit - Seller Features
- [ ] Seller routes (`/marketplace-provider/:uuid/agents/`)
- [ ] Agent CRUD UI
- [ ] Version management UI
- [ ] Training document upload
- [ ] Marketplace publish wizard

### Phase 4: Agent Registry Backend
- [ ] Complete REST API
- [ ] MCP server implementation
- [ ] Waldur webhook handlers
- [ ] Runtime integration

### Phase 5: Billing & Metering
- [ ] Credit/wallet system
- [ ] Subscription management
- [ ] Usage tracking integration
- [ ] Invoice generation

### Phase 6: Advanced Features
- [ ] Analytics dashboards
- [ ] A/B testing for agents
- [ ] Agent marketplace reviews
- [ ] Partner program

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first purchase | < 5 min | Analytics |
| Checkout conversion | > 60% | Funnel tracking |
| Agent configuration completion | > 70% | Usage logs |
| Monthly active users | Growth 20%/mo | Auth logs |
| Revenue per user | > $50/mo | Billing |
| Support ticket rate | < 3% of users | Helpdesk |

---

## Competitive Differentiation

| Feature | CMP | Competitors |
|---------|-----|-------------|
| Open source foundation | Yes (Waldur, Langflow) | Mostly proprietary |
| Self-hosted option | Yes | Rare |
| Multi-tenant marketplace | Yes | Limited |
| Visual agent builder | Yes (Studio) | Some |
| Unified buyer/seller UI | Yes (Site Kit) | Separate apps |
| White-label theming | Full | Limited |
| MCP integration | Native | Add-on |

---

## Appendices

### A. Related Documents

| Document | Location | Description |
|----------|----------|-------------|
| Architecture | `docs/gsv-platform/ARCHITECTURE.md` | Platform architecture |
| Agent Registry Spec | `gsv-gitops/docs/agent-registry/DESIGN_SPEC.md` | Registry design |
| Site Kit Architecture | `docs/gsv-platform/SITE-KIT-ARCHITECTURE.md` | UI extension design |
| Site Kit Implementation | `docs/gsv-platform/SITE-KIT-IMPLEMENTATION-PLAN.md` | Implementation tasks |
| Buyer Journey | `docs/gsv-platform/FRICTIONLESS-BUYER-JOURNEY.md` | Customer experience |
| Repository Structure | `docs/gsv-platform/REPOSITORY-STRUCTURE.md` | Code organization |
| Naming Conventions | `docs/gsv-platform/NAMING-CONVENTIONS.md` | Naming standards |

### B. Glossary

| Term | Definition |
|------|------------|
| **Agent** | AI-powered assistant or automation |
| **CMP** | Cloud Marketplace Platform |
| **MCP** | Model Context Protocol |
| **Offering** | Marketplace listing for an agent/app |
| **Plan** | Pricing tier for an offering |
| **Resource** | Deployed instance of an offering |
| **Site Kit** | UI extensions for CMP-Frontend |
| **Studio** | Development environment (Langflow) |
| **Runtime** | Execution environment for agents |
| **Tenant** | Customer organization |

### C. Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-13 | Initial PRD creation |

---

*Document maintained by GSV Platform Team*
