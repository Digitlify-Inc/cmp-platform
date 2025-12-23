# GSV Platform Documentation

**Version:** 1.0
**Last Updated:** December 2024

---

## Documentation Index

This directory contains comprehensive documentation for the GSV AI Agents Platform.

### Quick Links

| Document | Audience | Description |
|----------|----------|-------------|
| [Deployment Guide](./DEPLOYMENT_GUIDE.md) | DevOps | Installation and deployment instructions |
| [Admin Guide](./ADMIN_GUIDE.md) | Administrators | User, tenant, and platform management |
| [Operator Guide](./OPERATOR_GUIDE.md) | Operators | Infrastructure and GitOps operations |
| [Day 2 Ops Guide](./DAY2_OPS_GUIDE.md) | SRE | Daily operations and maintenance |
| [Provider Guide](./PROVIDER_GUIDE.md) | Providers | Creating and publishing agents |
| [Customer Guide](./CUSTOMER_GUIDE.md) | Customers | Subscribing and integrating agents |
| [FAQ](./FAQ.md) | Everyone | Frequently asked questions |
| [Gaps & Improvements](./GAPS_AND_IMPROVEMENTS.md) | Internal | GTM readiness and roadmap |

---

## Documentation by Role

### For Operators / DevOps

1. **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Start here
   - Local development (Kind)
   - Proxmox home lab setup
   - Hetzner cloud deployment
   - Custom domain configuration
   - Environment promotion (dev → qa → prod)

2. **[Operator Guide](./OPERATOR_GUIDE.md)**
   - Platform components
   - GitOps operations (ArgoCD)
   - Secrets management
   - Database operations
   - Networking and TLS

3. **[Day 2 Ops Guide](./DAY2_OPS_GUIDE.md)**
   - Daily health checks
   - Monitoring and alerting
   - Scaling operations
   - Backup and recovery
   - Incident response

### For Administrators

1. **[Admin Guide](./ADMIN_GUIDE.md)**
   - Access management (Keycloak)
   - User and tenant management
   - Agent administration
   - Billing and usage
   - Security administration

### For Providers (Agent Creators)

1. **[Provider Guide](./PROVIDER_GUIDE.md)**
   - Designing agents in Studio
   - Registering and deploying agents
   - Publishing to marketplace
   - Pricing and monetization
   - Analytics and insights

### For Customers (Agent Users)

1. **[Customer Guide](./CUSTOMER_GUIDE.md)**
   - Browsing the marketplace
   - Subscribing to agents
   - Configuring personas
   - Widget and API integration
   - Usage management

---

## Quick Start

### Deploying the Platform

```bash
# Check prerequisites
make preflight

# Deploy to local Kind cluster
make deploy-dev

# Check status
make status
```

### Promoting to QA/Production

```bash
# Promote from dev to QA
make promote.qa

# Promote from QA to Production
make promote.prod
```

### Accessing Services (Development)

| Service | URL | Credentials |
|---------|-----|-------------|
| ArgoCD | https://argocd.dev.gsv.dev | admin / (kubectl secret) |
| Portal | https://portal.dev.gsv.dev | Keycloak SSO |
| Studio | https://studio.dev.gsv.dev | Keycloak SSO |
| SSO Admin | https://sso.dev.gsv.dev/admin | admin / admin |
| Grafana | https://grafana.dev.gsv.dev | admin / prom-operator |

---

## Related Documentation

### Other Documentation Locations

| Location | Content |
|----------|---------|
| `docs/platform-audit/` | Platform audit report |
| `docs/uat-scripts/` | E2E testing scripts |
| `charts/*/README.md` | Helm chart documentation |
| `scripts/README.md` | Script documentation |

### External Resources

- [LangFlow Documentation](https://docs.langflow.org)
- [Waldur Documentation](https://docs.waldur.com)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io)

---

## Contributing

To update documentation:

1. Edit markdown files in this directory
2. Follow existing formatting conventions
3. Update this README if adding new documents
4. Commit with descriptive message

---

## Support

- Documentation issues: Create a GitHub issue
- Platform support: support@digitlify.com
- Security concerns: security@digitlify.com

---

*GSV Platform Engineering Team - December 2024*
