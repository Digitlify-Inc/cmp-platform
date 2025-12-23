# CMP Platform Credentials

**Updated:** 2025-12-16

## Quick Reference

| Component | URL | User | Get Password |
|-----------|-----|------|--------------|
| Keycloak Admin | sso.dev.gsv.dev/admin | temp-admin | kubectl -n sso get secret digitlify-idp-initial-admin -o jsonpath={.data.password} pipe base64 -d |
| Keycloak User | sso.dev.gsv.dev | admin | Admin123\! |
| CMP Portal | app.dev.gsv.dev | (SSO) | via Keycloak |
| ArgoCD | argocd.dev.gsv.dev | admin | kubectl get secret -n argocd argocd-initial-admin-secret -o jsonpath={.data.password} pipe base64 -d |
| Grafana | grafana.dev.gsv.dev | admin | kubectl get secret -n observability kube-prometheus-stack-grafana -o jsonpath={.data.admin-password} pipe base64 -d |
| Vault | vault.dev.gsv.dev | token | kubectl get secret vault-init -n vault -o jsonpath={.data.root_token} pipe base64 -d |
| Studio | studio.dev.gsv.dev | (SSO) | via Keycloak |

## SSO Config

Discovery: https://sso.dev.gsv.dev/realms/gsv/.well-known/openid-configuration

OIDC Clients: cmp-portal, agentstudio, agentruntime, backstage, ragflow

*Updated: 2025-12-16*
