# Storefront Information Architecture (IA) + Sitemap v1
_Last updated: 2025-12-18

This document defines the storefront structure so implementation is deterministic.

## 1) Principles
- Buyers discover by **Outcome** and **Role** first; category is secondary.
- Capabilities act as “filters” and “compatibility constraints”.
- Credits are visible everywhere post-login.

## 2) Primary navigation (header)
1. Marketplace
2. Solutions
3. Pricing
4. Blog
5. Docs

Right-side:
- (logged out) Log in, Get Started Free
- (logged in) Credits badge + Top up, Profile menu

## 3) Marketplace IA (browse modes)
Within `/marketplace`, provide a segmented browse mode:
- **All** (default)
- **Agents**
- **Apps**
- **Assistants**
- **Automations**

And a “Browse by” switch:
- Category (default)
- Role
- Outcome (Value Stream)
- Capability

### 3.1 Browse by Role (Solutions)
Roles (v1 suggested):
- Customer Support
- Sales / SDR
- Marketing
- HR
- IT / Helpdesk
- Operations
- Finance

Each role page is a curated landing page:
- “Top outcomes” for this role
- Featured offerings
- Recommended bundles

Routes:
- `/solutions`
- `/solutions/customer-support`
- `/solutions/sales`
- ...

### 3.2 Browse by Outcome (Value Streams)
Value streams (8 GTM):
- `customer_support`
- `sales_outreach`
- `hr_ops`
- `marketing_content`
- `knowledge_assistant`
- `meeting_scheduler`
- `data_extraction`
- `monitoring_alerting`

Routes:
- `/outcomes/customer_support`
- ...

### 3.3 Browse by Capability
Capability landing pages explain what the capability is and show offerings that include it.

Routes:
- `/capabilities/rag.knowledge_base`
- `/capabilities/web_widget.branding`
- `/capabilities/integrations.mcp_tools`
- ...

## 4) Global search and filters
### Search (global)
- Search matches: offering name, short description, value stream tags, capability tags.
- Search results are always filterable.

### Filter rail (consistent everywhere)
- Category
- Role
- Outcome (value stream)
- Capabilities (multi-select chips)
- Integrations (connectors/tools)
- Languages (multi)
- Modalities (text/image/audio; multi)
- Deployment mode (shared/dedicated namespace/vcluster/cluster)
- Trust signals (Verified/Featured/New/Trending)
- Trial available
- Pricing band (optional v2)

## 5) Sitemap (v1)

```
/
├─ /marketplace
│  ├─ /marketplace/agents
│  ├─ /marketplace/apps
│  ├─ /marketplace/assistants
│  ├─ /marketplace/automations
│  └─ /marketplace/{category}/{slug}
├─ /solutions
│  └─ /solutions/{role}
├─ /outcomes/{valueStream}
├─ /capabilities/{capKey}
├─ /pricing
│  ├─ #plans
│  ├─ #topups
│  └─ #gift-cards
├─ /blog
├─ /docs
├─ /login
├─ /redeem
└─ /account
   ├─ /account/billing
   ├─ /account/instances
   └─ /account/instances/{instanceId}
      ├─ /account/instances/{instanceId}#config
      ├─ /account/instances/{instanceId}#usage
      └─ /account/instances/{instanceId}#logs

Runtime surfaces:
/run/{instanceId}
/widget/preview/{instanceId}
```

## 6) Content ownership
- **Wagtail**: marketing pages, role pages, outcome pages, capability explainers, FAQs.
- **Saleor**: product listing + pricing + checkout.
- **Control Plane**: wallet/ledger + entitlements + provisioning state + config.

## 7) Deterministic rails (home page)
Home page sections (matches your mockups):
1) Hero + CTA (Explore Marketplace)
2) Stats (agents count / API calls / uptime) — can be static initially
3) Browse by category (4 tiles)
4) How it works (3 steps: Browse → Sign up → Try/Deploy)
5) Why Digitlify (6 cards)
6) Testimonials
7) Pricing teaser
8) Final CTA
