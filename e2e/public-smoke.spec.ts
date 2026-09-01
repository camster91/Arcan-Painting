import { expect, test } from "@playwright/test";

test.describe("public conversion and account routes", () => {
  test("visitors can open and dismiss the estimate dialog", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);

    await page.locator("header").getByRole("button", { name: /^(discuss your project|contact)$/i }).click();
    const dialog = page.getByRole("dialog", { name: /discuss your project/i });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
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
