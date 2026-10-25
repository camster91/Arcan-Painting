import { expect, test } from '@playwright/test';

test('gallery filters fit desktop and newly revealed photos receive keyboard focus', async ({page}) => {
  for (const width of [1024, 1440]) {
    await page.setViewportSize({width, height: 900});
    await page.goto('/projects');
    const tops = await page.locator('.p-project-gallery__filter').evaluateAll(buttons => buttons.map(b => b.getBoundingClientRect().top));
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(2);
  }
  const cards = page.locator('.p-project-gallery__card');
  const more = page.getByRole('button', {name: 'Show more images', exact: true});
  let previous = 12;
  while (await more.count()) {
    await more.focus();
    await page.keyboard.press('Enter');
    await expect(cards.nth(previous)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(cards.nth(previous + 1)).toBeFocused();
    previous = await cards.count();
  }
  expect(previous).toBe(70);
});

test('short landscape menu stays scrollable and closes on escape, outside focus and desktop resize', async ({page}) => {
  await page.setViewportSize({width: 844, height: 390});
  await page.goto('/');
  const menu = page.getByRole('button', {name: 'Menu', exact: true});
  const close = page.getByRole('button', {name: 'Close', exact: true});
  const nav = page.locator('#premium-navigation');
  await menu.click();
  await expect(close).toBeVisible();
  expect(await nav.evaluate(el => el.getBoundingClientRect().bottom <= innerHeight + 1)).toBe(true);
  const enquire = nav.getByRole('link', {name: 'Enquire', exact: true});
  await enquire.scrollIntoViewIfNeeded();
  expect(await enquire.evaluate(el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; })).toBe(true);
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await menu.click();
  await page.locator('main a').first().focus();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await page.setViewportSize({width: 844, height: 900});
  await menu.click();
  await nav.getByRole('link', {name: 'Painting', exact: true}).focus();
  await page.locator('footer').click({position: {x: 2, y: 2}});
  await expect(menu).toBeFocused();
  await menu.click();
  await nav.getByRole('link', {name: 'Painting', exact: true}).focus();
  await page.setViewportSize({width: 1024, height: 900});
  await expect(page.locator('.p-menu')).toHaveAttribute('aria-expanded', 'false');
  await page.setViewportSize({width: 844, height: 390});
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
});
