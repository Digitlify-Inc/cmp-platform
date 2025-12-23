# GSV Platform Administrator Guide

**Version:** 1.0
**Last Updated:** December 2024
**Audience:** Platform Administrators

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Architecture Overview](#2-architecture-overview)
3. [Access Management](#3-access-management)
4. [User and Tenant Management](#4-user-and-tenant-management)
5. [Agent Administration](#5-agent-administration)
6. [Billing and Usage Management](#6-billing-and-usage-management)
7. [Security Administration](#7-security-administration)
8. [Monitoring and Alerting](#8-monitoring-and-alerting)
9. [Backup and Recovery](#9-backup-and-recovery)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Introduction

### 1.1 Purpose

This guide provides comprehensive instructions for administering the GSV AI Agents Platform. It covers user management, security configuration, billing oversight, and platform monitoring.

### 1.2 Administrator Roles

| Role | Responsibilities |
|------|-----------------|
| **Platform Admin** | Full access to all platform functions, infrastructure management |
| **Tenant Admin** | Manage users and resources within a specific tenant/organization |
| **Billing Admin** | Access to billing, invoicing, and usage reports |
| **Security Admin** | Manage SSO, API keys, and security policies |

### 1.3 Admin Access URLs

| Environment | Admin Portal | ArgoCD | Grafana |
|-------------|--------------|--------|---------|
| Development | https://portal.dev.gsv.dev/admin | https://argocd.dev.gsv.dev | https://grafana.dev.gsv.dev |
| QA | https://portal.qa.gsv.dev/admin | https://argocd.qa.gsv.dev | https://grafana.qa.gsv.dev |
| Production | https://portal.digitlify.com/admin | https://argocd.digitlify.com | https://grafana.digitlify.com |

---

## 2. Architecture Overview

### 2.1 Platform Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GSV PLATFORM ADMIN VIEW                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Keycloak   │  │    Portal    │  │ Agent Studio │  │   Registry   │ │
│  │  (SSO/IAM)   │  │  (Frontend)  │  │  (LangFlow)  │  │   (Django)   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                 │                 │                 │          │
│         └─────────────────┼─────────────────┼─────────────────┘          │
│                           │                 │                            │
│                    ┌──────┴─────────────────┴──────┐                    │
│                    │        AGENT REGISTRY         │                    │
│                    │    (Central Orchestration)    │                    │
│                    └───────────────────────────────┘                    │
│                                   │                                      │
│         ┌─────────────────────────┼─────────────────────────┐           │
│         │                         │                         │           │
│  ┌──────┴──────┐          ┌───────┴───────┐         ┌───────┴───────┐  │
│  │   CMP       │          │ Agent Runtime │         │    Qdrant     │  │
│  │  (Waldur)   │          │  (LangFlow)   │         │  (VectorDB)   │  │
│  └─────────────┘          └───────────────┘         └───────────────┘  │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE: PostgreSQL (CNPG) | Redis | RabbitMQ | S3/MinIO       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Kubernetes Namespaces

| Namespace | Components | Admin Access |
|-----------|------------|--------------|
| `argocd` | ArgoCD Server, Application Controller | GitOps management |
| `sso` | Keycloak, oauth2-proxy | Identity management |
| `cmp` | Waldur, Agent Registry, Portal, Qdrant | Business applications |
| `agentstudio` | LangFlow (design) | Agent development |
| `agentruntime` | LangFlow (execution) | Agent execution |
| `observability` | Prometheus, Grafana, Loki | Monitoring |
| `vault` | HashiCorp Vault | Secrets management |

---

## 3. Access Management

### 3.1 Keycloak Administration

#### Accessing Keycloak Admin Console

```bash
# Development
https://sso.dev.gsv.dev/admin/master/console/

# Get admin credentials (from secret)
kubectl get secret keycloak-admin -n sso -o jsonpath='{.data.password}' | base64 -d
```

#### Realm Configuration

The GSV Platform uses a dedicated realm named `gsv`:

| Setting | Value | Description |
|---------|-------|-------------|
| Realm Name | `gsv` | Main authentication realm |
| Login Theme | `keycloak` | Custom branding available |
| Account Theme | `keycloak` | User self-service portal |
| Email Verification | Enabled | Verify email on registration |
| Password Policy | 8+ chars, mixed case | Enterprise security |

#### Creating OIDC Clients

For new service integration:

1. Navigate to **Clients** → **Create client**
2. Configure:
   - **Client ID**: `service-name`
   - **Client Protocol**: `openid-connect`
   - **Access Type**: `confidential`
   - **Valid Redirect URIs**: `https://service.domain.com/*`
3. Under **Credentials** tab, copy the client secret

### 3.2 Role-Based Access Control (RBAC)

#### Platform Roles

| Role | Scope | Permissions |
|------|-------|-------------|
| `platform-admin` | Global | Full platform administration |
| `org-admin` | Organization | Manage organization users and agents |
| `provider` | Organization | Create, deploy, publish agents |
| `customer` | Organization | Subscribe, configure, use agents |
| `viewer` | Organization | Read-only access to dashboards |

#### Assigning Roles

```bash
# Via Keycloak Admin Console
1. Users → Select User → Role Mappings
2. Available Roles → Select Role → Add selected

# Via API (example)
curl -X POST "https://sso.dev.gsv.dev/admin/realms/gsv/users/{user-id}/role-mappings/realm" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '[{"id":"role-id","name":"provider"}]'
```

### 3.3 API Key Management

#### Generating API Keys

API keys are automatically generated when customers subscribe to agents:

```python
# Format: ar_{random_32_chars}
# Example: ar_sk_live_x7k9m2n4p6q8r0s1t3u5v7w9
```

#### Revoking API Keys

```bash
# Via Admin API
curl -X DELETE "https://api.dev.gsv.dev/api/v1/admin/api-keys/{key_id}/" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

#### Listing All API Keys for a Tenant

```bash
curl -X GET "https://api.dev.gsv.dev/api/v1/admin/tenants/{tenant_id}/api-keys/" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

---

## 4. User and Tenant Management

### 4.1 Tenant (Organization) Management

#### Creating a New Tenant

```bash
# Via Admin API
curl -X POST "https://api.dev.gsv.dev/api/v1/admin/tenants/" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "slug": "acme-corp",
    "type": "ORGANIZATION",
    "billing_email": "billing@acme.com",
    "settings": {
      "max_users": 50,
      "max_agents": 10
    }
  }'
```

#### Tenant Types

| Type | Description | Use Case |
|------|-------------|----------|
| `INDIVIDUAL` | Single user | Personal accounts |
| `ORGANIZATION` | Multi-user team | Business accounts |
| `ENTERPRISE` | Large organization | Custom SLAs, dedicated resources |

### 4.2 User Management

#### Viewing All Users

```bash
# Django Admin
https://api.dev.gsv.dev/admin/tenants/user/

# API Endpoint
curl -X GET "https://api.dev.gsv.dev/api/v1/admin/users/" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

#### User Lifecycle Management

| Status | Description | Admin Action |
|--------|-------------|--------------|
| Active | Normal access | Default state |
| Suspended | Temporary block | Can be reactivated |
| Deactivated | Permanent block | Data retained |
| Deleted | Account removed | GDPR compliance |

#### Suspending a User

```bash
curl -X POST "https://api.dev.gsv.dev/api/v1/admin/users/{user_id}/suspend/" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

### 4.3 Membership Management

#### Adding Users to Tenant

```bash
curl -X POST "https://api.dev.gsv.dev/api/v1/admin/tenants/{tenant_id}/members/" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "role": "member"
  }'
```

---

## 5. Agent Administration

### 5.1 Agent Lifecycle

```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐
│  DRAFT  │───>│ DEPLOYED │───>│  LISTED  │───>│ RETIRED│
└─────────┘    └──────────┘    └──────────┘    └────────┘
     │              │               │
     │              │               │
     v              v               v
  Design         Testing       Production
```

### 5.2 Agent States

| State | Description | Allowed Actions |
|-------|-------------|-----------------|
| `DRAFT` | Being designed | Edit, Delete |
| `DEPLOYED` | Running in runtime | Test, Publish, Undeploy |
| `LISTED` | Available in marketplace | Delist, Update pricing |
| `RETIRED` | No longer available | Archive, Delete |

### 5.3 Managing Agents

#### Listing All Agents

```bash
# All agents across tenants (admin only)
curl -X GET "https://api.dev.gsv.dev/api/v1/admin/agents/" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

#### Force Undeploy an Agent

```bash
curl -X POST "https://api.dev.gsv.dev/api/v1/admin/agents/{agent_id}/force-undeploy/" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

#### Review Agent Before Publishing

```bash
# Mark agent as reviewed
curl -X POST "https://api.dev.gsv.dev/api/v1/admin/agents/{agent_id}/approve/" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{"review_notes": "Approved for marketplace"}'
```

### 5.4 Agent Deployment Verification

```bash
# Check runtime deployment
kubectl get pods -n agentruntime -l app=agent-runtime

# Check specific agent logs
kubectl logs -n agentruntime deployment/agent-runtime -f

# Verify agent health
curl -X GET "https://runtime.dev.gsv.dev/api/v1/flows/{flow_id}/health"
```

---

## 6. Billing and Usage Management

### 6.1 Usage Tracking

#### Viewing Usage Statistics

```bash
# Tenant usage summary
curl -X GET "https://api.dev.gsv.dev/api/v1/admin/usage/summary/?tenant_id={tenant_id}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

#### Usage Metrics Collected

| Metric | Description | Billing Impact |
|--------|-------------|----------------|
| `api_calls` | Total API requests | Per-call pricing |
| `tokens_input` | Input tokens processed | LLM cost |
| `tokens_output` | Output tokens generated | LLM cost |
| `response_time_ms` | Average latency | SLA tracking |
| `storage_bytes` | Vector storage used | Storage tier |

### 6.2 Plan Management

#### Available Plans

| Plan | Monthly Quota | Rate Limit | Price |
|------|---------------|------------|-------|
| Free Trial | 100 messages | 1 req/sec | €0 |
| Starter | 1,000 messages | 5 req/sec | €29 |
| Professional | 10,000 messages | 20 req/sec | €99 |
| Enterprise | Unlimited | 100 req/sec | Custom |

#### Modifying Subscription

```bash
# Upgrade plan
curl -X POST "https://api.dev.gsv.dev/api/v1/admin/subscriptions/{sub_id}/upgrade/" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{"new_plan": "professional"}'
```

### 6.3 Billing Reports

#### Generating Usage Report

```bash
# Export billing data
curl -X GET "https://api.dev.gsv.dev/api/v1/admin/billing/export/?start_date=2024-01-01&end_date=2024-01-31&format=csv" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -o billing_report.csv
```

### 6.4 Waldur Integration

#### Sync Usage to Waldur

```bash
# Trigger manual sync
curl -X POST "https://api.dev.gsv.dev/api/v1/admin/waldur/sync-usage/" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

#### View Waldur Offerings

```bash
# List all marketplace offerings
kubectl exec -n cmp deployment/waldur-mastermind-api -- \
  waldur marketplace offering list
```

---

## 7. Security Administration

### 7.1 Security Checklist

- [ ] OIDC clients use `confidential` access type
- [ ] API rate limiting enabled
- [ ] Webhook signatures validated
- [ ] TLS certificates valid and not expiring
- [ ] Database passwords rotated quarterly
- [ ] API keys have expiration dates
- [ ] Audit logs retained for 90+ days

### 7.2 Certificate Management

#### Checking Certificate Expiry

```bash
# List all certificates
kubectl get certificates -A

# Check specific certificate
kubectl describe certificate wildcard-dev-tls -n cert-manager
```

#### Renewing Certificates

Certificates are auto-renewed by cert-manager. For manual renewal:

```bash
# Force renewal
kubectl delete certificate wildcard-dev-tls -n cert-manager
# cert-manager will recreate automatically
```

### 7.3 Secrets Management

#### Viewing Secrets (Names Only)

```bash
# List secrets in namespace
kubectl get secrets -n cmp

# Never display secret values in logs
# Use kubectl describe for metadata only
kubectl describe secret agent-registry-secrets -n cmp
```

#### Rotating Secrets

```bash
# Step 1: Update secret in vault
kubectl exec -n vault vault-0 -- vault kv put secret/cmp/database password="newpassword"

# Step 2: Trigger ESO sync
kubectl annotate externalsecret agent-registry-secrets -n cmp force-sync=$(date +%s) --overwrite

# Step 3: Restart affected deployments
kubectl rollout restart deployment/agent-registry -n cmp
```

### 7.4 Audit Logging

#### Viewing Audit Logs

```bash
# Application logs
kubectl logs -n cmp deployment/agent-registry -f | grep -i audit

# Kubernetes audit logs (if enabled)
kubectl logs -n kube-system -l component=kube-apiserver | grep audit
```

---

## 8. Monitoring and Alerting

### 8.1 Grafana Dashboards

| Dashboard | Purpose | Key Metrics |
|-----------|---------|-------------|
| Platform Overview | High-level health | Request rate, error rate, latency |
| Agent Performance | Per-agent metrics | Response time, token usage |
| Infrastructure | K8s resources | CPU, memory, disk |
| Billing | Usage tracking | API calls, quota usage |

### 8.2 Key Metrics to Monitor

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Error Rate | > 1% | > 5% | Check logs, scale up |
| P99 Latency | > 2s | > 5s | Optimize queries |
| CPU Usage | > 70% | > 90% | Scale horizontally |
| Memory | > 75% | > 90% | Increase limits |
| Disk | > 70% | > 85% | Expand PVC |

### 8.3 Alert Configuration

#### Prometheus Alert Rules

```yaml
# Example critical alert
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: gsv-platform-alerts
  namespace: observability
spec:
  groups:
    - name: gsv-platform
      rules:
        - alert: HighErrorRate
          expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: High error rate detected
            description: Error rate is above 5% for 5 minutes
```

### 8.4 Log Aggregation

#### Accessing Logs via Loki

```bash
# Grafana Explore → Loki
# Query examples:

# All agent-registry errors
{namespace="cmp", app="agent-registry"} |= "ERROR"

# Specific user activity
{namespace="cmp"} |= "user_id=uuid-here"

# Webhook processing
{namespace="cmp", app="agent-registry"} |= "webhook"
```

---

## 9. Backup and Recovery

### 9.1 Backup Strategy

| Component | Backup Method | Frequency | Retention |
|-----------|---------------|-----------|-----------|
| PostgreSQL | CNPG continuous backup | Continuous | 30 days |
| Redis | Snapshot | Hourly | 7 days |
| Qdrant | Volume snapshot | Daily | 14 days |
| Keycloak | Database backup | Daily | 30 days |
| ArgoCD | Git repository | Continuous | Unlimited |

### 9.2 PostgreSQL Backup (CNPG)

#### Checking Backup Status

```bash
# List backups
kubectl get backups -n cmp

# Check continuous backup status
kubectl get cluster cmp-postgres -n cmp -o jsonpath='{.status.lastSuccessfulBackup}'
```

#### Point-in-Time Recovery

```bash
# Restore to specific time
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
        targetTime: "2024-12-04T10:30:00Z"
EOF
```

### 9.3 Disaster Recovery

#### Recovery Procedure

1. **Assess Damage**
   ```bash
   kubectl get pods -A | grep -v Running
   kubectl get pvc -A | grep -v Bound
   ```

2. **Restore Database**
   ```bash
   # Trigger CNPG recovery
   kubectl patch cluster cmp-postgres -n cmp --type merge \
     -p '{"spec":{"bootstrap":{"recovery":{"source":"backup-name"}}}}'
   ```

3. **Restore Application State**
   ```bash
   # Force ArgoCD sync
   argocd app sync gsv-platform --force
   ```

4. **Verify Recovery**
   ```bash
   # Run smoke tests
   ./scripts/verify/smoke-tests.sh
   ```

---

## 10. Troubleshooting

### 10.1 Common Issues

#### Issue: Users Cannot Login

```bash
# Check Keycloak status
kubectl get pods -n sso -l app=keycloak

# Check oauth2-proxy logs
kubectl logs -n agentstudio deployment/oauth2-proxy -f

# Verify realm configuration
curl -s https://sso.dev.gsv.dev/realms/gsv/.well-known/openid-configuration | jq .
```

#### Issue: Agent Not Responding

```bash
# Check agent runtime
kubectl get pods -n agentruntime

# View agent logs
kubectl logs -n agentruntime deployment/agent-runtime -f

# Test agent endpoint directly
kubectl exec -n cmp deployment/agent-registry -- \
  curl -s http://agent-runtime.agentruntime.svc.cluster.local:7860/api/v1/flows
```

#### Issue: High Latency

```bash
# Check resource usage
kubectl top pods -n cmp

# Review database performance
kubectl exec -n cmp cmp-postgres-1 -- psql -U postgres -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Check Qdrant performance
kubectl logs -n cmp deployment/qdrant -f
```

### 10.2 Debug Commands

```bash
# Platform status summary
kubectl get applications -n argocd
kubectl get pods -A | grep -v Running | grep -v Completed

# Quick health check
for svc in agent-registry keycloak waldur-api; do
  echo "Checking $svc..."
  kubectl exec -n cmp deployment/agent-registry -- curl -s "http://$svc/health" 2>/dev/null || echo "FAILED"
done

# Database connectivity
kubectl exec -n cmp deployment/agent-registry -- python -c "import django; django.setup(); from django.db import connection; connection.ensure_connection(); print('DB OK')"

# Redis connectivity
kubectl exec -n cmp deployment/agent-registry -- python -c "import redis; r=redis.from_url('redis://redis:6379'); print(r.ping())"
```

### 10.3 Support Escalation

| Severity | Response Time | Contact |
|----------|---------------|---------|
| P1 - Critical | 1 hour | oncall@digitlify.com |
| P2 - High | 4 hours | support@digitlify.com |
| P3 - Medium | 1 business day | support@digitlify.com |
| P4 - Low | 3 business days | support@digitlify.com |

---

## Appendix A: Admin API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/users/` | GET | List all users |
| `/api/v1/admin/tenants/` | GET/POST | Manage tenants |
| `/api/v1/admin/agents/` | GET | List all agents |
| `/api/v1/admin/usage/` | GET | Usage reports |
| `/api/v1/admin/billing/` | GET | Billing data |

## Appendix B: Useful kubectl Commands

```bash
# Restart deployment
kubectl rollout restart deployment/agent-registry -n cmp

# Scale deployment
kubectl scale deployment/agent-registry --replicas=3 -n cmp

# View events
kubectl get events -n cmp --sort-by='.lastTimestamp'

# Port forward for debugging
kubectl port-forward -n cmp svc/agent-registry 8000:80

# Execute command in pod
kubectl exec -it -n cmp deployment/agent-registry -- /bin/bash
```

---

*Document generated by GSV Platform Engineering Team*
