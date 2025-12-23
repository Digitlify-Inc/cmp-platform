# GSV Platform - Site Kit Architecture

**Date:** December 12, 2024
**Status:** Design Complete
**Author:** AI Architecture Analysis

## Executive Summary

This document defines the architecture for extending Waldur CMP with "Site Kits" - modular UI extensions that add Seller (Service Provider) and Buyer (Customer) features directly within Waldur, eliminating the need for the separate cmp-portal application.

## 1. Problem Statement

### Current State Issues

1. **Duplicate Architecture**: cmp-portal provides minimal unique value - most features redirect to Waldur CMP
2. **Organization Creation Gap**: Users can self-register via Keycloak but cannot create organizations without admin intervention
3. **Missing Seller Features**: No way for sellers to upload/manage agents, apps, MCPs lifecycle within Waldur
4. **Missing Buyer Features**: No way for buyers to configure purchased agents, widgets, API keys within Waldur
5. **Maintenance Overhead**: Two separate frontends (cmp-portal + cmp-frontend) to maintain

### Discovery: Organization Creation Already Exists

**Key Finding:** Waldur already has a comprehensive organization creation flow at `/organizations/create/` with:
- Step 1: Verification (identity confirmation)
- Step 2: Company details
- Step 3: Validation results (auto or manual)
- Step 4: Intent (purpose and finalization)

**However**, this feature is gated by feature flag: `MarketplaceFeatures.show_experimental_ui_components`

**Solution**: Enable this feature flag in Waldur configuration to allow self-service organization creation.

## 2. Architecture Overview

### Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     UNIFIED WALDUR CMP (cmp-frontend)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         CORE WALDUR FEATURES                            ││
│  │  Marketplace | Orders | Organizations | Projects | Teams | Billing      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────┐    ┌─────────────────────────────────────────┐│
│  │    SELLER SITE KIT      │    │           BUYER SITE KIT                 ││
│  │  (Service Provider)     │    │           (Customer)                     ││
│  │                         │    │                                          ││
│  │  • Agent/App Upload     │    │  • Agent Configuration                   ││
│  │  • Version Management   │    │  • Widget Management                     ││
│  │  • Lifecycle Control    │    │  • API Key Management                    ││
│  │  • LangFlow Studio      │    │  • MCP Key Management                    ││
│  │  • Training Documents   │    │  • Training Document Upload              ││
│  │  • Pricing Management   │    │  • Chat Window Config                    ││
│  └─────────────────────────┘    └─────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                       AGENT REGISTRY API                                ││
│  │  (Backend services for agent/app management)                            ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Waldur as the Hub**: All user interactions happen within Waldur CMP
2. **Agent Registry as Backend**: All agent/app APIs served by Agent Registry
3. **No Separate Portal**: cmp-portal is deprecated and sunset
4. **Feature Flags**: New features gated by Waldur feature flags
5. **Webhook Integration**: Waldur webhooks trigger Agent Registry actions

## 3. Seller Site Kit

### Purpose
Enable Service Providers (Sellers) to manage their AI agent offerings within Waldur.

### Features

| Feature | Description | Implementation |
|---------|-------------|----------------|
| Agent Upload | Upload new agent definitions | New route under `/providers/:uuid/agents/` |
| Version Management | Create/manage agent versions | Version list + create dialog |
| Lifecycle Control | Draft → Active → Deprecated | State machine in Agent Registry |
| LangFlow Integration | Open LangFlow Studio for visual editing | iFrame or redirect to LangFlow |
| Training Documents | Upload/manage training docs per agent | File upload component |
| Pricing Management | Set pricing tiers and plans | Waldur plan management extended |
| Analytics Dashboard | Usage metrics per agent | Charts + data from Agent Registry |

### Route Structure

```typescript
// New routes to add to cmp-frontend/src/marketplace/routes.ts
{
  name: 'provider-agents',
  parent: 'marketplace-provider',
  url: 'agents/',
  component: ProviderAgentsList,
  data: {
    breadcrumb: 'Agents',
    priority: 125,
  },
},
{
  name: 'provider-agent-details',
  parent: 'marketplace-provider',
  url: 'agents/:agent_uuid/',
  component: AgentDetailsContainer,
},
{
  name: 'provider-agent-versions',
  parent: 'marketplace-provider',
  url: 'agents/:agent_uuid/versions/',
  component: AgentVersionsList,
},
{
  name: 'provider-agent-training',
  parent: 'marketplace-provider',
  url: 'agents/:agent_uuid/training/',
  component: AgentTrainingDocuments,
},
```

