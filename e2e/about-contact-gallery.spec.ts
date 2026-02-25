import { test, expect } from "@playwright/test";

test.describe("About page", () => {
  test("renders hero and story content", async ({ page }) => {
    await page.goto("/about");

    await expect(
      page.getByRole("heading", { name: "Over Ons", level: 1 })
    ).toBeVisible();

    await expect(page.getByText("Ons Verhaal")).toBeVisible();
    await expect(page.getByText("Onze Waarden")).toBeVisible();
  });

  test("displays value cards", async ({ page }) => {
    await page.goto("/about");

    await expect(page.getByText("Verse Ingrediënten")).toBeVisible();
    await expect(page.getByText("Authentieke Recepten")).toBeVisible();
    await expect(page.getByText("Warm Onthaal")).toBeVisible();
  });
});

test.describe("Contact page", () => {
  test("renders hero and location cards", async ({ page }) => {
    await page.goto("/contact");

    await expect(
      page.getByRole("heading", { name: "Contact", level: 1 })
    ).toBeVisible();

    await expect(page.getByText("Arnhem")).toBeVisible();
    await expect(page.getByText("Huissen")).toBeVisible();
  });

  test("shows addresses and phone numbers", async ({ page }) => {
    await page.goto("/contact");

    await expect(
      page.getByText("Steenstraat 97, 6828 CK Arnhem")
    ).toBeVisible();
    await expect(
      page.getByText("Langestraat 96, 6851 BH Huissen")
    ).toBeVisible();
    await expect(page.getByText("026-3700111")).toBeVisible();
    await expect(page.getByText("026-3253700")).toBeVisible();
  });

  test("shows opening hours", async ({ page }) => {
    await page.goto("/contact");

    await expect(page.getByText("Openingstijden").first()).toBeVisible();
    await expect(page.getByText("Maandag").first()).toBeVisible();
    await expect(page.getByText("Zondag").first()).toBeVisible();
  });

  test("shows map placeholders", async ({ page }) => {
    await page.goto("/contact");

    const mapPlaceholders = page.getByText("Kaart binnenkort beschikbaar");
    await expect(mapPlaceholders.first()).toBeVisible();
  });
});

test.describe("Gallery page", () => {
  test("renders hero section", async ({ page }) => {
    await page.goto("/gallery");

    await expect(
      page.getByRole("heading", { name: "Galerij", level: 1 })
    ).toBeVisible();
  });

  test("shows images or empty state", async ({ page }) => {
    await page.goto("/gallery");

    const hasImages = (await page.locator("img").count()) > 0;
    const hasEmptyState =
      (await page
        .getByText("Er zijn nog geen foto's beschikbaar.")
        .count()) > 0;

    expect(hasImages || hasEmptyState).toBe(true);
  });
});

test.describe("Navigation", () => {
  test("header links navigate to correct pages", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Over Ons" }).click();
    await expect(page).toHaveURL("/about");

    await page.getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL("/contact");

    await page.getByRole("link", { name: "Galerij" }).click();
    await expect(page).toHaveURL("/gallery");
  });
});
