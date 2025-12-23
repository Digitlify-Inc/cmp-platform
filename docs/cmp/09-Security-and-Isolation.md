# Security & Tenant Isolation — MVP

**Date:** 2025-12-17

## Non-negotiables
1) No secrets in Langflow flows or artifacts
2) Runtime is private; Gateway is the chokepoint
3) Connector/MCP calls go through Connector Gateway
4) Vault+ESO is the only secret store
5) Audit trails for runs, tool calls, connector changes

## Shared tier isolation (hard enough for GTM)
- Secrets: Vault-scoped per binding
- Data: Ragflow KB scoped by org/project; MinIO prefix-per-project
- Execution: shared compute but strict limits + rate limiting + timeouts + policy checks

## Enterprise tiers (post-GTM)
- Dedicated namespace minimum
- Optional vcluster or cluster
