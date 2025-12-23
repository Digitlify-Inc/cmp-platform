# MVP Definition

**Target:** December 31, 2025 Soft Launch  
**Status:** Defining

---

## Core Value Proposition

> *"Subscribe to an AI agent, get an API key, embed a widget - done in 5 minutes."*

---

## MVP Scope

### In Scope ✅

#### Customer Journey
1. **Browse** - View available agents in marketplace
2. **Subscribe** - Select plan, complete payment
3. **Receive** - Get API key instantly
4. **Use** - Make API calls or embed widget
5. **Monitor** - View usage in dashboard

#### Features
| Feature | Priority | Status |
|---------|----------|--------|
| Agent catalog browsing | P0 | ⬜ |
| Plan selection & checkout | P0 | ⬜ |
| API key generation | P0 | ⬜ |
| Basic API usage | P0 | ⬜ |
| Usage dashboard | P1 | ⬜ |
| Widget embed | P1 | ⬜ |
| Email notifications | P2 | ⬜ |

#### Launch Agents
| Agent | Description | Plan |
|-------|-------------|------|
| **Customer Support** | Answer questions from docs | Starter $29/mo |
| **Knowledge Base** | Q&A on uploaded documents | Pro $99/mo |
| **Lead Qualifier** | Chat widget for sales | Pro $99/mo |

### Out of Scope ❌ (Post-Launch)

| Feature | Reason | Target |
|---------|--------|--------|
| Self-service agent creation | Complexity | Q1 2026 |
| Dedicated tenancy | Enterprise feature | Q1 2026 |
| Custom branding | Nice to have | Q1 2026 |
| Advanced analytics | Nice to have | Q1 2026 |
| Team management | Enterprise feature | Q1 2026 |
| Webhook notifications | Nice to have | Jan 2026 |

---

## Technical MVP

### Required Components

```
┌─────────────────────────────────────────────────────────────┐
│                    MVP Architecture                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Portal (CMP)         Agent Registry         Runtime         │
│  ┌──────────┐        ┌──────────────┐       ┌──────────┐   │
│  │ Catalog  │───────▶│  Provision   │──────▶│  Agent   │   │
│  │ Checkout │        │  API Keys    │       │ Endpoint │   │
│  │ Dashboard│◀───────│  Usage Track │◀──────│          │   │
│  └──────────┘        └──────────────┘       └──────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Agent Registry MVP Features

| Feature | MVP | Full |
|---------|-----|------|
| Create tenant | ✅ | ✅ |
| Provision agent (shared) | ✅ | ✅ |
| Provision agent (dedicated) | ❌ | ✅ |
| Generate API key | ✅ | ✅ |
| Validate API key | ✅ | ✅ |
| Track usage (basic) | ✅ | ✅ |
| Track usage (detailed) | ❌ | ✅ |
| Billing sync | ✅ | ✅ |
| Multi-version agents | ❌ | ✅ |

### CMP MVP Features

| Feature | MVP | Full |
|---------|-----|------|
| Browse offerings | ✅ | ✅ |
| View offering details | ✅ | ✅ |
| Select plan | ✅ | ✅ |
| Checkout | ✅ | ✅ |
| View orders | ✅ | ✅ |
| View usage | ✅ | ✅ |
| Manage API keys | ❌ | ✅ |
| Team management | ❌ | ✅ |

---

## User Stories

### Customer Stories

```gherkin
Feature: Agent Subscription

Scenario: Customer subscribes to Customer Support Agent
  Given I am logged into the marketplace
  When I browse the AI Agents category
  And I select "Customer Support Agent"
  And I choose the "Starter" plan at $29/month
  And I complete checkout
  Then I should receive an API key
  And I should see the agent in my dashboard
  And I should be able to make API calls

Scenario: Customer uses API key
  Given I have subscribed to an agent
  And I have received my API key
  When I make a POST request to /api/agents/{id}/predict
  With header X-API-Key: {my-api-key}
  And body {"message": "How do I reset my password?"}
  Then I should receive a response with the agent's answer
  And my usage count should increment

