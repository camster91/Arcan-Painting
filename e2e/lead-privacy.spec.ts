import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

const landing = "/?utm_source=search&utm_medium=paid&utm_campaign=painting&utm_content=hero&utm_term=interior";
const attribution = {
  landingPage: landing, referrer: "https://search.example.test/",
  utmSource: "search", utmMedium: "paid", utmCampaign: "painting", utmContent: "hero", utmTerm: "interior",
};
const customer = { name: "Privacy Fixture", email: "fixture@example.test", phone: "4165550101" };

async function fillInquiry(page: Page, path: "popup" | "embedded", method: "email" | "phone"): Promise<Locator> {
  // Only intercepted synthetic submissions. No live CRM, email or payment action.
  await page.route("**/api/availability?**", route => route.fulfill({ json: [] }));
  await page.goto(landing, { referer: attribution.referrer, waitUntil: "domcontentloaded" });
  // Wait for hydration/first-touch capture, so both paths exercise real getAttribution().
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("arcan_attribution") || "{}"))).toEqual(attribution);
  let form: Locator;
  if (path === "popup") {
    await page.locator("header").getByRole("button", { name: /^(discuss your project|contact)$/i }).click();
    form = page.getByRole("dialog", { name: /discuss your project/i });
  } else {
    form = page.locator("#contact");
  }
  await form.getByRole("button", { name: "Interior", exact: true }).click();
  await form.getByRole("textbox", { name: "Full name", exact: true }).fill(customer.name);
  await form.getByRole("button", { name: "Go to next step" }).click();
  await form.getByRole("button", { name: method === "email" ? "Email" : "Phone", exact: true }).click();
  await form.locator(`input[type=${method === "email" ? "email" : "tel"}]`).fill(customer[method]);
  await form.getByRole("button", { name: "Go to next step" }).click();
  return form;
}

for (const path of ["popup", "embedded"] as const) {
  for (const method of ["email", "phone"] as const) {
    test(`${path} ${method} submission preserves attribution and navigates without personal data`, async ({ page }) => {
      let payload: Record<string, unknown> | undefined;
      await page.route("**/api/contact", async route => {
        payload = route.request().postDataJSON();
        expect(route.request().method()).toBe("POST");
        expect(new URL(route.request().url()).search).toBe("");
        await route.fulfill({ json: { success: true, lead_saved: true, lead_id: 45 } });
      });
      const form = await fillInquiry(page, path, method);
      await form.getByRole("button", { name: "Submit", exact: true }).click();
      await expect(page).toHaveURL(/\/thank-you$/);
      expect(payload).toMatchObject({ name: customer.name, preferredContact: method, serviceType: "interior", attribution });
      expect(payload?.[method]).toBe(customer[method]);
      expect(payload?.[method === "email" ? "phone" : "email"]).toBe("");
      await expect(page.getByRole("heading", { name: "Thank you!", exact: true })).toBeVisible();
      const events = await page.evaluate(() => window.dataLayer || []);
      expect(JSON.stringify(events)).not.toMatch(/Privacy Fixture|fixture@example\.test|4165550101/);
    });
  }

  test(`${path} failed submissions stay on the form and retry with the same attribution`, async ({ page }) => {
    const payloads: unknown[] = [];
    let release: (() => void) | undefined;
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/api/contact", async route => {
      payloads.push(route.request().postDataJSON());
      if (payloads.length === 1) {
        await pending;
        await route.fulfill({ status: 503, json: { error: "Fixture save failed. Please retry." } });
      } else {
        await route.fulfill({ json: { success: true, lead_saved: true, lead_id: 45 } });
      }
    });
    const form = await fillInquiry(page, path, "email");
    await form.getByRole("button", { name: "Submit", exact: true }).click();
    const busy = form.getByRole("button", { name: "Submitting…", exact: true });
    try {
      await expect(busy).toBeDisabled();
      await expect(busy).toHaveAttribute("aria-busy", "true");
    } finally { release?.(); }
    await expect(form.getByText("Fixture save failed. Please retry.")).toBeVisible();
    expect(new URL(page.url()).pathname).toBe("/");
    await form.getByRole("button", { name: "Submit", exact: true }).click();
    await expect(page).toHaveURL(/\/thank-you$/);
    expect(payloads).toHaveLength(2);
    expect(payloads[0]).toEqual(payloads[1]);
    expect(payloads[1]).toMatchObject({ attribution });
  });
}

test("legacy personal query strings redirect before rendering and analytics", async ({ page }) => {
  const legacy = "/thank-you?name=Privacy%20Fixture&email=fixture%40example.test&phone=4165550101&serviceType=interior";
  const redirect = await page.request.get(legacy, { maxRedirects: 0 });
  expect(redirect.status()).toBe(302);
  expect(redirect.headers()["location"]).toBe("/thank-you");
  expect(redirect.headers()["referrer-policy"]).toBe("no-referrer");
  await page.route("**/api/availability?**", route => route.fulfill({ json: [] }));
  await page.goto(legacy);
  await expect(page).toHaveURL(/\/thank-you$/);
  await expect(page.getByRole("heading", { name: "Thank you!", exact: true })).toBeVisible();
  const events = await page.evaluate(() => window.dataLayer || []);
  expect(JSON.stringify(events)).not.toMatch(/Privacy Fixture|fixture@example\.test|4165550101/);
});
