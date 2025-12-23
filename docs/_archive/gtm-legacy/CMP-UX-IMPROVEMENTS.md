# CMP UX Improvements - Frictionless Journey Design

**Date:** December 14, 2024
**Status:** Draft
**Reference:** Kore.ai XO Platform UX Patterns

---

## Executive Summary

Based on analysis of Kore.ai XO platform, this document outlines UX improvements to make the CMP buyer and seller journeys more intuitive and frictionless.

---

## Key Learnings from Kore.ai

### 1. Progressive Disclosure Navigation

Kore.ai uses a **three-tier navigation hierarchy**:
- **Primary**: Product categories (Automation AI, Agent AI, Analytics)
- **Secondary**: Feature groups (5-15 subsections per product)
- **Tertiary**: Specific features (nested under conceptual groupings)

**CMP Application:**
```
Organization Dashboard (Primary)
├── My Agents (Secondary)
│   └── [Agent Name] (Tertiary)
│       ├── Overview (quick status, metrics)
│       ├── Configure (persona, training, branding)
│       ├── Integrate (API keys, widget, MCP)
│       └── Analytics (usage, performance)
```

### 2. Card-Based Dashboard Design

Kore.ai uses **grid-based cards** with:
- Visual icons for quick recognition
- Descriptive copy explaining purpose
- Action buttons for primary tasks
- Responsive layout for mobile

**CMP Application:**
- Replace table-based "My Agents" list with card grid
- Each card shows: agent icon, name, status, quick metrics
- Primary action: "Open" / Secondary: "Configure"

### 3. Widget-First Agent Experience

Agent AI Widget v3 features **five-tab structure**:
| Tab | Purpose |
|-----|---------|
| Search | Find content, run tasks |
| My AI Agent | Next best actions, manual inputs |
| Assist | Real-time suggestions, summaries |
| Transcript | Conversation history |
| More | Feedback, settings |

**CMP Application for Buyer's Agent Detail:**
| Tab | Purpose |
|-----|---------|
| Overview | Status, metrics, quick actions |
| Training | Upload docs, Q&A pairs, knowledge base |
| Persona | Name, tone, behavior, welcome message |
| Branding | Colors, logo, chat window styling |
| Integrate | API keys, widget embed, MCP config |

### 4. Welcome Events & Onboarding

Kore.ai provides **conversation events** for:
- On-connect dialog tasks
- Greeting messages (randomizable)
- Exit summaries

**CMP Application:**
- Add "Welcome Message" configuration in Persona tab
- Support multiple welcome message variants
- Allow random selection for variety
- Configure "conversation ended" messages

### 5. Analytics Dashboard Patterns

Kore.ai dashboard shows:
- **Summary metrics** at top (sessions, suggestions, performance)
- **Trend comparisons** with color-coded indicators
- **Pie charts** for breakdown views
- **Time-series** for historical data
- **Word clouds** for search/usage patterns

**CMP Application for Agent Analytics:**
| Metric | Visualization |
|--------|---------------|
| Total Conversations | Counter with trend |
| Messages Sent/Received | Line chart |
| Avg Response Time | Gauge |
| User Satisfaction | Pie chart |
| Top Topics | Word cloud |
| Usage by Channel | Bar chart |

---

## Proposed Navigation Redesign

### Current State (Problems)

```
Organization Dashboard
├── Projects          ← Confusing for agent buyers
├── Subscriptions     ← Generic term
├── My Agents         ← Good, but buried
├── Orders            ← Transaction-focused
├── Team              ← Important but secondary
├── Accounting        ← Important but secondary
└── Audit logs        ← Admin-focused
```

**Issues:**
1. Too many tabs at same level
2. "Projects" concept confusing for simple agent users
3. No clear visual hierarchy
4. Agent-focused actions spread across pages

### Proposed State (Solution)

