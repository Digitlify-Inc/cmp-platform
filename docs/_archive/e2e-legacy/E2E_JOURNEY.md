# GSV AI Agent Platform - End-to-End Journey Documentation

This document outlines the complete provider and customer journey for the GSV AI Agent Platform, demonstrating the flow from agent creation to customer deployment.

## Platform Overview

The GSV AI Agent Platform enables providers to build, publish, and monetize AI agents, while customers can discover, subscribe, configure, and deploy these agents in their applications.

### Architecture Components

| Component | Purpose | URL |
|-----------|---------|-----|
| Agent Studio | Visual agent builder (LangFlow) | https://studio.dev.gsv.dev |
| Agent Registry | Agent catalog and metadata | https://api.dev.gsv.dev |
| Agent Runtime | Agent execution environment | https://runtime.dev.gsv.dev |
| CMP (Marketplace) | Customer portal and billing | https://app.dev.gsv.dev |
| SSO (Keycloak) | Authentication and authorization | https://sso.dev.gsv.dev |

## Provider Journey

### 1. Create Agent in Agent Studio

**Goal**: Build an AI agent using the visual flow builder.

1. Access Agent Studio at `https://studio.dev.gsv.dev`
2. Log in with SSO credentials
3. Create a new flow with components:
   - Input nodes (text, voice, file upload)
   - LLM nodes (OpenAI, Anthropic, etc.)
   - RAG nodes (vector store, retriever)
   - Output nodes (text, audio)
4. Configure agent parameters:
   - System prompt and personality
   - Model selection and temperature
   - Memory/conversation context
   - Tool integrations

**Example: Customer Support Agent**
```yaml
Agent Name: Customer Support Agent
Version: 2.0.0
Category: CUSTOMER_SUPPORT
Capabilities:
  - text-input
  - voice-input
  - voice-output
  - multi-lingual
  - rag-retrieval
  - document-training
  - website-crawling
  - embeddable-widget
  - conversation-memory
  - topic-filtering
  - intent-classification
  - escalation-handling
Supported Languages:
  - en, es, fr, de, pt, zh, ja, ko, ar, hi
```

### 2. Register Agent with Agent Registry

**Goal**: Publish agent metadata to the central registry.

**API Endpoint**: `POST /api/v1/agents/`

**Authentication**: OIDC Bearer Token from Keycloak

```bash
# Get OIDC token
TOKEN=$(curl -s -X POST https://sso.dev.gsv.dev/realms/gsv/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=gsv-api" \
  -d "client_secret=<secret>" \
  | jq -r '.access_token')

# Register agent
curl -X POST https://api.dev.gsv.dev/api/v1/agents/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Support Agent",
    "slug": "customer-support-agent",
    "description": "Multi-modal AI customer support agent",
    "version": "2.0.0",
    "category": "CUSTOMER_SUPPORT",
    "status": "ACTIVE",
    "capabilities": ["text-input", "voice-input", "rag-retrieval"],
    "supported_languages": ["en", "es", "fr"],
    "requirements": {
      "memory": "2Gi",
      "cpu": "1000m",
      "gpu": false
    }
  }'
```

### 3. Deploy Agent to Runtime

**Goal**: Make the agent available for execution.

The Agent Runtime automatically synchronizes with the Agent Registry and deploys registered agents. Deployment creates:

- Kubernetes Deployment for the agent
- Service for internal communication
- Ingress for external access
- ConfigMap for agent configuration

### 4. Publish to CMP Marketplace

**Goal**: List the agent in the marketplace with pricing.

**API Endpoint**: `POST /api/marketplace-offerings/`

**Pricing Configuration**:
```json
{
  "model": "tiered",
  "plans": [
    {"name": "free", "display_name": "Free Trial", "price_monthly": 0, "messages_limit": 100},
    {"name": "basic", "display_name": "Basic", "price_monthly": 29.99, "messages_limit": 5000},
    {"name": "pro", "display_name": "Professional", "price_monthly": 99.99, "messages_limit": 25000},
    {"name": "enterprise", "display_name": "Enterprise", "price_monthly": null, "price_per_message": 0.005}
  ]
}
```

---

## Customer Journey

### 1. Discover and Subscribe

**Goal**: Find and subscribe to an AI agent.

1. Access CMP Portal at `https://app.dev.gsv.dev`
2. Log in with SSO (organization account)
3. Browse Marketplace categories:
   - Customer Support
   - Sales Automation
   - Data Analysis
   - Content Generation
4. View agent details:
   - Description and capabilities
   - Pricing plans
   - Reviews and ratings
5. Subscribe to a plan

### 2. Configure Agent Instance

**Goal**: Customize the agent for your organization.

After subscription, customers can configure:

**a) Agent Configuration**
```json
{
  "name": "Acme Customer Support Configuration",
  "welcome_message": "Hello! Welcome to Acme Corp support. How can I help you today?",
  "personality": "professional, helpful, concise",
  "allowed_topics": ["billing", "technical_support", "product_info", "returns"],
  "escalation_rules": {
    "frustrated_customer": "human_agent",
    "complex_issue": "senior_support"
  },
  "business_hours": {
    "timezone": "America/New_York",
    "hours": "09:00-18:00",
    "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
  }
}
```

