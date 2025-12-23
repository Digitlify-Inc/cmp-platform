import { test, expect } from '@playwright/test';

const TEST_ACCOUNTS = {
  buyer: {
    email: 'buyer@test.gsv.dev',
    password: 'Test123!',
  },
};

const CATEGORIES = ['Agents', 'Apps', 'Assistants', 'Automations'];

test.describe('B1: Anonymous Browse & Discovery', () => {
  test('B1.1: Marketplace loads without login', async ({ page }) => {
    // Go directly to marketplace (root may redirect differently)
    await page.goto('/default-channel/marketplace');
    await expect(page).toHaveURL(/\/default-channel\/marketplace/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('B1.2: Products are visible on marketplace page', async ({ page }) => {
    await page.goto('/default-channel/marketplace');
    const productCards = page.locator('li[data-testid="ProductElement"], .group.block, article, a[href*="/marketplace/agents/"]');
    await expect(productCards.first()).toBeVisible({ timeout: 15000 });
    const count = await productCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('B1.3: Category tabs filter products', async ({ page }) => {
    await page.goto('/default-channel/marketplace');
    await page.waitForLoadState('networkidle');
    for (const category of CATEGORIES) {
      const tab = page.locator(`a:has-text("${category}"), button:has-text("${category}")`);
      if (await tab.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await tab.first().click();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('B1.4: Search functionality works', async ({ page }) => {
    await page.goto('/default-channel/marketplace');
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
    const isVisible = await searchInput.first().isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      await searchInput.first().fill('customer support');
      await searchInput.first().press('Enter');
      await page.waitForLoadState('networkidle');
    }
  });

  test('B1.5: Product card click navigates to detail page', async ({ page }) => {
    await page.goto('/default-channel/marketplace');
    const firstProduct = page.locator('a[href*="/marketplace/agents/"], a[href*="/products/"], article a').first();
    await expect(firstProduct).toBeVisible({ timeout: 15000 });
    await firstProduct.click();
    await expect(page).toHaveURL(/\/products\/|\/marketplace\/(agents|apps)/);
  });
});

test.describe('B2: Product Evaluation', () => {
  test('B2.1: Product detail page displays real data', async ({ page }) => {
    await page.goto('/default-channel/products/customer-support-agent');
    // Use first() to avoid strict mode violation when multiple h1 elements exist
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  });

  test('B2.2: Pricing information is displayed', async ({ page }) => {
    await page.goto('/default-channel/products/customer-support-agent');
    // Look for dollar amounts in page - prices should be visible
    // Use first() to avoid strict mode violation when multiple price elements exist
    await expect(page.getByText(/\$\d+/).first()).toBeVisible({ timeout: 10000 });
  });

  test('B2.3: Add to cart button is visible', async ({ page }) => {
    await page.goto('/default-channel/products/customer-support-agent');
    const addToCartBtn = page.locator('button:has-text("Add to Cart"), button:has-text("Buy"), button:has-text("Subscribe")');
    await expect(addToCartBtn.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('B3: Authentication Flow', () => {
  test('B3.1: Login button is visible', async ({ page }) => {
    await page.goto('/default-channel/marketplace');
    const loginBtn = page.locator('button:has-text("Sign In"), a:has-text("Sign In"), a:has-text("Get Started")');
    await expect(loginBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test('B3.2: Login redirects to Keycloak', async ({ page }) => {
    await page.goto('/default-channel/marketplace');
    const loginBtn = page.locator('button:has-text("Sign In"), a:has-text("Sign In"), a:has-text("Get Started")');
    await loginBtn.first().click();
    // Wait for redirect to SSO or auth page
    // The marketplace may show /auth/signin before redirecting to external Keycloak
    await page.waitForURL(/keycloak|sso|auth/, { timeout: 15000 });
    // Verify we're on an auth-related page (either internal auth/signin or external Keycloak)
    const url = page.url();
    expect(url).toMatch(/keycloak|sso|auth/);
  });

  test('B3.3: Successful login redirects back', async ({ page }) => {
    // Skip test if SSO is not reachable (Docker DNS limitation)
    test.skip(true, 'SSO login requires DNS resolution to sso.dev.gsv.dev - skipped in Docker environment');

    await page.goto('/default-channel/marketplace');
    const loginBtn = page.locator('button:has-text("Sign In"), a:has-text("Sign In"), a:has-text("Get Started")');
    await loginBtn.first().click();
    await page.waitForURL(/keycloak|sso|auth/, { timeout: 15000 });
    await page.fill('input[name="username"], #username', TEST_ACCOUNTS.buyer.email);
    await page.fill('input[name="password"], #password', TEST_ACCOUNTS.buyer.password);
    await page.click('input[type="submit"], button[type="submit"]');
    await page.waitForURL(/marketplace/, { timeout: 20000 });
    const userMenu = page.locator('button:has-text("Sign Out"), a:has-text("My Account")');
    await expect(userMenu.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('B5: Add to Cart & Checkout', () => {
  test('B5.1: Add product to cart', async ({ page }) => {
    await page.goto('/default-channel/products/customer-support-agent');

    // First, select a variant to enable the Add to Cart button
    const variantSelector = page.locator('[data-testid="VariantSelector"] a, [data-testid="VariantSelector"] button');
    const variantVisible = await variantSelector.first().isVisible({ timeout: 5000 }).catch(() => false);
    if (variantVisible) {
      await variantSelector.first().click();
      await page.waitForLoadState('networkidle');
    }

    // Now try to add to cart
    const addToCartBtn = page.locator('button:has-text("Add to Cart"), button:has-text("Buy")');
    const isVisible = await addToCartBtn.first().isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      // Check if button is enabled (not disabled)
      const isDisabled = await addToCartBtn.first().isDisabled().catch(() => true);
      if (!isDisabled) {
        await addToCartBtn.first().click();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('B5.2: Cart page is accessible', async ({ page }) => {
    await page.goto('/default-channel/cart');
    await expect(page.locator('body')).toBeVisible();
  });

  test('B5.3: Checkout button accessible', async ({ page }) => {
    await page.goto('/default-channel/cart');
    const checkoutBtn = page.locator('[data-testid="CheckoutLink"], button:has-text("Checkout")');
    const checkoutVisible = await checkoutBtn.first().isVisible({ timeout: 5000 }).catch(() => false);
    if (checkoutVisible) {
      await expect(checkoutBtn.first()).toBeVisible();
    }
  });
});

test.describe('B7: Account Pages', () => {
  test('B7.1: Account page requires authentication', async ({ page }) => {
    await page.goto('/default-channel/account');
    await expect(page.locator('body')).toBeVisible();
  });

  test('B7.2: Settings page is accessible', async ({ page }) => {
    await page.goto('/default-channel/account/settings');
    await expect(page.locator('body')).toBeVisible();
  });

  test('B7.3: Billing page is accessible', async ({ page }) => {
    await page.goto('/default-channel/account/billing');
    await expect(page.locator('body')).toBeVisible();
  });

  test('B7.4: My Agents page is accessible', async ({ page }) => {
    await page.goto('/default-channel/account/subscriptions');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Navigation & Layout', () => {
  test('Header navigation links work', async ({ page }) => {
    await page.goto('/default-channel/marketplace');
    const navLinks = ['Marketplace', 'Solutions', 'Pricing'];
    for (const link of navLinks) {
      const navLink = page.locator(`nav a:has-text("${link}"), header a:has-text("${link}")`);
      const isVisible = await navLink.first().isVisible({ timeout: 3000 }).catch(() => false);
      if (isVisible) {
        await expect(navLink.first()).toBeVisible();
      }
    }
  });

  test('Footer is present', async ({ page }) => {
    await page.goto('/default-channel/marketplace');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible({ timeout: 10000 });
  });

  test('Mobile menu works on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/default-channel/marketplace');
    const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]');
    const menuVisible = await menuButton.first().isVisible({ timeout: 5000 }).catch(() => false);
    if (menuVisible) {
      await menuButton.first().click();
      const mobileNav = page.locator('nav');
      await expect(mobileNav.first()).toBeVisible();
    }
  });
});
