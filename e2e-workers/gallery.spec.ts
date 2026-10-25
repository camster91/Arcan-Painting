import { expect, test } from '@playwright/test';
import { projectGallery } from '../src/data/projectGallery';
async function showAll(page){
 while(await page.getByRole('button',{name:'Show more images',exact:true}).count()) await page.getByRole('button',{name:'Show more images',exact:true}).click();
}
test('all original gallery photos, filters and thumbnails remain browsable',async({page})=>{
 await page.goto('/projects');
 await expect(page.locator('.p-project-gallery__card')).toHaveCount(12);
 await showAll(page);
 await expect(page.locator('.p-project-gallery__card')).toHaveCount(70);
 expect((await page.locator('.p-project-gallery__card').evaluateAll(cards=>cards.map(c=>c.getAttribute('data-gallery-file')).sort()))).toEqual(projectGallery.map(p=>p.file).sort());
 for(const img of await page.locator('.p-project-gallery__card img').all()){
  await img.scrollIntoViewIfNeeded(); await expect.poll(()=>img.evaluate(i=>i.complete && i.naturalWidth>0)).toBe(true);
 }
 for(const category of ['Interior','Wallpaper','Exterior','Commercial','Archive']){
  await page.getByRole('button',{name:category,exact:true}).click();
  await showAll(page);
  await expect(page.locator('.p-project-gallery__card')).toHaveCount(projectGallery.filter(p=>p.category===category).length);
  await expect(page.getByRole('button',{name:category,exact:true})).toHaveAttribute('aria-pressed','true');
 }
});
test('original rotated photo fits the viewer, with keyboard navigation and focus return',async({page})=>{
 for(const viewport of [{width:320,height:740},{width:844,height:390},{width:1440,height:1000}]){
  await page.setViewportSize(viewport);await page.goto('/projects');await showAll(page);
  const anchor=page.locator('[data-gallery-file="20170116_143917.webp"]');await anchor.click();
  const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
  await expect(page.getByRole('button',{name:'Close image viewer'})).toBeFocused();
  const image=dialog.locator('img');
  await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>0&&img.style.width!=='')).toBe(true);
  await expect.poll(()=>image.evaluate(img=>{const i=img.getBoundingClientRect(),f=img.parentElement.getBoundingClientRect();return i.width<=f.width+2&&i.height<=f.height+2;})).toBe(true);
  expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  await page.getByRole('button',{name:'Next image',exact:true}).click();
  await expect(page.getByRole('button',{name:'Next image',exact:true})).toBeFocused();
  await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(anchor).toBeFocused();
 }
});
test('original gallery remains accessible without JavaScript',async({browser,baseURL})=>{
 const context=await browser.newContext({javaScriptEnabled:false});
 const page=await context.newPage();await page.goto(baseURL+'/projects');
 const files=await page.locator('a[href^="/gallery/images/"]').evaluateAll(links=>[...new Set(links.map(l=>l.getAttribute('href')))]);
 expect(files.length).toBe(70);await context.close();
});
test('original FAQ and section bookmarks remain useful',async({page})=>{
 await page.goto('/#faq');await expect(page.locator('#faq details')).toHaveCount(6);
 await page.locator('#faq summary').first().click();await expect(page.locator('#faq details[open] p')).toBeVisible();
 for(const id of ['portfolio','process','contact','services'])await expect(page.locator('#'+id)).toHaveCount(1);
 await expect(page.locator('#process li')).toHaveCount(4);
});
