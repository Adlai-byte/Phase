import { test, expect } from "@playwright/test";

test.describe("Login flow", () => {
  test("owner can log in and reach dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "elena@phase.com");
    await page.fill('input[name="password"]', "Password1");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("invalid credentials show error", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "elena@phase.com");
    await page.fill('input[name="password"]', "WrongPassword1");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await expect(
      page.locator(
        '[class*="error"], [class*="Error"], p:has-text("Invalid"), div:has-text("Invalid")'
      )
    ).toBeVisible({ timeout: 5000 });
  });

  test("admin can log in and reach admin panel", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@phase.com");
    await page.fill('input[name="password"]', "Password1");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin", { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin/);
  });
});
