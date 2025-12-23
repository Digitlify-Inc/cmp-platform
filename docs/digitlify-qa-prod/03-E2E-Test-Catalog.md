# Digitlify Platform — E2E Test Catalog

**Generated:** 2025-12-23

This catalog is extracted from the Playwright specs under `services/marketplace/e2e/` in the platform repo.


## AE1: Gateway Health

- **E2E-001** — AE1.1: Gateway service is reachable  _(spec: `agent-execution.spec.ts`)_
- **E2E-002** — AE1.2: Gateway requires authentication for runs  _(spec: `agent-execution.spec.ts`)_

## AE2: Langflow Runtime

- **E2E-003** — AE2.1: Runtime health endpoint responds  _(spec: `agent-execution.spec.ts`)_
- **E2E-004** — AE2.2: Runtime API requires authentication  _(spec: `agent-execution.spec.ts`)_

## AE3: Control Plane

- **E2E-005** — AE3.1: Instances endpoint requires auth  _(spec: `agent-execution.spec.ts`)_
- **E2E-006** — AE3.2: Offerings endpoint is public  _(spec: `agent-execution.spec.ts`)_
- **E2E-007** — AE3.3: OpenAPI schema is available  _(spec: `agent-execution.spec.ts`)_
- **E2E-008** — AE3.4: Swagger UI is accessible  _(spec: `agent-execution.spec.ts`)_

## AE4: Run Console UI

- **E2E-009** — AE4.1: Run console page structure  _(spec: `agent-execution.spec.ts`)_

## AE5: Credit Authorization

- **E2E-010** — AE5.1: Billing authorize requires auth  _(spec: `agent-execution.spec.ts`)_
- **E2E-011** — AE5.2: Wallet endpoint requires auth  _(spec: `agent-execution.spec.ts`)_

## AE6: My Agents Page

- **E2E-012** — AE6.1: Instances page loads  _(spec: `agent-execution.spec.ts`)_
- **E2E-013** — AE6.2: Instance detail page exists  _(spec: `agent-execution.spec.ts`)_

## AE7: Billing Integration

- **E2E-014** — AE7.1: Billing page loads  _(spec: `agent-execution.spec.ts`)_

## API Security

- **E2E-087** — Runtime API requires auth  _(spec: `full-e2e-flow.spec.ts`)_
- **E2E-088** — Studio API requires auth  _(spec: `full-e2e-flow.spec.ts`)_

## B1: Anonymous Browse & Discovery

- **E2E-048** — B1.1: Marketplace loads without login  _(spec: `buyer-journey.spec.ts`)_
- **E2E-049** — B1.2: Products are visible on marketplace page  _(spec: `buyer-journey.spec.ts`)_
- **E2E-050** — B1.3: Category tabs filter products  _(spec: `buyer-journey.spec.ts`)_
- **E2E-051** — B1.4: Search functionality works  _(spec: `buyer-journey.spec.ts`)_
- **E2E-052** — B1.5: Product card click navigates to detail page  _(spec: `buyer-journey.spec.ts`)_

## B2: Product Evaluation

- **E2E-053** — B2.1: Product detail page displays real data  _(spec: `buyer-journey.spec.ts`)_
- **E2E-054** — B2.2: Pricing information is displayed  _(spec: `buyer-journey.spec.ts`)_
- **E2E-055** — B2.3: Add to cart button is visible  _(spec: `buyer-journey.spec.ts`)_

## B3: Authentication Flow

- **E2E-056** — B3.1: Login button is visible  _(spec: `buyer-journey.spec.ts`)_
- **E2E-057** — B3.2: Login redirects to Keycloak  _(spec: `buyer-journey.spec.ts`)_
- **E2E-058** — B3.3: Successful login redirects back  _(spec: `buyer-journey.spec.ts`)_

## B5: Add to Cart & Checkout

- **E2E-059** — B5.1: Add product to cart  _(spec: `buyer-journey.spec.ts`)_
- **E2E-060** — B5.2: Cart page is accessible  _(spec: `buyer-journey.spec.ts`)_
- **E2E-061** — B5.3: Checkout button accessible  _(spec: `buyer-journey.spec.ts`)_

## B7: Account Pages

