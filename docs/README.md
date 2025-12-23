# GSV Platform Documentation

## Overview

GSV Platform is a **Software Factory** implementing the **Platform of Platforms** pattern. It provides a complete value chain from **Concept → Code → Cash** for AI agents, applications, and automations.

## Documentation Structure

```
docs/
├── cmp/                         # Cloud Marketplace Platform - AUTHORITATIVE
│   ├── HANDOVER.md              # Start here for implementation
│   ├── PHASE1-HANDOVER.md       # Phase 1: Infrastructure & GitOps
│   ├── PHASE2-HANDOVER.md       # Phase 2: Control Plane & Runtime
│   ├── PHASE3-HANDOVER.md       # Phase 3: Marketplace UI
│   ├── PHASE4-HANDOVER.md       # Phase 4: GTM Readiness (current)
│   ├── 01-23 *.md               # Full documentation pack
│   ├── *.openapi.yaml           # API specifications
│   └── *.postman_collection.json # Testing assets
│
├── website-content/             # CMS Website Copy & Structure
│   ├── 00-Site-Structure.md     # Navigation and sitemap
│   ├── 01-Homepage.md           # Homepage content
│   ├── 02-Marketplace.md        # Marketplace page
│   ├── 03-Pricing.md            # Pricing tiers
│   ├── 04-Solutions-Index.md    # Solutions landing
│   ├── 05-Outcome-*.md          # Outcome-based solutions
│   ├── 06-Capabilities-*.md     # Capability pages
│   └── ...                      # Blog, FAQ, Legal pages
│
├── wagtail-model-spec/          # Wagtail CMS Page Models
│   ├── 24-Wagtail-Page-Model-Spec-v1.md
│   ├── wagtail_models_skeleton.py
│   ├── wagtail_blocks_skeleton.py
│   └── taxonomies.*.json        # Category/Role/Outcome taxonomies
│
├── wagtail-saleor-sync-spec/    # Wagtail → Saleor Sync
│   ├── 25-Wagtail-to-Saleor-Sync-Command-Spec-v1.md
│   ├── code/cms/management/commands/sync_wagtail_to_saleor.py
│   ├── config/sync_mapping.v1.json
│   └── saleor/graphql_templates.graphql
│
├── ROLES.md                     # Platform roles registry (single source of truth)
│
└── _archive/                    # Deprecated documentation
    ├── operations/              # Moved from top-level
    ├── architecture/            # Moved from top-level
    └── ...                      # Legacy docs
```

## Quick Start

### For Implementation
| Document | Description |
|----------|-------------|
| [cmp/PHASE4-HANDOVER.md](cmp/PHASE4-HANDOVER.md) | **Current** - GTM readiness checklist |
| [cmp/HANDOVER.md](cmp/HANDOVER.md) | Complete implementation guide |
| [cmp/16-E2E-Visual-Architecture.md](cmp/16-E2E-Visual-Architecture.md) | Integration diagrams |
| [ROLES.md](ROLES.md) | Platform roles and naming conventions |

### For CMS/Website
| Document | Description |
|----------|-------------|
| [website-content/](website-content/) | All website copy and structure |
| [wagtail-model-spec/](wagtail-model-spec/) | Wagtail page models |
| [wagtail-saleor-sync-spec/](wagtail-saleor-sync-spec/) | CMS to commerce sync |

### API Specifications
| File | Description |
|------|-------------|
| [cmp/control-plane.openapi.yaml](cmp/control-plane.openapi.yaml) | Control Plane API |
| [cmp/gateway.openapi.yaml](cmp/gateway.openapi.yaml) | Gateway API |
| [cmp/capability-registry.yaml](cmp/capability-registry.yaml) | 16 capability definitions |

## GTM Status Summary

### DONE
- [x] Infrastructure (k8s, GitOps, secrets)
- [x] Control Plane (Django/DRF)
- [x] Runtime (Gateway + Langflow)
- [x] Marketplace (Next.js + Saleor)
- [x] Website templates (Wagtail/Django)
- [x] Documentation pack

### DONE (December 2024)
- [x] Saleor attributes created (9 attributes)
- [x] Saleor collections created (Agents, Apps, Assistants, Automations)
- [x] Saleor products created (9 products)
- [x] CMS taxonomies seeded (categories, roles, outcomes, capabilities, integrations)
- [x] CMS pages populated (20+ pages)
- [x] CMS migrations applied
- [x] Storefront renamed to marketplace

### IN PROGRESS
- [ ] Marketplace ↔ Website visual consistency
- [ ] E2E journey testing (buyer + seller)

### REMAINING FOR GTM
- [ ] Working checkout flow (Stripe test mode)
- [ ] Authentication (Keycloak SSO)
- [ ] E2E: Browse → Subscribe → Deploy → Chat
- [ ] DNS/SSL for production domains

## Repository Map

### Platform Development (GSVDEV)
- `gsv-platform` - Monorepo: services, templates, docs
- `gsv-gitops` - GitOps for dev/test

### Tenant Implementation (Digitlify-Inc)
- `cmp-website` - Marketing/CMS site (Wagtail)

### Commerce Stack (Saleor)
- `cmp-commerce-api` - Saleor GraphQL API (catalog, checkout)
- `cmp-commerce-dashboard` - Saleor Dashboard (product management)

## Live Environments

| Service | URL |
|---------|-----|
| Website (CMS) | https://dev.gsv.dev |
| Marketplace | https://marketplace.dev.gsv.dev |
| Control Plane | https://api.dev.gsv.dev |
| Saleor Dashboard | https://dashboard.dev.gsv.dev |
| Keycloak (SSO) | https://keycloak.dev.gsv.dev |
| ArgoCD | https://argocd.dev.gsv.dev |
| Backstage (IDP) | https://backstage.dev.gsv.dev |

---

*Last updated: December 20, 2024*
