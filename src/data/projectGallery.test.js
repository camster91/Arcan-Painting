// @vitest-environment node
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { projectGallery } from './projectGallery';
import { GET } from '../app/api/gallery/route';

describe('finished project selection', () => {
  it('publishes reviewed finished views with one photo per scene and valid assets', () => {
    expect(projectGallery.length).toBeGreaterThan(0);
    expect(new Set(projectGallery.map(item => item.file)).size).toBe(projectGallery.length);
    expect(new Set(projectGallery.map(item => item.scene)).size).toBe(projectGallery.length);
    expect(new Set(projectGallery.map(item => item.category))).toEqual(new Set(['Interior', 'Wallpaper', 'Exterior', 'Commercial']));
    for (const item of projectGallery) {
      expect(item.stage).toBe('Finished project');
      expect(item.isVideoStill).toBe(false);
      expect(item.alt.trim().length).toBeGreaterThan(10);
      expect(existsSync(new URL(`../../public/gallery/images/${item.file}`, import.meta.url))).toBe(true);
      expect(existsSync(new URL(`../../public/gallery/thumbnails/${item.file.replace('.webp', '_thumb.webp')}`, import.meta.url))).toBe(true);
    }
  });

  it('keeps unfinished and duplicate views out of the public API, including filtered pages', async () => {
    const all = await (await GET(new Request('https://arcanpainting.ca/api/gallery'))).json();
    expect(all.items.map(item => item.filename)).toEqual(projectGallery.map(item => item.file));
    expect(all.items.every(item => item.phase === 'after')).toBe(true);
    const filtered = projectGallery.filter(item => item.category === 'Interior');
    const page = await (await GET(new Request('https://arcanpainting.ca/api/gallery?category=interior&page=2&limit=2'))).json();
    expect(page.total).toBe(filtered.length);
    expect(page.items.map(item => item.filename)).toEqual(filtered.slice(2, 4).map(item => item.file));
  });
});
