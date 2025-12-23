# E2E Testing Guide

This directory contains end-to-end tests for the GSV Marketplace platform using Playwright.

## Test Coverage

The E2E tests cover the following critical paths:

### Buyer Journey Tests (`buyer-e2e-journey.spec.ts`)
- **Phase 1: Discovery** - Homepage, marketplace listing, category navigation, search
- **Phase 2: Evaluation** - Product detail pages, pricing, capabilities
- **Phase 3: Cart & Checkout** - Add to cart, cart page, checkout flow
- **Phase 4: Authentication** - Sign in, SSO redirect
- **Phase 5: Account Management** - Account pages, instances, billing, settings
- **Phase 6: Instance Access** - Run console

### Seller Journey Tests (`seller-e2e-journey.spec.ts`)
- **Phase 1: Dashboard Access** - Saleor Dashboard login
- **Phase 2: Product Management** - Products list, creation
- **Phase 3: Product Configuration** - GraphQL API, categories, collections
- **Phase 4: Pricing** - Product variants/plans
- **Phase 5: Marketplace Visibility** - Products appear in storefront
- **Phase 6: Order Monitoring** - Orders in dashboard
- **Phase 7: Control Plane Integration** - Offerings API

### Webhook Integration Tests (`webhook-integration.spec.ts`)
- Saleor order-paid webhook endpoint
- Webhook signature validation
- Instance provisioning endpoints
- Connector binding endpoints

### Agent Execution Tests (`agent-execution.spec.ts`)
- Gateway health and authentication
- Langflow Runtime integration
- Control Plane offerings API
- Run console UI

### Credits & Wallet Tests (`credits-wallet.spec.ts`)
- Wallet balance endpoints
- Billing authorize/settle/release
- Top-up flow
- Gateway credits enforcement

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm
- Access to dev environment endpoints

### Installation
```bash
cd services/marketplace
pnpm install
pnpm exec playwright install
```

### Running Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm exec playwright test e2e/buyer-e2e-journey.spec.ts

# Run tests with UI
pnpm exec playwright test --ui

# Run tests in headed mode
pnpm exec playwright test --headed

# Run specific test by name
pnpm exec playwright test -g "checkout"
```

### Environment Configuration

Tests use these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `E2E_BASE_URL` | `https://dev.gsv.dev` | Base URL for marketplace |
| `E2E_START_SERVER` | (unset) | Set to start local dev server |

### Test Endpoints

The tests validate against these services:

| Service | URL | Purpose |
|---------|-----|---------|
| Main Site + Marketplace | `https://dev.gsv.dev` | Next.js (storefront + CMS content) |
| Saleor API | `https://store.dev.gsv.dev/graphql/` | E-commerce backend |
| Saleor Dashboard | `https://admin.dev.gsv.dev` | Admin interface |
| Control Plane | `https://cp.dev.gsv.dev` | Platform API |
| Gateway | `https://api.dev.gsv.dev` | Execution gateway |
| SSO | `https://sso.dev.gsv.dev` | Keycloak authentication |
| Runtime | `https://runtime.dev.gsv.dev` | Langflow runtime |

## Test Architecture

### Fixtures (`fixtures/test-fixtures.ts`)
Shared test configuration including:
- Test account credentials
- Service URLs
- Categories and facets
- Authenticated page fixtures

### Test Naming Convention
Tests use a hierarchical naming pattern:
- `BJ` - Buyer Journey
- `SJ` - Seller Journey
- `WH` - Webhook Integration
- `AE` - Agent Execution
- `CW` - Credits & Wallet

Each test has a numeric suffix (e.g., `BJ1.1`, `BJ1.2`) for easy reference.

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run E2E Tests
  run: pnpm test:e2e
  env:
    E2E_BASE_URL: ${{ secrets.E2E_BASE_URL }}
```

### Test Reports
- HTML reports: `e2e-report/`
- Screenshots on failure: `test-results/`
- Videos on retry: `test-results/`

## Troubleshooting

### Common Issues

**DNS Resolution Errors**
If running in Docker/CI, ensure hostname resolution works for `*.dev.gsv.dev` domains.

**Certificate Errors**
Tests use `ignoreHTTPSErrors: true` for self-signed certificates in dev environment.

**Timeout Issues**
Increase timeouts in `playwright.config.ts` if services are slow:
```ts
timeout: 60000,
```

**Authentication Failures**
Verify test accounts exist and credentials are correct in `fixtures/test-fixtures.ts`.

### Debug Mode
```bash
# Enable Playwright debug mode
PWDEBUG=1 pnpm exec playwright test

# Generate trace
pnpm exec playwright test --trace on
```

## Test Strategy Reference

These tests align with the Testing Strategy (doc 14) minimum requirements:

| # | Required Test | Test File | Status |
|---|---------------|-----------|--------|
| T1 | Saleor order paid → instance created | `webhook-integration.spec.ts` | Implemented |
| T2 | Instance becomes ACTIVE via GitOps | `webhook-integration.spec.ts` | Partial |
| T3 | Run via Gateway → Runner → Langflow | `agent-execution.spec.ts` | Implemented |
| T4 | Credits debit; run blocked at zero | `credits-wallet.spec.ts` | Implemented |
| T5 | Credit pack top-up unblocks | `credits-wallet.spec.ts` | Implemented |
| T6 | Connector binding works; revoke blocks | `webhook-integration.spec.ts` | Implemented |
| T7 | RAG upload → retrieval; tenant isolation | `tenant-isolation.spec.ts` | Implemented |

## Contributing

When adding new tests:
1. Follow the naming convention (`XX#.#`)
2. Add tests to appropriate describe blocks
3. Use fixtures from `test-fixtures.ts`
4. Include smoke tests for critical paths
5. Update this README with new test coverage
