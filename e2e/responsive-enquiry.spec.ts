import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

for (const [width, height] of [[320, 740], [390, 844], [768, 1024], [1024, 768], [1440, 900], [1920, 1080], [2560, 1440]]) {
  test(`marketing and enquiry layout at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.locator('.p-hero h1')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width <= 1200) {
      await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Menu', exact: true }).click();
      await expect(page.getByRole('navigation', { name: 'Main navigation', exact: true })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeFocused();
    }
    if (width === 768 || width === 1024) {
      const hero = await page.locator('.p-hero').boundingBox();
      const image = await page.locator('.p-hero-media').boundingBox();
      expect(image!.width / hero!.width).toBeGreaterThan(0.45);
    }
    if (width >= 1024) {
      const image = await page.locator('.p-hero-media').boundingBox();
      expect(image!.height).toBeGreaterThanOrEqual(650);
      expect(image!.height).toBeGreaterThan(image!.width * 1.3);
      await expect(page.locator('.p-hero-media img').first()).toHaveCSS('object-fit', 'contain');
      const cta = await page.locator('.p-hero-actions .p-button').first().boundingBox();
      expect(cta!.y + cta!.height).toBeLessThan(height);
    }
    if (width === 390) {
      const image = await page.locator('.p-hero-media').boundingBox();
      expect(image!.y).toBeLessThan(height - 140);
    }
    await page.screenshot({ path: testInfo.outputPath(`home-${width}.jpg`), type: 'jpeg' });
    await page.goto('/contact');
    const name = page.getByLabel('Your name', { exact: true });
    await expect(name).toBeVisible();
    expect((await name.boundingBox())!.y).toBeLessThan(height - 80);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByLabel('Approximate budget (optional)')).not.toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`contact-${width}.jpg`), type: 'jpeg' });
    if (width <= 650) {
      const quickContact = page.getByRole('navigation', { name: 'Quick contact' });
      await quickContact.getByRole('link', { name: 'Start enquiry' }).click();
      await expect(name).toBeFocused();
      await expect(quickContact).not.toBeVisible();
    }
  });
}

test('project inspiration and optional details reach the enquiry without exposing contacts in the redirect', async ({ page }) => {
  await page.goto('/projects?photo=floral-feature-wall.webp#gallery');
  const dialog = page.getByRole('dialog', { name: 'Floral feature wall and sage trim' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Wallpaper', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await dialog.getByRole('link', { name: 'Enquire about a similar project' }).click();
  await expect(page.getByLabel('Service', { exact: true })).toHaveValue('wallpaper');
  await expect(page.getByText('Inspired by: Floral feature wall and sage trim')).toBeVisible();
  await page.getByLabel('Your name', { exact: true }).fill('Preview Test');
  await page.getByLabel('How would you prefer us to respond?').selectOption('email');
  await page.getByLabel('Email address', { exact: true }).fill('preview@example.test');
  await expect(page.getByLabel('Phone number (optional)', { exact: true })).not.toBeVisible();
  await page.getByLabel('Project location', { exact: true }).fill('Toronto');
  await page.getByLabel('Tell us about your project', { exact: true }).fill('Wallpaper for the dining room.');
  await page.getByText('Optional project details', { exact: true }).click();
  await page.getByLabel('Approximate budget (optional)').fill('12000');
  await page.getByText('Optional project details', { exact: true }).click();
  await page.route('**/api/contact', async route => {
    const payload = route.request().postDataJSON();
    expect(payload.serviceType).toBe('wallpaper');
    expect(payload.projectDescription).toContain('Project reference: Floral feature wall and sage trim (floral-feature-wall.webp)');
    expect(payload.projectDescription).toContain('Project scope: To be discussed');
    expect(payload.projectDescription).toContain('Approximate budget (CAD): 12000');
    expect(payload.phone).toBe('');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, lead_saved: true }) });
  });
  await page.getByRole('button', { name: 'Send project enquiry' }).click();
  await expect(page).toHaveURL(/\/thank-you$/);
});
