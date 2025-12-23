# GSV Platform Provider Guide

**Version:** 1.0
**Last Updated:** December 2024
**Audience:** AI Agent Providers, Developers

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Designing Agents in Studio](#2-designing-agents-in-studio)
3. [Registering Agents](#3-registering-agents)
4. [Deploying Agents](#4-deploying-agents)
5. [Publishing to Marketplace](#5-publishing-to-marketplace)
6. [Pricing and Plans](#6-pricing-and-plans)
7. [Analytics and Insights](#7-analytics-and-insights)
8. [Best Practices](#8-best-practices)

---

## 1. Getting Started

### 1.1 Provider Overview

As a **Provider** on the GSV Platform, you can:
- Design AI agents using visual flow builder (LangFlow)
- Deploy agents to managed infrastructure
- Publish agents on the marketplace
- Monetize through subscription plans
- Access analytics and usage metrics

### 1.2 Provider Journey

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   DESIGN     │───>│   DEPLOY     │───>│   PUBLISH    │───>│   MONETIZE   │
│  (Studio)    │    │  (Runtime)   │    │(Marketplace) │    │  (Billing)   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### 1.3 Access Requirements

| Service | URL | Authentication |
|---------|-----|----------------|
| Agent Studio | https://studio.digitlify.com | SSO (Keycloak) |
| Provider Dashboard | https://portal.digitlify.com/provider | SSO (Keycloak) |
| API Documentation | https://api.digitlify.com/docs | Public |

### 1.4 First Login

1. Navigate to https://studio.digitlify.com
2. Click "Login with SSO"
3. Enter your Keycloak credentials
4. Accept the terms of service
5. Complete your provider profile

---

## 2. Designing Agents in Studio

### 2.1 Agent Studio Overview

The Agent Studio is powered by LangFlow, providing:
- Visual drag-and-drop interface
- Pre-built component library
- Real-time testing and debugging
- Version control for flows

### 2.2 Creating a New Flow

1. Click **New Flow** in Studio
2. Choose a template or start blank
3. Add components from the sidebar:
   - **Inputs**: Chat Input, File Input
   - **LLMs**: OpenAI, Anthropic, Local models
   - **Tools**: RAG, Search, Calculator
   - **Outputs**: Chat Output, API Response

### 2.3 Example: Customer Support Agent

```
┌────────────┐    ┌──────────────┐    ┌────────────────┐    ┌─────────────┐
│ Chat Input │───>│RAG Retriever │───>│ Prompt Template│───>│ OpenAI GPT-4│
└────────────┘    └──────────────┘    └────────────────┘    └─────────────┘
                         │                    │                     │
                         v                    │                     v
                  ┌─────────────┐            │              ┌──────────────┐
                  │ FAQ Vector  │            │              │ Chat Output  │
                  │   Store     │<───────────┘              └──────────────┘
                  └─────────────┘
```

### 2.4 Component Configuration

#### LLM Component (OpenAI)

```yaml
model: gpt-4
temperature: 0.7
max_tokens: 500
top_p: 1.0
frequency_penalty: 0
presence_penalty: 0
```

#### RAG Retriever

```yaml
collection_name: customer-faq
top_k: 5
score_threshold: 0.7
```

#### Prompt Template

```
You are a customer support agent. Use the following context from our FAQ to help answer the customer's question.

FAQ Context:
{context}

Customer Question: {question}

Provide a helpful, accurate, and empathetic response:
```

### 2.5 Testing Your Flow

1. Click **Test** in the Studio
2. Enter sample inputs
3. View responses and debug logs
4. Iterate until satisfied

### 2.6 Saving and Versioning

```bash
# Studio automatically saves versions
# You can export flows as JSON:
{
  "name": "Customer Support Agent",
  "version": "1.0.0",
  "components": [...],
  "edges": [...]
}
```

---

## 3. Registering Agents

### 3.1 Agent Registration API

```bash
POST /api/v1/agents/
Authorization: Bearer {your_access_token}
Content-Type: application/json

{
  "name": "Customer Support Agent",
  "slug": "customer-support-agent",
  "description": "AI-powered customer support for FAQ and inquiries",
  "category": "CUSTOMER_SUPPORT",
  "version": "1.0.0",
  "flow_id": "langflow-flow-uuid",
  "capabilities": [
    "FAQ answering",
    "Order inquiries",
    "Product information"
  ],
  "system_prompt": "You are a helpful customer support agent..."
}
```

### 3.2 Agent Categories

| Category | Description |
|----------|-------------|
| `CUSTOMER_SUPPORT` | Customer service and FAQ |
| `SALES` | Sales assistance and lead qualification |
| `HR` | HR and employee support |
| `IT_SUPPORT` | Technical support and troubleshooting |
| `EDUCATION` | Training and learning assistance |
| `CUSTOM` | Custom/general purpose |

### 3.3 Agent States

| State | Description | Actions Allowed |
|-------|-------------|-----------------|
| `DRAFT` | Being designed | Edit, Delete |
| `DEPLOYED` | Running in runtime | Test, Publish, Undeploy |
| `LISTED` | On marketplace | Update pricing, Delist |
| `RETIRED` | Deprecated | Archive |

---

## 4. Deploying Agents

### 4.1 Deploy via API

```bash
POST /api/v1/agents/{agent_id}/deploy/
Authorization: Bearer {your_access_token}

# Response
{
  "status": "success",
  "agent_id": "uuid",
  "state": "DEPLOYED",
  "runtime_endpoint": "https://runtime.digitlify.com/flows/{flow_id}"
}
```

### 4.2 Deployment Options

```json
{
  "deploy_config": {
    "replicas": 1,
    "resources": {
      "cpu": "500m",
      "memory": "1Gi"
    },
    "auto_scale": {
      "enabled": true,
      "min_replicas": 1,
      "max_replicas": 5,
      "target_cpu_utilization": 70
    }
  }
}
```

### 4.3 Testing Deployed Agent

```bash
# Test the deployed agent
POST /api/v1/agents/{agent_id}/predict/
Authorization: Bearer {your_access_token}
Content-Type: application/json

{
  "message": "How long does shipping take?",
  "conversation_id": "optional-session-id"
}
```

### 4.4 Viewing Deployment Status

```bash
GET /api/v1/agents/{agent_id}/status/
Authorization: Bearer {your_access_token}

# Response
{
  "agent_id": "uuid",
  "state": "DEPLOYED",
  "health": "healthy",
  "replicas": {
    "desired": 2,
    "ready": 2
  },
  "metrics": {
    "requests_per_minute": 45,
    "avg_latency_ms": 850,
    "error_rate": 0.02
  }
}
```

---

## 5. Publishing to Marketplace

### 5.1 Pre-Publication Checklist

- [ ] Agent is deployed and healthy
- [ ] At least 2 pricing plans configured
- [ ] Description and capabilities are complete
- [ ] System prompt is appropriate
- [ ] Testing completed successfully

### 5.2 Publish via API

```bash
POST /api/v1/agents/{agent_id}/publish/
Authorization: Bearer {your_access_token}
Content-Type: application/json

{
  "visibility": "PUBLIC",
  "terms_accepted": true,
  "plans": [
    {
      "name": "Free Trial",
      "slug": "free-trial",
      "price_cents": 0,
      "currency": "EUR",
      "billing_period": "monthly",
      "monthly_quota": 100,
      "rate_limit_per_second": 1
    },
    {
      "name": "Professional",
      "slug": "professional",
      "price_cents": 9900,
      "currency": "EUR",
      "billing_period": "monthly",
      "monthly_quota": 10000,
      "rate_limit_per_second": 20
    }
  ]
}
```

### 5.3 Marketplace Listing

Your agent will appear in the marketplace with:
- Name and description
- Category and capabilities
- Pricing plans
- User reviews and ratings
- Usage statistics

### 5.4 Updating Published Agents

```bash
# Update pricing
PATCH /api/v1/agents/{agent_id}/plans/{plan_id}/
Authorization: Bearer {your_access_token}
Content-Type: application/json

{
  "price_cents": 7900,
  "monthly_quota": 12000
}

# Update description
PATCH /api/v1/agents/{agent_id}/
Authorization: Bearer {your_access_token}
Content-Type: application/json

{
  "description": "Updated description...",
  "capabilities": ["New capability", ...]
}
```

---

## 6. Pricing and Plans

### 6.1 Plan Structure

```json
{
  "name": "Professional",
  "slug": "professional",
  "price_cents": 9900,
  "currency": "EUR",
  "billing_period": "monthly",
  "monthly_quota": 10000,
  "rate_limit_per_second": 20,
  "features": [
    "10,000 messages per month",
    "Priority support",
    "API access",
    "Custom branding"
  ],
  "custom_pricing": false
}
```

### 6.2 Recommended Pricing Tiers

| Tier | Price | Quota | Target |
|------|-------|-------|--------|
| Free Trial | €0 | 100/month | Evaluation |
| Starter | €29 | 1,000/month | Small teams |
| Professional | €99 | 10,000/month | Growing businesses |
| Enterprise | Custom | Unlimited | Large organizations |

### 6.3 Revenue Sharing

| Revenue Source | Provider Share | Platform Fee |
|----------------|---------------|--------------|
| Subscriptions | 70% | 30% |
| Usage overage | 70% | 30% |
| Enterprise deals | Negotiable | Negotiable |

### 6.4 Payout Schedule

- Payouts processed monthly
- 30-day payment terms
- Minimum payout: €100
- Payment methods: Bank transfer, PayPal

---

## 7. Analytics and Insights

### 7.1 Provider Dashboard Metrics

| Metric | Description |
|--------|-------------|
| Total Subscribers | Active subscriptions |
| Monthly Revenue | Gross revenue this month |
| API Calls | Total requests processed |
| Avg Response Time | P50 latency |
| Error Rate | Failed requests % |
| User Satisfaction | Based on feedback |

### 7.2 Usage Analytics API

```bash
GET /api/v1/provider/analytics/?period=30d
Authorization: Bearer {your_access_token}

# Response
{
  "period": "2024-11-04 to 2024-12-04",
  "agents": [
    {
      "agent_id": "uuid",
      "name": "Customer Support Agent",
      "subscribers": 45,
      "api_calls": 15420,
      "revenue_cents": 445500,
      "avg_response_time_ms": 890,
      "error_rate": 0.015
    }
  ],
  "totals": {
    "subscribers": 45,
    "revenue_cents": 445500,
    "api_calls": 15420
  }
}
```

### 7.3 Conversation Logs

```bash
GET /api/v1/provider/agents/{agent_id}/conversations/?limit=50
Authorization: Bearer {your_access_token}

# Response includes (anonymized):
# - Message content
# - Response generated
# - Latency
# - Tokens used
# - Feedback score
```

---

## 8. Best Practices

### 8.1 Agent Design

1. **Clear Purpose**: Define a specific use case
2. **Good Prompts**: Write detailed system prompts
3. **Context Retrieval**: Use RAG for domain knowledge
4. **Error Handling**: Plan for edge cases
5. **Testing**: Test with diverse inputs

### 8.2 Pricing Strategy

1. **Free Tier**: Allow evaluation
2. **Clear Limits**: Transparent quotas
3. **Value-Based**: Price based on value delivered
4. **Competitive**: Research market rates

### 8.3 Documentation

Provide customers with:
- Getting started guide
- API reference
- Example use cases
- FAQ section
- Support contact

### 8.4 Monitoring

- Set up alerts for high error rates
- Monitor latency trends
- Review conversation logs regularly
- Act on customer feedback

### 8.5 Security

- Never expose API keys in flows
- Use environment variables for secrets
- Implement input validation
- Follow responsible AI practices

---

## Quick Reference: API Endpoints

| Action | Method | Endpoint |
|--------|--------|----------|
| Create agent | POST | `/api/v1/agents/` |
| Get agent | GET | `/api/v1/agents/{id}/` |
| Deploy agent | POST | `/api/v1/agents/{id}/deploy/` |
| Publish agent | POST | `/api/v1/agents/{id}/publish/` |
| Test agent | POST | `/api/v1/agents/{id}/predict/` |
| Get analytics | GET | `/api/v1/provider/analytics/` |
| List subscribers | GET | `/api/v1/provider/agents/{id}/subscribers/` |

---

## Support

- Documentation: https://docs.digitlify.com
- Provider Support: provider-support@digitlify.com
- Community Forum: https://community.digitlify.com

---

*Document generated by GSV Platform Engineering Team*
