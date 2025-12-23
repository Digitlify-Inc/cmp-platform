# Operator Runbook - GSV Agent Platform

**Date:** December 11, 2024
**Version:** 1.0

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Health Checks](#component-health-checks)
3. [Common Issues & Resolutions](#common-issues--resolutions)
4. [Monitoring & Alerts](#monitoring--alerts)
5. [Emergency Procedures](#emergency-procedures)

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Waldur CMP    │────▶│ Agent Registry  │◀────│  Config Portal  │
│  (Marketplace)  │     │    (Backend)    │     │   (Frontend)    │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         │ Webhooks              │ API
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   PostgreSQL    │     │     Redis       │
│   (Database)    │     │    (Cache)      │
└─────────────────┘     └─────────────────┘
```

### Components

| Component | Purpose | Port | Health Endpoint |
|-----------|---------|------|-----------------|
| Waldur CMP | Marketplace, Billing | 443 | `/api/` |
| Agent Registry | Backend API | 8000 | `/health/` |
| Config Portal | Frontend UI | 3000 | `/` |
| PostgreSQL | Database | 5432 | N/A |
| Redis | Cache/Queue | 6379 | N/A |
| Celery | Background Tasks | N/A | Flower UI |

---

## Component Health Checks

### Agent Registry

```bash
# Health check
curl -sf https://agent-registry.{env}.gsv.dev/health/

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "version": "1.0.0"
}

# Kubernetes check
kubectl get pods -l app=agent-registry -n agent-registry
kubectl logs -l app=agent-registry -n agent-registry --tail=20
```

### Waldur CMP

```bash
# Health check
curl -sf https://cmp.{env}.gsv.dev/api/

# Kubernetes check
kubectl get pods -n waldur
kubectl logs -l app=waldur-mastermind -n waldur --tail=20
```

### Config Portal

```bash
# Health check
curl -sf https://portal.{env}.gsv.dev/

# Kubernetes check
kubectl get pods -l app=cmp-portal -n portal
kubectl logs -l app=cmp-portal -n portal --tail=20
```

### Database

```bash
# Connection check
kubectl exec -it deploy/agent-registry -n agent-registry -- \
  python -c "import django; django.setup(); from django.db import connection; connection.ensure_connection(); print('OK')"
```

### Redis

```bash
# Connection check
kubectl exec -it deploy/agent-registry -n agent-registry -- \
  python -c "from django.core.cache import cache; cache.set('test', 'ok'); print(cache.get('test'))"
```

---

## Common Issues & Resolutions

### Issue: Webhooks Not Received

**Symptoms:**
- Orders in Waldur but no AgentAccess created
- No webhook logs in Agent Registry

**Diagnosis:**
```bash
# Check Agent Registry logs
kubectl logs -l app=agent-registry -n agent-registry --tail=100 | grep -i webhook

# Check Waldur webhook delivery status
# In Waldur Admin: Structure → Webhooks → View delivery history
```

**Resolution:**

1. **Verify webhook configuration:**
   ```bash
   # List webhooks in Waldur
   curl -X GET "https://cmp.{env}.gsv.dev/api/hooks/" \
     -H "Authorization: Token ${WALDUR_TOKEN}"
   ```

2. **Check network connectivity:**
   ```bash
   # From Waldur pod, test Agent Registry endpoint
   kubectl exec -it deploy/waldur-mastermind -n waldur -- \
     curl -v https://agent-registry.{env}.gsv.dev/webhooks/waldur/order/
   ```

3. **Verify webhook secret matches:**
   ```bash
   # Check Agent Registry secret
   kubectl get secret agent-registry-secrets -n agent-registry -o jsonpath='{.data.WALDUR_WEBHOOK_SECRET}' | base64 -d
   ```

4. **Re-create webhook if needed:**
   - Delete old webhook in Waldur Admin
   - Follow WALDUR-WEBHOOK-SETUP.md to create new one

---

### Issue: Agent Not Appearing in Portal

**Symptoms:**
- Order completed in Waldur
- Webhook received (logs show it)
- Agent not visible in Config Portal

**Diagnosis:**
```bash
# Check if AgentAccess was created
kubectl exec -it deploy/agent-registry -n agent-registry -- \
  python manage.py shell -c "
from agent_registry.access.models import AgentAccess
print(AgentAccess.objects.filter(waldur_order_uuid='<order-uuid>').values())
"

# Check for errors in webhook processing
kubectl logs -l app=agent-registry -n agent-registry --tail=200 | grep -i error
```

**Resolution:**

1. **If AgentAccess missing:**
   - Check webhook logs for processing errors
   - Verify offering UUID matches agent in registry
   - Manually create AgentAccess if needed:
   ```bash
   kubectl exec -it deploy/agent-registry -n agent-registry -- \
     python manage.py shell
   ```
   ```python
   from agent_registry.access.services import AccessService
   access, key = AccessService.create_access_from_order(
       waldur_customer_uuid="...",
       waldur_project_uuid="...",
       waldur_user_uuid="...",
       waldur_user_email="user@example.com",
       waldur_offering_uuid="...",
       waldur_plan_uuid="...",
       waldur_order_uuid="..."
   )
   print(f"Created access: {access.id}, Key: {key}")
   ```

2. **If AgentAccess exists but not visible:**
   - Check user's email matches waldur_user_email
   - Check tenant isolation
   - Clear portal cache and re-login

---

### Issue: API Key Not Working

**Symptoms:**
- 401 or 403 errors when using API key
- Key was generated successfully

**Diagnosis:**
```bash
# Test API key
curl -v -X POST "https://agent-registry.{env}.gsv.dev/api/v1/agents/<agent-id>/chat" \
  -H "X-API-Key: <key>" \
  -d '{"message": "test"}'

# Check key in database
kubectl exec -it deploy/agent-registry -n agent-registry -- \
  python manage.py shell -c "
from agent_registry.access.models import AgentAccess
access = AgentAccess.objects.filter(key_prefix='<first-10-chars>').first()
print(f'Valid: {access.is_valid}, Agent: {access.agent_instance.agent_id}')
"
```

**Resolution:**

1. **Key revoked:** Generate new key in portal
2. **Key expired:** Check expires_at field, generate new key
3. **Wrong agent:** Verify agent_id in request matches access
4. **Quota exceeded:** Check quota_used vs quota_limit

---

### Issue: Usage Not Syncing to Waldur

**Symptoms:**
- API calls working
- Usage visible in Agent Registry
- Waldur billing shows zero usage

**Diagnosis:**
```bash
# Check usage records
kubectl exec -it deploy/agent-registry -n agent-registry -- \
  python manage.py shell -c "
from agent_registry.billing.models import UsageRecord
print(UsageRecord.objects.filter(synced_to_waldur=False).count())
"

# Check Celery task status
kubectl logs -l app=agent-registry-celery -n agent-registry --tail=50 | grep usage
```

**Resolution:**

1. **Manual sync:**
   ```bash
   kubectl exec -it deploy/agent-registry -n agent-registry -- \
     python manage.py sync_usage_to_waldur
   ```

2. **Check Waldur API credentials:**
   ```bash
   # Test Waldur API access
   kubectl exec -it deploy/agent-registry -n agent-registry -- \
     python -c "
from agent_registry.waldur.client import WaldurClient
client = WaldurClient()
print(client.get_customers()[:1])
"
   ```

3. **Restart Celery worker:**
   ```bash
   kubectl rollout restart deployment/agent-registry-celery -n agent-registry
   ```

---

### Issue: SSO Login Failing

**Symptoms:**
- Redirect loop between portal and Keycloak
- "Invalid token" errors

**Diagnosis:**
```bash
# Check Keycloak connectivity
curl -sf https://sso.{env}.gsv.dev/realms/gsv/.well-known/openid-configuration

# Check portal logs
kubectl logs -l app=cmp-portal -n portal --tail=50 | grep -i auth
```

**Resolution:**

1. **Check client configuration:**
   - Verify KEYCLOAK_ID matches Keycloak client
   - Verify KEYCLOAK_ISSUER URL is correct
   - Check redirect URIs in Keycloak

2. **Clear session:**
   - User should clear cookies
   - Try incognito window

3. **Token expiry:**
   - Check Keycloak token lifetimes
   - Verify clock sync between servers

---

## Monitoring & Alerts

### Key Metrics to Monitor

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| API Response Time P95 | > 500ms | > 2000ms | Scale up, check DB |
| Error Rate | > 1% | > 5% | Check logs, roll back |
| Webhook Success Rate | < 99% | < 95% | Check network, secrets |
| Database Connections | > 80% | > 95% | Scale pool, check leaks |
| Redis Memory | > 70% | > 90% | Increase memory, check TTLs |

### Prometheus Queries

```promql
# API error rate
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# Webhook processing time
histogram_quantile(0.95, sum(rate(webhook_processing_seconds_bucket[5m])) by (le))

# Active agent accesses
agent_registry_active_accesses_total

# Usage sync lag
time() - agent_registry_last_usage_sync_timestamp
```

### Alert Rules

```yaml
# Example Prometheus alert rules
groups:
  - name: agent-registry
    rules:
      - alert: HighErrorRate
        expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate in Agent Registry

      - alert: WebhookFailures
        expr: sum(rate(webhook_failures_total[5m])) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: Webhook processing failures detected
```

---

## Emergency Procedures

### Full Service Outage

1. **Assess scope:**
   ```bash
   kubectl get pods -A | grep -E "(agent-registry|waldur|portal)"
   ```

2. **Check infrastructure:**
   - Database connectivity
   - Redis connectivity
   - Network/Ingress

3. **Rollback if recent deployment:**
   ```bash
   kubectl rollout undo deployment/agent-registry -n agent-registry
   ```

4. **Enable maintenance mode:**
   ```bash
   kubectl scale deployment/agent-registry -n agent-registry --replicas=0
   # Update ingress to show maintenance page
   ```

### Data Recovery

1. **Database backup restoration:**
   ```bash
   # List backups
   kubectl get volumesnapshots -n agent-registry

   # Restore from backup
   # (Follow your backup/restore procedure)
   ```

2. **Re-sync from Waldur:**
   ```bash
   kubectl exec -it deploy/agent-registry -n agent-registry -- \
     python manage.py sync_from_waldur --full
   ```

### Security Incident

1. **Rotate secrets immediately:**
   ```bash
   # Generate new webhook secret
   NEW_SECRET=$(openssl rand -hex 32)

   # Update Agent Registry
   kubectl create secret generic agent-registry-secrets \
     --from-literal=WALDUR_WEBHOOK_SECRET=$NEW_SECRET \
     -n agent-registry --dry-run=client -o yaml | kubectl apply -f -

   # Update Waldur webhook configuration
   # Restart services
   kubectl rollout restart deployment/agent-registry -n agent-registry
   ```

2. **Revoke compromised API keys:**
   ```bash
   kubectl exec -it deploy/agent-registry -n agent-registry -- \
     python manage.py revoke_api_keys --before "2024-12-11T00:00:00Z"
   ```

3. **Audit logs:**
   ```bash
   kubectl logs -l app=agent-registry -n agent-registry --since=24h > audit.log
   ```

---

## Contact Information

| Role | Contact | Escalation |
|------|---------|------------|
| On-Call Engineer | pager@gsv.dev | PagerDuty |
| Platform Lead | platform@gsv.dev | Slack #platform |
| Security | security@gsv.dev | Immediate |

---

## Related Documentation

- [Waldur Webhook Setup](./WALDUR-WEBHOOK-SETUP.md)
- [E2E Test Script](./E2E-TEST-SCRIPT.md)
- [GTM Checklist](../GTM-CHECKLIST-2024-12-11.md)
- [Architecture](../gsv-platform/ARCHITECTURE.md)
