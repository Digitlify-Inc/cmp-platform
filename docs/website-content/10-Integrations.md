# Integrations Page v1
_Last updated: 2025-12-19_

> Route: `/integrations`

## Hero
**Title:** Integrations  
**Subtitle:** Connect the tools you already use — securely.

## Grid sections
### Communication
- Email (SMTP/Gmail)
- Slack / Teams

### Work management
- Jira / Confluence

### Knowledge
- S3/MinIO for files
- Ragflow for KB/RAG (where used)

### Developer
- Webhooks
- API keys (via Vault)
- MCP servers (proxy via Connector Gateway)

## Trust note
All secrets are stored in Vault and injected only at runtime. No secrets in templates.
