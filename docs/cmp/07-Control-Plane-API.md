# Control Plane & Gateway APIs — MVP (Concrete OpenAPI)

**Date:** 2025-12-17

This closes the “no detailed API schemas beyond endpoint stubs” gap by shipping **OpenAPI specs** in this pack:

- `control-plane.openapi.yaml`
- `gateway.openapi.yaml`

## MVP-first endpoints
Control Plane:
- `/integrations/saleor/order-paid`
- `/orgs/auto`
- `/offerings` + `/offerings/{offeringId}/versions`
- `/instances` + `/instances/{instanceId}/entitlements`
- `/wallets/{walletId}/topups`
- `/billing/authorize` + `/billing/settle`
- `/connectors/bindings` + `/connectors/bindings/{bindingId}/revoke`

Gateway:
- `/v1/runs`
- `/v1/widget/session:init`

## Idempotency
All commerce-triggered calls must be idempotent using:
- `saleor:orderId:lineId`
