# UX Redesign Proposal - AI Agent Marketplace

**Date:** December 16, 2025
**Status:** Proposal
**Priority:** P0 - Critical for GTM

---

## Executive Summary

The current UI is based on Waldur's enterprise B2B marketplace model, which requires:
- Manual approval workflows
- Complex resource management
- Enterprise terminology ("Resources", "Orders", "Organizations")

For an AI agent marketplace, we need a **frictionless consumer experience** similar to:
- **Agent.ai** - AI agent marketplace
- **MuleRun** - Pay-per-run agent store
- **Artifact Hub** - Package discovery
- **Broadcom VSC** - Enterprise service catalog

---

## Target User Journey

### Current (Broken) Journey
```
Browse → Order → Wait for Approval → ??? → Find Resource → ??? → How to use?
```

### Target (Frictionless) Journey
```
Browse → Subscribe/Get → Configure (if needed) → Use (API/Widget/Chat)
         ↑                      ↑                     ↑
      Instant            Agent-specific         Multiple modes
      Access             (not universal)
```

---

## Key Design Principles

### 1. Zero Friction Acquisition
- **Instant access** - No approval workflows for standard agents
- **Try before buy** - Free tier or trial for all agents
- **One-click subscribe** - Single action to get started

### 2. Agent-Centric (Not Resource-Centric)
- Users think in terms of "agents" not "resources"
- Each agent type has its own configuration UI
- Configuration is optional and agent-specific

### 3. Multiple Consumption Modes
- **API** - For developers (API keys, SDK)
- **Widget** - For websites (embed code)
- **Chat** - Direct conversation interface
- **Integrations** - Slack, Teams, etc.

### 4. Flexible Pricing
- **Free** - Basic usage included
- **Pay-per-use** - Credits/tokens/API calls
- **Subscription** - Monthly/annual plans
- **Enterprise** - Custom pricing

---

## Proposed Information Architecture

### Navigation Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Logo    [Explore]  [My Agents]  [Docs]     [Search]  [User]│
└─────────────────────────────────────────────────────────────┘

Explore (Public)
├── All Agents
├── Categories
│   ├── Assistants
│   ├── Automations
│   ├── Knowledge Bases
│   └── Integrations
├── Featured
├── New
└── Popular

My Agents (Authenticated)
├── Dashboard (usage overview)
├── Active Agents
│   └── [Agent Card] → Configure | API Keys | Widget | Chat
├── API Keys (global)
├── Usage & Billing
└── Settings
```

---

## UI Components

### 1. Agent Discovery Card

```
┌──────────────────────────────────────────┐
│  [Icon]  Agent Name              [Badge] │
│          by Provider                     │
│                                          │
│  Short description that explains what    │
│  this agent does in 1-2 sentences.       │
│                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐       │
│  │Category│ │ Rating │ │ Users  │       │
│  │  Tag   │ │  ★4.8  │ │  1.2k  │       │
│  └────────┘ └────────┘ └────────┘       │
│                                          │
│  [Free] [Pro $29/mo] [Enterprise]       │
│                                          │
│  ┌──────────────┐  ┌──────────────┐     │
│  │  Try Free    │  │   Details    │     │
│  └──────────────┘  └──────────────┘     │
└──────────────────────────────────────────┘
```

### 2. Agent Detail Page

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Explore                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Icon]  Agent Name                    ┌─────────────────┐ │
│          by Provider Name              │   Get Started   │ │
│          ★★★★★ (128 reviews)          │      Free       │ │
│                                        └─────────────────┘ │
│                                                             │
│  [Overview] [Pricing] [Reviews] [Documentation]            │
│  ─────────────────────────────────────────────             │
│                                                             │
│  ## What it does                                            │
│  Detailed description of capabilities...                    │
│                                                             │
│  ## Features                                                │
│  ✓ Feature 1                                                │
│  ✓ Feature 2                                                │
│  ✓ Feature 3                                                │
│                                                             │
│  ## How to use                                              │
│  1. Subscribe to the agent                                  │
│  2. Get your API key                                        │
│  3. Start making requests                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. My Agent Dashboard (After Subscription)

```
┌─────────────────────────────────────────────────────────────┐
│  ← My Agents                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Icon]  Customer Support Agent          [Active] [Pro]    │
│                                                             │
│  [Overview] [Configure] [API Keys] [Widget] [Usage] [Logs] │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ## Quick Start                                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Try it now                              [Send]     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ Type a message to test your agent...        │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ## Usage This Month                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │   1,234  │  │  45,678  │  │   $12.34 │                  │
│  │ API Calls│  │  Tokens  │  │   Cost   │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│                                                             │
│  ## Integration Options                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│  │    API     │ │   Widget   │ │   Slack    │             │
│  │  [Setup]   │ │  [Embed]   │ │  [Connect] │             │
│  └────────────┘ └────────────┘ └────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Agent-Specific Configuration

