# Market UX Analysis: AI Agent Marketplaces

**Date:** December 16, 2025
**Status:** Strategic Analysis
**Purpose:** Inform CMP UX redesign to meet/exceed market expectations

---

## Executive Summary

After deep-diving into Kore.ai XO Platform, Salesforce Agentforce, Microsoft Copilot Studio, OpenAI GPT Store, HuggingFace Spaces, and emerging agentic UX patterns, this document identifies **critical gaps** between CMP's current Waldur-based UI and market expectations.

**Key Finding:** The market has moved beyond simple "marketplace" patterns to **integrated AI platform experiences** with:
1. **Module-based bundling** (Automation + Search + Contact Center + Agent AI)
2. **Builder/Studio integration** (low-code agent creation)
3. **Multiple consumption modes** (API, Widget, SDK, native integrations)
4. **Agentic UX patterns** (collaborative, embedded, asynchronous)

---

## 1. Kore.ai XO Platform Analysis

### Product Structure (Reference Architecture)

Kore.ai positions itself as "AI for Service" with **5 interconnected modules**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         KORE.AI XO PLATFORM                              │
├─────────────────┬─────────────────┬─────────────────┬───────────────────┤
│  AUTOMATION AI  │   SEARCH AI     │ CONTACT CENTER  │    AGENT AI       │
│  (Conversation  │   (RAG/LLM      │    AI (CCaaS)   │  (Agent Assist)   │
│   Flows)        │   Search)       │                 │                   │
├─────────────────┴─────────────────┴─────────────────┴───────────────────┤
│                              QUALITY AI                                  │
│                    (QA, Coaching, Compliance)                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key UX Patterns to Adopt

| Pattern | Kore.ai Implementation | CMP Recommendation |
|---------|------------------------|-------------------|
| **Module Tabs** | Top-level tabs for each AI capability | Replace "Resources" with capability-focused tabs |
| **Use Cases First** | Templates for specific business outcomes | Category landing pages with use-case templates |
| **Knowledge Integration** | Knowledge AI embedded across all modules | RAG/document upload as core feature |
| **Natural Language Config** | Train NLP inline, not separate screens | In-context agent tuning interface |
| **Test Workflows** | Playground testing before deployment | Built-in chat testing on every agent |

### Kore.ai's "Five Pillars" (Automation AI)

```
1. USE CASES        → "What do you want to accomplish?"
2. KNOWLEDGE AI     → "What does the agent know?"
3. NATURAL LANGUAGE → "How does it understand users?"
4. INTELLIGENCE     → "How does it handle complexity?"
5. TEST WORKFLOWS   → "Does it work?"
```

**CMP Equivalent Mapping:**

```
1. AGENT TYPE       → Agents, Apps, Assistants, Automations
2. KNOWLEDGE        → Document upload, URL scraping, API import
3. CONFIGURATION    → Persona, system prompt, tone
4. INTEGRATION      → OAuth, webhooks, triggers
5. TESTING          → Playground, API console, widget preview
```

### Agent Widget UX (Agent AI)

Kore.ai's Agent AI Widget has **5 tabs**:

| Tab | Purpose | CMP Equivalent |
|-----|---------|----------------|
| Search | Find dialog tasks, FAQs | Agent search within My Agents |
| My AI Agent | Run automations independently | Agent playground |
| Assist | Real-time suggestions & coaching | (Not applicable for consumer) |
| Transcript | Voice conversation history | Chat history |
| More | Settings, feedback | Agent settings |

### Conversation Events Pattern

```
WELCOME EVENTS (On-Connect)
├── On-Connect Dialog Task → Auto-run a flow when agent starts
├── Greeting Messages → Customizable per channel
└── Priority Settings → What runs first

EXIT EVENTS (On-Disconnect)
├── End-of-Conversation Task → Wrap-up automation
├── Conversation Summary → Auto-generate summary
└── Agentic App Trigger → Chain to another agent
```

**CMP Implementation:**
```yaml
# Agent Configuration Schema
welcome_events:
  greeting_message: "Hi! How can I help?"
  on_connect_flow: null  # Optional flow UUID

exit_events:
  summary_enabled: true
  handoff_agent: null  # Chain to another agent
  webhook_url: null    # External notification
```

---

## 2. Salesforce Agentforce Analysis

### Product Organization (By Role)

Salesforce organizes agents by **job role**, not technology:

