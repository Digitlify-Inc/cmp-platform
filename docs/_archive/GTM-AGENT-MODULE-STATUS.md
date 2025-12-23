# Agent Marketplace Module - Implementation Status

**Date:** December 16, 2025
**Status:** ALL DONE (100%)

This document details the complete implementation of the Agent Marketplace frontend module for the GTM buyer journey.

---

## Module Location

`cmp-frontend/src/marketplace/agents/`

---

## Core Files

| File | Status | Description |
|------|--------|-------------|
| `constants.ts` | DONE | Plugin type (`Marketplace.SiteAgent`), category configs, runtime types (shared/dedicated), credit costs, demo mode settings |
| `types.ts` | DONE | TypeScript interfaces: `OfferingCapabilities`, `AgentPluginOptions`, `CustomerAgentConfig`, `AgentApiKey`, `AgentUsageStats`, `TrainingDocument`, `WidgetEmbedConfig`, `ChatMessage`, `AgentSession` |
| `utils.ts` | DONE | Helper functions: `isAgentOffering()`, `getCategoryType()`, `getCapabilities()`, `hasCapability()`, `formatCredits()`, etc. |
| `api.ts` | DONE | Complete API functions for configs, keys, usage, widget, training docs, gateway, credits |
| `useOfferingSubscription.ts` | DONE | React hook to check subscription status with 30s caching |
| `index.ts` | DONE | Module exports for all components, types, and API functions |

---

## UI Components

| File | Status | Description |
|------|--------|-------------|
| `CategoryPill.tsx` | DONE | Badge component showing category (Agents/Apps/Assistants/Automations) with icons |
| `AgentCardInfo.tsx` | DONE | Card info component displaying credits per message/run and feature icons |
| `RunAgentButton.tsx` | DONE | Smart button that shows "Run" or "Subscribe" based on subscription state |
| `SubscribeAgentDialog.tsx` | DONE | One-click subscription dialog with project selection, credit balance display, auto-approval flow |
| `RunAgentDialog.tsx` | DONE | Full chat interface with demo mode (5 free messages), real-time credit balance, message history |
| `RunAgentDialog.scss` | DONE | Chat UI styling with role-based message styling |

---

## Dashboard Components

| File | Status | Description |
|------|--------|-------------|
| `AgentDashboard.tsx` | DONE | Unified tabbed interface with capability-driven tab visibility |
| `AgentDetailPage.tsx` | DONE | Wrapper component for routing/layout |

---

## Dashboard Tabs

**Location:** `src/marketplace/agents/tabs/`

| File | Status | Description |
|------|--------|-------------|
| `AgentConfigureTab.tsx` | DONE | Persona prompt, welcome message, branding, conversation settings |
| `AgentKnowledgeTab.tsx` | DONE | RAG training document upload, processing status, delete |
| `AgentApiKeysTab.tsx` | DONE | API key creation, listing, prefix display, revocation |
| `AgentWidgetTab.tsx` | DONE | Widget embed code, preview iframe, allowed domains config |
| `AgentUsageTab.tsx` | DONE | Usage statistics, metrics cards, breakdown table, export |
| `index.ts` | DONE | Tab exports |

---

## API Functions (`api.ts`)

### Customer Agent Configurations
- `getCustomerAgentConfigs()` - List all configs
- `getCustomerAgentConfig(uuid)` - Get single config
- `updateCustomerAgentConfig(uuid, data)` - Update config

### API Keys
- `getAgentApiKeys(configUuid)` - List keys for config
- `createAgentApiKey(configUuid, data)` - Create new key
- `revokeAgentApiKey(keyUuid)` - Revoke key

### Usage & Widget
- `getAgentUsage(configUuid, params)` - Get usage stats
- `getWidgetEmbed(configUuid)` - Get widget embed config

### Training Documents (RAG)
- `getTrainingDocuments(configUuid)` - List documents
- `uploadTrainingDocument(configUuid, file, name)` - Upload document
- `deleteTrainingDocument(docUuid)` - Delete document

### Agent Gateway
- `invokeAgent(apiKey, data)` - Invoke via API key
- `demoInvokeAgent(offeringUuid, data)` - Demo invoke (session auth)
- `validateApiKey(apiKey)` - Validate key and get context

### Subscription & Credits
- `checkOfferingSubscription(offeringUuid, projectUuid)` - Check subscription
- `getCustomerCredits(customerUuid)` - Get customer balance
- `getProjectCredits(projectUuid)` - Get project balance

---

## Customer Routes

**Location:** `src/customer/routes.ts`

| Route | Path | Component |
|-------|------|-----------|
| `organization-agents` | `/organizations/:uuid/agents/` | Agent list |
| `organization-agent-configure` | `/organizations/:uuid/agents/:configUuid/configure/` | Configure tab |
| `organization-agent-keys` | `/organizations/:uuid/agents/:configUuid/keys/` | API keys tab |
| `organization-agent-widgets` | `/organizations/:uuid/agents/:configUuid/widgets/` | Widget tab |

---

## Key Features

### Capability-Driven UI
Each offering declares capabilities in `plugin_options.capabilities`:
- `chat` - Enables chat/run functionality
- `rag` - Enables Knowledge tab for training documents
- `api` - Enables API Keys tab
- `widget` - Enables Widget embed tab
- `demo` - Enables demo mode before subscription
- `training` - Enables model training features

### Categories
| Category | Default Capabilities | Icon |
|----------|---------------------|------|
| Agents | chat, rag, api, widget, demo | Robot |
| Apps | api, widget | AppWindow |
| Assistants | chat, rag, demo | ChatCircle |
| Automations | api | Gear |

### Runtime Types
- **Shared**: Logical isolation via tenant context headers
- **Dedicated**: Physical namespace isolation in Kubernetes

### Credit System
- $1 = 100 credits
- Configurable cost per message (default: 1 credit)
- Configurable cost per run (default: 10 credits)
- Real-time balance display in UI

### Demo Mode
- 5 free messages before requiring subscription
- Session-based tracking
- Prompts subscription after limit reached

### Auto-Approval
- Orders auto-approved without provider review
- Instant access upon subscription
- One-click subscribe flow

---

## Integration Points

### Backend APIs Required
- `POST /marketplace-orders/` - Create subscription order
- `GET /marketplace-resources/` - Check subscription status
- `GET/PATCH /customer-agent-configs/` - Config management
- `POST /customer-agent-configs/{uuid}/api_keys/` - Key management
- `POST /agent-gateway/invoke/` - Agent invocation
- `POST /agent-gateway/demo/{uuid}/` - Demo invocation
- `GET /customers/{uuid}/credits/` - Credit balance

### Waldur Integration
- Uses existing marketplace order flow
- Integrates with customer/project selectors
- Respects organization permissions

---

*Last Updated: December 16, 2025*
