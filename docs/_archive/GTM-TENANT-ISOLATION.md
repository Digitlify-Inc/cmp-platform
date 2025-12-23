# GTM Tenant Isolation Model

## Overview

This document defines how tenant isolation is achieved in the CMP Agent Marketplace, mapping Waldur's Organization-Project-Team hierarchy to Langflow workspaces and Ragflow collections.

## Architecture Principles

1. **Organization = Billing Boundary** - Credits, invoices, payment profiles
2. **Project = Data Isolation** - Subscriptions, configurations, RAG data
3. **Subscription = Runtime Instance** - Langflow workspace, Ragflow collection
4. **Capability = Configuration Schema** - What can be customized per offering

## Hierarchy Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│                         WALDUR                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Organization (Acme Corp)                                        │
│  ├── Credits: 10,000                                             │
│  ├── Billing: Monthly invoice                                    │
│  │                                                               │
│  ├── Project: Website Support                                    │
│  │   ├── Subscription: Customer Support Agent                    │
│  │   │   └── Config: RAG trained on support docs                 │
│  │   └── Subscription: FAQ Assistant                             │
│  │       └── Config: System prompt for FAQs                      │
│  │                                                               │
│  └── Project: Sales Team                                         │
│      └── Subscription: Research Agent                            │
│          └── Config: Web search enabled                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   LANGFLOW (Shared Runtime)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Workspace: acme-corp-website-support-csa-001             │    │
│  │ Flow: customer-support-agent-v1                          │    │
│  │ Variables: {agent_name, welcome_msg, tone, ...}          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Workspace: acme-corp-website-support-faq-002             │    │
│  │ Flow: topic-assistant-v1                                 │    │
│  │ Variables: {system_prompt, avatar_url, ...}              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Workspace: acme-corp-sales-team-research-003             │    │
│  │ Flow: research-agent-v1                                  │    │
│  │ Variables: {search_sources, output_format, ...}          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   RAGFLOW (RAG Runtime)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Collection: acme-corp-website-support-csa-001            │    │
│  │ Documents: support-faq.pdf, policies.docx, ...           │    │
│  │ Embeddings: 1,234 vectors                                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  (FAQ Assistant doesn't use RAG - no collection)                 │
│                                                                  │
│  (Research Agent doesn't use RAG - no collection)                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Identifier Scheme

### Workspace Naming Convention

```
{org_slug}-{project_slug}-{offering_type}-{subscription_id}
```

Examples:
- `acme-corp-website-support-csa-001`
- `techstartup-product-team-research-042`
- `consultingfirm-client-a-code-assistant-108`

### Collection Naming Convention (Ragflow)

Same as workspace name for consistency:
```
{org_slug}-{project_slug}-{offering_type}-{subscription_id}
```

## Data Isolation Matrix

| Data Type | Isolation Level | Storage | Access Control |
|-----------|----------------|---------|----------------|
| Subscription config | Project | Waldur DB | Project members |
| RAG documents | Subscription | Ragflow | Subscription owner |
| Chat history | Subscription | Langflow | Subscription owner |
| API keys | Subscription | Waldur DB | Project managers |
| Usage metrics | Organization | Waldur DB | Org owners |
| Credit balance | Organization | Waldur DB | Org owners |

## Shared vs Dedicated Runtime

### Shared Runtime (Default)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHARED LANGFLOW CLUSTER                       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 Langflow API Gateway                     │    │
│  │  (Routes requests to correct workspace based on API key) │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                      │
│           ┌───────────────┼───────────────┐                     │
│           ▼               ▼               ▼                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Workspace A │  │ Workspace B │  │ Workspace C │              │
│  │ (Acme Corp) │  │ (TechStart) │  │ (Consult)   │              │
│  │             │  │             │  │             │              │
│  │ Flow vars:  │  │ Flow vars:  │  │ Flow vars:  │              │
│  │ - agent_name│  │ - agent_name│  │ - agent_name│              │
│  │ - ragflow_id│  │ - ragflow_id│  │ - ragflow_id│              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  Isolation: Workspace-level (logical separation)                 │
│  Scaling: Platform auto-scales entire cluster                    │
│  Suitable for: Free, Plus, Pro tiers                             │
└─────────────────────────────────────────────────────────────────┘
```

**Isolation Guarantees (Shared):**
- Workspace-level variable isolation
- API key scoped to workspace
- No cross-workspace data access
- Shared compute resources (fair scheduling)

### Dedicated Runtime (Enterprise)

```
┌─────────────────────────────────────────────────────────────────┐
│              DEDICATED LANGFLOW INSTANCE (Enterprise)            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Customer: BigCorp Enterprise                             │    │
│  │ Instance: langflow-bigcorp-dedicated-001                 │    │
│  │                                                          │    │
│  │ ┌─────────────────────────────────────────────────────┐ │    │
│  │ │ Dedicated Container                                  │ │    │
│  │ │ - CPU: 4 cores (reserved)                            │ │    │
│  │ │ - RAM: 16GB (reserved)                               │ │    │
│  │ │ - GPU: Optional                                      │ │    │
│  │ │ - Network: Isolated VPC                              │ │    │
│  │ └─────────────────────────────────────────────────────┘ │    │
│  │                                                          │    │
│  │ ┌─────────────────────────────────────────────────────┐ │    │
│  │ │ Dedicated Ragflow Instance                           │ │    │
│  │ │ - Separate vector DB                                 │ │    │
│  │ │ - Isolated embedding queue                           │ │    │
│  │ └─────────────────────────────────────────────────────┘ │    │
│  │                                                          │    │
│  │ Custom Options:                                          │    │
│  │ - Custom domain: ai.bigcorp.com                         │    │
│  │ - Custom SSL certificate                                │    │
│  │ - VPC peering to BigCorp network                        │    │
│  │ - Audit logging to BigCorp SIEM                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Isolation: Container-level (physical separation)                │
│  Scaling: Customer-controlled                                    │
│  Suitable for: Enterprise tier only                              │
└─────────────────────────────────────────────────────────────────┘
```

**Isolation Guarantees (Dedicated):**
- Physical container isolation
- Dedicated compute resources
- Network isolation (optional VPC)
- Custom SSL and domain
- Compliance audit logging

## Provisioning Flow

When a subscription is created:

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. SUBSCRIPTION CREATED                                          │
│    Order approved → Resource created in Waldur                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. WORKSPACE PROVISIONING                                        │
│    CMP Backend → Langflow API                                    │
│                                                                   │
│    POST /api/v1/workspaces                                       │
│    {                                                              │
│      "name": "acme-corp-website-support-csa-001",                │
│      "flow_id": "customer-support-agent-v1",                     │
│      "variables": {                                               │
│        "agent_name": "Support Assistant",                        │
│        "welcome_message": "Hi! How can I help?",                 │
│        "tone": "professional",                                    │
│        "ragflow_collection_id": "...",                           │
│        "ragflow_api_key": "..."                                  │
│      }                                                            │
│    }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. RAGFLOW COLLECTION (if RAG capability)                        │
│    CMP Backend → Ragflow API                                     │
│                                                                   │
│    POST /api/v1/collections                                      │
│    {                                                              │
│      "name": "acme-corp-website-support-csa-001",                │
│      "embedding_model": "text-embedding-3-small",                │
│      "chunk_size": 512,                                          │
│      "chunk_overlap": 50                                         │
│    }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. STORE REFERENCES                                              │
│    AgentConfig model updated with:                               │
│    - runtime_workspace_id                                        │
│    - knowledge_base_id (ragflow collection)                      │
│    - api_key (generated)                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. READY                                                         │
│    Buyer can now:                                                │
│    - Configure the agent                                         │
│    - Upload documents (if RAG)                                   │
│    - Get widget code                                             │
│    - Get API keys                                                │
└─────────────────────────────────────────────────────────────────┘
```

## API Request Flow

When a buyer's end-user sends a message:

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. END-USER REQUEST                                              │
│    Widget/API → CMP Gateway                                      │
│                                                                   │
│    POST https://api.cmp.digitlify.com/v1/chat/completions        │
│    Authorization: Bearer pk_live_xxx                             │
│    {                                                              │
│      "message": "How do I reset my password?"                    │
│    }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. API KEY VALIDATION                                            │
│    CMP Gateway validates:                                        │
│    - API key exists                                              │
│    - API key belongs to active subscription                      │
│    - Organization has sufficient credits                         │
│    - Domain is allowed (for widget requests)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. RAG RETRIEVAL (if RAG capability)                             │
│    CMP Gateway → Ragflow                                         │
│                                                                   │
│    POST /api/v1/search                                           │
│    {                                                              │
│      "collection_id": "acme-corp-website-support-csa-001",       │
│      "query": "How do I reset my password?",                     │
│      "top_k": 5                                                  │
│    }                                                              │
│                                                                   │
│    Returns: [relevant document chunks]                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. LANGFLOW EXECUTION                                            │
│    CMP Gateway → Langflow                                        │
│                                                                   │
│    POST /api/v1/workspaces/{workspace_id}/run                    │
│    {                                                              │
│      "message": "How do I reset my password?",                   │
│      "context": [RAG results],                                   │
│      "variables": {subscription config}                          │
│    }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. CREDIT DEDUCTION                                              │
│    CMP Backend deducts credits from organization                 │
│    Logs usage for analytics                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 6. RESPONSE                                                      │
│    {                                                              │
│      "response": "To reset your password, go to Settings...",   │
│      "credits_used": 2,                                          │
│      "credits_remaining": 9998                                   │
│    }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

## Security Considerations

### API Key Security

```python
# API Key Structure
{
    "key": "pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "subscription_uuid": "...",
    "project_uuid": "...",
    "organization_uuid": "...",
    "permissions": ["chat", "upload_document"],
    "allowed_domains": ["example.com", "*.example.com"],
    "rate_limit": "100/minute",
    "created_at": "...",
    "expires_at": null  # or datetime for temporary keys
}
```

### Domain Allowlist (Widget)

```python
# Validate widget requests
def validate_widget_request(request, api_key):
    origin = request.headers.get('Origin')
    allowed = api_key.allowed_domains

    if not origin:
        raise PermissionDenied("Origin header required")

    if not match_domain(origin, allowed):
        raise PermissionDenied(f"Domain {origin} not allowed")
```

### Rate Limiting

```python
# Rate limits by tier
RATE_LIMITS = {
    "free": "10/minute",
    "plus": "60/minute",
    "pro": "300/minute",
    "enterprise": "custom"  # Defined in subscription
}
```

## Cleanup on Subscription Termination

```
┌──────────────────────────────────────────────────────────────────┐
│ SUBSCRIPTION TERMINATED                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Langflow        │  │ Ragflow         │  │ Waldur          │
│ - Delete        │  │ - Delete        │  │ - Revoke API    │
│   workspace     │  │   collection    │  │   keys          │
│ - Clear chat    │  │ - Delete        │  │ - Archive       │
│   history       │  │   vectors       │  │   config        │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                              │
                              ▼
              Data retention policy:
              - Chat history: 30 days
              - RAG documents: Immediate delete
              - Config: Archived for audit
```

## Related Documents

- [GTM-BUYER-JOURNEY.md](./GTM-BUYER-JOURNEY.md) - Buyer journey
- [GTM-SELLER-JOURNEY.md](./GTM-SELLER-JOURNEY.md) - Seller journey
- [GTM-CAPABILITY-CONFIG.md](./GTM-CAPABILITY-CONFIG.md) - Capability-driven configuration
