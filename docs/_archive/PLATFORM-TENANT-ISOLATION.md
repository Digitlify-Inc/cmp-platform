# Platform-Wide Tenant Isolation Architecture

> **Purpose**: Document how tenant isolation is implemented at EVERY layer of the platform
> **Key Principle**: Every aspect of the platform provides tenant isolation - no exceptions
> **Last Updated**: 2024-12-14

---

## Executive Summary

Tenant isolation is not an afterthought - it is a foundational architectural principle that permeates every component of the platform. This document provides a comprehensive view of isolation mechanisms across all layers.

```
+-----------------------------------------------------------------------------+
|                    TENANT ISOLATION - COMPLETE STACK VIEW                    |
+-----------------------------------------------------------------------------+

     +-----------------------------------------------------------------------+
  1  |                        CLIENT LAYER                                   |
     |   Widget embed -> API Key validation -> tenant_id extraction          |
     +-----------------------------------------------------------------------+
                                    |
     +-----------------------------------------------------------------------+
  2  |                        EDGE / CDN LAYER                               |
     |   Origin validation -> Rate limiting per tenant -> WAF rules          |
     +-----------------------------------------------------------------------+
                                    |
     +-----------------------------------------------------------------------+
  3  |                       API GATEWAY LAYER                               |
     |   JWT validation -> API key -> tenant routing -> Request enrichment   |
     +-----------------------------------------------------------------------+
                                    |
     +-----------------------------------------------------------------------+
  4  |                       APPLICATION LAYER                               |
     |   Tenant context middleware -> Scoped queries -> Permission checks    |
     +-----------------------------------------------------------------------+
                                    |
     +-----------------------------------------------------------------------+
  5  |                        DATA LAYER                                     |
     |   PostgreSQL RLS -> Redis key prefix -> Qdrant collections -> S3 paths|
     +-----------------------------------------------------------------------+
                                    |
     +-----------------------------------------------------------------------+
  6  |                       RUNTIME LAYER                                   |
     |   Shared pools (logical) OR Dedicated namespaces (physical)           |
     +-----------------------------------------------------------------------+
                                    |
     +-----------------------------------------------------------------------+
  7  |                    INFRASTRUCTURE LAYER                               |
     |   Network policies -> Namespace isolation -> Secrets management       |
     +-----------------------------------------------------------------------+
```

---

## Layer 1: Client Layer Isolation

### Widget Embed Security

Every embedded widget operates in an isolated context with tenant-specific credentials.

- Widget ID is globally unique and maps to exactly one tenant
- Domain allowlist validates that widget only loads on pre-approved domains
- API key (pk_*) is scoped to specific widget capabilities
- Widget runs in sandboxed iframe with CSP headers

### API Client Authentication

- API keys are cryptographically random (32 bytes)
- Keys are hashed before storage (sha256)
- Each key is bound to exactly ONE tenant
- Keys cannot be transferred between tenants
- Compromised keys only affect one tenant

---

## Layer 2: Edge / CDN Layer Isolation

### Origin Validation

CDN edge rules validate the Origin header against the widget's allowed_domains list before forwarding requests.

### Rate Limiting Per Tenant

Rate limit buckets are scoped per tenant:

- tenant:{tenant_id}:api:minute -> per plan limits
- tenant:{tenant_id}:chat:minute -> message limits
- tenant:{tenant_id}:upload:hour -> upload limits

**Isolation Guarantee**: Tenant A hitting rate limit has ZERO impact on Tenant B.

---

## Layer 3: API Gateway Layer Isolation

### Request Routing

1. TLS Termination (custom cert for Enterprise)
2. Auth Middleware extracts tenant_id from JWT/API key
3. Tenant Router directs to shared pool or dedicated namespace
4. Header Injection adds X-Tenant-ID, X-Customer-ID, X-Plan-Tier

### JWT Claims Structure