```
┌──────────────────────────────────────────────────────────────────────┐
│                         AGENTFORCE                                    │
├────────────┬────────────┬────────────┬────────────┬─────────────────┤
│  Service   │    SDR     │   Sales    │   Buyer    │    Personal     │
│   Agent    │   Agent    │   Coach    │   Agent    │    Shopper      │
├────────────┴────────────┴────────────┴────────────┴─────────────────┤
│  Merchandiser │ Campaign Optimizer │ Custom Agent (Agent Builder)   │
└─────────────────────────────────────────────────────────────────────┘
```

### Key UX Patterns to Adopt

| Pattern | Salesforce Implementation | CMP Recommendation |
|---------|---------------------------|-------------------|
| **Role-Based Discovery** | Browse by job function | Filter by use case, not just category |
| **Pre-Built Templates** | Out-of-box agents, customize | Offer starter templates per category |
| **Low-Code Builder** | Agent Builder with drag-drop | Studio integration already exists |
| **Trust Layer** | "Einstein Trust Layer" prominent | Security/compliance badges |
| **AgentExchange** | Partner marketplace | Provider ecosystem display |

### Pricing Model Insights

Salesforce offers **three pricing models**:

```
1. CONVERSATION-BASED    → $2 per agent conversation
2. FLEX CREDITS          → $0.10 per action
3. PER-USER LICENSE      → $125-150/user/month
```

**Market Insight:** Enterprise buyers want **predictable costs** with **usage flexibility**. The hybrid "base + overage" model from CMP pricing doc is correct.

### Configuration UX (Einstein 1 Studio)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Einstein 1 Studio                                                    │
├──────────────────┬──────────────────┬───────────────────────────────┤
│  PROMPT BUILDER  │  COPILOT BUILDER │      MODEL BUILDER            │
│  ─────────────── │  ──────────────  │  ────────────────────         │
│  Create custom   │  Add actions to  │  Bring your own LLM           │
│  prompts         │  assistant       │  (Anthropic, OpenAI, etc.)    │
│                  │                  │                               │
│  • Templates     │  • Skill library │  • Model selection            │
│  • Test preview  │  • Flow actions  │  • API integration            │
│  • Publish       │  • MuleSoft APIs │  • Testing                    │
└──────────────────┴──────────────────┴───────────────────────────────┘
```

**CMP Equivalent Architecture:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ CMP Agent Studio                                                     │
├──────────────────┬──────────────────┬───────────────────────────────┤
│  PERSONA CONFIG  │   FLOW BUILDER   │      INTEGRATION              │
│  ─────────────── │  ──────────────  │  ────────────────────         │
│  Agent name      │  Langflow Studio │  API connections              │
│  System prompt   │  visual builder  │  OAuth providers              │
│  Tone & style    │                  │  Webhooks                     │
│                  │                  │                               │
│  • Greeting      │  • Import JSON   │  • Slack/Teams                │
│  • Personality   │  • Test in-app   │  • Custom integrations        │
│  • Escalation    │  • Version ctrl  │  • Event triggers             │
└──────────────────┴──────────────────┴───────────────────────────────┘
```

---

## 3. Emerging Agentic UX Patterns (2025)

### Three Core UX Modes

Research from Microsoft Design, UX for AI, and industry analysis identifies three patterns:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AGENTIC UX MODES                                  │
├─────────────────┬─────────────────┬─────────────────────────────────┤
│  COLLABORATIVE  │    EMBEDDED     │       ASYNCHRONOUS              │
│  ─────────────  │  ────────────── │  ──────────────────────         │
│  Human + Agent  │  Agent in       │  Agent works                    │
│  work together  │  existing app   │  independently                  │
│                 │                 │                                 │
│  • Chat UI      │  • Widget       │  • Background jobs              │
│  • Co-authoring │  • Sidebar      │  • Scheduled tasks              │
│  • Suggestions  │  • Inline hints │  • Deep research                │
├─────────────────┴─────────────────┴─────────────────────────────────┤
│  CRITICAL: Successful products use ALL THREE modes                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Microsoft's Agent UX Principles

**Space (Environment):**
- Connecting, not collapsing → Agents facilitate human connection
- Accessible yet invisible → Multimodal, foreground/background transitions

**Time (Temporal):**
- Reflecting on history → Memory across sessions
- Nudging more than notifying → Contextual, not intrusive
- Adapting and evolving → Learns user preferences

