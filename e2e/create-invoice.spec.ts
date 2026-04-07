import { test, expect } from "@playwright/test";

test.describe("Create invoice", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "elena@phase.com");
    await page.fill('input[name="password"]', "Password1");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 10000 });
  });

  test("can create a new invoice", async ({ page }) => {
    await page.goto("/dashboard/invoices");
    await page.waitForLoadState("networkidle");
    await page.click('button:has-text("Create Invoice")');
    await page.selectOption('select[name="tenantId"]', { index: 1 });
    await page.selectOption('select[name="type"]', "RENT");
    await page.fill('input[name="amount"]', "5000");
    await page.fill('input[name="dueDate"]', "2026-07-01");
    await page.click('button[type="submit"]:has-text("Create Invoice")');
    await expect(page.locator("text=PENDING")).toBeVisible({ timeout: 10000 });
  });
});
