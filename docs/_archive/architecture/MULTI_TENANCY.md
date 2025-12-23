# Multi-Tenancy Design

**Doc ID:** ARCH_MULTI_TENANCY  
**Status:** Draft v0.1  
**Applies to:** Agent Registry, Agent Runtime (LangFlow), CMP/Waldur, Customer & Provider Portals  

---

## 1. Purpose & Scope

This document defines how **multi-tenancy** is implemented and enforced across:

- **Control plane:** Agent Registry, CMP/Waldur, Portals  
- **Data plane:** Agent Runtime (LangFlow execution), storage, data pipelines  

Goals:

1. **Isolate each customer (Org/Tenant) from all others** at compute, data and API levels.
2. Support **multiple providers (sellers)** and **multiple buyers (tenants)** in a single marketplace.
3. Provide clear rules for:
   - Shared vs Dedicated runtime plans.
   - Data isolation and access control.
   - Observability and testing.

Customer Support Agent is one **Agentic Product** in this multi-tenant marketplace. All design here applies to other Agents, Apps, Assistants and Automations.

---

## 2. Tenancy Model Overview

### 2.1 Roles & Tenants

**Platform Owner**

- Operates the entire marketplace (Digitlify / GSV).
- Controls global policies, infrastructure and IAM.

**Provider (Seller)**

- A company/org that publishes offerings (Agents/Apps/Automations) to the marketplace.
- Example: Digitlify as first-party provider; partners later.

**Buyer (Tenant / Org)**

- A customer organisation that subscribes to offerings.
- Has its own Org → Project → Team → User structure.

### 2.2 Logical Entities & Mappings

We align across CMP/Waldur, Agent Registry and Runtime:

| Concept         | CMP / Waldur              | Agent Registry              | Runtime                       |
|----------------|---------------------------|-----------------------------|-------------------------------|
| Provider org   | ServiceProvider           | ProviderOrg / AgentTenant   | Provider namespace(s)        |
| Buyer org      | Customer                  | AgentTenant                 | Tenant namespace(s)          |
| Project        | Project                   | AgentProject                | Tenant project label/namespace |
| Offering       | Offering                  | ProductTemplate / mapping   | N/A (metadata only)          |
| Plan           | Plan                      | Plan snapshot in Instance   | Limits in config             |
| Subscription   | Resource                  | AgentInstance               | Deployed flow/service        |
| User           | Waldur User               | SSO Subject / AgentAccess   | Auth token / API key subject |

Key identifiers flowing through the system:

- `waldur_customer_uuid`, `waldur_project_uuid`, `waldur_offering_uuid`, `waldur_plan_uuid`, `waldur_resource_uuid`
- `tenant_id` (AgentTenant), `project_id` (AgentProject)
- `agent_id`, `agent_version_id`, `agent_instance_id`
- `access_id` (API/MCP key), `subject` (user/principal)

---

## 3. Isolation Layers

Isolation is applied at four layers:

1. **Control plane isolation** – which objects a tenant can *see and manage*.
2. **Compute isolation** – how flows are deployed and where they run.
3. **Data isolation** – where customer data is stored and how it is separated.
4. **Network & IAM isolation** – how requests and credentials are scoped.

### 3.1 Control Plane Isolation (Agent Registry & CMP)

- All Agent Registry entities carry a `tenant_id` and/or `project_id`.
- Customer-facing APIs and UIs **must always scope by tenant and role**:
  - Buyer users can only access AgentInstances, keys and data where `tenant_id = their_tenant`.
  - Provider users can only see:
    - Their own product templates and instances that use those products.
    - Aggregated per-tenant usage; never raw customer data.
- Waldur (CMP) already isolates Customers and Projects. We maintain a **1:1 mapping**:
  - `waldur_customer_uuid` ↔ `AgentTenant.tenant_id`
  - `waldur_project_uuid` ↔ `AgentProject.project_id`
  - `waldur_resource_uuid` ↔ `AgentInstance.agent_instance_id` (via mapping table).

Implementation hints:

- Use tenant-scoped API paths (e.g. `/tenants/{tenant_id}/projects/{project_id}/agents/...`).
- Enforce tenant from token, not from user input (the backend resolves `tenant_id` from JWT).
- Consider Postgres Row Level Security (RLS) for hard guarantees later.

