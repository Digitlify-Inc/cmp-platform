# Cluster Management Guide

Best practices for managing Kind cluster lifecycle, especially around system restarts.

---

## The Problem

Kind clusters run as Docker containers. When you restart your laptop/workstation:
1. Docker containers restart in undefined order
2. Pods may fail due to dependency ordering issues
3. Network configuration may change (especially Docker gateway IP)
4. PVCs might have mount issues

---

## Solutions

### Option 1: Graceful Shutdown/Startup (Recommended for Dev)

**Before system shutdown:**
```bash
make cluster.shutdown
```

This:
- Saves current cluster state
- Scales down application pods gracefully
- Leaves infrastructure (ArgoCD, Traefik) running

**After system restart:**
```bash
make cluster.startup
```

This:
- Waits for Docker to be ready
- Verifies cluster connectivity
- Triggers ArgoCD sync for all apps
- Restarts any stuck pods

---

### Option 2: Quick Rebuild (Fastest Recovery)

If cluster is in bad state, just rebuild it:

```bash
make clean
make deploy-dev
```

With GitOps, everything rebuilds from Git in ~10-15 minutes. This is often faster than debugging a broken cluster.

---

### Option 3: Manual Recovery

If you need to recover manually:

```bash
# 1. Check Docker is running
docker ps

# 2. Check cluster exists
kind get clusters

# 3. Set kubectl context
kubectl cluster-info --context kind-kind-gsv

# 4. Check what's broken
kubectl get pods -A | grep -v Running

# 5. Delete stuck pods (they'll be recreated)
kubectl delete pod <pod-name> -n <namespace> --force

# 6. Force ArgoCD sync
make gitops.sync-all
```

---

## Best Practices

### Daily Workflow

```bash
# End of day - shutdown gracefully
make cluster.shutdown
# Then shutdown laptop

# Next day - startup
# Start laptop, wait for Docker
make cluster.startup
make status
```

### When in Doubt, Rebuild

The cluster is cattle, not pets. If it's misbehaving:

```bash
make clean && make deploy-dev
```

All state is in Git. All data can be restored from backups.

---

## Common Issues After Restart

### Issue: Pods stuck in ContainerCreating

```bash
# Check events
kubectl describe pod <pod> -n <ns>

# Usually PVC mount issue - delete and let recreate
kubectl delete pod <pod> -n <ns>
```

### Issue: DNS not working

```bash
# Update DNS with new Docker gateway IP
make ubuntu.setup.dns-update
```

### Issue: ArgoCD apps OutOfSync

```bash
# Force refresh all apps
make gitops.sync-all
```

### Issue: Database pods not starting

CNPG clusters need primary to start first:

```bash
# Check cluster status
kubectl get clusters -A

# If stuck, delete pods in order
kubectl delete pod <cluster>-2 -n <ns>  # replica
kubectl delete pod <cluster>-1 -n <ns>  # primary will restart
```

---

## Automation Ideas

### Systemd Service (Linux)

Create `/etc/systemd/system/gsv-cluster-shutdown.service`:

```ini
[Unit]
Description=GSV Cluster Graceful Shutdown
DefaultDependencies=no
Before=shutdown.target reboot.target halt.target

[Service]
Type=oneshot
ExecStart=/home/user/gsv-gitops/scripts/cluster/shutdown.sh
TimeoutStartSec=60

[Install]
WantedBy=halt.target reboot.target shutdown.target
```

Enable: `sudo systemctl enable gsv-cluster-shutdown`

### LaunchAgent (macOS)

Create `~/Library/LaunchAgents/com.gsv.cluster-shutdown.plist` for logout hook.

---

## Recovery Time Expectations

| Scenario | Recovery Time |
|----------|---------------|
| Graceful shutdown + startup | 2-5 minutes |
| Unclean restart + startup | 5-10 minutes |
| Full cluster rebuild | 10-15 minutes |
| Rebuild + data restore | 20-30 minutes |

---

*For DR procedures, see [DR_RUNBOOK.md](DR_RUNBOOK.md)*