**b) API Access**
- Generate API keys for integration
- Configure rate limits
- Set up IP whitelisting (optional)

### 3. Train with Knowledge Base

**Goal**: Add organization-specific knowledge to the agent.

**Training Methods**:

1. **Document Upload**
   - PDF, DOCX, TXT files
   - Product manuals, FAQs, policies

2. **Website Crawling**
   - Specify URLs to crawl
   - Configure crawl depth and frequency

3. **API Integration**
   - Connect to existing knowledge bases
   - Sync with CRM/helpdesk systems

**Training Process**:
```
1. Upload Documents → 2. Text Extraction → 3. Chunking → 4. Embedding → 5. Vector Store
```

**Example Training Record**:
```json
{
  "name": "Acme Customer Support Configuration",
  "training_status": "trained",
  "documents_count": 15,
  "total_chunks": 150,
  "vector_collection": "acme_support_vectors",
  "last_trained": "2025-12-09T10:30:00Z"
}
```

### 4. Embed Widget in Application

**Goal**: Deploy the chat widget on your website.

**Option 1: Script Tag (Recommended)**
```html
<script
  src="https://gsv.dev/static/js/gsv-chat-widget.js"
  data-api-key="ak_acme_prod_a1b2c3d4e5f6"
  data-agent-id="customer-support-agent"
  data-agent-name="Acme Support"
  data-primary-color="#2563eb"
></script>
```

**Option 2: Manual Initialization**
```javascript
GSVChatWidget.init({
  apiKey: 'ak_acme_prod_a1b2c3d4e5f6',
  agentId: 'customer-support-agent',
  agentName: 'Acme Support',
  agentRuntimeUrl: 'https://runtime.dev.gsv.dev',
  primaryColor: '#2563eb',
  position: 'bottom-right',
  welcomeMessage: 'Hello! How can I help you today?'
});
```

**Widget Features**:
- Floating chat button (bottom-right)
- Expandable chat window
- Typing indicators
- Message timestamps
- Mobile responsive
- Customizable colors and branding
- Session persistence

---

## API Reference

### Authentication

All API calls require OIDC Bearer tokens from Keycloak:

```bash
# Client Credentials Flow
curl -X POST https://sso.dev.gsv.dev/realms/gsv/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=gsv-api" \
  -d "client_secret=<secret>"
```

### Agent Registry API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/agents/` | GET | List all agents |
| `/api/v1/agents/` | POST | Create new agent |
| `/api/v1/agents/{id}/` | GET | Get agent details |
| `/api/v1/agents/{id}/` | PUT | Update agent |
| `/api/v1/tenants/` | GET/POST | Manage tenants |
| `/api/v1/instances/` | GET/POST | Manage instances |

### Agent Runtime API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/chat` | POST | Send chat message |
| `/api/v1/sessions/{id}` | GET | Get session history |
| `/api/v1/sessions/{id}` | DELETE | Clear session |

**Chat Request**:
```json
{
  "message": "How do I return a product?",
  "session_id": "session_123456",
  "agent_id": "customer-support-agent"
}
```

**Chat Response**:
```json
{
  "response": "To return a product, please follow these steps...",
  "session_id": "session_123456",
  "message_id": "msg_789",
  "timestamp": "2025-12-09T10:35:00Z"
}
```

---

## Database Schema

### Agent Registry Tables

```
agent_tenant          - Organization/tenant records
agent_instance        - Agent instances per tenant
agent_access          - API keys and access tokens
customer_agent_config - Customer-specific configurations
training_document     - Uploaded training documents
```

### Key Relationships

```
agent_tenant (1) → (N) agent_instance
agent_instance (1) → (N) agent_access
agent_instance (1) → (N) customer_agent_config
customer_agent_config (1) → (N) training_document
```

---

## Demo Scenario: Acme Corporation

### Provider Setup (GSV Demo)

1. **Tenant**: GSV Demo (`gsv-demo`)
2. **Agent**: Customer Support Agent v2.0.0
3. **Capabilities**: Multi-modal, multi-lingual, RAG, embeddable widget
4. **Pricing**: Free, Basic ($29.99), Pro ($99.99), Enterprise (usage-based)

### Customer Setup (Acme Corporation)

1. **Organization**: Acme Corporation
2. **Subscription**: Professional Plan
3. **API Key**: `ak_acme_prod_a1b2c3d4e5f6`
4. **Training**: 15 documents, 150 chunks
5. **Integration**: Embedded widget on acme.com

### Live URLs

| Service | URL |
|---------|-----|
| Demo Website | https://gsv.dev (with embedded widget) |
| CMP Portal | https://app.dev.gsv.dev |
| Agent Studio | https://studio.dev.gsv.dev |
| API Documentation | https://api.dev.gsv.dev/docs |

---

## Troubleshooting

### Common Issues

1. **OIDC Token Errors**
   - Verify client credentials
   - Check Keycloak realm configuration
   - Ensure token hasn't expired (300s default)

2. **Agent Not Responding**
   - Check Agent Runtime pod status
   - Verify API key is active
   - Check rate limits

3. **Widget Not Loading**
   - Verify script URL is correct
   - Check browser console for errors
   - Ensure CORS is configured

### Support

- Documentation: https://docs.gsv.dev
- API Status: https://status.gsv.dev
- Support Email: support@gsv.dev
