# GSV Platform Operator Guide

**Version:** 1.0
**Last Updated:** December 2024
**Audience:** Platform Operators, DevOps Engineers

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Platform Components](#2-platform-components)
3. [Installation](#3-installation)
4. [Configuration Management](#4-configuration-management)
5. [GitOps Operations](#5-gitops-operations)
6. [Secrets Management](#6-secrets-management)
7. [Database Operations](#7-database-operations)
8. [Networking](#8-networking)
9. [Observability](#9-observability)
10. [Maintenance Procedures](#10-maintenance-procedures)

---

## 1. Introduction

### 1.1 Operator Responsibilities

| Area | Tasks |
|------|-------|
| **Infrastructure** | Cluster management, node scaling, storage |
| **Deployments** | ArgoCD applications, Helm releases |
| **Networking** | Ingress, TLS, DNS |
| **Data** | Database administration, backups |
| **Security** | Certificates, secrets rotation |
| **Monitoring** | Alerting, dashboards, log management |

### 1.2 Required Knowledge

- Kubernetes administration
- Helm chart management
- ArgoCD/GitOps workflows
- PostgreSQL administration
- TLS certificate management

---

## 2. Platform Components

### 2.1 Infrastructure Layer

| Component | Namespace | Helm Chart | Purpose |
|-----------|-----------|------------|---------|
| MetalLB | `metallb-system` | metallb | LoadBalancer (Kind/Proxmox) |
| Traefik | `traefik` | traefik | Ingress Controller |
| cert-manager | `cert-manager` | cert-manager | TLS certificates |
| external-dns | `external-dns` | external-dns | DNS automation |

### 2.2 Platform Layer

| Component | Namespace | Helm Chart | Purpose |
|-----------|-----------|------------|---------|
| ArgoCD | `argocd` | argocd | GitOps deployment |
| Keycloak | `sso` | keycloakx | Identity management |
| Waldur | `cmp` | waldur | Marketplace |
| Agent Registry | `cmp` | agent-registry | Agent orchestration |
| Portal | `cmp` | portal | Customer UI |

### 2.3 Data Layer

| Component | Namespace | Operator | Purpose |
|-----------|-----------|----------|---------|
| PostgreSQL | `cmp` | CNPG | Primary database |
| Redis | `cmp` | Bitnami | Caching |
| RabbitMQ | `cmp` | Bitnami | Message queue |
| Qdrant | `cmp` | Custom | Vector database |

### 2.4 Observability Layer

| Component | Namespace | Helm Chart | Purpose |
|-----------|-----------|------------|---------|
| Prometheus | `observability` | kube-prometheus-stack | Metrics |
| Grafana | `observability` | kube-prometheus-stack | Dashboards |
| Loki | `observability` | loki-stack | Log aggregation |
| AlertManager | `observability` | kube-prometheus-stack | Alerting |

---

## 3. Installation

### 3.1 Fresh Installation

```bash
# 1. Clone repository
git clone https://github.com/GSVDEV/gsv-gitops.git
cd gsv-gitops

# 2. Configure environment
cp .env.example .env
# Edit .env with required tokens

# 3. Run full deployment
make deploy-dev

# 4. Verify deployment
make status
make smoke
```

### 3.2 Component Installation Order

1. **Cluster** - Kind cluster or existing K8s
2. **Infrastructure** - MetalLB, Traefik, cert-manager
3. **ArgoCD** - GitOps controller
4. **Bootstrap** - App-of-Apps pattern
5. **Platform apps** - Auto-deployed via ArgoCD

### 3.3 Individual Component Installation

```bash
# Install only MetalLB
make metallb.install

# Install ingress stack
make ingress.setup

# Install ArgoCD
make argocd.install

# Bootstrap GitOps apps
make gitops.bootstrap
```

---

## 4. Configuration Management

### 4.1 Configuration Hierarchy

```
gsv-gitops/
├── charts/                      # Helm charts
│   └── cmp/
│       ├── values.yaml          # Base values
│       ├── values-cmp-dev.yaml  # Dev overrides
│       ├── values-cmp-qa.yaml   # QA overrides
│       └── values-cmp-prod.yaml # Prod overrides
├── platform/
│   ├── base/                    # Base Kustomize manifests
│   └── overlays/
│       ├── dev/                 # Dev patches
│       ├── qa/                  # QA patches
│       └── prod/                # Prod patches
└── clusters/
    └── kind-gsv/                # Cluster-specific config
```

### 4.2 Values Files Structure

```yaml
# values-cmp-{env}.yaml
waldur:
  imageName: "ghcr.io/digitlify-inc/cmp-backend"
  imageTag: "dev-xxxxx"

  site:
    domain: "portal.dev.gsv.dev"

ingress:
  enabled: true
  className: "traefik"
  tls:
    enabled: true
    secretName: wildcard-dev-tls

externalDB:
  enabled: true
  serviceName: cmp-postgres-rw
  secretName: cmp-postgres-app
```

### 4.3 Updating Configuration

#### Via GitOps (Recommended)

```bash
# 1. Edit values file
vim charts/cmp/values-cmp-dev.yaml

# 2. Commit and push
git add -A
git commit -m "config: update agent-registry config"
git push

# 3. ArgoCD syncs automatically
argocd app get agent-registry
```

#### Via Helm Direct (Emergency)

```bash
# Update values directly (not recommended for production)
helm upgrade agent-registry ./charts/agent-registry \
  -n cmp \
  -f values-dev.yaml \
  --set image.tag=v1.5.0
```

---

## 5. GitOps Operations

### 5.1 ArgoCD Application Management

```bash
# List all applications
argocd app list

# Get application details
argocd app get gsv-platform

# Sync specific application
argocd app sync agent-registry

# Sync all applications
argocd app sync --all

# Force sync (ignore drift)
argocd app sync agent-registry --force

# Rollback application
argocd app rollback agent-registry 2  # Rollback to revision 2
```

### 5.2 Application Health States

| Status | Meaning | Action |
|--------|---------|--------|
| `Healthy` | All resources OK | None |
| `Progressing` | Deployment in progress | Wait |
| `Degraded` | Some resources unhealthy | Investigate |
| `Missing` | Resources not found | Check manifests |
| `Unknown` | Cannot determine health | Check ArgoCD logs |

### 5.3 Sync Strategies

```yaml
# Application spec
spec:
  syncPolicy:
    automated:
      prune: true        # Delete removed resources
      selfHeal: true     # Revert manual changes
    syncOptions:
      - CreateNamespace=true
      - ApplyOutOfSyncOnly=true
```

### 5.4 App-of-Apps Pattern

```yaml
# Bootstrap app deploys child apps
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: gsv-root
  namespace: argocd
spec:
  source:
    repoURL: https://github.com/GSVDEV/gsv-gitops
    path: clusters/kind-gsv/apps
    targetRevision: main
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
```

---

## 6. Secrets Management

### 6.1 Current Setup

| Secret Type | Storage | Management |
|-------------|---------|------------|
| Database passwords | K8s Secret | CNPG auto-generated |
| API keys | K8s Secret | Application managed |
| TLS certificates | K8s Secret | cert-manager |
| Registry credentials | K8s Secret | Manual/sealed |
| OIDC secrets | K8s Secret | Manual |

### 6.2 Viewing Secrets

```bash
# List secrets in namespace
kubectl get secrets -n cmp

# View secret metadata (not values)
kubectl describe secret agent-registry-secrets -n cmp

# Decode secret value (be careful!)
kubectl get secret agent-registry-secrets -n cmp \
  -o jsonpath='{.data.DATABASE_PASSWORD}' | base64 -d
```

### 6.3 Creating Secrets

```bash
# Create generic secret
kubectl create secret generic my-secret -n cmp \
  --from-literal=username=admin \
  --from-literal=password=secretpass

# Create TLS secret
kubectl create secret tls wildcard-tls -n cert-manager \
  --cert=tls.crt \
  --key=tls.key

# Create docker registry secret
kubectl create secret docker-registry ghcr-pull-secret -n cmp \
  --docker-server=ghcr.io \
  --docker-username=$GHCR_USER \
  --docker-password=$GHCR_PAT
```

### 6.4 External Secrets Operator (Future)

```yaml
# ExternalSecret definition (ESO + Vault)
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: agent-registry-secrets
  namespace: cmp
spec:
  refreshInterval: 1h
  secretStoreRef:
    kind: ClusterSecretStore
    name: vault-backend
  target:
    name: agent-registry-secrets
  data:
    - secretKey: DATABASE_PASSWORD
      remoteRef:
        key: secret/data/cmp/database
        property: password
```

---

## 7. Database Operations

### 7.1 CNPG PostgreSQL Management

```bash
# List clusters
kubectl get cluster -n cmp

# Get cluster status
kubectl describe cluster cmp-postgres -n cmp

# Check replication status
kubectl cnpg status cmp-postgres -n cmp
```

### 7.2 Connecting to Database

```bash
# Get connection info
kubectl get secret cmp-postgres-app -n cmp -o jsonpath='{.data.username}' | base64 -d
kubectl get secret cmp-postgres-app -n cmp -o jsonpath='{.data.password}' | base64 -d

# Direct connection (via pod)
kubectl exec -it cmp-postgres-1 -n cmp -- psql -U postgres

# Port forward
kubectl port-forward -n cmp svc/cmp-postgres-rw 5432:5432
psql -h localhost -U postgres -d agent_registry
```

### 7.3 Backup Operations

```bash
# Create on-demand backup
kubectl apply -f - <<EOF
apiVersion: postgresql.cnpg.io/v1
kind: Backup
metadata:
  name: manual-backup-$(date +%Y%m%d%H%M)
  namespace: cmp
spec:
  cluster:
    name: cmp-postgres
EOF

# List backups
kubectl get backup -n cmp

# Check backup status
kubectl describe backup manual-backup-xxx -n cmp
```

### 7.4 Restore Operations

```bash
# Create new cluster from backup
kubectl apply -f - <<EOF
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: cmp-postgres-restored
  namespace: cmp
spec:
  instances: 2
  storage:
    size: 20Gi
  bootstrap:
    recovery:
      source: cmp-postgres
      recoveryTarget:
        targetTime: "2024-12-04T10:00:00Z"
EOF
```

### 7.5 Failover

```bash
# Promote replica to primary
kubectl cnpg promote cmp-postgres cmp-postgres-2 -n cmp

# Verify new primary
kubectl get pods -n cmp -l cnpg.io/cluster=cmp-postgres
```

---

## 8. Networking

### 8.1 Ingress Management

```bash
# List ingresses
kubectl get ingress -A

# View ingress details
kubectl describe ingress agent-registry -n cmp

# Check Traefik dashboard
kubectl port-forward -n traefik svc/traefik 9000:9000
# Access http://localhost:9000/dashboard/
```

### 8.2 TLS Certificate Management

```bash
# List certificates
kubectl get certificates -A

# Check certificate status
kubectl describe certificate wildcard-dev-tls -n cert-manager

# View certificate details
kubectl get secret wildcard-dev-tls -n cert-manager \
  -o jsonpath='{.data.tls\.crt}' | base64 -d | \
  openssl x509 -text -noout | grep -E "(Subject:|Not After)"

# Force renewal
kubectl delete certificate wildcard-dev-tls -n cert-manager
```

### 8.3 MetalLB Configuration

```bash
# View IP address pool
kubectl get ipaddresspool -n metallb-system

# Check L2 advertisement
kubectl get l2advertisement -n metallb-system

# View assigned IPs
kubectl get svc -A | grep LoadBalancer
```

### 8.4 Network Policies

```yaml
# Example: Allow ingress only from specific namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ingress-only
  namespace: cmp
spec:
  podSelector: {}
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: traefik
```

---

## 9. Observability

### 9.1 Prometheus Metrics

```bash
# Port forward Prometheus
kubectl port-forward -n observability svc/prometheus-stack-prometheus 9090:9090

# Useful queries
# Request rate
rate(http_requests_total[5m])

# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# Response latency P99
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

### 9.2 Grafana Dashboards

```bash
# Access Grafana
kubectl port-forward -n observability svc/prometheus-stack-grafana 3000:80

# Default credentials
# Username: admin
# Password: prom-operator
```

### 9.3 Log Aggregation (Loki)

```bash
# View logs in Grafana
# 1. Go to Explore
# 2. Select Loki data source
# 3. Query: {namespace="cmp"}

# LogQL examples
{namespace="cmp", app="agent-registry"} |= "ERROR"
{namespace="cmp"} | json | level="error"
```

### 9.4 Alerting

```bash
# List alert rules
kubectl get prometheusrules -n observability

# Check alert status
kubectl port-forward -n observability svc/alertmanager 9093:9093
# Access http://localhost:9093
```

---

## 10. Maintenance Procedures

### 10.1 Rolling Restart

```bash
# Restart deployment (zero-downtime)
kubectl rollout restart deployment/agent-registry -n cmp

# Watch rollout
kubectl rollout status deployment/agent-registry -n cmp
```

### 10.2 Scaling

```bash
# Horizontal scaling
kubectl scale deployment/agent-registry -n cmp --replicas=5

# View HPA
kubectl get hpa -n cmp

# Adjust HPA
kubectl patch hpa agent-registry -n cmp \
  -p '{"spec":{"maxReplicas":10}}'
```

### 10.3 Resource Tuning

```bash
# Check current resource usage
kubectl top pods -n cmp --containers

# Edit deployment resources
kubectl edit deployment/agent-registry -n cmp

# Via patch
kubectl patch deployment agent-registry -n cmp -p '
{
  "spec": {
    "template": {
      "spec": {
        "containers": [{
          "name": "agent-registry",
          "resources": {
            "requests": {"cpu": "500m", "memory": "1Gi"},
            "limits": {"cpu": "2", "memory": "4Gi"}
          }
        }]
      }
    }
  }
}'
```

### 10.4 Log Rotation

```bash
# Check log sizes
for pod in $(kubectl get pods -n cmp -o name); do
  echo "$pod:"
  kubectl exec $pod -n cmp -- du -sh /var/log 2>/dev/null || echo "  N/A"
done
```

### 10.5 Cleanup Operations

```bash
# Delete completed jobs
kubectl delete jobs -n cmp --field-selector status.successful=1

# Delete old ReplicaSets
kubectl get rs -n cmp -o wide | awk '$2==0 {print $1}' | xargs -r kubectl delete rs -n cmp

# Prune unused images (if using containerd)
crictl rmi --prune
```

---

## Appendix: Quick Reference

### Essential Commands

```bash
# Cluster health
kubectl get nodes
kubectl top nodes

# Application status
argocd app list
kubectl get applications -n argocd

# Pod debugging
kubectl get pods -A | grep -v Running
kubectl describe pod <pod-name> -n <namespace>
kubectl logs <pod-name> -n <namespace> -f

# Resource usage
kubectl top pods -n cmp
kubectl describe node | grep -A 5 "Allocated resources"

# Networking
kubectl get svc -A
kubectl get ingress -A
kubectl get certificates -A
```

---

*Document generated by GSV Platform Engineering Team*