**Core (Foundation):**
- Embrace uncertainty while establishing trust → Show confidence levels
- Transparency, control, consistency → Clear agent status always

### Top 10 Enterprise Agentic Patterns

| # | Pattern | Description | CMP Priority |
|---|---------|-------------|--------------|
| 1 | **Planning & Task Decomposition** | Break complex goals into steps | Medium |
| 2 | **Reflection/Self-Critique** | Agent evaluates own output | Low |
| 3 | **Tool Integration** | External API access | HIGH |
| 4 | **Routing & Intent Dispatch** | Route to specialized agents | Medium |
| 5 | **Multi-Agent Collaboration** | Agents working together | Future |
| 6 | **Mixed-Initiative Control** | Human-agent handoff | HIGH |
| 7 | **Error Handling & Recovery** | Graceful failure modes | HIGH |
| 8 | **Trust Calibration** | Progressive autonomy | Medium |
| 9 | **Memory & Context** | Session/persistent memory | HIGH |
| 10 | **Control Plane** | Governance dashboard | HIGH |

---

## 4. OpenAI GPT Store Patterns

### Discovery UX

```
┌─────────────────────────────────────────────────────────────────────┐
│ GPT Store                                                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ 🔍 Search GPTs...                                               ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ DALL-E   │ │ Writing  │ │ Research │ │Programming│ │Education │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                                      │
│  TOP PICKS        TRENDING          FEATURED BY OpenAI              │
│  ───────────      ─────────         ─────────────────               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Patterns

| Pattern | Implementation | CMP Adoption |
|---------|----------------|--------------|
| **Category Pills** | Horizontal scroll, icon + label | Yes - replace sidebar |
| **Leaderboard** | Popular, trending, new | Yes - social proof |
| **Creator Attribution** | "By [Creator Name]" | Yes - provider branding |
| **Try Instantly** | One-click to chat | CRITICAL - no checkout friction |
| **3M+ Custom GPTs** | User-generated ecosystem | Long-term goal |

---

## 5. HuggingFace Spaces Patterns

### Developer-Friendly UX

```
┌─────────────────────────────────────────────────────────────────────┐
│ Spaces                                                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [Gradio] [Streamlit] [Docker] [Static] [Jupyter]                   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Interactive Demo Area                                           │ │
│  │ ┌──────────────────────────────────────────────────────────┐   │ │
│  │ │                                                          │   │ │
│  │ │         [Live Model Interface]                           │   │ │
│  │ │                                                          │   │ │
│  │ └──────────────────────────────────────────────────────────┘   │ │
│  │                                                                 │ │
│  │  Files | App | Logs | Settings | Use via API                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  README.md (rendered)                                                │
│  ─────────────────────                                               │
│  ## How to Use                                                       │
│  ```python                                                           │
│  from gradio_client import Client                                    │
│  client = Client("user/space-name")                                  │
│  result = client.predict("Hello!")                                   │
│  ```                                                                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Patterns for CMP

| Pattern | HuggingFace | CMP Adoption |
|---------|-------------|--------------|
| **Live Demo First** | Interactive demo prominent | Agent playground on detail page |
| **Code Snippets** | API usage examples | Copy-paste ready code |
| **Duplicate/Fork** | Clone to customize | "Use as template" |
| **Hardware Selection** | CPU/GPU options | Usage tier selection |
| **API Tab** | Programmatic access docs | API documentation inline |

---

## 6. Gap Analysis: CMP vs. Market

### Critical Gaps (P0 - Must Fix for GTM)

| Gap | Market Standard | CMP Current | Impact |
|-----|-----------------|-------------|--------|
| **Instant Access** | Try before buy, one-click | Order → Approve → Find | Conversion killer |
| **Live Playground** | Chat interface on detail page | None | Can't evaluate agent |
| **Category UX** | Visual categories, filters | Text-heavy sidebar | Poor discovery |
| **Terminology** | "Agents", "Apps" | "Resources", "Offerings" | Confusing |
| **Configuration** | Agent-specific forms | Universal Waldur forms | Poor UX |

### Important Gaps (P1 - Fix Post-Launch)

| Gap | Market Standard | CMP Current | Impact |
|-----|-----------------|-------------|--------|
| **Templates** | Pre-built agent templates | None | Slow onboarding |
| **Builder Integration** | Inline flow editing | Separate Studio | Fragmented UX |
| **Memory/Context** | Persistent session memory | Per-request only | Limited capabilities |
| **Multi-Agent** | Chain agents together | Single agent only | Power user limitation |
| **Analytics** | Real-time usage dashboard | Basic metrics | Limited insights |

