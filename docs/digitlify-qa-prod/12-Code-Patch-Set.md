# Code Patch Set (What to change before QA)

## Marketplace UI
1) Replace demo “My Agents” with CP-backed instances:
   - `services/marketplace/src/app/[channel]/(main)/account/subscriptions/page.tsx`
   - Prefer: route to `/account/instances`
2) Implement Instance Configuration / Connectors / Usage pages (remove “coming soon”):
   - `.../configuration/page.tsx`
   - `.../connectors/page.tsx`
   - `.../usage/page.tsx`

## Gateway
1) Add API key auth option for:
   - `/v1/runs`
   - `/v1/widget/session:init`
2) Ensure billing endpoints enforce tenant/org membership.
3) Emit usage events.

## Runner
1) Replace `flow_id` fallback behavior:
   - fetch instance→flow mapping from CP
2) Add real usage extraction (token counts):
   - via model callbacks OR router integration OR estimation fallback
3) Write artifacts consistently to MinIO and return URLs.

## Control Plane
1) Add endpoints for:
   - instance configuration (branding, channels)
   - knowledge base + data sources + ingestion jobs
   - key introspection (for gateway API-key auth)
2) Add billing export hooks (OpenMeter integration).

