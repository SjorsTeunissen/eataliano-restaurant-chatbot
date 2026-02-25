import { test, expect } from "@playwright/test";
import { adminLogin } from "./helpers/auth";

test.describe("Admin menu CRUD operations", () => {
  test.skip(
    !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
    "Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD"
  );

  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/menu");
    await expect(
      page.getByRole("heading", { name: "Menubeheer" })
    ).toBeVisible();
  });

  test("menu management page loads with items", async ({ page }) => {
    // Verify that at least one category group with items is visible
    const itemCards = page.locator("[class*='flex items-center justify-between']");
    await expect(itemCards.first()).toBeVisible();
  });

  test("can open new item form", async ({ page }) => {
    await page.getByRole("button", { name: "Nieuw Item" }).click();

    // Modal should open with the form title
    await expect(page.getByRole("heading", { name: "Nieuw Item" })).toBeVisible();

    // Form fields should be present
    await expect(page.getByLabel("Naam")).toBeVisible();
    await expect(page.getByLabel("Beschrijving")).toBeVisible();
    await expect(page.getByLabel("Prijs")).toBeVisible();
    await expect(page.getByLabel("Categorie")).toBeVisible();
  });

  test("can add a new menu item", async ({ page }) => {
    const uniqueName = `E2E Test Pizza ${Date.now()}`;

    await page.getByRole("button", { name: "Nieuw Item" }).click();
    await expect(page.getByRole("heading", { name: "Nieuw Item" })).toBeVisible();

    // Fill the form
    await page.getByLabel("Naam").fill(uniqueName);
    await page.getByLabel("Beschrijving").fill("Een test pizza voor E2E tests");
    await page.getByLabel("Prijs").fill("12.50");

    // Select the first available category
    const categorySelect = page.getByLabel("Categorie");
    const options = categorySelect.locator("option");
    const optionCount = await options.count();
    if (optionCount > 1) {
      // Select the first real option (skip the placeholder)
      const optionValue = await options.nth(1).getAttribute("value");
      if (optionValue) {
        await categorySelect.selectOption(optionValue);
      }
    }

    // Submit and wait for API response
    const responsePromise = page.waitForResponse((res) =>
      res.url().includes("/api/menu") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Toevoegen" }).click();
    await responsePromise;

    // Verify the new item appears in the list
    await expect(page.getByText(uniqueName)).toBeVisible();
  });

  test("can edit an existing menu item", async ({ page }) => {
    // Click the first edit button
    const editButtons = page.getByRole("button", { name: /^Bewerk / });
    await expect(editButtons.first()).toBeVisible();
    await editButtons.first().click();

    // Modal should open with edit title
    await expect(
      page.getByRole("heading", { name: "Item Bewerken" })
    ).toBeVisible();

    // Change the description
    const descField = page.getByLabel("Beschrijving");
    await descField.fill("Bijgewerkt via E2E test");

    // Save and wait for API response
    const responsePromise = page.waitForResponse((res) =>
      res.url().includes("/api/menu/") && res.request().method() === "PATCH"
    );
    await page.getByRole("button", { name: "Opslaan" }).click();
    await responsePromise;
  });

  test("can toggle item availability", async ({ page }) => {
    // Find the first availability toggle
    const toggles = page.locator("input[type='checkbox'][aria-label*='beschikbaar']");
    await expect(toggles.first()).toBeAttached();

    const wasChecked = await toggles.first().isChecked();

    // Click the toggle and wait for API response
    const responsePromise = page.waitForResponse((res) =>
      res.url().includes("/api/menu/") && res.request().method() === "PATCH"
    );
    await toggles.first().click({ force: true });
    await responsePromise;

    // Verify the toggle state changed
    const isCheckedNow = await toggles.first().isChecked();
    expect(isCheckedNow).toBe(!wasChecked);
  });
});
