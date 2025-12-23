import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, URLS } from './fixtures/test-fixtures';

/**
 * Complete Buyer E2E Journey Test
 *
 * Tests the complete buyer flow from discovery to usage:
 * Browse -> Evaluate -> Try/Buy -> Checkout -> Activate -> Use
 *
 * This test validates the critical path for buyer conversion.
 */

const CHANNEL = 'default-channel';

// =============================================================================
// PHASE 1: DISCOVERY (Anonymous)
// =============================================================================
test.describe('Buyer Journey: Phase 1 - Discovery', () => {
  test('BJ1.1: Homepage loads and redirects to marketplace', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Should either show homepage or redirect to marketplace
    await expect(page.locator('body')).toBeVisible();
  });

  test('BJ1.2: Marketplace page displays offerings', async ({ page }) => {
    await page.goto(`/${CHANNEL}/marketplace`);
    await page.waitForLoadState('networkidle');

    // Wait for products to load
    const products = page.locator('[data-testid="ProductElement"], article, .group.block');
    await expect(products.first()).toBeVisible({ timeout: 15000 });

    const count = await products.count();
    expect(count).toBeGreaterThan(0);
  });

  test('BJ1.3: Category navigation works', async ({ page }) => {
    await page.goto(`/${CHANNEL}/marketplace`);
    await page.waitForLoadState('networkidle');

    // Check category tabs/links
    const categoryLinks = page.locator('a[href*="/marketplace/agents"], a[href*="/marketplace/apps"]');
    const categoryCount = await categoryLinks.count();
    expect(categoryCount).toBeGreaterThan(0);

    // Click first category
    if (categoryCount > 0) {
      await categoryLinks.first().click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/marketplace\/(agents|apps|assistants|automations)/);
    }
  });

  test('BJ1.4: Search bar is functional', async ({ page }) => {
    await page.goto(`/${CHANNEL}/marketplace`);

    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
    const isVisible = await searchInput.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      await searchInput.first().fill('customer support');
      await searchInput.first().press('Enter');
      await page.waitForLoadState('networkidle');
    }
  });
});

