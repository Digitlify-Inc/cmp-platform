# DNS & Network Troubleshooting (Local KinD)

## Platform-Specific Network Architecture

| Platform | Traefik Mode | Why | Access Method |
|----------|--------------|-----|---------------|
| **macOS** | NodePort (30080/30443) | Docker Desktop VM, MetalLB IPs not routable | `127.0.0.1` via KinD port mapping |
| **WSL2** | NodePort (30080/30443) | Docker bridge (172.18.x.x) not routable from Windows | `127.0.0.1` via KinD port mapping |
| **Linux (native)** | LoadBalancer | Docker bridge is native, MetalLB IPs routable | MetalLB IP (e.g., 172.18.255.200) |

## Windows + WSL2

### Common Issue: Services Not Accessible from Windows

**Symptom**: `https://argocd.dev.gsv.dev` not reachable from Windows browser, but `kubectl get ingress` shows IP `172.18.255.x`.

**Cause**: MetalLB assigns IPs on the Docker bridge network (172.18.0.0/16), which is internal to WSL2 and not routable from Windows host.

**Solution**: The install script (`scripts/cluster/install-ingress-certmgr.sh`) now auto-detects WSL2 and uses NodePort mode. If you have an existing cluster with LoadBalancer:

```bash
# Fix existing Traefik deployment
helm upgrade traefik traefik/traefik   --namespace traefik-system   --set service.type=NodePort   --set ports.web.nodePort=30080   --set ports.websecure.nodePort=30443   --reuse-values

# Verify
kubectl get svc traefik -n traefik-system
# Should show: TYPE=NodePort, PORTS=80:30080/TCP,443:30443/TCP
```

### Hosts File Setup

Add to `C:\Windows\System32\drivers\etc\hosts` (as Administrator):
```
127.0.0.1 argocd.dev.gsv.dev portal.dev.gsv.dev studio.dev.gsv.dev sso.dev.gsv.dev
127.0.0.1 backstage.dev.gsv.dev minio.dev.gsv.dev vault.dev.gsv.dev grafana.dev.gsv.dev api.dev.gsv.dev
```

### Verify Access
```powershell
# From PowerShell
curl.exe -k https://argocd.dev.gsv.dev
```

### Trust mkcert CA (for green lock in browsers)
```powershell
# Copy CA from WSL
wsl -e bash -c "cp $(mkcert -CAROOT)/rootCA.pem /mnt/c/Temp/gsv-mkcert-rootCA.pem"

# Import to Windows (PowerShell as user)
Import-Certificate -FilePath C:\Temp\gsv-mkcert-rootCA.pem -CertStoreLocation Cert:\CurrentUser\Root
```

## macOS

- `sudo brew services restart dnsmasq`
- `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`
- Ensure `/etc/resolver/dev.gsv.dev` points to `127.0.0.1`
- Verify: `dig +short argocd.dev.gsv.dev` → should return `127.0.0.1`

## Ubuntu (Native Linux)

- Check `dnsmasq` is active: `systemctl status dnsmasq`
- Config lives in `/etc/dnsmasq.d/gsv.conf`
- MetalLB IPs are directly routable
- Verify: `curl -k https://argocd.dev.gsv.dev`

## Quick Diagnostic Commands

```bash
# Check Traefik service type and ports
kubectl get svc traefik -n traefik-system

# Check KinD port mappings
docker ps --filter name=kind --format "{{.Names}}: {{.Ports}}"

# Test from WSL
curl -k https://localhost:443 -H "Host: argocd.dev.gsv.dev"

# Check ingress configuration
kubectl get ingress -A
```