### API Integration

```typescript
// Agent Registry API client for Seller features
const agentRegistryApi = {
  // Agent CRUD
  listAgents: (providerId: string) =>
    axios.get(`/api/providers/${providerId}/agents/`),
  createAgent: (providerId: string, data: AgentCreateData) =>
    axios.post(`/api/providers/${providerId}/agents/`, data),
  updateAgent: (agentId: string, data: AgentUpdateData) =>
    axios.patch(`/api/agents/${agentId}/`, data),
  deleteAgent: (agentId: string) =>
    axios.delete(`/api/agents/${agentId}/`),

  // Version management
  listVersions: (agentId: string) =>
    axios.get(`/api/agents/${agentId}/versions/`),
  createVersion: (agentId: string, data: VersionData) =>
    axios.post(`/api/agents/${agentId}/versions/`, data),
  publishVersion: (versionId: string) =>
    axios.post(`/api/versions/${versionId}/publish/`),

  // Training documents
  uploadTrainingDoc: (agentId: string, file: File) =>
    axios.post(`/api/agents/${agentId}/training/`, formData),
};
```

## 4. Buyer Site Kit

### Purpose
Enable Customers (Buyers) to configure and manage their purchased AI agents within Waldur.

### Features

| Feature | Description | Implementation |
|---------|-------------|----------------|
| Agent Configuration | Configure agent persona, behavior | Form with Agent Registry API |
| Widget Management | Get embed codes, customize widgets | Widget config component |
| API Key Management | Create/rotate API keys | API key list + actions |
| MCP Key Management | Manage MCP server connections | MCP config component |
| Training Upload | Upload custom training documents | File upload per agent |
| Chat Window Config | Customize standalone chat UI | Theme + behavior settings |
| Usage Dashboard | View usage metrics and costs | Charts + Waldur billing data |

### Route Structure

```typescript
// New routes under organization (customer) context
{
  name: 'organization-agents',
  parent: 'organization',
  url: 'agents/',
  component: CustomerAgentsList,
  data: {
    breadcrumb: 'My Agents',
    priority: 115,
  },
},
{
  name: 'organization-agent-config',
  parent: 'organization',
  url: 'agents/:access_uuid/configure/',
  component: AgentConfigurationPage,
},
{
  name: 'organization-agent-widgets',
  parent: 'organization',
  url: 'agents/:access_uuid/widgets/',
  component: AgentWidgetsPage,
},
{
  name: 'organization-agent-keys',
  parent: 'organization',
  url: 'agents/:access_uuid/keys/',
  component: AgentKeysPage,
},
```

### API Integration

```typescript
// Agent Registry API client for Buyer features
const buyerAgentApi = {
  // Access/Subscriptions
  listAccess: (customerId: string) =>
    axios.get(`/api/customers/${customerId}/agent-access/`),
  getAccess: (accessId: string) =>
    axios.get(`/api/agent-access/${accessId}/`),

  // Configuration
  getConfiguration: (accessId: string) =>
    axios.get(`/api/agent-access/${accessId}/configuration/`),
  updateConfiguration: (accessId: string, config: AgentConfig) =>
    axios.put(`/api/agent-access/${accessId}/configuration/`, config),

  // API Keys
  listApiKeys: (accessId: string) =>
    axios.get(`/api/agent-access/${accessId}/api-keys/`),
  createApiKey: (accessId: string, name: string) =>
    axios.post(`/api/agent-access/${accessId}/api-keys/`, { name }),
  revokeApiKey: (keyId: string) =>
    axios.delete(`/api/api-keys/${keyId}/`),

  // Widgets
  getWidgetConfig: (accessId: string) =>
    axios.get(`/api/agent-access/${accessId}/widget/`),
  updateWidgetConfig: (accessId: string, config: WidgetConfig) =>
    axios.put(`/api/agent-access/${accessId}/widget/`, config),
  getEmbedCode: (accessId: string) =>
    axios.get(`/api/agent-access/${accessId}/embed-code/`),

  // Training
  uploadTraining: (accessId: string, file: File) =>
    axios.post(`/api/agent-access/${accessId}/training/`, formData),
};
```

## 5. Organization Creation Solution

### Current Gap
Users authenticate via Keycloak but cannot create organizations (customers) in Waldur.

### Solution: Enable Existing Feature

