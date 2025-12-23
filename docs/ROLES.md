# Platform Roles Registry

This document serves as the single source of truth for all platform roles and their implementations.

## Core Principle

**Name by function/role, not by implementation.**

This ensures that vendor swaps (e.g., Waldur -> Saleor) do not require repository renames or major refactoring of references.

## Role Definitions

### Frontend Services

| Role | Function | Current Implementation | Domain (dev) |
|------|----------|----------------------|--------------|
| marketplace | Buyer/seller UI for browsing and purchasing | Next.js + Saleor SDK | marketplace.dev.gsv.dev |
| cms | Marketing site, blog, docs | Wagtail (Django) | dev.gsv.dev |

### Backend Services (Custom)

| Role | Function | Current Implementation | Domain (dev) |
|------|----------|----------------------|--------------|
| control-plane | Platform orchestration, user management | FastAPI | api.dev.gsv.dev |
| gateway | API routing, rate limiting | Custom (Envoy-based) | gateway.dev.gsv.dev |
| provisioner | Agent instance lifecycle management | Python | (internal) |
| runner | Agent execution environment | Python | (internal) |

### Backend Services (Vendored)

| Role | Function | Current Implementation | Domain (dev) |
|------|----------|----------------------|--------------|
| commerce-api | Product catalog, checkout, orders | Saleor GraphQL | saleor.dev.gsv.dev |
| commerce-dashboard | Admin UI for products/orders | Saleor Dashboard | dashboard.dev.gsv.dev |

### Infrastructure Services (Vendored)

| Role | Function | Current Implementation | Domain (dev) |
|------|----------|----------------------|--------------|
| sso | Authentication, OIDC provider | Keycloak | keycloak.dev.gsv.dev |
| secrets | Secret management, encryption | Vault | vault.dev.gsv.dev |
| cd | Continuous delivery, GitOps | ArgoCD | argocd.dev.gsv.dev |
| idp | Internal Developer Portal | Backstage | backstage.dev.gsv.dev |

## Repository Mapping

### gsv-platform (Our Code)

```
gsv-platform/
  services/
    marketplace/      # Role: marketplace
    control-plane/    # Role: control-plane
    gateway/          # Role: gateway
    provisioner/      # Role: provisioner
    runner/           # Role: runner
```

### gsv-vendors (Vendored Upstreams)

```
gsv-vendors/
  commerce/
    api/              # Role: commerce-api (Saleor API)
    dashboard/        # Role: commerce-dashboard (Saleor Dashboard)
  cms/
    engine/           # Role: cms (Wagtail)
  sso/
    provider/         # Role: sso (Keycloak)
  secrets/
    manager/          # Role: secrets (Vault)
  cd/
    controller/       # Role: cd (ArgoCD)
  idp/
    portal/           # Role: idp (Backstage)
```

## Image Naming

| Environment | Pattern | Example |
|-------------|---------|---------|
| Local/Dev | gsv-{role}:local | gsv-marketplace:local |
| Test | gsv-{role}:{sha} | gsv-marketplace:abc1234 |
| QA | {tenant}-{role}:{version} | digitlify-marketplace:v1.2.0-rc1 |
| Production | {tenant}-{role}:{version} | digitlify-marketplace:v1.2.0 |

## Kubernetes Resources

### Namespace: cmp

| Deployment | Role | Image |
|------------|------|-------|
| cmp-marketplace | marketplace | gsv-marketplace:local |
| cmp-control-plane | control-plane | gsv-control-plane:local |
| cmp-gateway | gateway | gsv-gateway:local |
| cmp-commerce-api | commerce-api | gsv-commerce-api:local |
| cmp-commerce-dashboard | commerce-dashboard | gsv-commerce-dashboard:local |
| cmp-cms | cms | gsv-cms:local |

## Adding a New Role

1. Choose a descriptive, vendor-agnostic role name
2. Add entry to this document
3. Create service in appropriate location:
   - Custom code: gsv-platform/services/{role}/
   - Vendored: gsv-vendors/{category}/{role}/
4. Update gsv-gitops with deployment manifests
5. Follow image naming convention

## Vendor Swap Procedure

When replacing a vendor (e.g., replacing Saleor with another commerce platform):

1. **Do NOT rename** the role or repository paths
2. Update the vendored code in gsv-vendors/{category}/{role}/
3. Update this document's "Current Implementation" column
4. Update integration code in gsv-platform/services/ as needed
5. The role name (commerce-api) remains stable

## Deprecated Repositories

> **Note:** The following repos are deprecated and have been replaced.

| Repo | Was | Replaced By |
|------|-----|-------------|
| cmp-frontend | Waldur HomePort | marketplace (Next.js + Saleor) |
| cmp-backend | Waldur MasterMind | commerce-api (Saleor) + control-plane |
| cmp-agentregistry | Agent registry service | Absorbed into control-plane |
| gsv-agentregistry | Agent registry service | Absorbed into control-plane |

## Historical Changes

| Date | Change | From | To |
|------|--------|------|-----|
| 2024-Q4 | Commerce platform | Waldur | Saleor |
| 2024-Q4 | Frontend | Waldur HomePort | Next.js marketplace |
| 2024-Q4 | Agent registry | Standalone service | Absorbed into control-plane |
| 2024-12 | Rename | storefront | marketplace |

---

*Last updated: 2024-12-20*
