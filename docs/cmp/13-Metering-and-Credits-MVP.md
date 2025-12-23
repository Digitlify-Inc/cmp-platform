# Metering & Credits — MVP Simplification

**Date:** 2025-12-17

To reduce risk, enforce credits **synchronously** at the Gateway for MVP.

## MVP flow
1) Gateway → CP: `POST /billing/authorize`
2) Run executes
3) Gateway → CP: `POST /billing/settle` with actual usage
4) CP debits ledger and updates wallet balance

OpenMeter can still receive events asynchronously for dashboards/reconciliation later.