The organization creation flow already exists in Waldur at:
- Route: `/organizations/create/`
- Component: `OrganizationCreatePage`
- Feature Flag: `MarketplaceFeatures.show_experimental_ui_components`

**Action Required:**
1. Enable the feature flag in Waldur backend configuration
2. Configure the onboarding checklist for your use case
3. Optionally customize the verification flow

### Configuration Steps

```yaml
# In cmp-backend (Waldur) configuration
features:
  marketplace:
    show_experimental_ui_components: true

# Optional: Configure auto-approval for organizations
WALDUR_CORE:
  ORGANIZATION_ONBOARDING_AUTO_APPROVE: true  # Skip admin review

# Optional: Configure country-specific checklists
WALDUR_ONBOARDING:
  DEFAULT_CHECKLIST_UUID: "<uuid>"
```

### Flow After Enabling

1. User logs in via Keycloak
2. User clicks "Create Organization" button (visible on dashboard)
3. Multi-step wizard:
   - Verification (auto or manual)
   - Company details
   - Validation (if auto)
   - Intent/purpose
4. Organization created (immediate or pending review)
5. User becomes organization owner
6. User can now create projects and order resources

## 6. Integration Points

### Waldur Webhooks → Agent Registry

```
┌─────────────┐    Webhook     ┌────────────────┐
│   Waldur    │ ─────────────► │ Agent Registry │
│    CMP      │                │     API        │
└─────────────┘                └────────────────┘
     │                               │
     │ Events:                       │ Actions:
     │ • marketplace_order_created   │ • Create AgentAccess
     │ • customer_creation_succeeded │ • Create AgentTenant
     │ • project_creation_succeeded  │ • Create AgentProject
     │ • resource_terminated         │ • Revoke Access
     └───────────────────────────────┘
```

### Agent Registry API → Waldur API

```typescript
// Agent Registry calls Waldur API for:
// 1. Publishing offerings to marketplace
await waldurClient.createOffering({
  name: agent.name,
  category: 'ai-agents',
  type: 'Marketplace.Basic',
  attributes: { agent_uuid: agent.uuid },
});

// 2. Reporting usage for billing
await waldurClient.createComponentUsage({
  resource: resourceUrl,
  component_type: 'messages',
  amount: usageCount,
});
```

## 7. cmp-portal Deprecation Plan

### Timeline

| Phase | Duration | Activities |
|-------|----------|------------|
| Phase 1 | Week 1 | Enable org creation in Waldur, implement basic Site Kit routes |
| Phase 2 | Week 2-3 | Complete Seller Site Kit features |
| Phase 3 | Week 3-4 | Complete Buyer Site Kit features |
| Phase 4 | Week 5 | Migration testing, redirect old URLs |
| Phase 5 | Week 6 | Deprecation notice, sunset cmp-portal |

### Migration Steps

1. **Enable Waldur Features**
   - Enable `show_experimental_ui_components` feature flag
   - Configure organization onboarding
   - Test organization creation flow

2. **Implement Site Kit Routes**
   - Add new routes to cmp-frontend
   - Create new components
   - Integrate with Agent Registry API

3. **Data Migration**
   - No data migration needed (Agent Registry is already backend)
   - Session migration handled by Keycloak (shared SSO)

4. **URL Redirects**
   - Configure Nginx/ingress to redirect portal URLs to Waldur
   - `/dashboard` → `/organizations/`
   - `/agents/:id` → `/organizations/:uuid/agents/:id/configure/`
   - `/marketplace` → `/marketplace/`

5. **Decommission**
   - Remove portal deployment from GitOps
   - Archive cmp-portal repository
   - Update documentation

### Redirect Mapping

| Old Portal URL | New Waldur URL |
|----------------|----------------|
| `portal.*.com/` | `app.*.com/profile/` |
| `portal.*.com/dashboard` | `app.*.com/organizations/` |
| `portal.*.com/agents` | `app.*.com/organizations/:uuid/agents/` |
| `portal.*.com/marketplace` | `app.*.com/marketplace/` |
| `portal.*.com/billing` | `app.*.com/organizations/:uuid/payment-profiles/` |

## 8. Implementation Plan

### Prerequisites

- [ ] Enable `show_experimental_ui_components` in Waldur config
- [ ] Configure organization onboarding checklist
- [ ] Verify Agent Registry API endpoints exist

### Phase 1: Foundation (Week 1)

**Waldur Configuration:**
- [ ] Enable organization creation feature flag
- [ ] Test self-service organization creation
- [ ] Configure auto-approval (if desired)

