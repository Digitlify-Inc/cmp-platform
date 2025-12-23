# Customer Console PRD (MVP)

## Problem
After a buyer subscribes to an agent/app/assistant/automation, they need a **control plane UI** to configure it:
- connect data sources (RAG),
- set branding,
- generate widget/embed + API/MCP keys,
- connect to CRM and other systems,
- view usage, limits, and billing.

Today, the marketplace has placeholders for key tabs.

## Users
- Buyer Admin (tenant admin)
- Buyer Operator (tenant user)
- Seller (creator)
- Platform Operator (Digitlify ops)

## MVP Scope (must for GTM)
A buyer can:
1) See purchased **Instances**
2) Open an Instance and:
   - create/revoke API keys
   - obtain a widget embed snippet
   - configure basic branding (name/logo/colors)
   - attach at least one knowledge source (URL crawl or file upload) OR clearly see that this is not yet available with a “coming soon” banner and roadmap
   - run a test chat and see usage deducted

## Non-goals (post-GTM)
- full CRM bidirectional sync
- complex team role management UI (but keep RBAC in API)
- advanced analytics

## Key Screens
1) **My Instances** (list)
2) **Instance Overview**
3) **Channels**
   - Widget (script snippet + allowed origins)
   - API (keys)
   - MCP (future)
4) **Branding**
5) **Data & Training**
6) **Connectors**
7) **Usage & Billing**

## Required Backend Capabilities
- CP new models:
  - `InstanceConfig` (branding, channel settings)
  - `KnowledgeBase` + `DataSource` + `IngestionJob`
  - `WidgetToken` (scoped, rotatable)
- Gateway:
  - API key auth and widget session that doesn’t require Keycloak.
- Runner:
  - resolve instance → flow mapping deterministically (no guess).

## Acceptance criteria
- Golden-path E2E includes:
  - configure branding + key
  - run and bill
  - embed snippet renders (even if basic)

