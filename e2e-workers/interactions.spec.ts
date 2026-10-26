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
  expect(await enquire.evaluate(el => { const r = el.getBoundingClientRect(); return r.top >= -1 && r.bottom <= innerHeight + 1; })).toBe(true);
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
  await menu.click();
  await page.setViewportSize({width: 1024, height: 900});
  await expect(page.locator('header .p-logo')).toBeFocused();
});

test('transparent brand artwork stays clear and home-linked in both shell locations', async ({page}) => {
  for (const width of [320,768,1440]) {
    await page.setViewportSize({width,height:900});
    await page.goto('/about');
    const logos = page.locator('a.p-logo');
    await expect(logos).toHaveCount(2);
    for (const logo of await logos.all()) {
      await logo.scrollIntoViewIfNeeded();
      await expect(logo).toHaveAttribute('href','/');
      const img = logo.locator('img');
      await expect(img).toHaveAttribute('src','/brand/arcan-painting-logo.png');
      await expect.poll(() => img.evaluate(el => el.complete && el.naturalWidth === 800 && el.naturalHeight === 235)).toBe(true);
      expect(await logo.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
      expect(await logo.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    }
    await logos.last().click();
    await expect(page).toHaveURL(/\/$/);
  }
});

test('map control waits for hydration and has a no-JavaScript listing link', async ({browser,baseURL}) => {
  const context = await browser.newContext({javaScriptEnabled:false});
  const page = await context.newPage();
  await page.goto(baseURL + '/contact');
  await expect(page.getByRole('button',{name:'View Arcan on Google Maps',exact:true})).toBeDisabled();
  await expect(page.getByRole('link',{name:'Open Arcan on Google Maps (opens in a new tab)',exact:true})).toHaveAttribute('href','https://maps.app.goo.gl/WY8Rh5myeWX6JJhR6');
  await context.close();
});