### Nice-to-Have (P2 - Future)

| Gap | Market Standard | CMP Current | Impact |
|-----|-----------------|-------------|--------|
| **Agentic Patterns** | Asynchronous, background | Synchronous only | Limited use cases |
| **Multi-Modal** | Voice, video, documents | Text/chat only | Channel limitations |
| **Marketplace Ecosystem** | Partner network, revenue share | Provider-only | Growth limitation |

---

## 7. Recommended UX Architecture

### Navigation Redesign

**Current (Waldur):**
```
├── Dashboard
├── Marketplace
├── My Organizations
│   └── Resources (confusing)
├── Reporting
└── User
```

**Proposed (Agent-First):**
```
├── Explore (public)
│   ├── Agents
│   ├── Apps
│   ├── Assistants
│   └── Automations
├── My Agents (authenticated)
│   ├── Active Subscriptions
│   ├── API Keys
│   ├── Usage
│   └── Settings
├── Build (provider)
│   ├── My Agents
│   ├── Studio (Langflow)
│   ├── Analytics
│   └── Settings
└── Account
```

### Agent Detail Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Back                                        [★ Save] [Share]      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐                                                   │
│  │    [Icon]    │  Agent Name                   ┌─────────────────┐│
│  │              │  by Provider Name             │                 ││
│  └──────────────┘  ★★★★☆ (42 reviews)          │  Try Now        ││
│                    Assistants · Customer Support │  FREE           ││
│                                                  └─────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ [Overview] [Try It] [Pricing] [Documentation] [Reviews]         ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌────────────────────────────────┬────────────────────────────────┐│
│  │                                │                                ││
│  │  Description                   │  LIVE PLAYGROUND               ││
│  │  ─────────────                 │  ────────────────              ││
│  │                                │  ┌────────────────────────────┐││
│  │  24/7 AI-powered customer      │  │                            │││
│  │  support assistant...          │  │  [Chat Interface]          │││
│  │                                │  │                            │││
│  │  Features                      │  │  Type a message...         │││
│  │  ─────────                     │  └────────────────────────────┘││
│  │  ✓ Multi-language              │                                ││
│  │  ✓ Knowledge base              │  [Get Started - $29/mo]        ││
│  │  ✓ Human handoff               │                                ││
│  │                                │                                ││
│  └────────────────────────────────┴────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### My Agent Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│ My Agents                                        [+ Subscribe New]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ API Calls│ │ Tokens   │ │ Active   │ │ Cost MTD │               │
│  │ 12,456   │ │ 245K     │ │ 4        │ │ $127.00  │               │
│  │ ↑12%     │ │ ↑8%      │ │          │ │          │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Active Agents                                  [List] [Grid]    ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │ ┌────────────────────────────────────────────────────────────┐  ││
│  │ │ 🤖 Customer Support Bot                     [Pro] [Active] │  ││
│  │ │    12,456 calls · Last used 2 min ago                      │  ││
│  │ │    [Configure] [API Keys] [Widget] [Chat] [Logs]           │  ││
│  │ └────────────────────────────────────────────────────────────┘  ││
│  │ ┌────────────────────────────────────────────────────────────┐  ││
│  │ │ 📄 Document Analyzer                      [Starter] [Active]│  ││
│  │ │    2,134 calls · Last used 1 hour ago                      │  ││
│  │ │    [Configure] [API Keys] [Widget] [Chat] [Logs]           │  ││
│  │ └────────────────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Implementation Recommendations

### Phase 1: Critical Fixes (Week 1-2)

**Must complete before any GTM activity:**

1. **Enable Auto-Approval**
   - Set `auto_approve=True` as default for all agent offerings
   - Remove approval workflow from buyer journey

2. **Add "Try Now" Playground**
   - Embed chat interface on offering detail page
   - Allow unauthenticated testing with rate limits

3. **Fix Navigation**
   - Rename "Resources" → "My Agents" or "Subscriptions"
   - Add direct path from subscription to configuration

4. **Category Visual Refresh**
   - Add icons to Agents/Apps/Assistants/Automations
   - Horizontal filter pills instead of sidebar

### Phase 2: Agent Dashboard (Week 3-4)