All tokens include:
- tenant_id: Primary tenant identifier (REQUIRED)
- customer_id: Organization within tenant
- roles: Tenant-scoped roles
- permissions: Tenant-scoped permissions

---

## Layer 4: Application Layer Isolation

### Tenant Context Middleware

```python
class TenantMiddleware:
    def __call__(self, request):
        # Extract tenant_id from header, JWT, or API key
        tenant_id = self._get_tenant_id(request)
        
        if not tenant_id:
            return HttpResponse(status=401)
        
        # Store in thread-local for use throughout request
        _tenant_context.tenant_id = tenant_id
        
        # Set PostgreSQL session variable for RLS
        with connection.cursor() as cursor:
            cursor.execute(
                "SET app.current_tenant = %s",
                [str(tenant_id)]
            )
        
        return self.get_response(request)
```

### Tenant-Scoped QuerySet Manager

```python
class TenantManager(models.Manager):
    def get_queryset(self):
        qs = TenantQuerySet(self.model, using=self._db)
        tenant_id = get_current_tenant()
        if tenant_id:
            return qs.filter(tenant_id=tenant_id)
        return qs

class TenantModel(models.Model):
    tenant_id = models.UUIDField(db_index=True)
    objects = TenantManager()
    
    class Meta:
        abstract = True
```

All queries through TenantManager automatically filter by tenant_id.

---

## Layer 5: Data Layer Isolation

### PostgreSQL Row-Level Security

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_documents ENABLE ROW LEVEL SECURITY;

-- Create isolation policy
CREATE POLICY tenant_isolation ON agent_configs
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::uuid);

-- Force RLS even for table owners
ALTER TABLE agent_configs FORCE ROW LEVEL SECURITY;
```

**Security Properties**:
- RLS is enforced at DATABASE level, not application
- Even raw SQL queries are filtered
- SQL injection cannot bypass tenant isolation

### Redis Key Isolation

Key naming convention: {tenant_id}:{service}:{resource}:{id}

Examples:
- org_abc123:session:user_xyz789
- org_abc123:agent:config:agt_001
- org_abc123:ratelimit:api:minute

### Qdrant Vector Store Isolation

Collection naming: {tenant_id}_{agent_id}

- Each tenant+agent combination has own collection
- Collections are physically separate
- No cross-collection queries possible

### File Storage Isolation (S3)

Path structure: digitlify-storage/{tenant_id}/...

- IAM policies enforce path restrictions
- Presigned URLs scoped to tenant path
- Cross-tenant path access is denied

---

## Layer 6: Runtime Layer Isolation

### Shared Runtime (Starter/Pro/Business)

- Multi-tenant with logical isolation
- Memory isolation per flow execution
- No persistent state shared between tenants
- Database: RLS enforced
- Cache: Key prefix enforced
- Vectors: Separate collections

### Dedicated Runtime (Enterprise)

- Own Kubernetes namespace
- Own Langflow runtime instances
- Own PostgreSQL, Redis, Qdrant
- Network policies for isolation
- Custom domain support

See [RUNTIME-ARCHITECTURE-MULTI-TENANT.md](./RUNTIME-ARCHITECTURE-MULTI-TENANT.md) for details.

---

## Layer 7: Infrastructure Layer Isolation

### Kubernetes Network Policies

```yaml
# Enterprise namespaces are network-isolated by default
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: ent-acme-corp
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

- Only dedicated ingress can reach enterprise namespace
- Cross-namespace traffic is blocked
- Egress limited to approved external services

### Secrets Management (Vault)

Path structure:
```
secret/digitlify/tenants/{tenant_id}/
  ├── database
  ├── api-keys
  └── integrations
```

Vault policies enforce tenant-level access:
```hcl
path "secret/data/digitlify/tenants/org_abc123/*" {
  capabilities = ["read", "list"]
}

path "secret/data/digitlify/tenants/org_*" {
  capabilities = ["deny"]
}
```

---

## Audit and Compliance

