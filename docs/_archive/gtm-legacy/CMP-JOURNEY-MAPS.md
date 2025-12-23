# CMP Journey Maps

**Date:** December 14, 2024
**Status:** Active
**Priority:** P0 - Critical for GTM

## Overview

This document defines the frictionless journey maps for the Cloud Marketplace Platform (CMP) targeting three personas:

1. **Buyer** (Customer/Tenant): Buy-Configure-Use
2. **Seller** (Service Provider): Build-Sell-Revenue
3. **Platform Operator**: Configure-Manage-Monitor

## Product Categories

CMP supports four primary categories:

| Category | Description | Examples |
|----------|-------------|----------|
| **Agents** | AI agents for automation and assistance | Customer support agent, Code review agent |
| **Apps** | Applications and integrations | CRM connector, Analytics dashboard |
| **Assistants** | Conversational AI assistants | Chatbots, Voice assistants |
| **Automations** | Workflow automation tools | Data sync, Scheduled tasks |

---

## Buyer Journey: Buy-Configure-Use

### Vision
Zero-friction customer acquisition. Users should go from discovery to using an AI agent in **under 5 minutes** with **minimal steps**.

### Target Journey Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BUYER JOURNEY: Buy-Configure-Use                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │ DISCOVER │───►│  SELECT  │───►│ CHECKOUT │───►│CONFIGURE │───►│  USE   │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └────────┘ │
│       │              │               │                │              │       │
│       ▼              ▼               ▼                ▼              ▼       │
│  Browse          View Details    Auth/Pay         Persona         API Keys  │
│  Marketplace     Compare Plans   Auto-provision   Training        Widget    │
│  Search          Read Reviews    Organization     Branding        Chat Test │
│  Filter          Try Demo        + Project        Settings        Analytics │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Flow

#### 1. Discover (Marketplace)
- **Anonymous browsing** enabled by default
- Search and filter by category (Agents, Apps, Assistants, Automations)
- View provider ratings and reviews
- Compare offerings side-by-side

#### 2. Select (Offering Details)
- View detailed description, features, screenshots
- Compare pricing plans (Starter, Pro, Enterprise)
- Try interactive demo (if available)
- Read documentation and FAQs

#### 3. Checkout (Purchase)
- **If not logged in:** Prompt login/register
- **If no organization:** Auto-create "{Name}'s Organization"
- **If no project:** Auto-create "Default" project
- Select plan and billing cycle
- Enter payment method
- Complete purchase

#### 4. Configure (Post-Purchase)
From "My Agents" list, buyer can:

| Tab | Purpose | Key Actions |
|-----|---------|-------------|
| **Overview** | Status and quick actions | View status, usage metrics, quick settings |
| **Training** | Teach the agent | Upload documents, add Q&A pairs, define topics |
| **Persona** | Customize personality | Set name, tone, language, behavior rules |
| **Branding** | Visual customization | Colors, logo, welcome message |

#### 5. Use (Integration)
From agent detail pages:

| Page | Purpose | Key Actions |
|------|---------|-------------|
| **API Keys** | Programmatic access | Generate/revoke keys, view MCP connection config |
| **Widget** | Embed on website | Get embed code, customize appearance, preview |

### Buyer Navigation Structure

```
Organization Dashboard
├── My Agents (subscribed agents)
│   └── [Agent Name]
│       ├── Configure
│       │   ├── Overview (status, metrics)
│       │   ├── Training (knowledge base)
│       │   ├── Persona (personality)
│       │   └── Branding (visual)
│       ├── API Keys (credentials)
│       └── Widget (embed code)
├── Subscriptions (all resources)
├── Orders (purchase history)
├── Team (invite collaborators)
└── Settings
```

### Key Terminology for Buyers

| Instead of... | Use... | Reason |
|---------------|--------|--------|
| Resources | Subscriptions | Buyer subscribes to offerings |
| AI Agents | My Agents | Personal ownership feeling |
| Service Provider | Provider | Simpler |
| Offering | Agent/App/Assistant/Automation | Category-specific |

---

## Seller Journey: Build-Sell-Revenue

### Vision
Enable providers to publish their AI agents to the marketplace and start earning revenue in **under 30 minutes**.

### Target Journey Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SELLER JOURNEY: Build-Sell-Revenue                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │  BUILD   │───►│ PUBLISH  │───►│  SELL    │───►│ SUPPORT  │───►│ EARN   │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └────────┘ │
│       │              │               │                │              │       │
│       ▼              ▼               ▼                ▼              ▼       │
│  Develop Agent   Create Offering  Marketplace     Customer        Revenue   │
│  in Studio       Define Plans     Listing         Requests        Dashboard │
│  Test Locally    Set Pricing      Reviews         Usage Stats     Payouts   │
│  Package         Upload Assets    Analytics       Feedback        Reports   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Flow

#### 1. Build (Development - External)
- **Studio**: Develop agent using preferred framework (LangChain, Claude, etc.)
- **Testing**: Test locally with MCP protocol
- **Packaging**: Prepare for deployment via Site-Kit

#### 2. Publish (CMP Provider Portal)
Create offering in CMP:

| Field | Description |
|-------|-------------|
| Category | Agents, Apps, Assistants, or Automations |
| Name | Display name for marketplace |
| Description | Features, use cases, benefits |
| Plans | Pricing tiers with components |
| Assets | Logo, screenshots, demo video |
| Documentation | Setup guide, API reference |

