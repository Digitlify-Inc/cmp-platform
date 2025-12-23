# Platform Overview

**Document Version:** 1.0  
**Status:** Finalized  
**Last Updated:** November 27, 2025

---

## Executive Summary

The GSV Platform is an Internal Developer Platform (IDP) that powers the **Digitlify AI Agent Marketplace**. It enables:

1. **Agent Creation** - Visual flow design in LangFlow Studio
2. **Agent Deployment** - Automated provisioning to Runtime
3. **Agent Monetization** - Marketplace listing and subscription billing
4. **Agent Consumption** - API access with usage tracking

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Customer Experience Layer                        │
│  Portal (Waldur CMP)  │  Studio (LangFlow)  │  Widget (Embed)           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Identity & Access Layer                          │
│                            Keycloak SSO                                  │
│              OIDC │ SAML │ Social Login │ MFA                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Integration Layer (MCP)                          │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ Agent        │  │   Waldur     │  │  LangFlow    │                  │
│  │ Registry     │  │   MCP        │  │   MCP        │                  │
│  │ (MCP Hub)    │  │              │  │              │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Application Layer                                │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Waldur     │  │   LangFlow   │  │   LangFlow   │                  │
│  │   CMP        │  │   Studio     │  │   Runtime    │                  │
│  │ (Marketplace)│  │  (Design)    │  │ (Execution)  │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Data Layer                                       │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  PostgreSQL  │  │    Redis     │  │  RabbitMQ    │                  │
│  │   (CNPG)     │  │   (Cache)    │  │   (Queue)    │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Infrastructure Layer                             │
│                                                                          │
│  Kubernetes (K3s/Kind)  │  ArgoCD  │  Traefik  │  Cert-Manager          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Waldur CMP (Cloud Marketplace Platform)

**Purpose:** Customer-facing marketplace for browsing, ordering, and managing AI agents.

**Key Features:**
- Service catalog with categories
- Pricing plans and subscriptions
- Order management
- Usage reporting
- Customer organizations/projects

**Technology:** Django (forked as cmp-backend), React (forked as cmp-frontend)

---

### 2. LangFlow Studio

**Purpose:** Visual development environment for creating AI agent flows.

**Key Features:**
- Drag-and-drop flow builder
- Component library
- Built-in testing
- Version control
- Flow export/import

**Technology:** LangFlow (Python/React)

---

### 3. LangFlow Runtime

**Purpose:** Production execution environment for deployed agents.

**Key Features:**
- Flow execution
- API endpoint generation
- Scaling capabilities
- Usage metering
- Multi-tenant isolation

**Technology:** LangFlow (Python)

---

### 4. Agent Registry (MCP Hub)

**Purpose:** Central bridge connecting Studio, Runtime, and CMP via MCP protocol.

**Key Features:**
- Agent lifecycle management
- Offering synchronization
- API key generation
- Usage tracking
- Multi-tenancy orchestration

**Technology:** Django + FastMCP

---

### 5. Keycloak SSO

**Purpose:** Centralized identity and access management.

**Key Features:**
- Single sign-on (SSO)
- OIDC/SAML support
- User federation
- Role-based access
- Custom themes

**Technology:** Keycloak + Keycloakify theme

---

## Deployment Environments

| Environment | Domain Pattern | Cluster | Purpose |
|-------------|----------------|---------|---------|
| **Dev** | `*.dev.gsv.dev` | Kind (local) | Development |
| **QA** | `*.qa.digitlify.com` | K3s (Hetzner) | Testing |
| **Prod** | `*.digitlify.com` | K3s (Hetzner) | Production |

---

## GitOps Structure

```
gsv-gitops/
├── bootstrap/           # Cluster bootstrap (ArgoCD, operators)
│   ├── base/
│   └── overlays/{dev,qa,prod}/
├── platform/           # Platform applications
│   ├── base/
│   │   ├── agentstudio/
│   │   ├── agentruntime/
│   │   ├── cmp/
│   │   ├── cnpg/
│   │   └── keycloak/
│   └── overlays/{dev,qa,prod}/
├── charts/             # Helm charts
└── docs/               # Documentation (you are here)
```

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **GitOps** | ArgoCD | Industry standard, declarative |
| **Database** | CloudNativePG | K8s native PostgreSQL |
| **Protocol** | MCP | Anthropic standard for AI integration |
| **Multi-tenancy** | Shared + Dedicated | Cost vs isolation tradeoff |
| **SSO** | Keycloak | Self-hosted, full-featured |

---

## Security Model

1. **Authentication:** Keycloak OIDC for all services
2. **Authorization:** RBAC per organization/project
3. **API Security:** API keys with SHA-256 hashing
4. **Network:** Kubernetes NetworkPolicies for isolation
5. **Secrets:** Kubernetes Secrets (Vault planned)
6. **TLS:** Cert-manager with Let's Encrypt

---

## Next Steps

1. Review [Component Architecture](COMPONENT_ARCHITECTURE.md)
2. Understand [MCP Integration](MCP_INTEGRATION.md)
3. Study [Multi-Tenancy](MULTI_TENANCY.md) models
