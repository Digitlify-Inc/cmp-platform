# Backup & Disaster Recovery Guide

Guide for backing up and restoring the GSV Platform.

---

## Overview

The GSV Platform uses a multi-layer backup strategy:

| Layer | Tool | Scope |
|-------|------|-------|
| Kubernetes Resources | Velero | Namespaces, ConfigMaps, Secrets, Deployments |
| PostgreSQL Databases | CNPG | Point-in-time recovery, continuous WAL archiving |
| Object Storage | MinIO | Backup target for both Velero and CNPG |

---

## Components

### MinIO (Object Storage)
- **Purpose:** S3-compatible storage for backups
- **URL:** https://minio.dev.gsv.dev
- **Credentials:** minio / minio123
- **Buckets:**
  - `velero-backups` - Kubernetes resource backups
  - `cnpg-backups` - PostgreSQL WAL and base backups
  - `waldur-backups` - Application-level exports

### Velero (Kubernetes Backup)
- **Purpose:** Backup/restore Kubernetes resources and PVs
- **Namespace:** velero
- **Schedule:** Daily at 2 AM, 7-day retention

### CNPG (PostgreSQL Backup)
- **Purpose:** Continuous WAL archiving and point-in-time recovery
- **Clusters:** cmp-postgres, cmp-keycloak-pg, agentstudio-postgres, agentruntime-postgres

---

## Daily Operations

### Check Backup Status

```bash
# Velero backups
kubectl get backups -n velero

# Velero backup details
velero backup describe <backup-name> --details

# CNPG cluster status (includes backup info)
kubectl get clusters -A
kubectl describe cluster cmp-postgres -n cmp | grep -A 20 "Status:"
```

### Manual Backup

```bash
# Create immediate Velero backup
velero backup create manual-backup-$(date +%Y%m%d) \
  --include-namespaces agentstudio,agentruntime,cmp,keycloak

# Trigger CNPG on-demand backup
kubectl annotate cluster cmp-postgres -n cmp \
  cnpg.io/immediateBackup=$(date +%Y%m%dT%H%M%S)
```

---

## Restore Procedures

### Restore Kubernetes Resources (Velero)

```bash
# List available backups
velero backup get

# Restore entire backup
velero restore create --from-backup <backup-name>

# Restore specific namespace
velero restore create --from-backup <backup-name> \
  --include-namespaces agentstudio

# Restore specific resources
velero restore create --from-backup <backup-name> \
  --include-resources configmaps,secrets
```

### Restore PostgreSQL (CNPG)

#### Option 1: Point-in-Time Recovery

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: cmp-postgres-restored
  namespace: cmp
spec:
  instances: 2
  
  bootstrap:
    recovery:
      source: cmp-postgres
      recoveryTarget:
        targetTime: "2025-11-27T10:00:00Z"  # Restore to this point
  
  externalClusters:
    - name: cmp-postgres
      barmanObjectStore:
        destinationPath: s3://cnpg-backups/cmp-postgres
        endpointURL: http://minio.backup-system.svc.cluster.local:9000
        s3Credentials:
          accessKeyId:
            name: cnpg-backup-creds
            key: ACCESS_KEY_ID
          secretAccessKey:
            name: cnpg-backup-creds
            key: SECRET_ACCESS_KEY
```

#### Option 2: Restore from Base Backup

```bash
# List available backups in MinIO
kubectl run mc --rm -it --restart=Never --image=minio/mc -- \
  ls minio/cnpg-backups/cmp-postgres/

# Apply recovery cluster manifest
kubectl apply -f recovery-cluster.yaml
```

---

## Disaster Recovery Scenarios

### Scenario 1: Single Pod Failure
**Impact:** Minimal - CNPG auto-heals
**Action:** None required, automatic recovery

### Scenario 2: Database Corruption
**Impact:** Data integrity issue
**Action:**
1. Identify corruption point
2. Create PITR recovery cluster
3. Validate data
4. Switchover applications

### Scenario 3: Namespace Deleted
**Impact:** Service outage
**Action:**
```bash
# Restore from Velero
velero restore create ns-restore \
  --from-backup daily-backup-YYYYMMDD \
  --include-namespaces <namespace>
```

### Scenario 4: Full Cluster Loss
**Impact:** Complete outage
**Action:**
1. Provision new cluster
2. Install ArgoCD
3. Bootstrap GitOps (auto-deploys apps)
4. Restore databases from MinIO backups
5. Restore Velero resources

---

## CNPG Backup Configuration

Each CNPG cluster should have backup configured:

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: cmp-postgres
  namespace: cmp
spec:
  instances: 3
  
  backup:
    barmanObjectStore:
      destinationPath: s3://cnpg-backups/cmp-postgres
      endpointURL: http://minio.backup-system.svc.cluster.local:9000
      s3Credentials:
        accessKeyId:
          name: cnpg-backup-creds
          key: ACCESS_KEY_ID
        secretAccessKey:
          name: cnpg-backup-creds
          key: SECRET_ACCESS_KEY
      wal:
        compression: gzip
      data:
        compression: gzip
    retentionPolicy: "7d"
  
  # Scheduled backups
  backup:
    schedule: "0 0 2 * * *"  # 2 AM daily
```

---

## Monitoring Backups

### Grafana Dashboards
- CNPG dashboard shows backup status
- Custom Velero dashboard for backup metrics

### Alerts
```yaml
# Example PrometheusRule for backup alerts
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: backup-alerts
  namespace: observability
spec:
  groups:
    - name: backups
      rules:
        - alert: VeleroBackupFailed
          expr: velero_backup_failure_total > 0
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "Velero backup failed"
        
        - alert: CNPGBackupStale
          expr: time() - cnpg_pg_wal_archive_last_archived_time > 3600
          for: 10m
          labels:
            severity: warning
          annotations:
            summary: "CNPG WAL archiving is stale"
```

---

## Testing Backups

### Monthly Restore Test
1. Create test namespace
2. Restore backup to test namespace
3. Validate data integrity
4. Delete test namespace

```bash
# Restore to test namespace
velero restore create test-restore \
  --from-backup daily-backup-YYYYMMDD \
  --namespace-mappings cmp:cmp-test

# Validate
kubectl get pods -n cmp-test
kubectl exec -it cmp-postgres-1 -n cmp-test -- psql -c "SELECT count(*) FROM waldur_core_user;"

# Cleanup
kubectl delete namespace cmp-test
```

---

## Retention Policies

| Backup Type | Retention | Storage |
|-------------|-----------|---------|
| Velero Daily | 7 days | MinIO |
| CNPG WAL | 7 days | MinIO |
| CNPG Base | 7 days | MinIO |
| Manual Backups | 30 days | MinIO |

---

## Production Considerations

1. **Use external object storage** (S3, GCS, Azure Blob) instead of in-cluster MinIO
2. **Enable encryption at rest** for backup buckets
3. **Cross-region replication** for disaster recovery
4. **Regular restore testing** (monthly minimum)
5. **Separate backup credentials** from application credentials
6. **Monitor backup size growth** to plan capacity

---

## Quick Reference

```bash
# Velero CLI
velero backup get
velero backup describe <name>
velero restore create --from-backup <name>
velero schedule get

# CNPG status
kubectl get clusters -A
kubectl describe cluster <name> -n <namespace>

# MinIO CLI
kubectl run mc --rm -it --restart=Never --image=minio/mc -- \
  config host add minio http://minio.backup-system:9000 minio minio123
```

---

*Last Updated: November 27, 2025*
