# Domain & Hostname Matrix (Single-site)

Goal: **one primary site** under `digitlify.com`, with environment subdomains for QA.

## Production (prod)
- Marketplace (buyers/sellers): `digitlify.com` (+ optional `www.digitlify.com`)
- Saleor Storefront API: `shop.digitlify.com` (or keep internal + proxy)
- Saleor Dashboard: `admin.digitlify.com`
- SSO (Keycloak): `sso.digitlify.com`
- Control Plane: `cp.digitlify.com`
- Gateway API: `api.digitlify.com`
- Widget endpoint (optional): `widget.digitlify.com`
- Langflow Studio (internal): `studio.digitlify.com`
- Langflow Runtime: `runtime.digitlify.com`
- RAG: `rag.digitlify.com`
- Backstage (internal): `idp.digitlify.com`
- ArgoCD (internal): `cd.digitlify.com` (optional)

## QA
Use `*.qa.digitlify.com`:
- Marketplace: `qa.digitlify.com` (+ `www.qa.digitlify.com` optional)
- Admin: `admin.qa.digitlify.com`
- Shop: `shop.qa.digitlify.com`
- SSO: `sso.qa.digitlify.com`
- CP: `cp.qa.digitlify.com`
- API: `api.qa.digitlify.com`
- Widget: `widget.qa.digitlify.com`
- Studio: `studio.qa.digitlify.com`
- Runtime: `runtime.qa.digitlify.com`
- RAG: `rag.qa.digitlify.com`
- Backstage: `idp.qa.digitlify.com`

## Why this matters
- Keycloak redirect URIs & cookie domains must match the final hostnames.
- NextAuth URLs must match the final hostnames.
- External-DNS annotations + cert-manager certs must match the hostnames.
- Playwright E2E tests must be parameterized per environment.

