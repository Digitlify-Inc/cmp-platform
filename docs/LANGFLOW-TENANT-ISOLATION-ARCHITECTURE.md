# Langflow Tenant Isolation Architecture

**Version:** 1.0.0
**Date:** December 21, 2025
**Status:** APPROVED

## Access Control Matrix

| Role | Studio | Runtime | Marketplace |
|------|--------|---------|-------------|
| platform-operator | Full | Full | Full |
| service-provider (seller) | Full | DENIED | Full |
| buyer | DENIED | DENIED | Full |

## Architecture

The platform uses OAuth2-proxy with Keycloak OIDC for authentication and RBAC.

### Studio Access (operators + sellers)
- OAUTH2_PROXY_ALLOWED_GROUPS: /gsv-team,/sellers

### Runtime Access (operators only)
- OAUTH2_PROXY_ALLOWED_GROUPS: /gsv-team

### Key Settings
- LANGFLOW_AUTO_LOGIN: true (trust OAuth2-proxy)
- Cookie expiry: 7 days
- Cookie refresh: 1 hour

## Keycloak Roles

- platform-operator: Full access (composite role)
- service-provider: Studio + marketplace (composite role)
- buyer: Marketplace only (composite role)

## Network Isolation

Runtime pods only accept traffic from:
1. runtime-oauth2-proxy (authenticated UI)
2. cmp-runner (internal API)
