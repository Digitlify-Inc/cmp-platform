# Digitlify — QA/Prod Promotion Doc Pack (Consolidated)

**Generated:** 2025-12-23

This folder is a consolidated “go-to-QA / go-to-prod” documentation pack that:
- lists current open issues and GTM blockers (prioritized),
- includes the complete E2E test catalog (auto-extracted),
- provides QA and Prod promotion runbooks,
- defines the missing **Customer Console** (where buyers manage agents/apps/assistants/automations: training, branding, widget, keys, connectors, usage),
- covers Stripe/payment enablement options for fast GTM.

## Quick Start
1. Start with **02-GTM-Blockers-P0.md** (fix these first).
2. Run the **E2E Smoke** subset from **04-E2E-Execution-Runbook.md**.
3. Follow **05-QA-Promotion-Runbook.md**.
4. After QA pass, follow **06-Prod-Promotion-Runbook.md**.

## Naming
- “Marketplace” = Next.js storefront/portal (buyers + sellers).
- “Control Plane” (CP) = Django service that owns tenants/orgs/offerings/instances/wallets/billing.
- “Gateway” = API entry for runs + widgets + billing authorize/settle.
- “Runner” = executes Langflow flow for an instance.
- “Studio” = Langflow builder UI (seller/ops).

