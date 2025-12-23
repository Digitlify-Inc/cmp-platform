# Agent Registry - Design Specification

**Document Version:** 1.0 FINAL  
**Status:** v1 Design FROZEN ✅  
**Last Updated:** November 27, 2025

---

## Overview

The **Agent Registry** is the MCP Hub that bridges:
- **LangFlow Studio** (flow creation)
- **LangFlow Runtime** (flow execution)  
- **Waldur CMP** (marketplace, billing, customers)

---

## The Pizzeria Analogy

```
Kitchen (Studio)     →  Menu (CMP)       →  Restaurant Floor (Runtime)
Create Recipe           List & Price       Customer Consumes
                              ↑
                      Agent Registry
                    (Kitchen Manager)
```

---

## Data Model

### Core Entities

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   AgentTenant   │────▶│  AgentProject   │────▶│  AgentInstance  │
│   (Customer)    │     │   (Project)     │     │    (Agent)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        │                                               │
        ▼                                               ▼
┌─────────────────┐                           ┌─────────────────┐
│  AgentAccess    │◀──────────────────────────│  UsageRecord    │
│  (API Key)      │                           │  (Metering)     │
└─────────────────┘                           └─────────────────┘
```

### Waldur Mapping

| Waldur Entity | Registry Entity | Relationship |
|---------------|-----------------|--------------|
| Customer | AgentTenant | 1:1 |
| Project | AgentProject | 1:1 |
| Resource | AgentInstance | 1:1 |
| User | AgentAccess | 1:N (multiple keys per user) |
| Offering | AgentInstance.waldur_offering_uuid | Link |

---

## Multi-Tenancy Models

### Shared Tenancy (Budget Plans: $29-99/month)

```
shared-pool namespace
├── agent-support-v1 (serves Tenant A, B, C)
├── agent-kb-v1 (serves Tenant A, D)
└── agent-lead-v1 (serves Tenant B, C, E)

Isolation: API keys + data tagging
```

**Characteristics:**
- Multiple tenants share agent instances
- Cost-effective for small usage
- Isolation via API key validation
- Fair-share resource scheduling

### Dedicated Tenancy (Enterprise: $500+/month)

```
org-acme-ns namespace (Tenant A only)
├── agent-support-v1
├── agent-kb-v1
└── agent-custom-v1

org-bigcorp-ns namespace (Tenant B only)
├── agent-support-v2
└── agent-analytics-v1
```

**Characteristics:**
- Dedicated namespace per tenant
- Full network isolation
- Custom resource limits
- Compliance-ready

---

## Agent Lifecycle States

```
                         ┌─────────────────────────────────────┐
                         │                                     │
        ┌────────────────┼──────────────────┐                 │
        │                │                  │                 │
        ▼                ▼                  ▼                 │
┌────────┐     ┌──────────┐     ┌────────┐     ┌────────┐    │
│ DRAFT  │◀───▶│ DEPLOYED │────▶│ LISTED │────▶│ ACTIVE │────┤
└────────┘     └──────────┘     └────────┘     └────────┘    │
    │               │                │              │         │
    │               │                │              ▼         │
    │               │                │         ┌────────┐     │
    │               │                └────────▶│ PAUSED │─────┘
    │               │                          └────────┘
    │               │                               │
    ▼               ▼                               ▼
