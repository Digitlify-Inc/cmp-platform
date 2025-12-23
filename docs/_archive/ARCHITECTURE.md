# GSV Platform Architecture

## Overview

GSV GitOps provides a universal bootstrap for deploying the GSV Platform on any Kubernetes environment.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GSV PLATFORM ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  gsv-gitops (GSVDEV)                                                │   │
│  │  ════════════════════                                               │   │
│  │  Universal Bootstrap                                                 │   │
│  │  • Cluster provisioning (Kind, Proxmox, Hetzner)                   │   │
│  │  • Infrastructure apps (ArgoCD, cert-manager, Traefik)             │   │
│  │  • Observability (Prometheus, Grafana, Loki)                       │   │
│  │  • Policy engine (Kyverno)                                          │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│                                 │ platform-root-app                         │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  config (Digitlify-Inc)                                             │   │
│  │  ══════════════════════                                             │   │
│  │  Tenant Configuration                                                │   │
│  │  • CNPG database clusters                                           │   │
│  │  • Keycloak identity                                                 │   │
│  │  • Waldur CMP                                                        │   │
│  │  • Agent Studio & Runtime                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Repository Structure

### gsv-gitops (This Repository)

```
gsv-gitops/
├── bootstrap/              # ArgoCD App-of-Apps
│   ├── base/               # Infrastructure applications
│   │   ├── argocd/         # ArgoCD self-management
│   │   ├── cert-manager/   # TLS certificates
│   │   ├── traefik/        # Ingress controller
│   │   ├── metallb/        # LoadBalancer (local)
│   │   ├── external-dns/   # DNS automation
│   │   ├── kyverno/        # Policy engine
│   │   ├── observability/  # Monitoring stack
│   │   └── platform-root/  # → config repo
│   │
│   └── overlays/           # Environment configurations
│       ├── dev/            # dev.gsv.dev
│       ├── qa/             # qa.digitlify.com
│       └── prod/           # digitlify.com
│
├── providers/              # Cluster provisioning
│   ├── kind/               # Local development
│   ├── proxmox/            # Homelab
│   └── hetzner/            # Cloud production
│
├── defaults/               # Configuration hierarchy
│   ├── platform.yaml       # Universal defaults
│   └── providers/          # Provider-specific defaults
│
└── scripts/                # Automation
```

### config (Digitlify-Inc)

```
config/
├── base/                   # Base manifests
│   ├── idp/                # Keycloak
│   ├── cnpg/               # Database clusters
│   ├── cmp/                # Waldur CMP
│   ├── agentstudio/        # Langflow Studio
│   └── agentruntime/       # Langflow Runtime
│
├── overlays/               # Kustomize overlays
│   ├── local/              # Used by gsv-gitops 'dev'
│   ├── qa/
│   └── prod/
│
└── environments/           # ArgoCD applications
    ├── local/              # Used by gsv-gitops 'dev'
    ├── qa/
    └── prod/
```

## Configuration Hierarchy

Configuration is merged from multiple sources, with later sources overriding earlier ones:

```
1. defaults/platform.yaml           # Universal platform defaults
                ↓
2. defaults/providers/{provider}.yaml   # Provider-specific (kind, hetzner, etc.)
                ↓
3. bootstrap/overlays/{env}/kustomization.yaml  # Environment-specific
                ↓
4. .env file (gitignored)           # Local overrides
```

## Environment Mapping

gsv-gitops environments map to config repo paths:

| gsv-gitops env | Domain | Config repo path |
|----------------|--------|------------------|
| dev | dev.gsv.dev | local |
| qa | qa.digitlify.com | qa |
| prod | digitlify.com | prod |

This allows the config repo to use its existing structure while gsv-gitops uses consistent environment names.

## GitOps Flow

```
1. Provision Cluster
   ┌─────────────────────────────────────────────────────────────┐
   │  providers/{kind|proxmox|hetzner}/setup.sh                  │
   │  Creates Kubernetes cluster                                  │
   └─────────────────────────────────────────────────────────────┘
                              │
                              ▼
2. Create Secrets (One-time)
   ┌─────────────────────────────────────────────────────────────┐
   │  scripts/create-secrets.sh                                   │
   │  • GitHub token for ArgoCD                                  │
   │  • Database passwords                                        │
   │  • Cloudflare token (cloud only)                            │
   └─────────────────────────────────────────────────────────────┘
                              │
                              ▼
3. Install ArgoCD
   ┌─────────────────────────────────────────────────────────────┐
   │  Install ArgoCD from official manifests                     │
   └─────────────────────────────────────────────────────────────┘
                              │
                              ▼
4. Apply Bootstrap
   ┌─────────────────────────────────────────────────────────────┐
   │  kustomize build bootstrap/overlays/{env} | kubectl apply   │
   │  Creates ArgoCD Applications for all infrastructure         │
   └─────────────────────────────────────────────────────────────┘
                              │
                              ▼
5. ArgoCD Sync
   ┌─────────────────────────────────────────────────────────────┐
   │  ArgoCD continuously syncs:                                  │
   │  • Infrastructure apps from gsv-gitops                      │
   │  • Platform apps from config repo (via platform-root)       │
   └─────────────────────────────────────────────────────────────┘
```

## Sync Waves

Applications are deployed in order using ArgoCD sync waves:

| Wave | Applications |
|------|--------------|
| -3 | ArgoCD (self-management) |
| -2 | MetalLB, cert-manager |
| -1 | Traefik |
| 0 | external-dns, Kyverno, Observability |
| 1+ | Platform (CNPG, Keycloak, CMP, Studio, Runtime) |

## Security Model

### Secrets (Phase 1 - GTM)

- Secrets created once during initial deployment
- Never stored in git
- Managed via `scripts/create-secrets.sh`

### Future (Post-GTM)

- External Secrets Operator (ESO)
- HashiCorp Vault
- Automatic secret rotation

## High Availability

| Component | Dev | QA | Prod |
|-----------|-----|----|----- |
| ArgoCD | 1 | 2 | 2 |
| Traefik | 1 | 2 | 3 |
| Prometheus | 1 | 1 | 2 |
| Storage | local-path | hcloud-volumes | hcloud-volumes |
