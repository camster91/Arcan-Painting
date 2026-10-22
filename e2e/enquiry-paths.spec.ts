import { expect, test } from "@playwright/test";

const services = [
  ["interior-painting", "Interior"], ["exterior-painting", "Exterior"],
  ["commercial-painting", "Commercial"], ["wallpaper-services", "Wallpaper"],
  ["specialty-finishes", "Specialty Finishes"],
];

for (const [route, label] of services) {
  test(`${route}: both body CTAs and header preserve service and keyboard focus`, async ({ page }, testInfo) => {
    await page.goto(`/${route}`);
    for (const trigger of [
      page.getByRole("main").getByRole("button", { name: "Discuss Your Project", exact: true }),
      page.getByRole("main").getByRole("button", { name: "Contact the Team", exact: true }),
      page.locator("header").getByRole("button", { name: /^(discuss your project|contact)$/i }),
    ]) {
      await trigger.focus();
      await trigger.press("Enter");
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("button", { name: label, exact: true })).toHaveAttribute("aria-pressed", "true");
      const close = dialog.getByRole("button", { name: "Close project inquiry form" });
      await expect(close).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(dialog.getByRole("button", { name: "Go to next step" })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(close).toBeFocused();
      const bounds = await dialog.boundingBox();
      expect(bounds?.y).toBeGreaterThanOrEqual(0);
      expect((bounds?.y || 0) + (bounds?.height || 0)).toBeLessThanOrEqual(page.viewportSize()!.height);
      if (route === "interior-painting") await page.screenshot({ path: testInfo.outputPath("service-enquiry.png") });
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("calculator sends context and attribution, preserves pending/error inputs and reaches clean confirmation", async ({ page }, testInfo) => {
  const requests: any[] = [];
  let release: () => void = () => {};
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/contact", async route => {
    requests.push(route.request().postDataJSON());
    if (requests.length === 1) {
      await pending;
      await route.fulfill({ status: 503, json: { error: "Fixture save failed. Please retry." } });
    } else await route.fulfill({ json: { success: true, lead_saved: true, lead_id: 123 } });
  });
  await page.goto("/quote?utm_source=fixture&utm_campaign=calculator");
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("arcan_attribution"))).not.toBeNull();
  const trigger = page.getByRole("button", { name: "Lock in a free exact quote" });
  await trigger.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("calculator.png"), fullPage: true });
  await trigger.focus();
  await trigger.press("Enter");
  let dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.press("Enter");
  dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Interior", exact: true })).toHaveAttribute("aria-pressed", "true");
  await dialog.getByRole("button", { name: "Interior", exact: true }).click();
  await expect(dialog.getByLabel("Full name")).toBeFocused();
  await expect(dialog.getByRole("button", { name: "Go to next step" })).toBeDisabled();
  await dialog.getByLabel("Full name").fill("Enquiry Fixture");
  await dialog.getByRole("button", { name: "Go to next step" }).click();
  await expect(dialog.getByRole("button", { name: "Phone", exact: true })).toBeFocused();
  await dialog.getByRole("button", { name: "Email", exact: true }).click();
  await expect(dialog.getByLabel("Email address")).toBeFocused();
  await dialog.getByLabel("Email address").fill("fixture@example.test");
  await dialog.getByRole("button", { name: "Go to next step" }).click();
  await expect(dialog.getByRole("textbox")).toBeFocused();
  await expect(dialog.getByRole("textbox")).toHaveValue(/600 sq ft; 3 rooms; standard paint; 2 coats/);
  await dialog.getByRole("button", { name: "Submit", exact: true }).click();
  try {
    await expect(dialog.getByRole("button", { name: "Submitting…" })).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Submitting…" })).toHaveAttribute("aria-busy", "true");
    expect(requests).toHaveLength(1);
  } finally { release(); }
  await expect(dialog.getByText("Fixture save failed. Please retry.")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("enquiry-retry.png") });
  await dialog.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page).toHaveURL(/\/thank-you$/);
  expect(requests).toHaveLength(2);
  expect(requests[0]).toEqual(requests[1]);
  expect(requests[1]).toMatchObject({ serviceType: "interior", attribution: { utmSource: "fixture", utmCampaign: "calculator" } });
  expect(JSON.stringify(await page.evaluate(() => window.dataLayer || []))).not.toMatch(/Enquiry Fixture|fixture@example/);
});

test("mobile visitors can scroll through the calculator card to its enquiry button", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Touch scrolling applies to the mobile project.");
  await page.goto("/quote");
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("arcan_attribution"))).not.toBeNull();
  const card = page.getByText("Project type", { exact: true });
  await card.scrollIntoViewIfNeeded();
  const bounds = await card.boundingBox();
  const startY = bounds!.y + 10;
  const x = bounds!.x + 5;
  const startScroll = await page.evaluate(() => scrollY);
  const session = await page.context().newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: startY }] });
  for (let offset = 20; offset <= 220; offset += 20) {
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: startY - offset }] });
  }
  // End with a stationary finger hold instead of an artificial high-velocity
  // fling: Chromium otherwise consumes the next tap to stop kinetic scrolling.
  await page.waitForTimeout(200);
  await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: startY - 220 }] });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(startScroll + 50);
  // A fast touch swipe can leave Chromium's kinetic scroll in progress. Wait
  // for it to settle before testing a separate tap on the enquiry button.
  await page.evaluate(() => new Promise<void>(resolve => {
    let previous = scrollY;
    let stableFrames = 0;
    const check = () => {
      stableFrames = scrollY === previous ? stableFrames + 1 : 0;
      previous = scrollY;
      if (stableFrames >= 10) resolve();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }));
  const trigger = page.getByRole("button", { name: "Lock in a free exact quote" });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.tap();
  await expect(page.getByRole("dialog")).toBeVisible();
});
