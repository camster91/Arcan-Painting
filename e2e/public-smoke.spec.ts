import { expect, test } from "@playwright/test";

test.describe("public conversion and account routes", () => {
  test("visitors can reach the enquiry form through the responsive navigation", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);

    const menu = page.locator('header button[aria-controls="premium-navigation"]');
    if (await menu.isVisible()) {
      await menu.click();
      await expect(menu).toHaveAttribute("aria-expanded", "true");
      await page.keyboard.press("Escape");
      await expect(menu).toHaveAttribute("aria-expanded", "false");
      await expect(menu).toBeFocused();
      await menu.click();
    }
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Enquire", exact: true }).click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.getByRole("heading", { name: "Tell us what you have in mind." })).toBeVisible();
    await expect(page.getByLabel("Your name", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send project enquiry" })).toBeEnabled();
    expect(pageErrors).toEqual([]);
  });

  test("privacy and invalid service URLs have the expected public response", async ({ page }) => {
    const privacy = await page.goto("/privacy", { waitUntil: "domcontentloaded" });
    expect(privacy?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Privacy Notice" })).toBeVisible();

    const missing = await page.goto("/interior-painting/not-a-service-area", { waitUntil: "domcontentloaded" });
    expect(missing?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page Not Found" })).toBeVisible();

    const missingApiRoute = await page.request.get("/api/does-not-exist");
    expect(missingApiRoute.status()).toBe(404);
    expect(missingApiRoute.headers()["content-type"]).toContain("application/json");
  });

  test("health refuses to mark an unconfigured CRM ready", async ({ page }) => {
    const health = await page.request.get("/api/health");

    expect(health.status()).toBe(503);
    await expect(health.json()).resolves.toMatchObject({ status: "unavailable" });
  });

  test("account links render and are excluded from indexing", async ({ page }) => {
    for (const route of [
      "/account/signin",
      "/account/forgot-password",
      "/account/reset-password?token=test-token",
      "/account/accept-invite?token=test-token",
      "/account/change-password",
    ]) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status(), route).toBe(200);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
    }
  });
});
