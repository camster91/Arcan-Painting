import { expect, test } from '@playwright/test';
const production = process.env.WORKERS_EXPECT_PRODUCTION === 'true';
const routes = ['/', '/interior-painting', '/wallpaper-services', '/specialty-finishes', '/commercial-painting', '/exterior-painting', '/projects', '/projects/pattern-and-atmosphere', '/projects/a-study-in-contrast', '/about', '/contact', '/quote', '/privacy', '/thank-you', '/design-system'];
for (const width of [320, 390, 768, 1024, 1440]) {
  test(`all public pages render and hydrate at ${width}px`, async ({page}) => {
    test.setTimeout(120_000);
    await page.setViewportSize({width, height:900});
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if(m.type() === 'error') errors.push(m.text()); });
    for (const route of routes) {
      const response = await page.goto(route, {waitUntil:'domcontentloaded'});
      expect(response?.status(), route).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('form'),route).toHaveCount(0);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth), route).toBe(true);
      for (const image of await page.locator('img').all()) {
        await image.scrollIntoViewIfNeeded();
        await expect.poll(()=>image.evaluate(img=>img.complete && img.naturalWidth > 0)).toBe(true);
      }
      expect(await page.locator('img').evaluateAll(imgs => imgs.filter(img=>!img.complete || img.naturalWidth === 0).map(img=>img.getAttribute('src'))),route).toEqual([]);
      const robots = await page.locator('meta[name="robots"]').getAttribute('content');
      if (!production || ['/design-system','/thank-you'].includes(route)) expect(robots,route).toContain('noindex');
      else {
        expect(robots,route).not.toContain('noindex');
        expect(await page.locator('link[rel="canonical"]').getAttribute('href'),route).toBe(`https://arcanpainting.ca${route === '/' ? '/' : route}`);
      }
      expect(await page.locator('header a[aria-label="Arcan Painting home"]').getAttribute('href')).toBe('/');
      await expect(page.locator('nav a[href="/design-system"]')).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
}
test('mobile menu keyboard, project loader, and direct contact links',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  const menu=page.locator('header button[aria-controls="premium-navigation"]');
  await menu.click(); await expect(menu).toHaveAttribute('aria-expanded','true');
  await page.keyboard.press('Escape'); await expect(menu).toBeFocused(); await expect(menu).toHaveAttribute('aria-expanded','false');
  await menu.click(); await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Selected work'}).click();
  await page.locator('a[href="/projects/a-study-in-contrast"]').first().click();
  await expect(page.getByRole('heading',{name:'A study in contrast',exact:true})).toBeVisible();
  await page.goto('/contact');
  for (const path of ['/contact','/quote','/interior-painting','/exterior-painting','/commercial-painting','/wallpaper-services','/specialty-finishes']) {
    await page.goto(path);
    await expect(page.locator('form')).toHaveCount(0);
    await expect(page.getByRole('link',{name:'Email Arcan',exact:true})).toHaveAttribute('href','mailto:info@arcanpainting.ca');
    await expect(page.getByRole('link',{name:'Call 416 727 2148',exact:true})).toHaveAttribute('href','tel:+14167272148');
    await expect(page.getByRole('button',{name:'Send project enquiry'})).toHaveCount(0);
  }
  await page.goto('/thank-you?synthetic=discard');
  await expect(page).toHaveURL(/\/thank-you$/);
});
test('unknown routes fail and indexing matches the deployment',async({request})=>{
  expect((await request.get('/unknown-arcan-test-page')).status()).toBe(404);
  const robots=await request.get('/robots.txt'); expect(await robots.text()).toContain(production ? 'Allow: /' : 'Disallow: /');
  const design=await request.get('/design-system'); expect(design.headers()['x-robots-tag']).toContain('noindex');
  const disabled=await request.post('/api/contact',{data:{}}); expect(disabled.status()).toBe(503); expect((await disabled.json()).lead_saved).toBe(false);
});