┌─────────────────────────────────────────────────────────┐
│                       RETIRED                            │
└─────────────────────────────────────────────────────────┘
```

| State | Description | Visible in CMP |
|-------|-------------|----------------|
| DRAFT | Created, not deployed | No |
| DEPLOYED | Running in Runtime | No |
| LISTED | Available in marketplace | Yes (not orderable) |
| ACTIVE | Orderable and running | Yes |
| PAUSED | Temporarily unavailable | Yes (not orderable) |
| RETIRED | End of life | No |

---

## MCP Tools

### Tenant Management

| Tool | Parameters | Description |
|------|------------|-------------|
| `create_tenant` | waldur_customer_uuid, name, tenancy_model | Create tenant from Waldur customer |
| `create_project` | tenant_id, waldur_project_uuid, name | Create project in tenant |

### Agent Lifecycle

| Tool | Parameters | Description |
|------|------------|-------------|
| `register_agent` | tenant_id, agent_id, name, langflow_flow_id | Register new agent |
| `provision_agent` | agent_instance_id, environment | Deploy to Runtime |
| `publish_agent` | agent_instance_id, category, plans | Create CMP offering |
| `pause_agent` | agent_instance_id | Temporarily disable |
| `retire_agent` | agent_instance_id | End of life |

### Access Control

| Tool | Parameters | Description |
|------|------------|-------------|
| `grant_access` | agent_instance_id, waldur_user_uuid, quota | Generate API key |
| `revoke_access` | access_id | Revoke API key |
| `validate_api_key` | api_key | Validate and return tenant/agent info |

### Usage Tracking

| Tool | Parameters | Description |
|------|------------|-------------|
| `track_usage` | api_key, endpoint, status, response_time, tokens | Record usage |
| `get_usage_stats` | tenant_id, period | Get usage statistics |
| `sync_billing` | billing_cycle_id | Sync usage to Waldur |

---

## API Key Format

```
Prefix: ar_
Format: ar_{base64_random_32_bytes}
Example: ar_Kx7mP9qR2sT5uV8wY1zA3bC6dE9fG2hI4jK7lM0nO3pQ
Storage: SHA-256 hash only (plaintext never stored)
```

---

## Quota Management

### Per-Access Quotas
```python
AgentAccess:
  quota_limit: 10000     # Monthly limit
  quota_used: 7500       # Current usage
  quota_exceeded: False  # Computed property
```

### Quota Enforcement
```
Request → Validate API Key → Check Quota → Allow/Deny → Track Usage
```

### Mid-Cycle Plan Changes

**Upgrade (Starter → Pro):**
- Limits increase immediately
- Usage counters preserved
- Billing prorated by Waldur

**Downgrade (Pro → Starter):**
- Queued for next billing cycle
- Limits reduced at cycle start
- Overage handling if already exceeded

---

## Billing Sync

### Monthly Cycle
```
1. Billing job runs at 00:05 UTC on 1st
2. Query UsageRecords for previous month
3. Aggregate per tenant
4. Create TenantQuotaSnapshot
5. Sync to Waldur via API
6. Mark snapshot as synced
7. Reset monthly counters
```

### Idempotency
```python
TenantQuotaSnapshot:
  billing_cycle_id: "2025-12"  # YYYY-MM
  synced_to_waldur: True
  synced_at: timestamp
  sync_attempts: 1
```

---

## Canonical Test Data

All tests use these references:

```yaml
tenant:
  id: tenant-acme-789
  waldur_customer_uuid: cust-waldur-acme
  waldur_customer_name: Acme Corporation
  tenancy_model: shared
  monthly_api_calls_limit: 100000

project:
  id: project-prod-001
  waldur_project_uuid: proj-waldur-prod
  waldur_project_name: Production

agent:
  agent_id: flow-support-123
  agent_name: Customer Support Agent
  agent_version: 1.0.0
  state: ACTIVE
  namespace: shared-pool
  runtime_endpoint: https://runtime.gsv.dev/predict/flow-support-123
  waldur_offering_uuid: off-support-456

access:
  waldur_user_uuid: user-john-456
  waldur_user_email: john@acme.com
  api_key_prefix: ar_acme12
  quota_limit: 100000
```

---

## Endpoint Classification

### Public (Customer-facing)
```
https://api.digitlify.com/agents/{agent_id}/predict
  Auth: X-API-Key header
  Rate limit: 100 req/s per key, 500 req/s per tenant
```

### Partner (B2B)
```
https://api.digitlify.com/webhooks/waldur/*
  Auth: HMAC signature (X-Waldur-Signature)
  Rate limit: 100 req/s
```

### Internal (Cluster only)
```
http://agent-registry.cmp.svc.cluster.local/internal/*
  Auth: Kubernetes ServiceAccount token
  No external exposure
```

---

## Security Considerations

1. **API Keys:** SHA-256 hashed, never stored in plaintext
2. **Network Isolation:** NetworkPolicies for dedicated tenants
3. **RBAC:** Kubernetes RBAC for namespace access
4. **Audit Logging:** All admin actions logged
5. **Data Encryption:** TLS in transit, encrypted volumes at rest

---

## Design Status: FROZEN ✅

This design is frozen for v1 implementation. Changes require formal review.

### Frozen Items:
- [x] Data models
- [x] MCP tools
- [x] Multi-tenancy rules
- [x] Lifecycle states
- [x] Quota management
- [x] Billing sync
- [x] Security model

### Ready for Implementation
Week 1: Django scaffold + Core models
Week 2: MCP server + Provisioning
Week 3: CMP integration + Billing
Week 4: Testing + Launch prep

---

*Document frozen November 24, 2025*
