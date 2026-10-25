import { expect, test } from '@playwright/test';

test('public dialogs keep background scroll position and release it after closing', async ({page}) => {
  for (const viewport of [{width:390,height:844},{width:1440,height:900},{width:844,height:390}]) {
    await page.setViewportSize(viewport);
    for (const kind of ['map','gallery']) {
      await page.goto(kind === 'map' ? '/contact' : '/projects');
      const trigger = kind === 'map'
        ? page.getByRole('button', {name:'View Arcan on Google Maps',exact:true})
        : page.locator('.p-project-gallery__card').first();
      const left = await page.locator('header .p-logo').evaluate(el => el.getBoundingClientRect().left);
      await trigger.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const position = await page.evaluate(() => scrollY);
      expect(await page.locator('header .p-logo').evaluate(el => el.getBoundingClientRect().left)).toBe(left);
      await page.mouse.move(2, viewport.height / 2);
      await page.mouse.wheel(0, 650);
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => scrollY)).toBe(position);
      const close = page.getByRole('button', {name:kind === 'map' ? 'Close map' : 'Close image viewer', exact:true});
      await close.scrollIntoViewIfNeeded();
      await close.click();
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
      expect(await page.locator('header .p-logo').evaluate(el => el.getBoundingClientRect().left)).toBe(left);
      const restored = await page.evaluate(() => scrollY);
      await page.mouse.move(2, viewport.height / 2);
      await page.mouse.wheel(0, 200);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(restored);
    }
  }
});
