# Glossary

Quick reference for terms used in GSV Platform documentation.

---

## Platform Terms

| Term | Definition |
|------|------------|
| **GSV Platform** | The Internal Developer Platform powering Digitlify |
| **Digitlify** | The AI Agent Marketplace product |
| **CMP** | Cloud Marketplace Platform (Waldur-based) |
| **Portal** | Customer-facing marketplace UI |
| **Studio** | LangFlow-based agent design environment |
| **Runtime** | LangFlow-based agent execution environment |
| **Agent Registry** | MCP Hub connecting Studio ↔ Runtime ↔ CMP |

---

## Technical Terms

| Term | Definition |
|------|------------|
| **MCP** | Model Context Protocol - Anthropic's standard for AI tool integration |
| **GitOps** | Infrastructure-as-code managed via Git and ArgoCD |
| **CNPG** | CloudNativePG - Kubernetes-native PostgreSQL operator |
| **SSO** | Single Sign-On via Keycloak |
| **OIDC** | OpenID Connect - authentication protocol |

---

## Agent Terms

| Term | Definition |
|------|------------|
| **Flow** | A LangFlow pipeline defining agent logic |
| **Agent** | A deployed, monetizable AI service |
| **Agent Instance** | A specific version of an agent in the registry |
| **Offering** | A CMP listing for an agent with pricing |
| **Plan** | A pricing tier (Starter, Pro, Enterprise) |

---

## Multi-Tenancy Terms

| Term | Definition |
|------|------------|
| **Tenant** | A customer organization |
| **Shared Tenancy** | Multiple tenants share resources (budget plans) |
| **Dedicated Tenancy** | Tenant has isolated resources (enterprise) |
| **Namespace** | Kubernetes namespace for isolation |
| **API Key** | Customer credential for agent access |
| **Quota** | Usage limit per billing cycle |

---

## Waldur Terms

| Term | Definition |
|------|------------|
| **Customer** | Waldur organization (maps to AgentTenant) |
| **Project** | Waldur project (maps to AgentProject) |
| **Resource** | Waldur resource (maps to AgentInstance) |
| **Offering** | Waldur marketplace listing |
| **Order** | Customer purchase request |
| **Service Provider** | Entity offering services (Digitlify) |

---

## Environment Terms

| Term | Definition |
|------|------------|
| **Dev** | Development environment (`*.dev.gsv.dev`) |
| **QA** | Quality Assurance (`*.qa.digitlify.com`) |
| **Prod** | Production (`*.digitlify.com`) |
| **Kind** | Local Kubernetes cluster |
| **K3s** | Lightweight Kubernetes for production |

---

## Acronyms

| Acronym | Full Form |
|---------|-----------|
| **API** | Application Programming Interface |
| **CI/CD** | Continuous Integration / Continuous Deployment |
| **CRD** | Custom Resource Definition |
| **DNS** | Domain Name System |
| **E2E** | End-to-End |
| **GTM** | Go-To-Market |
| **IDP** | Internal Developer Platform |
| **K8s** | Kubernetes |
| **MVP** | Minimum Viable Product |
| **RAG** | Retrieval-Augmented Generation |
| **RBAC** | Role-Based Access Control |
| **REST** | Representational State Transfer |
| **TLS** | Transport Layer Security |
| **UI** | User Interface |
| **UUID** | Universally Unique Identifier |

---

## The Pizzeria Analogy

| Pizzeria | Platform | Explanation |
|----------|----------|-------------|
| Kitchen | Studio | Where recipes (flows) are created |
| Menu | CMP | Where dishes (agents) are listed |
| Restaurant Floor | Runtime | Where customers consume |
| Kitchen Manager | Agent Registry | Coordinates everything |
| Recipe | Flow | The agent logic |
| Dish | Agent | The final product |
| Order | Subscription | Customer purchase |
| Bill | Invoice | Usage-based billing |

---

*Last Updated: November 27, 2025*