```
Organization Dashboard
├── Agents            ← Primary focus (renamed from "My Agents")
│   ├── [Agent Cards Grid]
│   └── Quick Actions: Configure, Get API Key, View Widget
├── Marketplace       ← Discovery
│   └── Browse, Search, Categories
├── Usage             ← Consolidated metrics
│   ├── Overview (all agents)
│   ├── By Agent
│   └── Billing/Invoices
└── Settings          ← Collapsed admin
    ├── Organization
    ├── Team
    ├── Projects (advanced)
    └── Audit logs
```

**Benefits:**
1. Agent-centric design (primary use case front and center)
2. Marketplace easily accessible
3. Usage/billing consolidated
4. Admin features grouped under Settings

---

## Agent Detail Page Redesign

### Current Flow (Fragmented)

```
My Agents → [Agent] → Configure Agent (separate page)
                   → API Keys (separate page)
                   → Widget (separate page)
```

**Issues:**
- Multiple page loads
- Context switching
- No unified view of agent

### Proposed Flow (Unified)

```
Agents → [Agent Card] → Agent Dashboard (single page with tabs)
                        ├── Overview Tab
                        │   ├── Status badge (Active/Inactive)
                        │   ├── Quick metrics (conversations, messages)
                        │   ├── Recent activity feed
                        │   └── Quick actions (Start Chat, Get Embed Code)
                        ├── Configure Tab
                        │   ├── Training (accordion: Documents, Q&A, Topics)
                        │   ├── Persona (accordion: Name, Tone, Behavior)
                        │   └── Branding (accordion: Colors, Logo, Messages)
                        ├── Integrate Tab
                        │   ├── API Keys (generate, copy, revoke)
                        │   ├── Widget (preview, customize, get code)
                        │   └── MCP (connection config)
                        └── Analytics Tab
                            ├── Usage metrics
                            ├── Conversation insights
                            └── User feedback
```

**Benefits:**
- Single page, tabbed interface
- All agent config in one place
- Preview changes in real-time
- Accordion sections reduce cognitive load

---

## Welcome Events Configuration

### New Feature: Conversation Events

Add to Agent Configure → Persona section:

```
Welcome Events
├── On-Connect Message
│   ├── Enable/Disable toggle
│   ├── Message variants (add multiple)
│   ├── Random selection toggle
│   └── Preview
├── Suggested Actions
│   ├── Enable/Disable toggle
│   ├── Quick reply buttons
│   └── Default prompts
└── Exit Events
    ├── Farewell message
    └── Feedback request toggle
```

### Configuration UI

```typescript
interface WelcomeEventsConfig {
  onConnect: {
    enabled: boolean;
    messages: string[];
    randomize: boolean;
  };
  suggestedActions: {
    enabled: boolean;
    buttons: Array<{ label: string; action: string }>;
  };
  onExit: {
    enabled: boolean;
    message: string;
    requestFeedback: boolean;
  };
}
```

---

## Widget Customization Enhancement

### Current State

Basic embed code generation with minimal customization.

### Proposed State

**Live Preview Widget Customizer:**

