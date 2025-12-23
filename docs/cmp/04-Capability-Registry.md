# Capability Registry — MVP (Concrete Spec)

**Date:** 2025-12-17  
**Purpose:** The Capability Registry is the **single source of truth** for what an Agent/App/Assistant/Automation *can do*, how it is configured, what it provisions, and how it is metered (credits).  
This document is intentionally detailed to remove “guesswork” from implementation.

---

## 1) How the registry is used end-to-end

### 1.1 Authoring & publishing (creator)
1) Build in **Langflow Studio**.
2) Export `flow.json`.
3) Publish to Control Plane as an immutable `offeringVersionId`:
   - store `flow.json` in MinIO (artifacts bucket/prefix)
   - record `sha256` hash
   - attach **capabilities[]** and **defaults** (non-secret)

### 1.2 Listing & marketing
- **Saleor** product/variant attributes carry:
  - capabilities (for filtering + plan-gating)
  - connectors (for filtering + “requires setup” UI)
  - languages/modalities/value streams (store discovery)
- **Wagtail** pages use the same slugs for landing pages and SEO content.

### 1.3 Activation & provisioning
On instance activation, Control Plane computes:
- allowed capabilities (plan)
- instance overrides (customer inputs)
- **effectiveConfig** (non-secret) for runtime
- desired state manifests for GitOps (routes/policies/KB/scheduler)

### 1.4 Execution & enforcement
- Gateway enforces auth + entitlements + credits.
- Runner injects effectiveConfig into execution.
- Connector/MCP Gateway pulls secrets from Vault at tool-call time.

---

## 2) Registry structure (fields)
Each capability defines:
- `id`, `v`, `layer`, `title`, `description`
- `saleor_value`: the identifier used in Saleor attribute values
- `config_schema`: JSON Schema fragment for UI generation + validation
- `provisioning.handler`: the handler identifier (CP uses it to produce desired state)
- `metering.dimensions`: usage dims emitted for credits

---

## 3) Effective config merge (no-gaps rule)
Recommended merge order:
1) `planDefaults`
2) `offeringDefaults` (per offering version)
3) `instanceOverrides` (customer)

Final:
- `effectiveConfig = planDefaults ⊕ offeringDefaults ⊕ instanceOverrides`
- later layers override earlier layers

---

## 4) Canonical registry (exact content)
Below is the shipped `capability-registry.yaml`.

```yaml

```

---

## 5) Handler interface (recommended)
Each provisioning handler implements:
- `validate(config) -> errors[]`
- `desired_state(instance) -> manifests[]` (GitOps)
- `meter(usage) -> credit_debit` (maps dims → credits)

---

## 6) Branding for website widgets
Branding is explicit in the registry under `web_widget.branding`:
- `brand_name`, `logo_url`, `avatar_url`
- `primary_color`, `accent_color`, `font_family`
- `launcher_text`, `position`
- enforced `allowed_domains` at widget session init
