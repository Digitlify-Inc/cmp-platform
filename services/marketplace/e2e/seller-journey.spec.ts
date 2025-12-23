import { test, expect } from "@playwright/test";

const TEST_ACCOUNTS = {
  admin: {
    email: "admin@dev.gsv.dev",
    password: "Admin123!",
  },
};

const URLS = {
  site: "https://dev.gsv.dev",
  dashboard: "https://admin.dev.gsv.dev",
};

test.describe("S1: Seller Dashboard Access", () => {
  test("S1.1: Saleor Dashboard loads", async ({ page }) => {
    await page.goto(URLS.dashboard);
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("S2: Product Management", () => {
  test("S2.1: Products list is visible after login", async ({ page }) => {
    await page.goto(URLS.dashboard);
    const emailInput = page.locator("input[type=email], input[name=email]");
    if (await emailInput.isVisible()) {
      await emailInput.fill(TEST_ACCOUNTS.admin.email);
      await page.locator("input[type=password]").fill(TEST_ACCOUNTS.admin.password);
      await page.locator("button[type=submit]").click();
      await page.waitForLoadState("networkidle");
    }
    const productsLink = page.locator("a:has-text(\"Products\"), [href*=products]");
    if (await productsLink.first().isVisible()) {
      await productsLink.first().click();
      await page.waitForLoadState("networkidle");
      const productsList = page.locator("[class*=product], table");
      await expect(productsList.first()).toBeVisible();
    }
  });
});

test.describe("S5: Marketplace Listing Verification", () => {
  test("S5.1: Products appear in marketplace", async ({ page }) => {
    await page.goto(URLS.site + '/marketplace');
    const products = page.locator('li[data-testid="ProductElement"], .group.block, article, a[href*="/marketplace/agents/"]');
    await expect(products.first()).toBeVisible({ timeout: 10000 });
  });
});
