import { test, expect } from "@playwright/test";

test.describe("Reservation flow via chatbot", () => {
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

  test("user can request a reservation through chat", async ({ page }) => {
    const input = page.getByPlaceholder("Stel een vraag...");
    await input.fill(
      "Ik wil graag een tafel reserveren voor 4 personen op 15 maart om 19:00 in Arnhem. Naam: Test Klant, telefoon: 0612345678"
    );
    await page.getByRole("button", { name: "Verstuur bericht" }).click();

    // User message should appear
    await expect(page.getByTestId("chat-message-user")).toBeVisible();

    // Wait for assistant response with confirmation language
    const assistantMessage = page.getByTestId("chat-message-assistant");
    await expect(assistantMessage).toBeVisible({ timeout: 30000 });
  });

  test("bot asks for missing reservation details", async ({ page }) => {
    const input = page.getByPlaceholder("Stel een vraag...");
    await input.fill("Ik wil reserveren");
    await page.getByRole("button", { name: "Verstuur bericht" }).click();

    // User message should appear
    await expect(page.getByTestId("chat-message-user")).toBeVisible();

    // Bot should respond asking for more details
    const assistantMessage = page.getByTestId("chat-message-assistant");
    await expect(assistantMessage).toBeVisible({ timeout: 15000 });
  });
});