1. **New "My Agents" Page**
   - Agent cards with quick actions
   - Usage summary at top
   - Direct access to Configure, API Keys, Widget, Chat

2. **Unified Configuration UX**
   - Agent-specific config tabs (Persona, Branding, Widget, Advanced)
   - Preview pane showing changes in real-time

3. **API Key Management**
   - Create, view, revoke keys
   - Usage tracking per key

### Phase 3: Discovery UX (Week 5-6)

1. **Category Landing Pages**
   - Each category (Agents, Apps, etc.) has dedicated page
   - Use case templates featured
   - Social proof (reviews, usage counts)

2. **Search & Filters**
   - Full-text search with autocomplete
   - Filter by price, rating, category, provider

3. **Featured Sections**
   - "Popular This Week"
   - "New Releases"
   - "Staff Picks"

### Phase 4: Advanced Features (Week 7-10)

1. **Template System**
   - Pre-built agent configurations
   - "Use as template" from any public agent

2. **Memory & Context**
   - Session persistence
   - User context across conversations

3. **Multi-Mode Consumption**
   - API (existing)
   - Widget (existing)
   - SDK (new - JS, Python)
   - Native integrations (Slack, Teams)

---

## 9. Pricing Model Alignment

### Market Comparison

| Vendor | Model | Price Point |
|--------|-------|-------------|
| Salesforce Agentforce | Per conversation | $2/conversation |
| Microsoft Copilot | Per user/month | $30/user/month |
| Kore.ai | Enterprise custom | $50K-500K/year |
| OpenAI GPT Store | Free (revenue share) | Creator revenue share |
| CMP (Proposed) | Bundled subscription | $29-99/month |

### Recommendation

Keep the **bundled subscription model** from PRICING-MODEL-2025-12-16.md but add:

1. **Free Tier with Instant Access**
   - 100 API calls, 1 agent
   - No credit card required
   - Convert to paid via usage limits

2. **Per-Agent Add-Ons**
   - Some premium agents have additional fees
   - Clear pricing on agent detail page

3. **Usage-Based Overage**
   - Soft limits with clear overage pricing
   - Auto-notify at 80%, 100%

---

## 10. Sources

### Kore.ai Documentation
- [Kore.ai XO Platform Home](https://docs.kore.ai/xo/home/)
- [Automation AI](https://docs.kore.ai/xo/automation/about-automation-ai/)
- [Search AI](https://docs.kore.ai/xo/searchai/about-search-ai/)
- [Contact Center AI](https://docs.kore.ai/xo/contactcenter/about-contact-center-ai/)
- [Agent AI Widget](https://docs.kore.ai/xo/agentai/agent-experience/agent-assist-widget-v3/)
- [Conversation Events](https://docs.kore.ai/xo/agentai/configuration/conversation-events/)

### Salesforce Agentforce
- [Agentforce Platform](https://www.salesforce.com/agentforce/)
- [Agentforce Pricing](https://www.salesforce.com/agentforce/pricing/)

### Microsoft Design
- [UX Design for Agents](https://microsoft.design/articles/ux-design-for-agents/)

### Agentic UX Research
- [Agentic AI Design Patterns - Enterprise Guide](https://www.aufaitux.com/blog/agentic-ai-design-patterns-enterprise-guide/)
- [Secrets of Agentic UX](https://www.uxforai.com/p/secrets-of-agentic-ux-emerging-design-patterns-for-human-interaction-with-ai-agents)
- [AI-First UX Design in 2025](https://medium.com/design-bootcamp/ai-first-ux-design-in-2025-shaping-smarter-user-interactions-80a96166f117)

### Pricing Models
- [Pricing Models for Enterprise AI Agents](https://businessengineer.ai/p/pricing-models-for-enterprise-ai)
- [Agentic AI Pricing Strategies](https://www.withvayu.com/blog/agentic-ai-pricing-strategies-how-saas-leaders-are-evolving-their-models)
- [BCG: Rethinking B2B Software Pricing in AI Era](https://www.bcg.com/publications/2025/rethinking-b2b-software-pricing-in-the-era-of-ai)

### Marketplace Patterns
- [OpenAI GPT Store](https://openai.com/index/introducing-the-gpt-store/)
- [HuggingFace Spaces](https://huggingface.co/docs/hub/spaces)

---

*Document created: December 16, 2025*
*Next steps: Prioritize Phase 1 implementation items*
