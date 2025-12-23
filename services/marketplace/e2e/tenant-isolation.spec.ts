import { test, expect } from '@playwright/test';

/**
 * Tenant Isolation E2E Tests
 * Tests RBAC enforcement: operators, sellers, buyers
 */

const ACCOUNTS = {
  operator: { email: 'operator@gsv.dev', password: 'Operator123!' },
  seller: { email: 'seller@test.gsv.dev', password: 'Seller123!' },
  buyer: { email: 'buyer@test.gsv.dev', password: 'Buyer123!' },
};

const URLS = {
  studio: 'https://studio.dev.gsv.dev',
  runtime: 'https://runtime.dev.gsv.dev',
  site: 'https://dev.gsv.dev',
};

async function loginKeycloak(page: any, email: string, password: string) {
  await page.waitForURL(/sso\.dev\.gsv\.dev/, { timeout: 15000 });
  await page.fill('#username', email);
  await page.fill('#password', password);
  await page.click('[type="submit"]');
  await page.waitForLoadState('networkidle');
}

test.describe('Operator Access', () => {
  test('can access Studio', async ({ page }) => {
    await page.goto(URLS.studio);
    await loginKeycloak(page, ACCOUNTS.operator.email, ACCOUNTS.operator.password);
    const content = await page.content();
    expect(content).not.toContain('403');
  });

  test('can access Runtime', async ({ page }) => {
    await page.goto(URLS.runtime);
    await loginKeycloak(page, ACCOUNTS.operator.email, ACCOUNTS.operator.password);
    const content = await page.content();
    expect(content).not.toContain('403');
  });
});

test.describe('Seller Access', () => {
  test('can access Studio', async ({ page }) => {
    await page.goto(URLS.studio);
    await loginKeycloak(page, ACCOUNTS.seller.email, ACCOUNTS.seller.password);
    const content = await page.content();
    expect(content).not.toContain('403');
  });

  test('CANNOT access Runtime', async ({ page }) => {
    await page.goto(URLS.runtime);
    await loginKeycloak(page, ACCOUNTS.seller.email, ACCOUNTS.seller.password);
    const content = await page.content();
    expect(content).toContain('403');
  });
});

test.describe('Buyer Access', () => {
  test('CANNOT access Studio', async ({ page }) => {
    await page.goto(URLS.studio);
    await loginKeycloak(page, ACCOUNTS.buyer.email, ACCOUNTS.buyer.password);
    const content = await page.content();
    expect(content).toContain('403');
  });

  test('CANNOT access Runtime', async ({ page }) => {
    await page.goto(URLS.runtime);
    await loginKeycloak(page, ACCOUNTS.buyer.email, ACCOUNTS.buyer.password);
    const content = await page.content();
    expect(content).toContain('403');
  });

  test('can access Marketplace', async ({ page }) => {
    await page.goto(URLS.site);
    await expect(page.locator('body')).toBeVisible();
  });
});
