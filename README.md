# CMP Platform

Digitlify Cloud Marketplace Platform - Monorepo

## Overview

This is the production deployment repository for Digitlify, the first tenant of the GSV Cloud Marketplace Platform.

## Repository Strategy

| Org | Repo Pattern | Purpose |
|-----|--------------|---------|
| GSVDEV | `gsv-*` | Development/Platform - all source code |
| Digitlify-Inc | `cmp-*` | First tenant - production deployment |
| Future Tenants | `{tenant}-*` | Tenant-specific deployments |

## Structure

```
cmp-platform/
├── services/              # Microservices
│   ├── marketplace/       # Next.js 16 storefront
│   ├── control-plane/     # Django API (orgs/instances/billing)
│   ├── gateway/           # FastAPI (auth/credits/routing)
│   ├── provisioner/       # FastAPI (Saleor webhooks)
│   ├── runner/            # FastAPI (Langflow adapter)
│   └── connector/         # FastAPI (MCP/Vault gateway)
├── docs/                  # Documentation
│   ├── cmp/               # Platform architecture docs
│   └── digitlify-qa-prod/ # QA/Prod promotion docs
├── apps/                  # App templates
├── agents/                # Agent templates
├── apis/                  # API templates
└── components/            # Shared UI components
```

## Related Repositories

| Repo | Purpose |
|------|---------|
| `cmp-gitops` | ArgoCD manifests for QA/Prod |
| `cmp-cms` | CMS content (future) |
| `cmp-sso-theme` | Keycloak theme (to be renamed from sso-theme) |

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Build all services
pnpm build

# Run tests
pnpm test
```

## Documentation

- [Platform Architecture](docs/cmp/02-Architecture.md)
- [Buyer Journey](docs/cmp/03-Buyer-Journey.md)
- [QA/Prod Promotion](docs/digitlify-qa-prod/README.md)

## Version

Current: v0.0.1 (Initial release for Digitlify tenant)
