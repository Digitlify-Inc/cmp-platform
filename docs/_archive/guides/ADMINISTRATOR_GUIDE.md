# GSV Platform Administrator Guide

## Introduction

This guide is for platform administrators managing the GSV Platform infrastructure.

---

## Table of Contents

1. [Admin Access Points](#admin-access-points)
2. [Getting Credentials](#getting-credentials)
3. [Cluster Management](#cluster-management)
4. [User Management](#user-management)
5. [Secrets Management](#secrets-management)
6. [Database Administration](#database-administration)
7. [Backup Operations](#backup-operations)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)

---

## Admin Access Points

| Service | URL | Auth |
|---------|-----|------|
| ArgoCD | argocd.{domain} | SSO / admin |
| Grafana | grafana.{domain} | SSO / admin |
| Vault | vault.{domain} | Token / K8s |
| MinIO | minio.{domain} | Admin creds |
| Keycloak | sso.{domain}/admin | Admin creds |

---

## Getting Credentials

```bash
# ArgoCD admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo

# Vault root token
kubectl -n vault get secret vault-init \
  -o jsonpath="{.data.root_token}" | base64 -d && echo

# Grafana admin password
kubectl -n observability get secret prometheus-stack-grafana \
  -o jsonpath="{.data.admin-password}" | base64 -d && echo

# Keycloak admin password
kubectl -n keycloak get secret keycloak-admin-credentials \
  -o jsonpath="{.data.password}" | base64 -d && echo
```

---

## Cluster Management

### ArgoCD Operations

```bash
# List applications
kubectl get applications -n argocd

# Sync application
argocd app sync <app-name>

# Force sync with prune
argocd app sync <app-name> --prune --force
```

### Check Health

```bash
# View degraded apps
kubectl get applications -n argocd | grep -v Healthy

# Check events
kubectl get events --all-namespaces --sort-by='.lastTimestamp'
```

---

## User Management

### Keycloak Admin Console

1. Navigate to https://sso.{domain}/admin
2. Login with admin credentials
3. Select realm (gsv-platform)

### Create User

1. Go to Users > Add User
2. Fill in details (username, email, name)
3. Save
4. Go to Credentials tab
5. Set temporary password

### Roles

| Role | Permissions |
|------|-------------|
| platform-admin | Full platform access |
| org-admin | Organization admin |
| project-admin | Project admin |
| developer | Developer access |
| viewer | Read-only access |

---

## Secrets Management

### Vault Operations

```bash
# Port forward
kubectl -n vault port-forward svc/vault 8200:8200 &

# Set environment
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=$(kubectl -n vault get secret vault-init \
  -o jsonpath="{.data.root_token}" | base64 -d)

# Check status
vault status

# List secrets
vault kv list kv/

# Read secret
vault kv get kv/path/to/secret

# Write secret
vault kv put kv/path/to/secret key1=value1
```

### ESO Status

```bash
# View ClusterSecretStore
kubectl get clustersecretstores

# View ExternalSecrets
kubectl get externalsecrets --all-namespaces
```

---

## Database Administration

### CNPG Clusters

| Cluster | Namespace | Service |
|---------|-----------|---------|
| cmp-postgres | cmp | cmp-postgres-rw |
| cmp-keycloak-pg | keycloak | cmp-keycloak-pg-rw |
| sso-pg | sso | sso-pg-rw |
| agent-registry-postgres | cmp | agent-registry-postgres-rw |
| agentruntime-postgres | agentruntime | agentruntime-postgres-rw |
| agentstudio-postgres | agentstudio | agentstudio-postgres-rw |

### Connect to Database

```bash
# Get password
PASSWORD=$(kubectl -n cmp get secret cmp-postgres-app \
  -o jsonpath="{.data.password}" | base64 -d)

# Port forward
kubectl -n cmp port-forward svc/cmp-postgres-rw 5432:5432 &

# Connect
PGPASSWORD=$PASSWORD psql -h localhost -U waldur -d waldur
```

### Check Cluster Status

```bash
# List CNPG clusters
kubectl get clusters --all-namespaces

# Describe cluster
kubectl describe cluster <name> -n <namespace>
```

---

## Backup Operations

### Velero

```bash
# List backups
velero backup get

# Create backup
velero backup create manual-backup-$(date +%Y%m%d)

# Restore
velero restore create restore-name --from-backup <backup-name>
```

### CNPG Backups

```bash
# List backups
kubectl get backups -n <namespace>

# Trigger manual backup
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
```

### Backup Schedule

| Type | Schedule | Retention |
|------|----------|-----------|
| CNPG Daily | 2-5 AM | 7-30 days |
| Velero Daily | 1 AM | 30 days |
| Velero Weekly | Sunday 2 AM | 90 days |

---

## Monitoring

### Grafana Dashboards

| Dashboard | Purpose |
|-----------|---------|
| Kubernetes Overview | Cluster health |
| Node Exporter | Node metrics |
| PostgreSQL | Database metrics |
| ArgoCD | GitOps status |

### Prometheus Queries

```promql
# Cluster CPU usage
sum(rate(container_cpu_usage_seconds_total[5m])) / sum(machine_cpu_cores) * 100

# Memory by namespace
sum(container_memory_working_set_bytes) by (namespace)

# Pod restarts
sum(kube_pod_container_status_restarts_total) by (namespace, pod)
```

### View Alerts

```bash
# Port forward alertmanager
kubectl -n observability port-forward svc/alertmanager-operated 9093:9093 &

# Check alerts
curl http://localhost:9093/api/v2/alerts | jq '.[] | select(.status.state=="active")'
```

---

## Troubleshooting

### Pod Not Starting

```bash
# Check status
kubectl describe pod <pod> -n <namespace>

# Check events
kubectl get events -n <namespace> --sort-by='.lastTimestamp'

# Check resources
kubectl top pods -n <namespace>
```

### Service Unavailable

```bash
# Check endpoints
kubectl get endpoints <service> -n <namespace>

# Check ingress
kubectl describe ingress <ingress> -n <namespace>

# Test connectivity
kubectl run tmp --rm -i --tty --image nicolaka/netshoot -- \
  curl http://<service>.<namespace>.svc.cluster.local
```

### Database Issues

```bash
# Check CNPG cluster
kubectl get cluster <name> -n <namespace>

# Check pod logs
kubectl logs <cluster>-1 -n <namespace>

# Test connection
kubectl exec -it <cluster>-1 -n <namespace> -- psql -U postgres -c "SELECT 1"
```

### ArgoCD Sync Issues

```bash
# Refresh app
argocd app get <app> --refresh

# Check diff
argocd app diff <app>

# Hard refresh
argocd app sync <app> --force
```

---

## Emergency Runbooks

### Rollback Deployment

```bash
# Check history
argocd app history <app>

# Rollback
argocd app rollback <app> <revision>

# Verify
kubectl get pods -n <namespace> -w
```

### Database Failover

```bash
# Check primary
kubectl get pods -n <namespace> -l postgresql=<cluster> \
  -o jsonpath='{.items[*].metadata.labels.role}'

# Promote replica
kubectl cnpg promote <cluster> <replica-pod> -n <namespace>
```

### Scale Application

```bash
# Manual scale
kubectl scale deployment <deployment> -n <namespace> --replicas=<count>

# Verify
kubectl get pods -n <namespace> -l app=<app>
```