- **E2E-062** — B7.1: Account page requires authentication  _(spec: `buyer-journey.spec.ts`)_
- **E2E-063** — B7.2: Settings page is accessible  _(spec: `buyer-journey.spec.ts`)_
- **E2E-064** — B7.3: Billing page is accessible  _(spec: `buyer-journey.spec.ts`)_
- **E2E-065** — B7.4: My Agents page is accessible  _(spec: `buyer-journey.spec.ts`)_

## Buyer Access

- **E2E-114** — CANNOT access Studio  _(spec: `tenant-isolation.spec.ts`)_
- **E2E-115** — CANNOT access Runtime  _(spec: `tenant-isolation.spec.ts`)_
- **E2E-116** — can access Marketplace  _(spec: `tenant-isolation.spec.ts`)_

## Buyer Journey: Complete Flow Smoke Test

- **E2E-047** — BJ-SMOKE: Browse -> Product -> Cart -> Checkout flow  _(spec: `buyer-e2e-journey.spec.ts`)_

## Buyer Journey: Phase 1 - Discovery

- **E2E-026** — BJ1.1: Homepage loads and redirects to marketplace  _(spec: `buyer-e2e-journey.spec.ts`)_
- **E2E-027** — BJ1.2: Marketplace page displays offerings  _(spec: `buyer-e2e-journey.spec.ts`)_
- **E2E-028** — BJ1.3: Category navigation works  _(spec: `buyer-e2e-journey.spec.ts`)_
- **E2E-029** — BJ1.4: Search bar is functional  _(spec: `buyer-e2e-journey.spec.ts`)_

## Buyer Journey: Phase 2 - Evaluation

- **E2E-030** — BJ2.1: Product detail page loads  _(spec: `buyer-e2e-journey.spec.ts`)_
- **E2E-031** — BJ2.2: Product page shows pricing  _(spec: `buyer-e2e-journey.spec.ts`)_
- **E2E-032** — BJ2.3: Product page shows capabilities  _(spec: `buyer-e2e-journey.spec.ts`)_
- **E2E-033** — BJ2.4: Try Free button is visible  _(spec: `buyer-e2e-journey.spec.ts`)_
- **E2E-034** — BJ2.5: Add to Cart button is visible  _(spec: `buyer-e2e-journey.spec.ts`)_

## Buyer Journey: Phase 3 - Cart & Checkout

- **E2E-035** — BJ3.1: Add product to cart  _(spec: `buyer-e2e-journey.spec.ts`)_
- **E2E-036** — BJ3.2: Cart page displays items  _(spec: `buyer-e2e-journey.spec.ts`)_
- **E2E-037** — BJ3.3: Checkout button navigates correctly  _(spec: `buyer-e2e-journey.spec.ts`)_
- **E2E-038** — BJ3.4: Checkout page loads Saleor checkout component  _(spec: `buyer-e2e-journey.spec.ts`)_

## Buyer Journey: Phase 4 - Authentication

- **E2E-039** — BJ4.1: Sign in button visible  _(spec: `buyer-e2e-journey.spec.ts`)_
- **E2E-040** — BJ4.2: Sign in redirects to SSO  _(spec: `buyer-e2e-journey.spec.ts`)_

## Buyer Journey: Phase 5 - Account Management

- **E2E-041** — BJ5.1: Account page accessible  _(spec: `buyer-e2e-journey.spec.ts`)_
- **E2E-042** — BJ5.2: Instances/My Agents page accessible  _(spec: `buyer-e2e-journey.spec.ts`)_
- **E2E-043** — BJ5.3: Billing page accessible  _(spec: `buyer-e2e-journey.spec.ts`)_
- **E2E-044** — BJ5.4: Settings page accessible  _(spec: `buyer-e2e-journey.spec.ts`)_
- **E2E-045** — BJ5.5: Orders page accessible  _(spec: `buyer-e2e-journey.spec.ts`)_

## Buyer Journey: Phase 6 - Instance Access

- **E2E-046** — BJ6.1: Run page structure exists  _(spec: `buyer-e2e-journey.spec.ts`)_

## CW-SMOKE: Credits System Smoke Test

- **E2E-082** — All billing endpoints are protected  _(spec: `credits-wallet.spec.ts`)_

## CW1: Wallet Endpoints

