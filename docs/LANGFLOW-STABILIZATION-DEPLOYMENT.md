# Langflow Stabilization - Deployment Guide

**Date:** December 21, 2025

## Changes Summary

### Component Upgrades
- Langflow: 1.6.9 → 1.7.1
- OAuth2-Proxy: 7.6.0 → 7.8.1

### RBAC Configuration
- platform-operator: Studio + Runtime
- service-provider: Studio only
- buyer: Neither

## Deployment Steps

1. Commit GitOps changes
2. ArgoCD sync
3. Update Vault secrets
4. Restart pods
5. Validate access

## Vault Secrets

```bash
vault kv put secret/gsv/runtime langflow_auto_login=true
vault kv put secret/gsv/studio langflow_auto_login=true
```

## Validation

```bash
# Run E2E tests
cd services/marketplace
npx playwright test tenant-isolation.spec.ts
```
