import { test, expect } from "@playwright/test";

test.describe("Admin impersonation", () => {
  test("admin can impersonate owner and return", async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@phase.com");
    await page.fill('input[name="password"]', "Password1");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin", { timeout: 10000 });

    // Navigate to owners and impersonate
    await page.goto("/admin/owners");
    await page.waitForLoadState("networkidle");
    // Find the first impersonate button
    await page.click('button:has-text("Impersonate")');
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    // Verify impersonation banner
    await expect(page.locator("text=impersonation")).toBeVisible({
      timeout: 5000,
    });

    // Return to admin
    await page.click("text=Return to Admin");
    await page.waitForURL("**/admin", { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin/);
  });
});
