# GSV Platform Repository Structure

This document defines the official repository structure for the GSV Platform and tenant organizations.

## Overview

- **GSVDEV** = Development/Platform Organization (latest GA code)
- **Tenant Orgs** (e.g., Digitlify-Inc) = Branded tenant implementations (copy + customize)
- **Digitlify-Inc** = First tenant / reference implementation

## Naming Conventions

| Prefix | Meaning | Example |
|--------|---------|---------|
| `gsv-*` | Platform/development repos (GSVDEV) | `gsv-gitops`, `gsv-agentregistry` |
| `cmp-*` | Cloud Marketplace Platform reference implementation (Digitlify) | `cmp-frontend`, `cmp-backend` |
| `{tenant}-*` | Other tenant repos | `acme-agentregistry`, `acme-gitops` |

**CMP = Cloud Marketplace Platform**

## GSVDEV Organization (Platform Development)

### Core Platform Repos

| Repository | Description | Type |
|------------|-------------|------|
| `gsv-platform` | Platform monorepo - templates, shared components, documentation | Monorepo |
| `gsv-gitops` | All-in-one GitOps (ArgoCD config for dev/test) | GitOps |
| `gsv-agentregistry` | Agent Registry - lifecycle management of apps, agents, MCPs | Component |
| `gsv-idp` | Internal Developer Portal (Backstage) | Component |
| `gsv-cmp` | CMP platform source (Waldur customizations) | Component |
| `gsv-website` | GSV Organization website | Website |

### Supporting Repos

| Repository | Description |
|------------|-------------|
| `gsv-apis` | Shared API implementations (TMF Open APIs) |
| `gsv-components` | TMF ODA components and shared components |
| `gsv-templates` | Backstage golden paths and scaffolding templates |
| `idp-catalog` | Backstage software catalog definitions |
| `idp-config` | IDP GitOps configuration manifests |
| `container-images` | Container image definitions |
| `helm-charts` | Helm charts for platform components |

### Environment-Specific (Dev/Test)

| Repository | Description |
|------------|-------------|
| `gsv-idp-dev` | IDP development environment config |
| `gsv-idp-test` | IDP test environment config |

## Tenant Organization Structure

### Digitlify-Inc (First Tenant / Reference Implementation)

| Repository | Description |
|------------|-------------|
| `cmp-gitops` | Production ArgoCD config (copy from gsv-gitops) |
| `cmp-agentregistry` | Agent Registry - lifecycle management of apps, agents, MCPs by tenants (customers) and providers (sellers) |
| `cmp-frontend` | Waldur frontend (UI for ALL users) |
| `cmp-backend` | Waldur backend (API) |
| `cmp-website` | Digitlify marketing/CMS site (reference implementation) |

### Other Tenant Pattern

For tenants beyond Digitlify, use `{tenant-name}` or `{tenant-id}` prefix:

| Repository Pattern | Description |
|--------------------|-------------|
| `{tenant}-gitops` | Tenant ArgoCD config |
| `{tenant}-agentregistry` | Tenant agent registry |
| `{tenant}-website` | Tenant marketing site |

Example for tenant "Acme":
- `acme-gitops`
- `acme-agentregistry`
- `acme-website`

## Key Distinctions

### Agent Registry
- **Agent Registry** = Lifecycle management of apps, agents, MCPs
- Used by both tenants (customers) and providers (sellers)
- NOT just agent storage or discovery

### GitOps Repos
- `gsv-gitops` = All-in-one for dev/test (GSVDEV uses this)
- `cmp-gitops` = All-in-one for production (tenant uses this)
- `config` / `config-dev` = Legacy/alternative GitOps structure

### Frontend/Backend
- `cmp-frontend` = Waldur frontend (serves ALL users, not just customers)
- `cmp-backend` = Waldur backend (API for all operations)

### Websites
- `gsv-website` = GSV organization site
- `cmp-website` = Digitlify site (reference implementation for tenant websites)

## Code Flow

```
GSVDEV (Latest GA)          Tenant Org (Production)
---------------------       -------------------------
gsv-agentregistry    -----> cmp-agentregistry (or {tenant}-agentregistry)
                              + tenant customizations

gsv-gitops           -----> cmp-gitops (or {tenant}-gitops)
                              + production values

gsv-platform/docs    -----> Reference documentation
```

## ArgoCD Configuration

| Environment | ArgoCD Points To |
|-------------|------------------|
| Dev/Test | `gsv-gitops` (GSVDEV) |
| Production | `cmp-gitops` or `{tenant}-gitops` (Tenant Org) |

## Deprecated/Confusing Names

These names should NOT be used:

| Avoid | Reason | Use Instead |
|-------|--------|-------------|
| `cmp-portal` | Confused with CMP product | `cmp-frontend` |
| `gsv-agents` | Renamed | `gsv-agentregistry` |
| Generic `agents` | Unclear scope | `*-agentregistry` |

## Monorepo Structure (gsv-platform)

```
gsv-platform/
├── docs/                    # Platform documentation
│   ├── repository-structure.md
│   ├── architecture/
│   └── guides/
├── agents/                  # Agent templates
├── apis/                    # API templates
├── apps/                    # Application templates
├── components/              # Shared components
└── workflows/               # CI/CD workflows
```

## Environment and Domain Mapping

### Environment Progression

| Stage | Org | Repo Prefix | Domain Pattern |
|-------|-----|-------------|----------------|
| Local Dev | GSVDEV | `gsv-*` | localhost |
| Test | GSVDEV | `gsv-*` | `*.dev.gsv.dev` |
| QA | Tenant | `cmp-*` / `{tenant}-*` | `*.qa.{tenant}.com` |
| Production | Tenant | `cmp-*` / `{tenant}-*` | `*.{tenant}.com` |

### Domain Examples (Digitlify)

| Service | Dev/Test (GSVDEV) | QA (Tenant) | Prod (Tenant) |
|---------|-------------------|-------------|---------------|
| Portal | portal.dev.gsv.dev | portal.qa.digitlify.com | portal.digitlify.com |
| API | api.dev.gsv.dev | api.qa.digitlify.com | api.digitlify.com |
| IDP | idp.dev.gsv.dev | idp.qa.digitlify.com | idp.digitlify.com |

### Promotion Flow

```
Local Dev -> Test -> QA -> Production
   |          |       |        |
   v          v       v        v
GSVDEV     GSVDEV  Tenant   Tenant
gsv-*      gsv-*   cmp-*    cmp-*
localhost  *.dev.gsv.dev  *.qa.tenant.com  *.tenant.com
```

### Key Points

- **GSVDEV** owns Local Dev and Test environments
- **Tenant Orgs** own QA and Production environments
- Code is promoted by copying/syncing from `gsv-*` repos to tenant repos
- Each environment has its own ArgoCD instance pointing to appropriate repos
