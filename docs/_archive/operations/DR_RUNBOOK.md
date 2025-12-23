# Weekly DR Drill Runbook

Disaster Recovery practice procedures for GSV Platform.

---

## Schedule

| Week | Date | Drill Type | Duration |
|------|------|------------|----------|
| 1 | TBD | Velero namespace restore | 1 hour |
| 2 | TBD | CNPG point-in-time recovery | 1 hour |
| 3 | TBD | Full cluster rebuild | 2 hours |
| 4 | TBD | Cross-environment restore | 2 hours |

---

## Pre-Drill Checklist

- [ ] Notify team of DR drill
- [ ] Verify backups exist and are recent
- [ ] Document current state (pod counts, data checksums)
- [ ] Have rollback plan ready

---

## Drill 1: Velero Namespace Restore

**Objective:** Restore a single namespace from Velero backup.

### Step 1: Create Backup

```bash
# Manual backup before drill
velero backup create pre-drill-$(date +%Y%m%d) \
  --include-namespaces agentstudio \
  --wait

# Verify backup
velero backup describe pre-drill-$(date +%Y%m%d)
```

### Step 2: Simulate Disaster

```bash
# Delete namespace (CAUTION: destructive!)
kubectl delete namespace agentstudio

# Verify deletion
kubectl get ns agentstudio
# Should show: not found
```

### Step 3: Restore

```bash
# Restore from backup
velero restore create --from-backup pre-drill-$(date +%Y%m%d) --wait

# Verify restore
kubectl get pods -n agentstudio
kubectl get pvc -n agentstudio
```

### Step 4: Validate

```bash
# Check application health
curl -k https://studio.dev.gsv.dev/health

# Check ArgoCD sync
kubectl get app agentstudio -n argocd
```

### Success Criteria

- [ ] Namespace restored
- [ ] All pods running
- [ ] PVCs restored with data
- [ ] Application accessible
- [ ] Data intact

---

## Drill 2: CNPG Point-in-Time Recovery

**Objective:** Restore PostgreSQL to specific point in time.

### Step 1: Note Current State

```bash
# Connect to database and note row counts
kubectl exec -it -n agentstudio agentstudio-postgres-1 -- psql -U app -d app -c "SELECT COUNT(*) FROM flows;"
```

### Step 2: Create Test Data

```bash
# Insert test row with timestamp
kubectl exec -it -n agentstudio agentstudio-postgres-1 -- psql -U app -d app -c \
  "INSERT INTO test_dr (created_at, data) VALUES (NOW(), 'pre-disaster-data');"

# Note the time
echo "Recovery point: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

### Step 3: Simulate Data Loss

```bash
# Wait 2 minutes, then corrupt data
sleep 120
kubectl exec -it -n agentstudio agentstudio-postgres-1 -- psql -U app -d app -c \
  "DELETE FROM test_dr;"
```

### Step 4: PITR Restore

```bash
# Create recovery cluster pointing to backup
cat <<EOF | kubectl apply -f -
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: agentstudio-postgres-recovery
  namespace: agentstudio
spec:
  instances: 1
  storage:
    size: 5Gi
  bootstrap:
    recovery:
      source: agentstudio-postgres
      recoveryTarget:
        targetTime: "2025-11-27T12:00:00Z"  # Set to your recovery point
  externalClusters:
    - name: agentstudio-postgres
      barmanObjectStore:
        destinationPath: s3://cnpg-backups/agentstudio
        endpointURL: http://minio.backup-system.svc.cluster.local:9000
        s3Credentials:
          accessKeyId:
            name: cnpg-backup-creds
            key: ACCESS_KEY_ID
          secretAccessKey:
            name: cnpg-backup-creds
            key: SECRET_ACCESS_KEY
EOF
```

### Step 5: Validate Recovery

```bash
# Check recovered data
kubectl exec -it -n agentstudio agentstudio-postgres-recovery-1 -- psql -U app -d app -c \
  "SELECT * FROM test_dr;"

# Should show pre-disaster data
```

### Success Criteria

- [ ] Recovery cluster created
- [ ] Data restored to correct point in time
- [ ] No data loss beyond recovery point

---

## Drill 3: Full Cluster Rebuild

**Objective:** Rebuild entire platform from scratch.

### Step 1: Document Current State

```bash
# Export current state
kubectl get applications -n argocd -o yaml > /tmp/apps-backup.yaml
kubectl get secrets -n argocd -o yaml > /tmp/secrets-backup.yaml

# Note all running pods
kubectl get pods -A > /tmp/pods-before.txt
```

### Step 2: Destroy Cluster

```bash
# Delete Kind cluster
make kind.down

# Verify deletion
kind get clusters
```

### Step 3: Rebuild from GitOps

```bash
# Full rebuild
make deploy-dev

# This should:
# 1. Create new Kind cluster
# 2. Install Traefik, cert-manager
# 3. Install ArgoCD
# 4. Bootstrap GitOps
# 5. Sync all applications
```

### Step 4: Restore Data

```bash
# Once cluster is up, restore Velero backups
velero restore create full-restore --from-backup <latest-backup>

# Or restore CNPG from object storage
# (databases auto-restore from barmanObjectStore if configured)
```

### Step 5: Validate

```bash
# Compare pod counts
kubectl get pods -A > /tmp/pods-after.txt
diff /tmp/pods-before.txt /tmp/pods-after.txt

# Test all endpoints
curl -k https://argocd.dev.gsv.dev
curl -k https://studio.dev.gsv.dev
curl -k https://portal.dev.gsv.dev
curl -k https://sso.dev.gsv.dev
```

### Success Criteria

- [ ] Cluster rebuilt in < 30 minutes
- [ ] All applications synced
- [ ] Data restored from backups
- [ ] All endpoints accessible

---

## Drill 4: Cross-Environment Restore

**Objective:** Restore production backup to dev environment.

### Step 1: Export Production Backup

```bash
# On production cluster
velero backup create prod-export-$(date +%Y%m%d) \
  --include-namespaces cmp,keycloak \
  --wait

# Copy backup to dev MinIO (or use shared S3)
```

### Step 2: Import to Dev

```bash
# On dev cluster
# Configure Velero to read from production backup location
# Restore with namespace mapping if needed

velero restore create --from-backup prod-export-$(date +%Y%m%d) \
  --namespace-mappings cmp:cmp-restored
```

### Step 3: Validate

```bash
kubectl get pods -n cmp-restored
```

---

## Post-Drill Report Template

```markdown
# DR Drill Report - [Date]

## Drill Type
[Velero Restore / CNPG PITR / Full Rebuild / Cross-Env]

## Participants
- [Names]

## Timeline
- Start: [time]
- Disaster simulated: [time]
- Recovery started: [time]
- Recovery complete: [time]
- Validation complete: [time]

## Metrics
- RTO (Recovery Time Objective): [target]
- RTO (Actual): [actual]
- RPO (Recovery Point Objective): [target]
- RPO (Actual): [actual]

## Issues Encountered
1. [Issue and resolution]

## Action Items
- [ ] [Improvement needed]

## Next Drill
- Date: [date]
- Type: [type]
```

---

## Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| Platform Lead | TBD | TBD |
| On-Call | TBD | TBD |

---

*Last Updated: November 27, 2025*
