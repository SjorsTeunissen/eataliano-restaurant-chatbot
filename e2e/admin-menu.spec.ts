import { test, expect } from "@playwright/test";

test.describe("Admin Dashboard & Menu Management", () => {
  test("unauthenticated user visiting /admin is redirected to /auth/login", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("unauthenticated user visiting /admin/menu is redirected to /auth/login", async ({
    page,
  }) => {
    await page.goto("/admin/menu");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("login page has admin login form", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(
      page.getByRole("heading", { name: "Admin Inloggen" })
    ).toBeVisible();
    await expect(page.getByLabel("E-mailadres")).toBeVisible();
    await expect(page.getByLabel("Wachtwoord")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Inloggen" })
    ).toBeVisible();
  });
});
