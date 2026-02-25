import { test, expect } from "@playwright/test";

test.describe("Chatbot sidebar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("chat toggle button is visible on page load", async ({ page }) => {
    const toggle = page.getByRole("button", { name: "Open chat" });
    await expect(toggle).toBeVisible();
  });

  test("clicking toggle opens sidebar", async ({ page }) => {
    await page.getByRole("button", { name: "Open chat" }).click();

    const sidebar = page.getByRole("complementary", { name: "Chatpaneel" });
    await expect(sidebar).toHaveCSS("transform", "none");
  });

  test("sidebar contains header, input, and send button", async ({ page }) => {
    await page.getByRole("button", { name: "Open chat" }).click();

    await expect(page.getByText("Chat met Eataliano")).toBeVisible();
    await expect(page.getByPlaceholder("Stel een vraag...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Verstuur bericht" })).toBeVisible();
  });

  test("welcome message displayed on first open", async ({ page }) => {
    await page.getByRole("button", { name: "Open chat" }).click();

    await expect(page.getByTestId("welcome-message")).toBeVisible();
    await expect(page.getByText(/Welkom bij Eataliano/)).toBeVisible();
  });

  test("clicking close button closes sidebar", async ({ page }) => {
    await page.getByRole("button", { name: "Open chat" }).click();

    const sidebar = page.getByRole("complementary", { name: "Chatpaneel" });
    await expect(sidebar).toHaveCSS("transform", "none");

    // Click close button in header
    await sidebar.getByRole("button", { name: "Sluit chat" }).click();

    // Toggle should now show "Open chat" again
    await expect(page.getByRole("button", { name: "Open chat" })).toBeVisible();
  });

  test("clicking toggle again reopens sidebar", async ({ page }) => {
    const toggle = page.getByRole("button", { name: "Open chat" });
    await toggle.click();

    const sidebar = page.getByRole("complementary", { name: "Chatpaneel" });
    await expect(sidebar).toHaveCSS("transform", "none");

    // Close via toggle
    await page.getByRole("button", { name: "Sluit chat" }).first().click();

    // Reopen
    await page.getByRole("button", { name: "Open chat" }).click();
    await expect(sidebar).toHaveCSS("transform", "none");
  });
});

test.describe("Chatbot AI conversation", () => {
  test.skip(
    !process.env.OPENAI_API_KEY,
    "Requires OPENAI_API_KEY to be set"
  );

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open chat" }).click();
    await expect(
      page.getByRole("complementary", { name: "Chatpaneel" })
    ).toHaveCSS("transform", "none");
  });

  test("user can send a message and receive a response", async ({ page }) => {
    const input = page.getByPlaceholder("Stel een vraag...");
    await input.fill("Hallo");
    await page.getByRole("button", { name: "Verstuur bericht" }).click();

    // User message should appear
    await expect(page.getByTestId("chat-message-user")).toBeVisible();

    // Wait for assistant response (generous timeout for OpenAI)
    await expect(page.getByTestId("chat-message-assistant")).toBeVisible({
      timeout: 15000,
    });
  });

  test("shows loading indicator while waiting for response", async ({
    page,
  }) => {
    const input = page.getByPlaceholder("Stel een vraag...");
    await input.fill("Wat zijn jullie openingstijden?");
    await page.getByRole("button", { name: "Verstuur bericht" }).click();

    // Typing indicator should appear while waiting
    await expect(page.getByTestId("typing-indicator")).toBeVisible();

    // Eventually the assistant response should appear
    await expect(page.getByTestId("chat-message-assistant")).toBeVisible({
      timeout: 15000,
    });
  });
});
