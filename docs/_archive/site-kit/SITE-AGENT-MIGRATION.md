# Site Agent Migration Guide

**Date:** December 13, 2024
**Status:** Planning

---

## Overview

This document describes the migration path from standalone Agent Registry (cmp-agentregistry / gsv-agentregistry) to the integrated Site Agent architecture within Waldur (marketplace_site_agent).

---

## Current State Analysis

### Existing Site Agent Components

The Waldur backend already has a comprehensive marketplace_site_agent module:

```
cmp-backend/src/waldur_mastermind/marketplace_site_agent/
├── models.py           # AgentIdentity, AgentService, AgentProcessor
├── views.py            # REST API endpoints
├── serializers.py      # DRF serializers
├── handlers.py         # Event handlers
├── tasks.py            # Celery background tasks
├── extension.py        # Waldur extension registration
├── urls.py             # URL routing
└── filters.py          # Query filters
```

### Frontend Components

```
cmp-frontend/src/site-agent/
├── constants.ts        # SITE_AGENT_PLUGIN type
├── marketplace.ts      # Offering configuration
├── SiteAgentOrderForm.tsx
└── SiteAgentCredentialsForm.tsx
```

---

## Feature Mapping

### Models

| Agent Registry | Site Agent | Notes |
|---------------|------------|-------|
| Agent | AgentIdentity | Identity for each running agent |
| AgentVersion | - | Extend AgentIdentity with version tracking |
| AgentAccess | - | Add new model for API key management |
| AgentTenant | - | Use Waldur Customer directly |
| AgentProject | - | Use Waldur Project directly |

### APIs

| Agent Registry Endpoint | Site Agent Equivalent |
|------------------------|----------------------|
| POST /agents/ | Built into marketplace order flow |
| GET /agents/{id}/ | GET /site-agent-identities/{uuid}/ |
| POST /webhooks/waldur/* | Not needed - native Waldur events |
| POST /api/mcp/* | Add to marketplace_site_agent |
| POST /api/v1/access/ | Add AgentAccess model |

### Event Handling

Agent Registry currently receives Waldur webhooks. With Site Agent, events are handled natively:

```python
# Current: Agent Registry receives webhook
POST /webhooks/waldur/order/
{
    "event_type": "marketplace_order_created",
    "context": {"order_uuid": "..."}
}

# Target: Direct Django signal handler
@receiver(post_save, sender=Order)
def handle_order_created(sender, instance, created, **kwargs):
    if created and instance.offering.type == SITE_AGENT_OFFERING:
        # Provision agent access directly
        AgentAccess.objects.create(...)
```

---

## Migration Plan

### Phase 1: Extend Site Agent (Q1 2025)

Add missing features to marketplace_site_agent:

1. **AgentAccess Model**
```python
class AgentAccess(UuidMixin, TimeStampedModel):
    identity = models.ForeignKey(AgentIdentity)
    project = models.ForeignKey(Project)
    api_key_hash = models.CharField(max_length=128)
    key_prefix = models.CharField(max_length=8)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True)
```

2. **MCP Protocol Endpoints**
```python
# Add to urls.py
path("mcp/", MCPServerView.as_view()),
path("mcp/tools/", MCPToolsListView.as_view()),
path("mcp/resources/", MCPResourcesListView.as_view()),
```

3. **Usage Metering**
```python
class AgentUsage(TimeStampedModel):
    access = models.ForeignKey(AgentAccess)
    tokens_input = models.BigIntegerField(default=0)
    tokens_output = models.BigIntegerField(default=0)
    requests = models.IntegerField(default=0)
```

### Phase 2: Frontend Site Kit (Q1 2025)

Move portal features to cmp-frontend:

```
cmp-frontend/src/site-agent/
├── components/
│   ├── AgentList.tsx
│   ├── AgentConfig.tsx
│   ├── AgentWidgets.tsx
│   └── AgentApiKeys.tsx
├── services/
│   └── agentApi.ts
└── routes.ts
```

Routes:
- /organization/:uuid/agents/
- /organization/:uuid/agents/:id/configure/
- /organization/:uuid/agents/:id/widgets/
- /organization/:uuid/agents/:id/keys/

### Phase 3: Data Migration (Q1 2025)

1. Export Agent Registry data
2. Map to Site Agent models
3. Run migration script
4. Verify data integrity

### Phase 4: Deprecation (Q2 2025)

1. Disable new registrations in Agent Registry
2. Enable redirect from old to new endpoints
3. Monitor for usage
4. Archive repositories

---

## API Compatibility

### Redirect Strategy

Old endpoints return 301 redirects to new locations:

```nginx
# Agent Registry -> Site Agent
location /api/v1/agents/ {
    return 301 /api/site-agent-identities/;
}

location /webhooks/waldur/ {
    return 410; # Gone - webhooks no longer needed
}
```

### SDK Updates

Update client SDKs to use new endpoints:

```python
# Old
client = AgentRegistryClient("https://api.digitlify.com")

# New  
client = WaldurClient("https://app.digitlify.com")
client.site_agent.identities.list()
```

---

## Benefits

1. **Simplified Architecture**: One backend service instead of two
2. **Unified Authentication**: Single token for all Waldur/Agent operations
3. **Native Events**: No webhook translation layer
4. **Consistent Permissions**: Waldur RBAC for all resources
5. **Reduced Ops Burden**: One deployment, one database

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Data loss during migration | Full backup before migration, dry-run testing |
| API breaking changes | 6-month deprecation period with redirects |
| Missing features | Feature parity checklist before deprecation |
| Performance regression | Load testing on Site Agent endpoints |

---

## Success Criteria

- [ ] All Agent Registry features available in Site Agent
- [ ] Data migration verified with 100% integrity
- [ ] Zero customer-reported blocking issues
- [ ] All client SDKs updated
- [ ] Documentation complete
- [ ] Old repositories archived

---

*Document maintained by GSV Platform Team*