### 3.2 Compute Isolation (Agent Runtime)

We support two runtime modes:

#### 3.2.1 Shared Runtime (Standard / Pro plans)

- One or a few **multi-tenant LangFlow Runtime deployments** per environment.
- A **Runtime Gateway** (API service) sits in front of LangFlow and is the only entry point.

For each request:

1. Gateway validates API key / JWT with Agent Registry.
2. Resolves `tenant_id`, `agent_instance_id` and runtime config.
3. Invokes LangFlow with **fully resolved config** (flow, data sources, limits).
4. Emits usage events with tenant & instance tags.

Isolation properties:

- A key bound to `tenant_id A` and `agent_instance_id X` **cannot be used** to call instance Y (the gateway rejects).
- Flow and data source IDs are **never accepted from client input**; they come from Registry.
- Rate limits and quotas enforced per `agent_instance_id` (and optionally per key).

#### 3.2.2 Dedicated Runtime (Enterprise / Isolated plans)

For high-value tenants or instances:

- A dedicated **Kubernetes namespace** per tenant or per AgentInstance:
  - `ten-{tenant_id}` or `ten-{tenant_id}-agent-{agent_instance_id}`
- A dedicated LangFlow Deployment + Service per instance.
- ResourceQuotas, LimitRanges and NetworkPolicies apply per namespace.

Isolation properties:

- Compute isolation: CPU/memory/hpa per tenant/instance.
- Network isolation: only the gateway (and necessary system components) can reach the namespace.
- Secrets isolation: dedicated service accounts and secret scopes.

The Agent Registry tracks `tenancy_model` per AgentInstance: `shared` or `dedicated`. Provisioning logic chooses deployment pattern based on this.

### 3.3 Data Isolation

#### 3.3.1 Vector DB (RAG)

- Each AgentInstance uses a unique collection/index name:
  - Example: `tenant_{tenant_id}_agent_{agent_instance_id}`
- Optionally, each tenant has a separate DB user or even a separate vector DB cluster.
- Runtime receives the collection name from Registry; clients never provide it.

#### 3.3.2 Object Storage (files, embeddings, logs)

- Shared bucket with strict prefixes:
  - `tenants/{tenant_id}/agents/{agent_instance_id}/docs/...`
  - `tenants/{tenant_id}/agents/{agent_instance_id}/embeddings/...`
- IAM policies or bucket policies restrict access:
  - Only the tenant’s runtime/data pipelines’ service accounts can read/write within their prefix.

#### 3.3.3 Relational Databases

- Control plane database (Agent Registry) stores:
  - `agent_tenant`, `agent_project`, `agent_instance`, `agent_access`, `usage_record`.
- Each table includes `tenant_id`.
- All application queries must filter by tenant; optional RLS for defence in depth.

### 3.4 Network & IAM Boundaries

- Service-to-service calls authenticated with short-lived JWTs or mTLS.
- External API keys:
  - Always bound to a **specific AgentInstance** and optionally a Tenant/Project/User.
  - Have minimal scopes: `invoke`, `manage`, `mcp`, etc.
- Logs and traces:
  - Must be tagged with `tenant_id`, `agent_instance_id`, `provider_id` to aid auditing.
  - Must not contain sensitive cross-tenant identifiers inside payloads.

---

## 4. Request Flow & Tenant Resolution

### 4.1 Sequence Overview

```mermaid
sequenceDiagram
    participant Client as Client (Widget/API)
    participant Gateway as Runtime Gateway
    participant Registry as Agent Registry
    participant Runtime as LangFlow Runtime

    Client->>Gateway: POST /agents/{agent_instance_id}/run + API key
    Gateway->>Registry: Validate API key & instance (tenant + scopes)
    Registry-->>Gateway: Validated (tenant_id, agent_instance_id, config)
    alt Valid key & correct instance
        Gateway->>Runtime: Execute flow with resolved config (collection IDs, secrets)
        Runtime-->>Gateway: Result + usage metrics
        Gateway->>Registry: POST usage event (tenant_id, agent_instance_id, metrics)
        Gateway-->>Client: Response (text/stream)
    else Invalid or cross-tenant key
        Gateway-->>Client: 4xx error (INVALID_API_KEY or FORBIDDEN)
    end
