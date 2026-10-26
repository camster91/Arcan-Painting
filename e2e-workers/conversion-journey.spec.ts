import { expect, test } from '@playwright/test';

test('homepage gives the hero a direct project enquiry path', async ({ page }) => {
  await page.goto('/');

  const hero = page.locator('.p-hero');
  await expect(hero.getByRole('link', { name: 'Discuss your project' })).toHaveAttribute('href', '/contact');
  await expect(hero.getByRole('link', { name: 'View selected work' })).toHaveAttribute('href', '#work');
});

test('homepage keeps the core service grid concise while exposing commercial and exterior work', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.p-services > a')).toHaveCount(3);
  await expect(page.locator('.p-service-secondary-links a[href="/commercial-painting"]')).toHaveText(/Commercial Painting/);
  await expect(page.locator('.p-service-secondary-links a[href="/exterior-painting"]')).toHaveText(/Exterior Painting/);
});

test('project detail puts a project enquiry CTA before the feature image', async ({ page }) => {
  await page.goto('/projects/pattern-and-atmosphere');

  const cta = page.locator('.p-project-actions a[href="/contact"]');
  const image = page.locator('.p-project-detail');
  await expect(cta).toBeVisible();
  await expect(image).toBeVisible();
  expect(await page.locator('main').evaluate((main) => {
    const action = main.querySelector('.p-project-actions a[href="/contact"]');
    const detail = main.querySelector('.p-project-detail');
    return Boolean(action && detail && (action.compareDocumentPosition(detail) & Node.DOCUMENT_POSITION_FOLLOWING));
  })).toBe(true);
});

test('mobile contact actions remain ahead of the optional Google Maps dialog', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/contact');

  await expect(page.getByRole('link', { name: 'Email Arcan', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Call 416 727 2148', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'View Arcan on Google Maps', exact: true })).toBeVisible();
  expect(await page.locator('main').evaluate((main) => {
    const contact = main.querySelector('.p-contact-actions');
    const email = contact?.querySelector('a[href^="mailto:"]');
    const phone = contact?.querySelector('a[href^="tel:"]');
    const map = contact?.querySelector('.p-map-listing');
    return Boolean(
      email && phone && map &&
      (email.compareDocumentPosition(map) & Node.DOCUMENT_POSITION_FOLLOWING) &&
      (phone.compareDocumentPosition(map) & Node.DOCUMENT_POSITION_FOLLOWING),
    );
  })).toBe(true);
});