**Route Structure:**
- [ ] Add `/providers/:uuid/agents/` route (Seller)
- [ ] Add `/organizations/:uuid/agents/` route (Buyer)
- [ ] Create placeholder components

### Phase 2: Seller Site Kit (Week 2-3)

**Components:**
- [ ] ProviderAgentsList - List seller's agents
- [ ] AgentCreateDialog - Upload new agent
- [ ] AgentDetailsContainer - View/edit agent
- [ ] AgentVersionsList - Manage versions
- [ ] AgentTrainingDocuments - Upload training files
- [ ] AgentAnalytics - Usage dashboard

**API Integration:**
- [ ] Create Agent Registry API client for seller features
- [ ] Implement CRUD operations
- [ ] Add version management
- [ ] Add training document upload

### Phase 3: Buyer Site Kit (Week 3-4)

**Components:**
- [ ] CustomerAgentsList - List purchased agents
- [ ] AgentConfigurationPage - Configure agent behavior
- [ ] AgentWidgetsPage - Widget embed codes
- [ ] AgentKeysPage - API/MCP key management
- [ ] AgentChatConfig - Chat window customization

**API Integration:**
- [ ] Create Agent Registry API client for buyer features
- [ ] Implement configuration save/load
- [ ] Add API key management
- [ ] Add widget configuration

### Phase 4: Migration (Week 5)

**Testing:**
- [ ] E2E test organization creation
- [ ] E2E test seller workflow
- [ ] E2E test buyer workflow
- [ ] Performance testing

**Redirects:**
- [ ] Configure ingress redirects
- [ ] Update DNS if needed
- [ ] Test redirect flows

### Phase 5: Deprecation (Week 6)

**Communication:**
- [ ] Announce deprecation to users
- [ ] Update documentation
- [ ] Provide migration guide

**Decommission:**
- [ ] Remove portal from GitOps
- [ ] Archive repository
- [ ] Remove DNS entries

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Feature flag not available | Low | High | Verify Waldur version supports flag |
| Agent Registry API gaps | Medium | Medium | Audit and implement missing endpoints |
| User confusion during transition | Medium | Low | Clear communication, gradual rollout |
| Performance issues | Low | Medium | Load testing before cutover |
| SSO session issues | Low | High | Test with same Keycloak realm |

## 10. Success Criteria

1. **Organization Creation**: Users can self-register and create organizations
2. **Seller Features**: Service providers can upload and manage agents within Waldur
3. **Buyer Features**: Customers can configure purchased agents within Waldur
4. **No Portal Dependencies**: All cmp-portal features available in Waldur
5. **Zero Downtime**: Migration completed without service interruption
6. **User Satisfaction**: No increase in support tickets

## Appendix A: File Locations

### Waldur Frontend (cmp-frontend)

```
src/
├── marketplace/
│   ├── routes.ts                    # Add seller routes here
│   └── service-providers/
│       └── agents/                  # NEW: Seller Site Kit components
│           ├── ProviderAgentsList.tsx
│           ├── AgentCreateDialog.tsx
│           ├── AgentDetailsContainer.tsx
│           └── ...
├── customer/
│   ├── routes.ts                    # Add buyer routes here
│   └── agents/                      # NEW: Buyer Site Kit components
│       ├── CustomerAgentsList.tsx
│       ├── AgentConfigurationPage.tsx
│       ├── AgentWidgetsPage.tsx
│       └── ...
└── api/
    └── agent-registry.ts            # NEW: Agent Registry API client
```

### Agent Registry (cmp-agentregistry)

```
agent_registry/
├── access/                          # AgentAccess models
├── agents/                          # Agent models
├── api/                             # API views (extend for Site Kit)
├── waldur/                          # Waldur integration
│   └── client.py                    # Waldur API client
└── webhooks/                        # Webhook handlers
    └── views.py                     # Webhook views
```

## Appendix B: References

- Waldur Frontend: `C:\workspace\repo\github.com\Digitlify-Inc\cmp-frontend`
- Agent Registry: `C:\workspace\repo\github.com\Digitlify-Inc\cmp-agentregistry`
- Portal (to deprecate): `C:\workspace\repo\github.com\Digitlify-Inc\cmp-portal`
- GitOps: `C:\workspace\repo\github.com\GSVDEV\gsv-gitops`
- Platform Docs: `C:\workspace\docs\gsv-platform`
