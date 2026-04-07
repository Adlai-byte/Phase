import { test, expect } from "@playwright/test";

test.describe("Pay invoice", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "elena@phase.com");
    await page.fill('input[name="password"]', "Password1");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 10000 });
  });

  test("can mark an invoice as paid", async ({ page }) => {
    await page.goto("/dashboard/invoices");
    await page.waitForLoadState("networkidle");
    // Find a PENDING invoice row and click its pay button
    const pendingRow = page
      .locator("tr")
      .filter({ hasText: "PENDING" })
      .first();
    await pendingRow.locator('button[title="Mark as paid"]').click();
    // Verify success — either toast or status change
    await expect(
      page.locator("text=Payment Recorded").or(page.locator("text=PAID"))
    ).toBeVisible({ timeout: 10000 });
  });
});