Scenario: Customer embeds widget
  Given I have subscribed to Customer Support Agent
  When I copy the widget code from my dashboard
  And I paste it into my website
  Then visitors should see a chat widget
  And conversations should use my API quota
```

### Developer Stories

```gherkin
Feature: Agent Development

Scenario: Developer creates agent in Studio
  Given I am logged into Studio
  When I create a new flow
  And I add RAG components
  And I configure the knowledge base
  And I test the flow
  Then I should see successful responses

Scenario: Developer publishes agent
  Given I have a working flow in Studio
  When I click "Publish to Marketplace"
  And I fill in name, description, category
  And I set pricing plans
  Then the agent should appear in the marketplace
  And customers should be able to subscribe
```

---

## Launch Agents Specification

### 1. Customer Support Agent

**Description:** AI-powered customer support trained on your documentation.

**Use Case:** Answer common customer questions 24/7.

**Input:** Customer question (text)
**Output:** Answer with source references

**Components:**
- RAG retrieval
- GPT-4 / Claude response generation
- Source citation

**Plans:**
| Plan | Price | Quota | Features |
|------|-------|-------|----------|
| Starter | $29/mo | 1,000 queries | Basic RAG |
| Pro | $99/mo | 10,000 queries | + Analytics |

### 2. Knowledge Base Agent

**Description:** Interactive Q&A on uploaded documents.

**Use Case:** Internal knowledge base, document search.

**Input:** Question + document context
**Output:** Answer from documents

**Components:**
- Document ingestion
- Vector search
- LLM synthesis

**Plans:**
| Plan | Price | Quota | Features |
|------|-------|-------|----------|
| Starter | $29/mo | 500 queries | Up to 10 docs |
| Pro | $99/mo | 5,000 queries | Unlimited docs |

### 3. Lead Qualification Agent

**Description:** Chat widget that qualifies sales leads.

**Use Case:** Website visitor engagement, lead capture.

**Input:** Visitor conversation
**Output:** Lead qualification + contact info

**Components:**
- Conversational flow
- Lead scoring
- CRM integration (future)

**Plans:**
| Plan | Price | Quota | Features |
|------|-------|-------|----------|
| Pro | $99/mo | 500 leads | Basic qualification |
| Business | $299/mo | 2,000 leads | + CRM export |

---

## Success Criteria

### Launch Day (Dec 31)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Platform uptime | 99.5% | Monitoring |
| E2E tests passing | 100% | CI/CD |
| Launch agents available | 3 | Marketplace |
| API response time | < 2s | Monitoring |
| Documentation complete | 90% | Review |

### Week 1 Post-Launch

| Metric | Target | Measurement |
|--------|--------|-------------|
| First customer signup | 1+ | Analytics |
| API calls served | 100+ | Usage tracking |
| Critical bugs | 0 | Bug tracker |
| Support tickets | < 10 | Support system |

---

## Technical Debt Accepted

For MVP, we accept:

1. **Shared tenancy only** - Dedicated comes later
2. **Basic usage tracking** - Detailed analytics later
3. **Manual agent publishing** - Self-service later
4. **Limited customization** - Branding options later
5. **Email-only notifications** - Webhooks later

---

## Non-Functional Requirements

| Requirement | MVP Target |
|-------------|------------|
| Response time | < 3 seconds |
| Availability | 99% |
| Concurrent users | 100 |
| API rate limit | 100 req/min per key |
| Data retention | 30 days |

---

## Definition of Done

An MVP feature is "done" when:

- [ ] Code complete and reviewed
- [ ] Unit tests passing
- [ ] Integration test passing
- [ ] Documentation updated
- [ ] Deployed to QA
- [ ] E2E test passing
- [ ] Deployed to Production
- [ ] Monitoring configured

---

*Last Updated: November 27, 2025*
