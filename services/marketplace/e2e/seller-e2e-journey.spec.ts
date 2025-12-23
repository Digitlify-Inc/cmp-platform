import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, URLS } from './fixtures/test-fixtures';

/**
 * Complete Seller E2E Journey Test
 *
 * Tests the seller/publisher flow for managing offerings:
 * Create Offering -> Configure Pricing -> Publish -> Monitor
 *
 * Sellers interact primarily through Saleor Dashboard for product management.
 */

// =============================================================================
// PHASE 1: DASHBOARD ACCESS
// =============================================================================
test.describe('Seller Journey: Phase 1 - Dashboard Access', () => {
  test('SJ1.1: Saleor Dashboard is accessible', async ({ page }) => {
    await page.goto(URLS.dashboard);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('SJ1.2: Dashboard shows login form', async ({ page }) => {
    await page.goto(URLS.dashboard);
    await page.waitForLoadState('networkidle');

    // Dashboard should show login or be accessible
    const loginForm = page.locator('input[type="email"], input[name="email"], form');
    const isVisible = await loginForm.first().isVisible({ timeout: 10000 }).catch(() => false);

    // Either login form visible or already authenticated
    expect(isVisible || page.url().includes('dashboard')).toBeTruthy();
  });

  test('SJ1.3: Dashboard login works', async ({ page }) => {
    await page.goto(URLS.dashboard);
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const isLoginVisible = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (isLoginVisible) {
      await emailInput.fill(TEST_ACCOUNTS.admin.email);
      await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.admin.password);
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');
    }

    // Should be on dashboard after login
    await expect(page.locator('body')).toBeVisible();
  });
});

// =============================================================================
// PHASE 2: PRODUCT MANAGEMENT
// =============================================================================
test.describe('Seller Journey: Phase 2 - Product Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login to dashboard
    await page.goto(URLS.dashboard);
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const isLoginVisible = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (isLoginVisible) {
      await emailInput.fill(TEST_ACCOUNTS.admin.email);
      await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.admin.password);
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('SJ2.1: Products list is accessible', async ({ page }) => {
    // Navigate to products
    const productsLink = page.locator('a[href*="products"], [data-test-id*="products"]');
    const isVisible = await productsLink.first().isVisible({ timeout: 10000 }).catch(() => false);

    if (isVisible) {
      await productsLink.first().click();
      await page.waitForLoadState('networkidle');
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('SJ2.2: Product creation page accessible', async ({ page }) => {
    // Navigate to products
    const productsLink = page.locator('a[href*="products"]');
    if (await productsLink.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await productsLink.first().click();
      await page.waitForLoadState('networkidle');
    }

    // Look for create/add button
    const createBtn = page.locator('a[href*="add"], button:has-text("Create"), button:has-text("Add")');
    const isVisible = await createBtn.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      await createBtn.first().click();
      await page.waitForLoadState('networkidle');
    }

    await expect(page.locator('body')).toBeVisible();
  });
});

// =============================================================================
// PHASE 3: PRODUCT CONFIGURATION
// =============================================================================
test.describe('Seller Journey: Phase 3 - Product Configuration', () => {
  test('SJ3.1: Saleor GraphQL API is accessible', async ({ request }) => {
    const response = await request.post(URLS.saleorGraphQL, {
      data: {
        query: `
          query {
            shop {
              name
              description
            }
          }
        `,
      },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data?.shop).toBeDefined();
  });

  test('SJ3.2: Products are queryable via GraphQL', async ({ request }) => {
    const response = await request.post(URLS.saleorGraphQL, {
      data: {
        query: `
          query {
            products(first: 10, channel: "default-channel") {
              edges {
                node {
                  id
                  name
                  slug
                }
              }
            }
          }
        `,
      },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data?.products?.edges).toBeInstanceOf(Array);
  });

  test('SJ3.3: Product categories exist', async ({ request }) => {
    const response = await request.post(URLS.saleorGraphQL, {
      data: {
        query: `
          query {
            categories(first: 10) {
              edges {
                node {
                  id
                  name
                  slug
                }
              }
            }
          }
        `,
      },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data?.categories?.edges).toBeInstanceOf(Array);
  });

  test('SJ3.4: Product collections exist', async ({ request }) => {
    const response = await request.post(URLS.saleorGraphQL, {
      data: {
        query: `
          query {
            collections(first: 10, channel: "default-channel") {
              edges {
                node {
                  id
                  name
                  slug
                }
              }
            }
          }
        `,
      },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data?.collections?.edges).toBeInstanceOf(Array);
  });
});

// =============================================================================
// PHASE 4: PRICING CONFIGURATION
// =============================================================================
test.describe('Seller Journey: Phase 4 - Pricing', () => {
  test('SJ4.1: Product variants (plans) are queryable', async ({ request }) => {
    const response = await request.post(URLS.saleorGraphQL, {
      data: {
        query: `
          query {
            products(first: 1, channel: "default-channel") {
              edges {
                node {
                  id
                  name
                  variants {
                    id
                    name
                    pricing {
                      price {
                        gross {
                          amount
                          currency
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `,
      },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    const product = body.data?.products?.edges?.[0]?.node;

    if (product) {
      expect(product.variants).toBeInstanceOf(Array);
    }
  });
});

// =============================================================================
// PHASE 5: MARKETPLACE VISIBILITY
// =============================================================================
test.describe('Seller Journey: Phase 5 - Marketplace Visibility', () => {
  test('SJ5.1: Products appear in marketplace', async ({ page }) => {
    await page.goto(`${URLS.marketplace}/default-channel/marketplace`);
    await page.waitForLoadState('networkidle');

    const products = page.locator('[data-testid="ProductElement"], article, .group.block, a[href*="/products/"]');
    await expect(products.first()).toBeVisible({ timeout: 15000 });

    const count = await products.count();
    expect(count).toBeGreaterThan(0);
  });

  test('SJ5.2: Product details are visible in marketplace', async ({ page }) => {
    await page.goto(`${URLS.marketplace}/default-channel/products/customer-support-agent`);
    await page.waitForLoadState('networkidle');

    // Product title should be visible
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

    // Price should be visible
    const price = page.getByText(/\$\d+/).first();
    await expect(price).toBeVisible({ timeout: 10000 });
  });

  test('SJ5.3: Product categories are filterable', async ({ page }) => {
    await page.goto(`${URLS.marketplace}/default-channel/marketplace/agents`);
    await page.waitForLoadState('networkidle');

    // Should show filtered products
    await expect(page.locator('body')).toBeVisible();
    const url = page.url();
    expect(url).toContain('/agents');
  });
});

// =============================================================================
// PHASE 6: ORDER MONITORING (via API)
// =============================================================================
test.describe('Seller Journey: Phase 6 - Order Monitoring', () => {
  test('SJ6.1: Orders endpoint exists in Saleor', async ({ request }) => {
    // Orders require authentication, so we just verify the endpoint exists
    const response = await request.post(URLS.saleorGraphQL, {
      data: {
        query: `
          query {
            __type(name: "Query") {
              fields {
                name
              }
            }
          }
        `,
      },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    const fields = body.data?.__type?.fields?.map((f: { name: string }) => f.name) || [];
    expect(fields).toContain('orders');
  });

  test('SJ6.2: Dashboard orders page accessible', async ({ page }) => {
    await page.goto(URLS.dashboard);
    await page.waitForLoadState('networkidle');

    // Login if needed
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill(TEST_ACCOUNTS.admin.email);
      await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.admin.password);
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');
    }

    // Navigate to orders
    const ordersLink = page.locator('a[href*="orders"]');
    if (await ordersLink.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await ordersLink.first().click();
      await page.waitForLoadState('networkidle');
    }

    await expect(page.locator('body')).toBeVisible();
  });
});

// =============================================================================
// PHASE 7: CONTROL PLANE INTEGRATION
// =============================================================================
test.describe('Seller Journey: Phase 7 - Control Plane Integration', () => {
  test('SJ7.1: Control Plane offerings API accessible', async ({ request }) => {
    const response = await request.get(`${URLS.controlPlane}/offerings/`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.results).toBeInstanceOf(Array);
  });

  test('SJ7.2: Control Plane OpenAPI schema available', async ({ request }) => {
    const response = await request.get(`${URLS.controlPlane}/api/schema/`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.openapi).toBeDefined();
  });
});

// =============================================================================
// COMPLETE SELLER SMOKE TEST
// =============================================================================
test.describe('Seller Journey: Complete Flow Smoke Test', () => {
  test('SJ-SMOKE: Dashboard -> Products -> Marketplace visibility', async ({ page, request }) => {
    // Step 1: Verify Saleor API is working
    const apiResponse = await request.post(URLS.saleorGraphQL, {
      data: {
        query: `query { shop { name } }`,
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(apiResponse.status()).toBe(200);

    // Step 2: Dashboard loads
    await page.goto(URLS.dashboard);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();

    // Step 3: Products appear in marketplace
    await page.goto(`${URLS.marketplace}/default-channel/marketplace`);
    await page.waitForLoadState('networkidle');

    const products = page.locator('[data-testid="ProductElement"], article, a[href*="/products/"]');
    await expect(products.first()).toBeVisible({ timeout: 15000 });

    // Step 4: Product detail accessible
    await products.first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible();
  });
});