#### 3. Sell (Marketplace Listing)
Once approved:
- Listing appears in marketplace
- Customers can browse, compare, purchase
- Provider sets visibility (public/private)
- Featured placement available

#### 4. Support (Customer Success)
- View customer list and usage
- Respond to support requests
- Monitor usage patterns
- Collect feedback

#### 5. Earn (Revenue)
- View revenue dashboard
- Track sales by plan/period
- Configure payout method
- Download financial reports

### Seller Navigation Structure

```
Provider Dashboard
├── Offerings (my products)
│   └── [Offering Name]
│       ├── Details (edit listing)
│       ├── Plans (pricing)
│       ├── Assets (media)
│       ├── Analytics (usage)
│       └── Customers (subscribers)
├── Orders (incoming purchases)
├── Support (customer requests)
├── Revenue (earnings)
│   ├── Dashboard
│   ├── Payouts
│   └── Reports
└── Settings
    ├── Provider Profile
    ├── Payout Method
    └── Notifications
```

### Key Terminology for Sellers

| Instead of... | Use... | Reason |
|---------------|--------|--------|
| Resources | Offerings | Seller creates offerings |
| Customers | Subscribers/Customers | Clear relationship |
| Usage | Consumption | Metered usage |

---

## Component Flow: Studio → Site-Kit → CMP

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPONENT FLOW: Agent Lifecycle                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            │
│  │   STUDIO    │────────►│  SITE-KIT   │────────►│    CMP      │            │
│  │ (External)  │         │  (Runtime)  │         │(Marketplace)│            │
│  └─────────────┘         └─────────────┘         └─────────────┘            │
│        │                       │                       │                     │
│        │                       │                       │                     │
│  ┌─────┴─────┐           ┌─────┴─────┐           ┌─────┴─────┐              │
│  │Development│           │Deployment │           │Distribution│              │
│  │- Build    │           │- Container│           │- Listing   │              │
│  │- Test     │           │- MCP Proto│           │- Pricing   │              │
│  │- Package  │           │- Heartbeat│           │- Orders    │              │
│  │- Export   │           │- Metrics  │           │- Billing   │              │
│  └───────────┘           └───────────┘           └───────────┘              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Integration Points

| Component | Responsibility | Key APIs |
|-----------|----------------|----------|
| **Studio** | Agent development, testing | Export agent config |
| **Site-Kit** | Agent runtime, MCP protocol | Heartbeat, metrics, state |
| **CMP** | Marketplace, billing, user management | Offerings, orders, resources |

---

## Implementation Status

### Buyer Journey

| Step | Component | Status | Notes |
|------|-----------|--------|-------|
| Anonymous browse | Frontend | Done | `ANONYMOUS_USER_CAN_VIEW_OFFERINGS: true` |
| Auto-org creation | Backend | Done | Organization auto-approval enabled |
| My Agents list | Frontend | Done | `CustomerAgentsList.tsx` |
| Agent Configure | Frontend | Done | `AgentConfigurePage.tsx` with tabs |
| API Keys page | Frontend | Done | `AgentKeysPage.tsx` |
| Widget page | Frontend | Done | `AgentWidgetsPage.tsx` |
| Training tab | Frontend | Done | `AgentTrainingTab.tsx` (UI ready) |
| Persona tab | Frontend | Done | `AgentPersonaTab.tsx` (UI ready) |
| Branding tab | Frontend | Done | `AgentBrandingTab.tsx` (UI ready) |

### Seller Journey

| Step | Component | Status | Notes |
|------|-----------|--------|-------|
| Provider registration | Backend | Done | Waldur service provider flow |
| Create offering | Frontend | Done | Offering create/edit forms |
| Define plans | Frontend | Done | Plan management |
| Marketplace listing | Frontend | Done | Public marketplace |
| Customer analytics | Frontend | TODO | Need provider analytics dashboard |
| Revenue dashboard | Frontend | TODO | Need revenue reporting |

### Platform Categories

| Category | Status | Notes |
|----------|--------|-------|
| Agents | Done | Migration `0197_cmp_categories.py` |
| Apps | Done | Migration `0197_cmp_categories.py` |
| Assistants | Done | Migration `0197_cmp_categories.py` |
| Automations | Done | Migration `0197_cmp_categories.py` |
| AI Agents (deprecated) | Removed | Duplicate, use "Agents" instead |

---

## Success Metrics

### Buyer Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first purchase | < 5 min | Analytics |
| Checkout abandonment | < 20% | Funnel tracking |
| Post-purchase activation | > 80% within 24h | Usage logs |
| Configuration completion | > 60% | Feature adoption |

### Seller Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first listing | < 30 min | Analytics |
| Listing approval rate | > 90% | Workflow tracking |
| Active offerings | Growing | Marketplace stats |
| Revenue per seller | Growing | Financial reports |

---

## Related Documentation

- [Frictionless Buyer Journey](./FRICTIONLESS-BUYER-JOURNEY.md) - Detailed buyer flow
- [E2E Process Flow](./E2E-PROCESS-FLOW.md) - Complete end-to-end flows
- [Site-Kit Architecture](./SITE-KIT-ARCHITECTURE.md) - Runtime deployment
- [GTM Status](./GTM-STATUS-2024-12-14.md) - Current go-to-market status
