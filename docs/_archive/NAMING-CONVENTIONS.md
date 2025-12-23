# GSV Platform Naming Conventions

## Principle

Use generic, role-based names for self-hosted OSS components.
This allows replacing the underlying OSS without causing naming issues.

**Online services retain their brand names** (GitHub, etc.)

## Component Naming

| Generic Name | OSS Component | Category |
|--------------|---------------|----------|
| idp | Backstage | Self-hosted |
| cmp | Waldur | Self-hosted |
| sso | Keycloak | Self-hosted |
| studio | Langflow | Self-hosted |
| runtime | Langflow Runtime | Self-hosted |
| agent-registry | Custom MCP Hub | Self-hosted |
| cd | ArgoCD | Self-hosted |
| git | Gitea | Self-hosted |
| registry | Harbor | Self-hosted |
| **GitHub** | GitHub | Online (unchanged) |
| **Other SaaS** | Various | Online (unchanged) |

## Repository Naming

### Platform Repositories (GSVDEV)

```
gsv-{component}      # Platform component
gsv-{type}           # Platform library/config

Examples:
- gsv-idp            # IDP platform code
- gsv-cmp            # CMP platform code  
- gsv-apis           # Shared APIs library
- gsv-templates      # IDP templates
```

### Tenant Repositories

```
{tenant_id}-config   # GitOps configuration
{tenant_id}-{comp}   # Component overlay

Examples (Digitlify):
- config             # GitOps (implicit digitlify-config)
- cmp                # CMP overlay (implicit digitlify-cmp)
- idp                # IDP overlay
```

## Environment Naming

| Environment | GSVDEV | Tenants |
|-------------|--------|---------|
| Development | dev | - |
| QA/Staging | qa | qa |
| Production | prod/GA | prod |

## Namespace Naming (Kubernetes)

```
{component}          # For platform components
{tenant}-{component} # For tenant-specific

Examples:
- cmp                # CMP namespace
- backstage          # IDP namespace  
- digitlify-cmp      # Tenant CMP namespace
```

## Branch Naming

```
main                 # Production-ready code
develop              # Integration branch
feature/{ticket}-{desc}
bugfix/{ticket}-{desc}
release/{version}
```
