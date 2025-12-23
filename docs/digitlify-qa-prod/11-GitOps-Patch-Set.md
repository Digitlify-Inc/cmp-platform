# GitOps Patch Set (What to change before QA)

This is a **targeted patch list** for the GitOps repo. Apply only what is needed to pass P0/P1.

## 1) Add missing QA ingress patches
QA overlay currently does not patch all components (runtime, rag, marketplace, cp, api, widget, commerce).
Create ingress patches similar to `platform/overlays/dev/*/ingress-patch.yaml` but with `*.qa.digitlify.com`.

Targets (base ingresses):
- `platform/base/cmp-marketplace/ingress.yaml` → `qa.digitlify.com`
- `platform/base/cmp-control-plane/ingress.yaml` → `cp.qa.digitlify.com`
- `platform/base/cmp-gateway/ingress.yaml` → `api.qa.digitlify.com`
- `platform/base/cmp-commerce/ingress.yaml` → `shop.qa.digitlify.com`, `admin.qa.digitlify.com`
- `platform/base/runtime/ingress.yaml` → `runtime.qa.digitlify.com`
- `platform/base/studio/ingress.yaml` → `studio.qa.digitlify.com`
- `platform/base/rag/ingress.yaml` → `rag.qa.digitlify.com`
- widget ingress (if present) → `widget.qa.digitlify.com`

## 2) Fix ExternalSecrets Vault KVv2 key usage
Update `remoteRef.key` that currently uses `secret/data/...` to KVv2 relative keys.

Examples that need review:
- `platform/base/runtime/external-secret-env.yaml`
- `platform/base/studio/external-secret-env.yaml`
- `platform/base/rag/external-secret-env.yaml`
- CNPG MinIO backup secrets

## 3) Standardize S3 endpoint variables
Pick one endpoint per env (e.g., `minio.minio.svc:9000`) and ensure:
- backup system
- CNPG backups
- runtime artifacts
all use the same.

## 4) Add OpenMeter deployment wiring
OpenMeter exists in `v0.0.2/os-kits/...` but is not promoted into platform base/overlays. Decide:
- include in QA now (recommended) OR
- keep export hooks only for GTM

