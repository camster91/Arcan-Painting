import { expect, test } from "@playwright/test";

test("gallery renders unique keyboard stops, static layout, filters and accessible lightbox", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/availability?**", route => route.fulfill({ json: [] }));
  await page.goto("/");
  const photos = page.getByRole("button", { name: /^Open project photo:/ });
  await expect(photos).toHaveCount(12);
  await page.locator("#portfolio").scrollIntoViewIfNeeded();
  await expect(page.locator("#portfolio")).toHaveCSS("opacity", "1");
  await expect.poll(async () => photos.locator("img").evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  const count = await page.evaluate(() => ({
    photoButtons: document.querySelectorAll('button[aria-label^="Open project photo"]').length,
    images: document.images.length,
    uniqueImages: new Set([...document.images].map(image => image.getAttribute("src"))).size,
    htmlCharacters: document.documentElement.outerHTML.length,
  }));
  await testInfo.attach("dom-counts", { body: JSON.stringify(count), contentType: "application/json" });
  await page.locator("#portfolio").screenshot({ path: testInfo.outputPath("gallery.png") });
  await photos.first().focus();
  await photos.first().press("Enter");
  const viewer = page.getByRole("dialog", { name: "Project photo viewer" });
  await expect(viewer).toBeVisible();
  const bounds = await viewer.boundingBox();
  expect(bounds?.y).toBe(0);
  expect(bounds?.height).toBe(page.viewportSize()!.height);
  await expect(viewer.getByRole("button", { name: "Close", exact: true })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(viewer.getByRole("button", { name: "Next", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(viewer.getByRole("button", { name: "Close", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  await expect(photos.first()).toBeFocused();
  await page.getByRole("button", { name: "Show all projects" }).click();
  await expect(photos).toHaveCount(41);
  const sources = await photos.locator("img").evaluateAll(images => images.map(image => image.getAttribute("src")));
  expect(new Set(sources).size).toBe(41);
  await page.getByRole("button", { name: "Show fewer projects" }).click();
  await expect(photos).toHaveCount(12);
  await page.getByRole("button", { name: /^Commercial \(/ }).click();
  expect(await photos.count()).toBeGreaterThan(0);
  expect(await photos.count()).toBeLessThanOrEqual(12);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("footer sections and permanent service links work from home and a service page", async ({ page }) => {
  for (const path of ["/", "/interior-painting"]) {
    await page.goto(path);
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "Admin", exact: true })).toHaveCount(0);
    await footer.getByRole("link", { name: "Our Process", exact: true }).click();
    await expect(page).toHaveURL(/\/#process$/);
    await expect(page.locator("#process")).toBeInViewport();
  }
  for (const name of ["Interior Painting", "Exterior Painting", "Commercial Painting", "Wallpaper Services", "Specialty Finishes"]) {
    await page.locator("footer").getByRole("link", { name, exact: true }).click();
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
});
