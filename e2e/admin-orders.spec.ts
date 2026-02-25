import { test, expect } from "@playwright/test";

test.describe("Admin Order & Reservation Management", () => {
  test("redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("orders page loads with correct header after login", async ({
    page,
  }) => {
    // Navigate to login
    await page.goto("/auth/login");

    // Fill in credentials
    await page.getByLabel("E-mailadres").fill(process.env.TEST_ADMIN_EMAIL || "admin@test.com");
    await page.getByLabel("Wachtwoord").fill(process.env.TEST_ADMIN_PASSWORD || "password");
    await page.getByRole("button", { name: "Inloggen" }).click();

    // Navigate to orders
    await page.goto("/admin/orders");
    await expect(page.getByRole("heading", { name: "Bestellingen" })).toBeVisible();
  });

  test("reservations page loads with correct header after login", async ({
    page,
  }) => {
    await page.goto("/auth/login");
    await page.getByLabel("E-mailadres").fill(process.env.TEST_ADMIN_EMAIL || "admin@test.com");
    await page.getByLabel("Wachtwoord").fill(process.env.TEST_ADMIN_PASSWORD || "password");
    await page.getByRole("button", { name: "Inloggen" }).click();

    await page.goto("/admin/reservations");
    await expect(
      page.getByRole("heading", { name: "Reserveringen" })
    ).toBeVisible();
  });

  test("admin sidebar navigation links work", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("E-mailadres").fill(process.env.TEST_ADMIN_EMAIL || "admin@test.com");
    await page.getByLabel("Wachtwoord").fill(process.env.TEST_ADMIN_PASSWORD || "password");
    await page.getByRole("button", { name: "Inloggen" }).click();

    await page.goto("/admin/orders");

    // Click on Reserveringen link in sidebar
    await page.getByRole("link", { name: "Reserveringen" }).click();
    await expect(page).toHaveURL(/\/admin\/reservations/);
    await expect(
      page.getByRole("heading", { name: "Reserveringen" })
    ).toBeVisible();

    // Click on Bestellingen link in sidebar
    await page.getByRole("link", { name: "Bestellingen" }).click();
    await expect(page).toHaveURL(/\/admin\/orders/);
    await expect(
      page.getByRole("heading", { name: "Bestellingen" })
    ).toBeVisible();
  });
});
