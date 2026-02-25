import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("displays hero section with heading and CTA buttons", async ({
    page,
  }) => {
    const hero = page.locator("section").first();
    await expect(hero).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Eataliano", level: 1 })
    ).toBeVisible();
    await expect(
      page.getByText("Authentieke Italiaanse keuken in Arnhem & Huissen")
    ).toBeVisible();
  });

  test("has Bekijk Menu link pointing to /menu", async ({ page }) => {
    const menuLink = page.getByRole("link", { name: "Bekijk Menu" });
    await expect(menuLink).toBeVisible();
    await expect(menuLink).toHaveAttribute("href", "/menu");
  });

  test("has Reserveer een Tafel link pointing to /contact", async ({
    page,
  }) => {
    const contactLink = page.getByRole("link", {
      name: "Reserveer een Tafel",
    });
    await expect(contactLink).toBeVisible();
    await expect(contactLink).toHaveAttribute("href", "/contact");
  });

  test("displays location cards with Arnhem and Huissen", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Onze Locaties" })
    ).toBeVisible();
    await expect(page.getByText("Arnhem")).toBeVisible();
    await expect(page.getByText("Huissen")).toBeVisible();
  });

  test("displays Why Eataliano section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Waarom Eataliano?" })
    ).toBeVisible();
    await expect(page.getByText("Verse Ingredienten")).toBeVisible();
    await expect(page.getByText("Twee Locaties")).toBeVisible();
    await expect(page.getByText("Online Bestellen")).toBeVisible();
  });

  test("has correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/Eataliano/);
  });
});