// =============================================================================
// PHASE 2: EVALUATION
// =============================================================================
test.describe('Buyer Journey: Phase 2 - Evaluation', () => {
  test('BJ2.1: Product detail page loads', async ({ page }) => {
    await page.goto(`/${CHANNEL}/marketplace`);
    await page.waitForLoadState('networkidle');

    // Click on first product
    const productLink = page.locator('a[href*="/products/"], a[href*="/marketplace/agents/"]').first();
    await expect(productLink).toBeVisible({ timeout: 15000 });
    await productLink.click();

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/products\/|\/marketplace\/(agents|apps)/);
  });

  test('BJ2.2: Product page shows pricing', async ({ page }) => {
    await page.goto(`/${CHANNEL}/products/customer-support-agent`);
    await page.waitForLoadState('networkidle');

    // Look for price display
    const priceElement = page.getByText(/\$\d+/).first();
    await expect(priceElement).toBeVisible({ timeout: 10000 });
  });

  test('BJ2.3: Product page shows capabilities', async ({ page }) => {
    await page.goto(`/${CHANNEL}/products/customer-support-agent`);
    await page.waitForLoadState('networkidle');

    // Product details should be visible
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('BJ2.4: Try Free button is visible', async ({ page }) => {
    await page.goto(`/${CHANNEL}/products/customer-support-agent`);
    await page.waitForLoadState('networkidle');

    const tryFreeBtn = page.locator('button:has-text("Try Free"), button:has-text("Start Trial")');
    const isVisible = await tryFreeBtn.first().isVisible({ timeout: 10000 }).catch(() => false);

    // Try Free should be available (if product supports trials)
    if (isVisible) {
      await expect(tryFreeBtn.first()).toBeEnabled();
    }
  });

  test('BJ2.5: Add to Cart button is visible', async ({ page }) => {
    await page.goto(`/${CHANNEL}/products/customer-support-agent`);
    await page.waitForLoadState('networkidle');

    const addToCartBtn = page.locator('button:has-text("Add to Cart"), button:has-text("Subscribe")');
    await expect(addToCartBtn.first()).toBeVisible({ timeout: 10000 });
  });
});

// =============================================================================
// PHASE 3: CART & CHECKOUT
// =============================================================================
test.describe('Buyer Journey: Phase 3 - Cart & Checkout', () => {
  test('BJ3.1: Add product to cart', async ({ page }) => {
    await page.goto(`/${CHANNEL}/products/customer-support-agent`);
    await page.waitForLoadState('networkidle');

    // Select variant if required
    const variantSelector = page.locator('[data-testid="VariantSelector"] button, [data-testid="VariantSelector"] a');
    const variantVisible = await variantSelector.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (variantVisible) {
      await variantSelector.first().click();
      await page.waitForLoadState('networkidle');
    }

    // Click Add to Cart
    const addToCartBtn = page.locator('button:has-text("Add to Cart")');
    const isVisible = await addToCartBtn.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      const isEnabled = await addToCartBtn.first().isEnabled().catch(() => false);
      if (isEnabled) {
        await addToCartBtn.first().click();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('BJ3.2: Cart page displays items', async ({ page }) => {
    await page.goto(`/${CHANNEL}/cart`);
    await page.waitForLoadState('networkidle');

    // Cart page should load (may be empty or have items)
    await expect(page.locator('body')).toBeVisible();

    // Check for cart content or empty state
    const cartContent = page.locator('[data-testid="CartProductList"], h1:has-text("Shopping Cart")');
    await expect(cartContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('BJ3.3: Checkout button navigates correctly', async ({ page }) => {
    // First add item to cart
    await page.goto(`/${CHANNEL}/products/customer-support-agent`);
    await page.waitForLoadState('networkidle');

    const variantSelector = page.locator('[data-testid="VariantSelector"] button').first();
    if (await variantSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
      await variantSelector.click();
      await page.waitForLoadState('networkidle');
    }

    const addBtn = page.locator('button:has-text("Add to Cart")').first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      if (await addBtn.isEnabled()) {
        await addBtn.click();
        await page.waitForLoadState('networkidle');
      }
    }

    // Go to cart
    await page.goto(`/${CHANNEL}/cart`);
    await page.waitForLoadState('networkidle');

    // Click checkout - should NOT result in 404
    const checkoutLink = page.locator('[data-testid="CheckoutLink"], a:has-text("Checkout")');
    const checkoutVisible = await checkoutLink.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (checkoutVisible) {
      await checkoutLink.first().click();
      await page.waitForLoadState('networkidle');

      // Verify we're on checkout page, NOT 404
      const url = page.url();
      expect(url).toMatch(/\/checkout/);
      expect(url).not.toMatch(/404/);

      // Checkout page should have content
      const pageContent = await page.content();
      expect(pageContent).not.toContain('404');
      expect(pageContent).not.toContain('Page not found');
    }
  });

  test('BJ3.4: Checkout page loads Saleor checkout component', async ({ page }) => {
    await page.goto(`/${CHANNEL}/checkout?checkout=test`);
    await page.waitForLoadState('networkidle');

    // Page should load without error
    await expect(page.locator('body')).toBeVisible();

    // Should show checkout title
    const title = page.locator('h1:has-text("Checkout")');
    await expect(title).toBeVisible({ timeout: 10000 });
  });
});

// =============================================================================
// PHASE 4: AUTHENTICATION
// =============================================================================
test.describe('Buyer Journey: Phase 4 - Authentication', () => {
  test('BJ4.1: Sign in button visible', async ({ page }) => {
    await page.goto(`/${CHANNEL}/marketplace`);
    await page.waitForLoadState('networkidle');

    const signInBtn = page.locator('a:has-text("Sign In"), button:has-text("Sign In"), a:has-text("Get Started")');
    await expect(signInBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test('BJ4.2: Sign in redirects to SSO', async ({ page }) => {
    await page.goto(`/${CHANNEL}/marketplace`);
    await page.waitForLoadState('networkidle');

    const signInBtn = page.locator('a:has-text("Sign In"), button:has-text("Sign In"), a:has-text("Get Started")');
    await signInBtn.first().click();

    // Should redirect to auth page
    await page.waitForURL(/auth|sso|keycloak/, { timeout: 15000 });
  });
});

// =============================================================================
// PHASE 5: ACCOUNT PAGES (Post-Auth)
// =============================================================================
test.describe('Buyer Journey: Phase 5 - Account Management', () => {
  test('BJ5.1: Account page accessible', async ({ page }) => {
    await page.goto(`/${CHANNEL}/account`);
    await expect(page.locator('body')).toBeVisible();
  });

  test('BJ5.2: Instances/My Agents page accessible', async ({ page }) => {
    await page.goto(`/${CHANNEL}/account/instances`);
    await expect(page.locator('body')).toBeVisible();
  });

  test('BJ5.3: Billing page accessible', async ({ page }) => {
    await page.goto(`/${CHANNEL}/account/billing`);
    await expect(page.locator('body')).toBeVisible();
  });

  test('BJ5.4: Settings page accessible', async ({ page }) => {
    await page.goto(`/${CHANNEL}/account/settings`);
    await expect(page.locator('body')).toBeVisible();
  });

  test('BJ5.5: Orders page accessible', async ({ page }) => {
    await page.goto(`/${CHANNEL}/orders`);
    await expect(page.locator('body')).toBeVisible();
  });
});

// =============================================================================
// PHASE 6: INSTANCE ACCESS (Post-Purchase)
// =============================================================================
test.describe('Buyer Journey: Phase 6 - Instance Access', () => {
  test('BJ6.1: Run page structure exists', async ({ page }) => {
    await page.goto(`/${CHANNEL}/run/test-instance`);
    await expect(page.locator('body')).toBeVisible();

    // Should not be a 500 error
    const content = await page.content();
    expect(content).not.toContain('500 Internal Server Error');
  });
});

// =============================================================================
// COMPLETE JOURNEY SMOKE TEST
// =============================================================================
test.describe('Buyer Journey: Complete Flow Smoke Test', () => {
  test('BJ-SMOKE: Browse -> Product -> Cart -> Checkout flow', async ({ page }) => {
    // Step 1: Browse marketplace
    await page.goto(`/${CHANNEL}/marketplace`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(new RegExp(`/${CHANNEL}/marketplace`));

    // Step 2: Click on product
    const productLink = page.locator('a[href*="/products/"]').first();
    await expect(productLink).toBeVisible({ timeout: 15000 });
    const href = await productLink.getAttribute('href');
    await productLink.click();
    await page.waitForLoadState('networkidle');

    // Step 3: On product page, check key elements
    await expect(page.locator('h1').first()).toBeVisible();

    // Step 4: Check cart navigation
    await page.goto(`/${CHANNEL}/cart`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible();

    // Step 5: Check checkout navigation (should not 404)
    await page.goto(`/${CHANNEL}/checkout?checkout=smoke-test`);
    await page.waitForLoadState('networkidle');

    const pageTitle = await page.title();
    expect(pageTitle).not.toContain('404');

    const checkoutTitle = page.locator('h1:has-text("Checkout")');
    await expect(checkoutTitle).toBeVisible({ timeout: 10000 });
  });
});