- **E2E-069** — CW1.1: Wallet endpoint requires authentication  _(spec: `credits-wallet.spec.ts`)_
- **E2E-070** — CW1.2: Wallet balance endpoint exists  _(spec: `credits-wallet.spec.ts`)_
- **E2E-071** — CW1.3: Wallet ledger endpoint exists  _(spec: `credits-wallet.spec.ts`)_

## CW2: Billing Endpoints

- **E2E-072** — CW2.1: Billing authorize endpoint exists  _(spec: `credits-wallet.spec.ts`)_
- **E2E-073** — CW2.2: Billing settle endpoint exists  _(spec: `credits-wallet.spec.ts`)_
- **E2E-074** — CW2.3: Billing release endpoint exists  _(spec: `credits-wallet.spec.ts`)_

## CW3: Top-Up Flow

- **E2E-075** — CW3.1: Top-up endpoint exists  _(spec: `credits-wallet.spec.ts`)_
- **E2E-076** — CW3.2: Credit packs exist in Saleor  _(spec: `credits-wallet.spec.ts`)_

## CW4: Marketplace Billing UI

- **E2E-077** — CW4.1: Billing page loads  _(spec: `credits-wallet.spec.ts`)_
- **E2E-078** — CW4.2: Pricing page loads  _(spec: `credits-wallet.spec.ts`)_
- **E2E-079** — CW4.3: Redeem page loads  _(spec: `credits-wallet.spec.ts`)_

## CW5: Gateway Credits Enforcement

- **E2E-080** — CW5.1: Gateway run endpoint requires auth  _(spec: `credits-wallet.spec.ts`)_
- **E2E-081** — CW5.2: Gateway health check  _(spec: `credits-wallet.spec.ts`)_

## Control Plane API

- **E2E-018** — Health check endpoint responds  _(spec: `api-integration.spec.ts`)_
- **E2E-019** — Offerings endpoint returns data  _(spec: `api-integration.spec.ts`)_
- **E2E-020** — Organizations endpoint requires auth  _(spec: `api-integration.spec.ts`)_

## Dashboard Health

- **E2E-025** — Saleor Dashboard serves UI  _(spec: `api-integration.spec.ts`)_

## Main Site + Marketplace Health

- **E2E-021** — Site health check responds  _(spec: `api-integration.spec.ts`)_
- **E2E-022** — Site serves HTML  _(spec: `api-integration.spec.ts`)_
- **E2E-023** — Marketplace route is accessible  _(spec: `api-integration.spec.ts`)_

## Marketplace Flow

- **E2E-085** — Products are visible  _(spec: `full-e2e-flow.spec.ts`)_
- **E2E-086** — Product detail page loads  _(spec: `full-e2e-flow.spec.ts`)_

## Navigation & Layout

- **E2E-066** — Header navigation links work  _(spec: `buyer-journey.spec.ts`)_
- **E2E-067** — Footer is present  _(spec: `buyer-journey.spec.ts`)_
- **E2E-068** — Mobile menu works on small screens  _(spec: `buyer-journey.spec.ts`)_

## Operator Access

- **E2E-110** — can access Studio  _(spec: `tenant-isolation.spec.ts`)_
- **E2E-111** — can access Runtime  _(spec: `tenant-isolation.spec.ts`)_

## Platform Health

- **E2E-083** — Control Plane is healthy  _(spec: `full-e2e-flow.spec.ts`)_
- **E2E-084** — Saleor API responds  _(spec: `full-e2e-flow.spec.ts`)_

## S1: Seller Dashboard Access

- **E2E-107** — S1.1: Saleor Dashboard loads  _(spec: `seller-journey.spec.ts`)_

## S2: Product Management

- **E2E-108** — S2.1: Products list is visible after login  _(spec: `seller-journey.spec.ts`)_

## S5: Marketplace Listing Verification

- **E2E-109** — S5.1: Products appear in marketplace  _(spec: `seller-journey.spec.ts`)_

## SSO Health

- **E2E-024** — Keycloak realm is accessible  _(spec: `api-integration.spec.ts`)_

## Saleor GraphQL API

- **E2E-015** — Products query returns data  _(spec: `api-integration.spec.ts`)_
- **E2E-016** — Collections query returns data  _(spec: `api-integration.spec.ts`)_
- **E2E-017** — Channel query returns default-channel  _(spec: `api-integration.spec.ts`)_

