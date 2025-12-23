import { test, expect } from '@playwright/test';

/**
 * Full E2E Flow Tests
 * Studio -> Control Plane -> Runtime -> Marketplace
 */

const URLS = {
  studio: 'https://studio.dev.gsv.dev',
  runtime: 'https://runtime.dev.gsv.dev',
  site: 'https://dev.gsv.dev',
  controlPlane: 'https://cp.dev.gsv.dev',
  saleor: 'https://store.dev.gsv.dev/graphql/',
};

test.describe('Platform Health', () => {
  test('Control Plane is healthy', async ({ request }) => {
    const response = await request.get(URLS.controlPlane + '/health/');
    expect(response.status()).toBe(200);
  });

  test('Saleor API responds', async ({ request }) => {
    const response = await request.post(URLS.saleor, {
      data: { query: '{ products(first:1,channel:"default-channel") { edges { node { name } } } }' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(200);
  });
});

test.describe('Marketplace Flow', () => {
  test('Products are visible', async ({ page }) => {
    await page.goto(URLS.site + '/marketplace');
    const products = page.locator('[data-testid="product-card"], article');
    await expect(products.first()).toBeVisible({ timeout: 10000 });
  });

  test('Product detail page loads', async ({ page }) => {
    await page.goto(URLS.site + '/marketplace');
    const product = page.locator('[data-testid="product-card"] a, article a').first();
    await product.click();
    await expect(page).toHaveURL(/\/products\//);
  });
});

test.describe('API Security', () => {
  test('Runtime API requires auth', async ({ request }) => {
    const response = await request.get(URLS.runtime + '/api/v1/flows');
    expect([401, 403]).toContain(response.status());
  });

  test('Studio API requires auth', async ({ request }) => {
    const response = await request.get(URLS.studio + '/api/v1/flows');
    expect([401, 403]).toContain(response.status());
  });
});