```
┌─────────────────────────────────────────────────────────────┐
│ Widget Customization                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │ Settings        │    │ Live Preview                    │ │
│  │                 │    │                                 │ │
│  │ Theme: [Dark ▼] │    │  ┌─────────────────────────┐   │ │
│  │                 │    │  │ 💬 Agent Name           │   │ │
│  │ Position:       │    │  ├─────────────────────────┤   │ │
│  │ ○ Bottom-right  │    │  │                         │   │ │
│  │ ○ Bottom-left   │    │  │ Welcome! How can I      │   │ │
│  │                 │    │  │ help you today?         │   │ │
│  │ Bubble Style:   │    │  │                         │   │ │
│  │ ○ Circle        │    │  │ [Quick Reply 1]         │   │ │
│  │ ○ Pill          │    │  │ [Quick Reply 2]         │   │ │
│  │                 │    │  │                         │   │ │
│  │ Primary Color:  │    │  ├─────────────────────────┤   │ │
│  │ [#7c3aed    ]   │    │  │ Type a message...   [→] │   │ │
│  │                 │    │  └─────────────────────────┘   │ │
│  │ [Reset]         │    │                                 │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
│                                                              │
│  Embed Code:                                                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ <script src="https://..." data-agent="..." />           │ │
│  └─────────────────────────────────────────────────────────┘ │
│  [Copy Code]  [Download HTML]  [Test in New Tab]             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Analytics Dashboard Design

### Agent Analytics Page

```
┌─────────────────────────────────────────────────────────────┐
│ Agent Analytics: Customer Support Bot           [7 Days ▼]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ Conversations│ │ Messages     │ │ Satisfaction │         │
│  │    1,234     │ │    8,456     │ │     94%      │         │
│  │   ↑ 12%      │ │   ↑ 8%       │ │   ↑ 2%       │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Conversations Over Time                                 │ │
│  │ [Line Chart: 7-day trend]                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────┐ ┌─────────────────────────────────┐│
│  │ Top Topics          │ │ Response Time Distribution     ││
│  │ [Word Cloud]        │ │ [Histogram]                    ││
│  └─────────────────────┘ └─────────────────────────────────┘│
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Recent Conversations                            [View All]│
│  │ ┌────────────────────────────────────────────────────┐ │ │
│  │ │ User: "How do I reset..." │ 2m ago │ Resolved ✓   │ │ │
│  │ │ User: "Billing question"  │ 5m ago │ In Progress  │ │ │
│  │ └────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 weeks)

1. **Agent Cards Grid** - Replace table with card-based layout
2. **Unified Agent Dashboard** - Combine configure/keys/widget into tabs
3. **Live Widget Preview** - Add real-time customization preview

### Phase 2: Core Features (2-4 weeks)

4. **Welcome Events** - Add conversation events configuration
5. **Analytics Dashboard** - Build agent analytics page
6. **Navigation Redesign** - Implement progressive disclosure

### Phase 3: Polish (4-6 weeks)

7. **Mobile Responsive** - Ensure all views work on mobile
8. **Onboarding Flow** - Guided setup for new users
9. **Advanced Analytics** - Word clouds, satisfaction tracking

---

## Component Specifications

### AgentCard Component

```typescript
interface AgentCardProps {
  agent: {
    uuid: string;
    name: string;
    icon?: string;
    status: 'active' | 'inactive' | 'error';
    category: 'agent' | 'app' | 'assistant' | 'automation';
    metrics: {
      conversations: number;
      trend: number; // percentage change
    };
  };
  onConfigure: () => void;
  onOpen: () => void;
}
```

### AgentDashboard Tabs

```typescript
type AgentDashboardTab =
  | 'overview'
  | 'configure'
  | 'integrate'
  | 'analytics';

interface AgentDashboardProps {
  agentUuid: string;
  activeTab: AgentDashboardTab;
  onTabChange: (tab: AgentDashboardTab) => void;
}
```

### WelcomeEventsForm

```typescript
interface WelcomeEventsFormProps {
  config: WelcomeEventsConfig;
  onChange: (config: WelcomeEventsConfig) => void;
  onPreview: () => void;
}
```

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Time to configure agent | ~10 min | < 3 min | User testing |
| Page loads per task | 4-5 | 1-2 | Analytics |
| Configuration completion | ~40% | > 70% | Feature adoption |
| Widget customization use | ~20% | > 50% | Feature adoption |
| User satisfaction | Unknown | > 4/5 | NPS survey |

---

## Related Documents

- [CMP Journey Maps](./CMP-JOURNEY-MAPS.md)
- [Site-Kit Architecture](./SITE-KIT-ARCHITECTURE.md)
- [Frictionless Buyer Journey](./FRICTIONLESS-BUYER-JOURNEY.md)

---

*Document maintained by GSV Platform Team*