### Audit Logging

Every audit event includes tenant_id:

```json
{
  "timestamp": "2024-12-14T10:30:00.000Z",
  "tenant_id": "org_abc123",
  "user_id": "user_12345",
  "action": "agent.config.update",
  "resource_id": "agt_001",
  "result": "success"
}
```

### Retention by Plan

| Plan       | Retention  | Features                    |
|------------|------------|-----------------------------|
| Starter    | 30 days    | Basic events                |
| Pro        | 90 days    | + Detailed changes          |
| Business   | 180 days   | + Export capability         |
| Enterprise | Custom     | + SIEM integration, 1yr+    |

---

## Isolation Verification Checklist

### Client Layer
- [ ] Widget IDs are globally unique and map to one tenant
- [ ] API keys are hashed and scoped to one tenant
- [ ] CORS validates origin against tenant's allowed domains

### Edge Layer
- [ ] Rate limits are per-tenant, not global
- [ ] CDN rules validate widget origin

### API Gateway Layer
- [ ] Every request has tenant_id
- [ ] Requests without tenant_id are rejected
- [ ] Routing determined by tenant's plan tier

### Application Layer
- [ ] Tenant middleware sets database session variable
- [ ] All queries use TenantManager (auto-filtered)
- [ ] Unscoped queries require explicit opt-in

### Database Layer
- [ ] RLS is enabled on ALL tenant tables
- [ ] RLS is FORCED (even for table owners)
- [ ] App user does not have BYPASSRLS

### Cache Layer
- [ ] All Redis keys include tenant_id prefix
- [ ] KEYS/SCAN operations are scoped to tenant

### Vector Store Layer
- [ ] Collections named {tenant_id}_{agent_id}
- [ ] No cross-collection queries possible

### File Storage Layer
- [ ] All files under tenant-prefixed path
- [ ] IAM policies enforce path restrictions

### Runtime Layer
- [ ] Shared: Tenant context per request
- [ ] Enterprise: Dedicated namespace with network policies

### Infrastructure Layer
- [ ] Network policies block cross-namespace traffic
- [ ] Vault access limited to own tenant path

---

## Test Scenarios

1. [ ] Tenant A cannot see Tenant B's agents
2. [ ] Tenant A cannot see Tenant B's conversations
3. [ ] Tenant A cannot see Tenant B's documents
4. [ ] Tenant A cannot access Tenant B's widget
5. [ ] SQL injection cannot bypass RLS
6. [ ] Raw SQL queries are still filtered
7. [ ] API key from Tenant A cannot access Tenant B
8. [ ] Enterprise namespace is network isolated
9. [ ] Vault access is limited to own tenant path
10. [ ] Audit logs show tenant_id for every action

---

## Summary Table

| Layer         | Mechanism                    | Bypass Protection                |
|---------------|------------------------------|----------------------------------|
| Client        | Widget ID, API Key scope     | Keys cryptographically bound     |
| Edge          | Origin validation, rate limits| CDN rules are server-side       |
| Gateway       | JWT claims, tenant routing   | Tokens are signed (RS256)        |
| Application   | Middleware, scoped managers  | Must opt-in to bypass            |
| Database      | PostgreSQL RLS               | FORCE RLS, no BYPASSRLS          |
| Cache         | Key prefix                   | Client wrapper enforces          |
| Vectors       | Per-tenant collections       | Collection names include tenant  |
| Files         | Path prefix, IAM policies    | AWS enforces policies            |
| Runtime       | Logical/Physical isolation   | Network policies block cross-NS  |
| Secrets       | Vault path policies          | Vault enforces at path level     |

---

## Key Principles

1. **Defense in depth** - Isolation at every layer
2. **Fail secure** - Missing tenant = denied
3. **Audit everything** - tenant_id in every log
4. **Enterprise gets physical isolation** - On top of logical isolation
5. **No exceptions** - Every aspect provides tenant isolation