Configuration should be **agent-driven**, not universal. Different agents need different config:

### Knowledge Base Agent Config
- Upload documents (PDF, DOCX, TXT, MD)
- Connect URLs for web scraping
- API import from other sources
- Response style settings
- Source citation preferences

### Customer Support Agent Config
- Agent name and greeting
- Tone (Professional, Friendly, Casual)
- Escalation rules
- Business hours
- Handoff email

### Automation Agent Config
- Trigger conditions
- Action sequences
- Connected accounts (OAuth)
- Schedule settings
- Notification preferences

---

## Pricing Models

### Model 1: Subscription Tiers
```
Free        Pro ($29/mo)      Business ($99/mo)    Enterprise
─────       ────────────      ─────────────────    ──────────
100 calls   10,000 calls      100,000 calls        Unlimited
1 agent     5 agents          Unlimited agents     Custom
Community   Email support     Priority support     Dedicated
```

### Model 2: Pay-Per-Use (Credits)
```
Buy credits in packs:
$10  = 1,000 credits
$50  = 6,000 credits (20% bonus)
$100 = 15,000 credits (50% bonus)

Agent costs:
- Simple chat: 1 credit/call
- Knowledge base: 5 credits/call
- Complex workflow: 10-50 credits/call
```

### Model 3: Metered (Per Agent)
```
Each agent has its own pricing:

Customer Support Agent
├── Free: 50 conversations/month
├── Starter: $19/mo - 500 conversations
└── Growth: $49/mo - 2,000 conversations

Knowledge Base Agent
├── Free: 100 queries/month + 10MB storage
├── Pro: $29/mo - 5,000 queries + 1GB storage
└── Enterprise: Custom
```

### Model 4: Hybrid (Base + Usage)
```
Base Plan: $29/month
├── Includes: 5,000 API calls
├── Includes: 3 active agents
├── Includes: Basic support
└── Overage: $0.002 per additional call
```

---

## Implementation Phases

### Phase 1: Critical Fixes (Week 1)
**Goal:** Make current system usable

1. Enable auto-approval for all agent offerings
2. Add "Configure" action on resource detail page
3. Fix navigation to My Agents from resource list
4. Update terminology (Resources → Subscriptions)

### Phase 2: Agent Dashboard (Week 2-3)
**Goal:** Purpose-built agent management

1. New My Agents page with agent cards
2. Quick-start chat interface for testing
3. Unified API key management
4. Usage dashboard with charts

### Phase 3: Agent-Specific Config (Week 4-5)
**Goal:** Dynamic configuration per agent type

1. Config schema system - agents define their config UI
2. Knowledge base upload for RAG agents
3. Integration connections (OAuth flows)
4. Webhook/trigger configuration

### Phase 4: Discovery UX (Week 6-7)
**Goal:** Modern marketplace experience

1. New agent cards with ratings, usage counts
2. Category filters with icons
3. Search with autocomplete
4. Featured/Popular/New sections

### Phase 5: Pricing & Billing (Week 8-10)
**Goal:** Flexible monetization

1. Usage metering per agent
2. Credit system implementation
3. Stripe subscription tiers
4. Usage alerts and limits

---

## Technical Requirements

### Backend Changes
1. Auto-approve setting as default for site agent offerings
2. Agent config schema - JSON schema per offering for dynamic forms
3. Usage metering - Track calls, tokens, latency per agent
4. Credit system - Balance, transactions, alerts

### Frontend Changes
1. New routing - /agents/* instead of /marketplace-resources/*
2. Dynamic forms - Render config from JSON schema
3. Real-time chat - WebSocket for agent testing
4. Dashboard components - Charts, usage cards

### API Changes
1. `GET /api/agents/` - Simplified agent listing
2. `POST /api/agents/{id}/chat/` - Direct chat endpoint
3. `GET /api/agents/{id}/usage/` - Usage stats
4. `GET /api/agents/{id}/config-schema/` - Dynamic form schema

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Time to first API call | >10 min | <2 min |
| Clicks to subscribe | 5+ | 2 |
| Support tickets for "how to use" | High | Low |
| Agent activation rate | Unknown | >80% |
| Daily active users | - | Tracked |

---

## Reference Analysis

### Agent.ai Patterns
- Card-based agent discovery
- Execution counts as social proof
- Premium badges for paid agents
- Workflow visualization

### MuleRun Patterns
- Pay-per-run pricing display (Fixed, Step-based, Metered)
- Min/max cost estimates
- "Run" as primary action
- Category toggles

### Artifact Hub Patterns
- Rich filtering (type, repo, org)
- Package cards with metadata
- Version information prominent
- README integration

### Broadcom VSC Patterns
- Enterprise service catalog
- Form factor filtering
- Kubernetes-native thinking
- Certification badges

---

*Document created: December 16, 2025*
*Next review: After Phase 1 implementation*
