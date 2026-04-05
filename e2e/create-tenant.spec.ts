import { test, expect } from "@playwright/test";

test.describe("Create tenant", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "elena@phase.com");
    await page.fill('input[name="password"]', "Password1");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 10000 });
  });

  test("can add a new tenant", async ({ page }) => {
    await page.goto("/dashboard/tenants");
    await page.waitForLoadState("networkidle");
    await page.click('button:has-text("Add Tenant")');
    await page.fill('input[name="name"]', "E2E Test Tenant");
    await page.fill('input[name="phone"]', "0917-999-0001");
    await page.click('button[type="submit"]:has-text("Add Tenant")');
    await expect(page.locator("text=E2E Test Tenant")).toBeVisible({
      timeout: 10000,
    });
  });
});
