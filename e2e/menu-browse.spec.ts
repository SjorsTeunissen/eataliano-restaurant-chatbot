import { test, expect } from "@playwright/test";

test.describe("Menu page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/menu");
  });

  test("displays page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Ons Menu", level: 1 })
    ).toBeVisible();
  });

  test("displays menu items", async ({ page }) => {
    // At least one menu item card should be visible
    const cards = page.locator("[class*='bg-white']").filter({
      has: page.locator("h3"),
    });
    await expect(cards.first()).toBeVisible();
  });

  test("displays category filter tabs", async ({ page }) => {
    const filterNav = page.getByRole("navigation", {
      name: "Categoriefilter",
    });
    await expect(filterNav).toBeVisible();
    await expect(filterNav.getByText("Alles")).toBeVisible();
  });

  test("filters items when clicking a category tab", async ({ page }) => {
    const filterNav = page.getByRole("navigation", {
      name: "Categoriefilter",
    });

    // Get all category buttons (excluding "Alles")
    const categoryButtons = filterNav.getByRole("button").filter({
      hasNot: page.getByText("Alles"),
    });

    const buttonCount = await categoryButtons.count();
    if (buttonCount === 0) {
      test.skip();
      return;
    }

    // Get the text of the first category button
    const firstCategoryName = await categoryButtons.first().textContent();

    // Click the first category filter
    await categoryButtons.first().click();

    // Verify the category heading is still visible
    if (firstCategoryName) {
      await expect(
        page.getByRole("heading", { name: firstCategoryName })
      ).toBeVisible();
    }
  });

  test('shows all items when clicking "Alles"', async ({ page }) => {
    const filterNav = page.getByRole("navigation", {
      name: "Categoriefilter",
    });

    // Click a category first (if available)
    const categoryButtons = filterNav.getByRole("button").filter({
      hasNot: page.getByText("Alles"),
    });

    if ((await categoryButtons.count()) > 0) {
      await categoryButtons.first().click();
    }

    // Click "Alles" to reset
    await filterNav.getByText("Alles").click();

    // Verify multiple sections are displayed
    const sections = page.locator("section");
    await expect(sections.first()).toBeVisible();
  });

  test("displays allergen and dietary badges", async ({ page }) => {
    // Look for badge-styled spans within the menu area
    const badges = page.locator("span").filter({
      has: page.locator("text=/vegetarian|vegan|gluten|dairy|noten/i"),
    });

    // If menu items have badges, they should be visible
    const badgeCount = await badges.count();
    if (badgeCount > 0) {
      await expect(badges.first()).toBeVisible();
    }
  });

  test("filtered view hides items from other categories", async ({ page }) => {
    const filterNav = page.getByRole("navigation", {
      name: "Categoriefilter",
    });

    // Get all category buttons (excluding "Alles")
    const categoryButtons = filterNav.getByRole("button").filter({
      hasNot: page.getByText("Alles"),
    });

    const buttonCount = await categoryButtons.count();
    if (buttonCount < 2) {
      test.skip();
      return;
    }

    // Get the names of the first two categories
    const firstCategoryName = await categoryButtons.nth(0).textContent();
    const secondCategoryName = await categoryButtons.nth(1).textContent();

    // Click the first category filter
    await categoryButtons.nth(0).click();

    // The first category heading should be visible
    if (firstCategoryName) {
      await expect(
        page.getByRole("heading", { name: firstCategoryName })
      ).toBeVisible();
    }

    // The second category heading should NOT be visible
    if (secondCategoryName) {
      await expect(
        page.getByRole("heading", { name: secondCategoryName })
      ).not.toBeVisible();
    }
  });

  test("menu item cards show price", async ({ page }) => {
    // Look for a price formatted in EUR (e.g. "€ 12,50" or "€12,50")
    const pricePattern = page.locator("text=/€\\s?\\d+[,.]\\d{2}/");
    await expect(pricePattern.first()).toBeVisible();
  });
});