## Seller Access

- **E2E-112** — can access Studio  _(spec: `tenant-isolation.spec.ts`)_
- **E2E-113** — CANNOT access Runtime  _(spec: `tenant-isolation.spec.ts`)_

## Seller Journey: Complete Flow Smoke Test

- **E2E-106** — SJ-SMOKE: Dashboard -> Products -> Marketplace visibility  _(spec: `seller-e2e-journey.spec.ts`)_

## Seller Journey: Phase 1 - Dashboard Access

- **E2E-089** — SJ1.1: Saleor Dashboard is accessible  _(spec: `seller-e2e-journey.spec.ts`)_
- **E2E-090** — SJ1.2: Dashboard shows login form  _(spec: `seller-e2e-journey.spec.ts`)_
- **E2E-091** — SJ1.3: Dashboard login works  _(spec: `seller-e2e-journey.spec.ts`)_

## Seller Journey: Phase 2 - Product Management

- **E2E-092** — SJ2.1: Products list is accessible  _(spec: `seller-e2e-journey.spec.ts`)_
- **E2E-093** — SJ2.2: Product creation page accessible  _(spec: `seller-e2e-journey.spec.ts`)_

## Seller Journey: Phase 3 - Product Configuration

- **E2E-094** — SJ3.1: Saleor GraphQL API is accessible  _(spec: `seller-e2e-journey.spec.ts`)_
- **E2E-095** — SJ3.2: Products are queryable via GraphQL  _(spec: `seller-e2e-journey.spec.ts`)_
- **E2E-096** — SJ3.3: Product categories exist  _(spec: `seller-e2e-journey.spec.ts`)_
- **E2E-097** — SJ3.4: Product collections exist  _(spec: `seller-e2e-journey.spec.ts`)_

## Seller Journey: Phase 4 - Pricing

- **E2E-098** — SJ4.1: Product variants (plans) are queryable  _(spec: `seller-e2e-journey.spec.ts`)_

## Seller Journey: Phase 5 - Marketplace Visibility

- **E2E-099** — SJ5.1: Products appear in marketplace  _(spec: `seller-e2e-journey.spec.ts`)_
- **E2E-100** — SJ5.2: Product details are visible in marketplace  _(spec: `seller-e2e-journey.spec.ts`)_
- **E2E-101** — SJ5.3: Product categories are filterable  _(spec: `seller-e2e-journey.spec.ts`)_

## Seller Journey: Phase 6 - Order Monitoring

- **E2E-102** — SJ6.1: Orders endpoint exists in Saleor  _(spec: `seller-e2e-journey.spec.ts`)_
- **E2E-103** — SJ6.2: Dashboard orders page accessible  _(spec: `seller-e2e-journey.spec.ts`)_

## Seller Journey: Phase 7 - Control Plane Integration

- **E2E-104** — SJ7.1: Control Plane offerings API accessible  _(spec: `seller-e2e-journey.spec.ts`)_
- **E2E-105** — SJ7.2: Control Plane OpenAPI schema available  _(spec: `seller-e2e-journey.spec.ts`)_

## WH1: Webhook Endpoint Availability

- **E2E-117** — WH1.1: Order-paid webhook endpoint exists  _(spec: `webhook-integration.spec.ts`)_
- **E2E-118** — WH1.2: Webhook requires signature  _(spec: `webhook-integration.spec.ts`)_

## WH2: Saleor Webhook Configuration

- **E2E-119** — WH2.1: Saleor API is accessible  _(spec: `webhook-integration.spec.ts`)_
- **E2E-120** — WH2.2: Checkout can be created  _(spec: `webhook-integration.spec.ts`)_

## WH3: Instance Provisioning

- **E2E-121** — WH3.1: Instances can be created via API  _(spec: `webhook-integration.spec.ts`)_
- **E2E-122** — WH3.2: Trial endpoint exists  _(spec: `webhook-integration.spec.ts`)_

## WH4: Connector Bindings

- **E2E-123** — WH4.1: Connector bindings endpoint exists  _(spec: `webhook-integration.spec.ts`)_
- **E2E-124** — WH4.2: Connector revoke endpoint exists  _(spec: `webhook-integration.spec.ts`)_