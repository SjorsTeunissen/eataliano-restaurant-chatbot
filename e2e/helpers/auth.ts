import { type Page, expect } from "@playwright/test";

/**
 * Reusable admin login helper.
 * Uses E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD env vars as defaults.
 */
export async function adminLogin(
  page: Page,
  email?: string,
  password?: string
): Promise<void> {
  const loginEmail = email ?? process.env.E2E_ADMIN_EMAIL ?? "";
  const loginPassword = password ?? process.env.E2E_ADMIN_PASSWORD ?? "";

  await page.goto("/auth/login");

  await page.getByLabel("E-mailadres").fill(loginEmail);
  await page.getByLabel("Wachtwoord").fill(loginPassword);
  await page.getByRole("button", { name: "Inloggen" }).click();

  await page.waitForURL(/\/admin/);
  await expect(
    page.getByRole("heading", { name: "Dashboard" })
  ).toBeVisible();
}
