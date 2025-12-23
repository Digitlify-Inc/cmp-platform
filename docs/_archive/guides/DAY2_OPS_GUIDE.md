# GSV Platform Day 2 Operations Guide

**Version:** 1.0
**Last Updated:** December 2024
**Audience:** Operations Engineers, SRE Teams

---

## Table of Contents

1. [Daily Operations](#1-daily-operations)
2. [Monitoring and Alerting](#2-monitoring-and-alerting)
3. [Scaling Operations](#3-scaling-operations)
4. [Updates and Upgrades](#4-updates-and-upgrades)
5. [Backup and Recovery](#5-backup-and-recovery)
6. [Incident Response](#6-incident-response)
7. [Maintenance Windows](#7-maintenance-windows)
8. [Security Operations](#8-security-operations)
9. [Cost Optimization](#9-cost-optimization)
10. [Runbooks](#10-runbooks)

---

## 1. Daily Operations

### 1.1 Morning Health Check

Run this checklist every morning:

```bash
#!/bin/bash
# daily-health-check.sh

echo "=== GSV Platform Daily Health Check ==="
echo "Date: $(date)"
echo ""

# 1. Cluster Health
echo "1. Cluster Status:"
kubectl get nodes
echo ""

# 2. Pods Status
echo "2. Pod Status (Non-Running):"
kubectl get pods -A | grep -v Running | grep -v Completed
echo ""

# 3. ArgoCD Sync Status
echo "3. ArgoCD Applications:"
kubectl get applications -n argocd -o custom-columns=NAME:.metadata.name,STATUS:.status.sync.status,HEALTH:.status.health.status
echo ""

# 4. Certificate Expiry
echo "4. Certificate Status:"
kubectl get certificates -A -o custom-columns=NAME:.metadata.name,READY:.status.conditions[0].status,EXPIRY:.status.notAfter
echo ""

# 5. PVC Usage
echo "5. Persistent Volume Claims:"
kubectl get pvc -A
echo ""

# 6. Recent Events (Warnings)
echo "6. Recent Warning Events:"
kubectl get events -A --field-selector type=Warning --sort-by='.lastTimestamp' | tail -10
```

### 1.2 Key Metrics to Monitor

| Metric | Healthy Range | Warning | Critical |
|--------|---------------|---------|----------|
| API Response Time (P99) | < 500ms | > 1s | > 3s |
| Error Rate | < 0.1% | > 1% | > 5% |
| Database Connections | < 70% | > 80% | > 95% |
| Memory Usage | < 70% | > 80% | > 90% |
| CPU Usage | < 60% | > 75% | > 90% |
| Disk Usage | < 70% | > 80% | > 90% |
| Queue Depth (Celery) | < 100 | > 500 | > 1000 |

### 1.3 Log Monitoring

#### Critical Log Patterns to Watch

```bash
# Errors in Agent Registry
kubectl logs -n cmp deployment/agent-registry -f | grep -E "ERROR|CRITICAL|Exception"

# Database Connection Issues
kubectl logs -n cmp deployment/agent-registry -f | grep -i "connection"

# Authentication Failures
kubectl logs -n sso deployment/keycloak -f | grep -i "authentication failed"

# Webhook Processing Errors
kubectl logs -n cmp deployment/agent-registry -f | grep "webhook" | grep -i error
```

---

## 2. Monitoring and Alerting

### 2.1 Grafana Dashboards

| Dashboard | URL | Purpose |
|-----------|-----|---------|
| Platform Overview | `/d/gsv-overview` | High-level platform health |
| Agent Metrics | `/d/gsv-agents` | Per-agent performance |
| Infrastructure | `/d/kubernetes-overview` | K8s resource usage |
| Database | `/d/cnpg-postgres` | PostgreSQL metrics |

### 2.2 Alert Configuration

#### PagerDuty / OpsGenie Integration

```yaml
# alertmanager-config.yaml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
    - match:
        severity: warning
      receiver: 'slack-warnings'

receivers:
  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: '<PD_SERVICE_KEY>'

  - name: 'slack-warnings'
    slack_configs:
      - api_url: '<SLACK_WEBHOOK>'
        channel: '#gsv-alerts'
```

### 2.3 Custom Alert Rules

```yaml
# gsv-platform-alerts.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: gsv-platform-alerts
  namespace: observability
spec:
  groups:
    - name: gsv.availability
      rules:
        - alert: AgentRegistryDown
          expr: up{job="agent-registry"} == 0
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "Agent Registry is down"

        - alert: HighLatency
          expr: histogram_quantile(0.99, http_request_duration_seconds_bucket{job="agent-registry"}) > 3
          for: 10m
          labels:
            severity: warning

        - alert: DatabaseConnectionPoolExhausted
          expr: pg_stat_activity_count{datname="agent_registry"} / pg_settings_max_connections > 0.9
          for: 5m
          labels:
            severity: critical
```

---

## 3. Scaling Operations

### 3.1 Horizontal Pod Autoscaling

#### Current HPA Configuration

```bash
# View HPA status
kubectl get hpa -A

# View HPA details
kubectl describe hpa agent-registry -n cmp
```

#### Manual Scaling

```bash
# Scale up agent-registry
kubectl scale deployment/agent-registry -n cmp --replicas=5

# Scale worker pods
kubectl scale deployment/agent-registry-worker -n cmp --replicas=3
```

### 3.2 Vertical Scaling

#### Adjusting Resource Limits

```bash
# Edit deployment resources
kubectl edit deployment/agent-registry -n cmp

# Or via kustomize patch
cat > resource-patch.yaml <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agent-registry
  namespace: cmp
spec:
  template:
    spec:
      containers:
      - name: agent-registry
        resources:
          requests:
            cpu: "500m"
            memory: "1Gi"
          limits:
            cpu: "2000m"
            memory: "4Gi"
EOF
```

### 3.3 Database Scaling

#### Scale PostgreSQL Replicas

```bash
# CNPG cluster scaling
kubectl patch cluster cmp-postgres -n cmp --type merge \
  -p '{"spec":{"instances":3}}'
```

#### Connection Pool Tuning

```yaml
# PgBouncer configuration
pgbouncer:
  poolMode: transaction
  defaultPoolSize: 20
  maxClientConn: 100
```

### 3.4 Scaling Decision Matrix

| Symptom | Metric | Action |
|---------|--------|--------|
| High latency | P99 > 2s | Scale horizontally |
| Memory pressure | > 85% | Increase limits or scale |
| CPU throttling | > 90% | Increase CPU limits |
| Queue backlog | > 500 tasks | Scale workers |
| DB connections | > 80% | Add replicas or pooler |

---

## 4. Updates and Upgrades

### 4.1 Application Updates

#### GitOps Flow (Recommended)

```bash
# 1. Update image tag in kustomization
# platform/overlays/dev/agent-registry/kustomization.yaml
images:
  - name: ghcr.io/digitlify-inc/agent-registry
    newTag: v1.2.3

# 2. Commit and push
git add -A
git commit -m "chore: update agent-registry to v1.2.3"
git push

# 3. ArgoCD syncs automatically (or manual sync)
argocd app sync agent-registry
```

#### Promotion Workflow

```bash
# Promote from dev to QA
make promote.qa

# Promote from QA to Prod (requires approval)
make promote.prod
```

### 4.2 Kubernetes Upgrades

#### Pre-upgrade Checklist

- [ ] Backup all critical data
- [ ] Review deprecation warnings
- [ ] Test upgrade in non-prod first
- [ ] Schedule maintenance window
- [ ] Notify stakeholders

#### Upgrade Process (Kind)

```bash
# 1. Update Kind node image
# scripts/cluster/create-kind-gsv.sh
KIND_NODE_IMAGE="kindest/node:v1.30.0"

# 2. Delete and recreate cluster
make clean
make deploy-dev
```

### 4.3 Helm Chart Updates

```bash
# Update Helm dependencies
helm dependency update ./charts/cmp

# View changes before applying
helm diff upgrade cmp ./charts/cmp -n cmp -f values-cmp-dev.yaml

# Apply upgrade
helm upgrade cmp ./charts/cmp -n cmp -f values-cmp-dev.yaml
```

### 4.4 Database Migrations

```bash
# Run migrations manually (if needed)
kubectl exec -n cmp deployment/agent-registry -- python manage.py migrate

# Check migration status
kubectl exec -n cmp deployment/agent-registry -- python manage.py showmigrations
```

---

## 5. Backup and Recovery

### 5.1 Automated Backups

#### PostgreSQL (CNPG)

```bash
# Check backup status
kubectl get backups -n cmp

# Verify continuous backup
kubectl get cluster cmp-postgres -n cmp -o jsonpath='{.status.firstRecoverabilityPoint}'

# List available recovery points
kubectl get cluster cmp-postgres -n cmp -o jsonpath='{.status.currentPrimary}'
```

#### Manual Backup

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
```

### 5.2 Recovery Procedures

#### Point-in-Time Recovery (PITR)

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
  externalClusters:
    - name: cmp-postgres
      barmanObjectStore:
        destinationPath: s3://gsv-backups/cmp-postgres
        s3Credentials:
          accessKeyId:
            name: backup-creds
            key: ACCESS_KEY_ID
          secretAccessKey:
            name: backup-creds
            key: ACCESS_SECRET_KEY
EOF
```

### 5.3 Disaster Recovery

#### DR Runbook

1. **Assess Impact**
   ```bash
   kubectl get pods -A | grep -v Running
   kubectl get pvc -A | grep -v Bound
   ```

2. **Restore Infrastructure**
   ```bash
   # If cluster is destroyed
   make deploy-dev
   ```

3. **Restore Data**
   ```bash
   # Restore from latest backup
   # See PITR section above
   ```

4. **Verify Recovery**
   ```bash
   ./scripts/verify/smoke-tests.sh
   ```

---

## 6. Incident Response

### 6.1 Incident Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| P1 | Service down | 15 min | API completely unavailable |
| P2 | Degraded service | 1 hour | High latency, partial outage |
| P3 | Minor issue | 4 hours | Non-critical feature broken |
| P4 | Low impact | 24 hours | Cosmetic issues |

### 6.2 Incident Response Steps

#### 1. Acknowledge & Assess

```bash
# Quick status check
kubectl get pods -A | grep -v Running
kubectl get events -A --sort-by='.lastTimestamp' | tail -20
```

#### 2. Mitigate

```bash
# Restart problematic deployment
kubectl rollout restart deployment/agent-registry -n cmp

# Scale up if needed
kubectl scale deployment/agent-registry -n cmp --replicas=5

# Rollback if recent deployment
kubectl rollout undo deployment/agent-registry -n cmp
```

#### 3. Communicate

- Update status page
- Notify stakeholders via Slack/email
- Start incident channel if P1/P2

#### 4. Resolve & Document

- Document root cause
- Create post-incident review
- Update runbooks

### 6.3 Common Incident Scenarios

#### Scenario: High Error Rate

```bash
# 1. Check logs
kubectl logs -n cmp deployment/agent-registry --tail=100 | grep ERROR

# 2. Check database connectivity
kubectl exec -n cmp deployment/agent-registry -- python -c "import django; django.setup(); from django.db import connection; connection.ensure_connection(); print('OK')"

# 3. Check external dependencies
kubectl exec -n cmp deployment/agent-registry -- curl -s http://qdrant:6333/collections

# 4. Restart if needed
kubectl rollout restart deployment/agent-registry -n cmp
```

#### Scenario: Database Issues

```bash
# 1. Check CNPG cluster status
kubectl get cluster -n cmp

# 2. Check primary pod
kubectl logs -n cmp cmp-postgres-1 --tail=50

# 3. Check connections
kubectl exec -n cmp cmp-postgres-1 -- psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# 4. Failover if needed
kubectl cnpg promote cmp-postgres cmp-postgres-2 -n cmp
```

---

## 7. Maintenance Windows

### 7.1 Scheduling Maintenance

| Activity | Frequency | Window | Duration |
|----------|-----------|--------|----------|
| Security patches | Weekly | Tue 2-4 AM | 2 hours |
| Minor updates | Bi-weekly | Wed 2-4 AM | 2 hours |
| Major upgrades | Quarterly | Sat 2-6 AM | 4 hours |
| Database maintenance | Monthly | Sun 3-5 AM | 2 hours |

### 7.2 Pre-Maintenance Checklist

- [ ] Announce maintenance window (48h notice)
- [ ] Create backup
- [ ] Prepare rollback plan
- [ ] Verify monitoring alerts
- [ ] Prepare communication templates

### 7.3 Maintenance Procedures

#### Zero-Downtime Deployment

```bash
# Use rolling update strategy
kubectl patch deployment agent-registry -n cmp -p '
{
  "spec": {
    "strategy": {
      "type": "RollingUpdate",
      "rollingUpdate": {
        "maxSurge": 1,
        "maxUnavailable": 0
      }
    }
  }
}'
```

#### Database Maintenance

```bash
# Run VACUUM ANALYZE
kubectl exec -n cmp cmp-postgres-1 -- psql -U postgres -d agent_registry -c "VACUUM ANALYZE;"

# Check bloat
kubectl exec -n cmp cmp-postgres-1 -- psql -U postgres -d agent_registry -c "
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;"
```

---

## 8. Security Operations

### 8.1 Security Monitoring

```bash
# Check for failed authentication attempts
kubectl logs -n sso deployment/keycloak -f | grep -i "invalid"

# Monitor API key usage
kubectl logs -n cmp deployment/agent-registry -f | grep "api_key"

# Check for suspicious activity
kubectl logs -n cmp deployment/agent-registry -f | grep -E "(injection|XSS|traversal)"
```

### 8.2 Certificate Rotation

```bash
# Check certificate expiry
kubectl get certificates -A -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.notAfter}{"\n"}{end}'

# Force certificate renewal
kubectl delete certificate wildcard-dev-tls -n cert-manager
# cert-manager will auto-recreate
```

### 8.3 Secret Rotation

```bash
# Rotate database password
# 1. Generate new password
NEW_PASS=$(openssl rand -base64 32)

# 2. Update in Vault
kubectl exec -n vault vault-0 -- vault kv put secret/cmp/database password="$NEW_PASS"

# 3. Trigger ESO sync
kubectl annotate externalsecret agent-registry-secrets -n cmp force-sync=$(date +%s) --overwrite

# 4. Restart applications
kubectl rollout restart deployment -n cmp
```

### 8.4 Security Scanning

```bash
# Scan images with Trivy
trivy image ghcr.io/digitlify-inc/agent-registry:latest

# Kubernetes security audit
kubectl auth can-i --list --as=system:serviceaccount:cmp:default
```

---

## 9. Cost Optimization

### 9.1 Resource Right-Sizing

```bash
# Check resource usage vs requests
kubectl top pods -n cmp --containers

# Identify over-provisioned pods
kubectl get pods -n cmp -o custom-columns=NAME:.metadata.name,REQ_CPU:.spec.containers[0].resources.requests.cpu,REQ_MEM:.spec.containers[0].resources.requests.memory
```

### 9.2 Cleanup Unused Resources

```bash
# Delete completed jobs
kubectl delete jobs -n cmp --field-selector status.successful=1

# Clean up old ReplicaSets
kubectl get rs -n cmp -o wide | awk '$2 == 0 {print $1}' | xargs kubectl delete rs -n cmp

# Remove unused PVCs
kubectl get pvc -n cmp --no-headers | while read name _; do
  if ! kubectl get pods -n cmp -o jsonpath='{.items[*].spec.volumes[*].persistentVolumeClaim.claimName}' | grep -q "$name"; then
    echo "Unused PVC: $name"
  fi
done
```

### 9.3 Optimization Recommendations

| Area | Current | Recommendation | Savings |
|------|---------|----------------|---------|
| Agent Registry replicas | 3 | 2 (off-peak) | 33% |
| Worker scaling | Fixed | HPA-based | 20-40% |
| Storage | Premium | Standard (non-DB) | 50% |
| Development cluster | 24/7 | Scheduled | 60% |

---

## 10. Runbooks

### 10.1 Runbook: Agent Registry Restart

```bash
#!/bin/bash
# Runbook: Restart Agent Registry

echo "Step 1: Check current status"
kubectl get pods -n cmp -l app=agent-registry

echo "Step 2: Perform rolling restart"
kubectl rollout restart deployment/agent-registry -n cmp

echo "Step 3: Monitor rollout"
kubectl rollout status deployment/agent-registry -n cmp --timeout=5m

echo "Step 4: Verify health"
kubectl exec -n cmp deployment/agent-registry -- curl -s http://localhost:8000/health/

echo "Step 5: Check logs for errors"
kubectl logs -n cmp deployment/agent-registry --tail=20 | grep -i error || echo "No errors found"
```

### 10.2 Runbook: Database Failover

```bash
#!/bin/bash
# Runbook: PostgreSQL Failover

echo "Step 1: Check current primary"
kubectl get cluster cmp-postgres -n cmp -o jsonpath='{.status.currentPrimary}'

echo "Step 2: Identify new primary"
NEW_PRIMARY=$(kubectl get pods -n cmp -l cnpg.io/cluster=cmp-postgres,role!=primary -o jsonpath='{.items[0].metadata.name}')

echo "Step 3: Promote new primary"
kubectl cnpg promote cmp-postgres $NEW_PRIMARY -n cmp

echo "Step 4: Verify failover"
sleep 30
kubectl get cluster cmp-postgres -n cmp

echo "Step 5: Check application connectivity"
kubectl exec -n cmp deployment/agent-registry -- python -c "from django.db import connection; connection.ensure_connection(); print('OK')"
```

### 10.3 Runbook: Certificate Emergency Renewal

```bash
#!/bin/bash
# Runbook: Emergency Certificate Renewal

CERT_NAME=${1:-wildcard-dev-tls}
NAMESPACE=${2:-cert-manager}

echo "Step 1: Delete existing certificate"
kubectl delete certificate $CERT_NAME -n $NAMESPACE

echo "Step 2: Wait for cert-manager to recreate"
sleep 30

echo "Step 3: Verify new certificate"
kubectl get certificate $CERT_NAME -n $NAMESPACE

echo "Step 4: Check certificate details"
kubectl describe certificate $CERT_NAME -n $NAMESPACE

echo "Step 5: Restart ingress if needed"
kubectl rollout restart deployment/traefik -n traefik
```

---

## Appendix A: Essential Commands

```bash
# Cluster Status
kubectl get nodes
kubectl top nodes
kubectl get pods -A | grep -v Running

# Application Status
kubectl get applications -n argocd
argocd app list

# Logs
kubectl logs -n cmp deployment/agent-registry -f
kubectl logs -n cmp deployment/agent-registry --previous

# Database
kubectl exec -n cmp cmp-postgres-1 -- psql -U postgres -c "SELECT version();"

# Port Forwarding
kubectl port-forward -n cmp svc/agent-registry 8000:80
kubectl port-forward -n argocd svc/argocd-server 8080:443
kubectl port-forward -n observability svc/prometheus-stack-grafana 3000:80
```

---

*Document generated by GSV Platform Engineering Team*
