# CMP Platform - Claude Instructions

## Overview

This is the **Digitlify Cloud Marketplace Platform** monorepo - the reference implementation for the first tenant.

## Repository Strategy

| Organization | Prefix | Purpose |
|-------------|--------|---------|
| **GSVDEV** | `gsv-*` | Development/Platform org - source code, component lifecycle |
| **Digitlify-Inc** | `cmp-*` | First tenant (Digitlify) - production deployment |

## Canonical Documentation Source

**All CMP documentation is located at:** `docs/cmp/`

## Key Documents

| Document | Purpose |
|----------|---------|
| HANDOVER.md | Complete implementation context |
| STATUS.md | Current implementation status |
| 01-PRD.md | Product requirements |
| 02-Architecture.md | Three-plane architecture |
| 06-Integration-and-Provisioning.md | Saleor to CP to GitOps flow |
| 14-Testing-Strategy.md | E2E test requirements |
| control-plane.openapi.yaml | Control Plane API spec |
| gateway.openapi.yaml | Gateway API spec |

## Digitlify QA/Prod Docs

See `docs/digitlify-qa-prod/` for:
- Open issue register (P0/P1/P2)
- GTM blockers
- E2E test catalog
- QA and Prod promotion runbooks
- Go-live checklist

## Services

| Service | Path | Technology |
|---------|------|------------|
| Marketplace | `services/marketplace/` | Next.js 16, React 19 |
| Control Plane | `services/control-plane/` | Django, DRF |
| Gateway | `services/gateway/` | FastAPI |
| Provisioner | `services/provisioner/` | FastAPI |
| Runner | `services/runner/` | FastAPI |
| Connector | `services/connector/` | FastAPI |

## Important

- This is a tenant-specific deployment repo
- For development/platform work, use `GSVDEV/gsv-platform`
- Follow GitOps principles - all changes through git
- STATUS.md tracks current implementation progress
