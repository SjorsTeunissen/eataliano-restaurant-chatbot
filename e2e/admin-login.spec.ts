import { test, expect } from "@playwright/test";
import { adminLogin } from "./helpers/auth";

test.describe("Admin access (unauthenticated)", () => {
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

test.describe("Admin login and dashboard", () => {
  test.skip(
    !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
    "Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD"
  );

  test("admin can log in with valid credentials", async ({ page }) => {
    await adminLogin(page);
    await expect(page).toHaveURL(/\/admin/);
    await expect(
      page.getByRole("heading", { name: "Dashboard" })
    ).toBeVisible();
  });

  test("dashboard displays stat cards", async ({ page }) => {
    await adminLogin(page);

    await expect(page.getByText("Bestellingen Vandaag")).toBeVisible();
    await expect(page.getByText("Reserveringen Vandaag")).toBeVisible();
    await expect(page.getByText("Menu Items")).toBeVisible();
    await expect(page.getByText("Categorieen")).toBeVisible();
  });

  test("dashboard has link to menu management", async ({ page }) => {
    await adminLogin(page);

    const menuLink = page.getByRole("link", { name: "Beheer Menu" });
    await expect(menuLink).toBeVisible();
    await expect(menuLink).toHaveAttribute("href", "/admin/menu");
  });

  test("admin sidebar navigation links are visible", async ({ page }) => {
    await adminLogin(page);

    const sidebar = page.getByTestId("admin-sidebar");
    await expect(sidebar.getByText("Dashboard")).toBeVisible();
    await expect(sidebar.getByText("Menu")).toBeVisible();
    await expect(sidebar.getByText("Bestellingen")).toBeVisible();
    await expect(sidebar.getByText("Reserveringen")).toBeVisible();
    await expect(sidebar.getByText("Instellingen")).toBeVisible();
  });

  test("admin can log out", async ({ page }) => {
    await adminLogin(page);

    // Click the logout button (visible on desktop in the top bar)
    await page.getByRole("button", { name: "Uitloggen" }).first().click();

    // Should be redirected to login page
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
