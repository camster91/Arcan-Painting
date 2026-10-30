// @vitest-environment node
import { existsSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { projectGallery } from './projectGallery';
import { getGalleryCovers, orderGalleryItems } from './gallerySelection';
import { GET } from '../app/api/gallery/route';

vi.mock('../app/api/utils/sql', () => ({ default: vi.fn() }));
import sql from '../app/api/utils/sql';
afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });

describe('finished project selection', () => {
  it('publishes reviewed finished views with valid assets', () => {
    expect(projectGallery.length).toBeGreaterThan(0);
    expect(new Set(projectGallery.map(item => item.file)).size).toBe(projectGallery.length);
    expect(projectGallery.every(item => item.scene)).toBe(true);
    expect(new Set(projectGallery.map(item => item.category))).toEqual(new Set(['Interior', 'Wallpaper', 'Exterior', 'Commercial']));
    for (const item of projectGallery) {
      expect(item.stage).toBe('Finished project');
      expect(item.isVideoStill).toBe(false);
      expect(item.alt.trim().length).toBeGreaterThan(10);
      expect(existsSync(new URL(`../../public/gallery/images/${item.file}`, import.meta.url))).toBe(true);
      expect(existsSync(new URL(`../../public/gallery/thumbnails/${item.file.replace('.webp', '_thumb.webp')}`, import.meta.url))).toBe(true);
    }
  });

  it('shows one cover per scene while preserving additional finished views in the viewer', () => {
    const photos = orderGalleryItems(projectGallery);
    const covers = getGalleryCovers(photos);
    expect(covers.length).toBeLessThan(photos.length);
    expect(new Set(covers.map(item => item.scene)).size).toBe(covers.length);
    expect(covers.reduce((sum, item) => sum + item.photoCount, 0)).toBe(projectGallery.length);
    const floral = photos.filter(item => item.scene === 'floral-window-room');
    const start = photos.findIndex(item => item.scene === 'floral-window-room');
    expect(photos.slice(start, start + floral.length)).toEqual(floral);
    expect(covers.find(item => item.scene === 'floral-window-room').photoCount).toBe(6);
    expect(new Set(photos.map(item => item.file))).toEqual(new Set(projectGallery.map(item => item.file)));
  });

  it('keeps unfinished and duplicate views out of the public API, including filtered pages', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const all = await (await GET(new Request('https://arcanpainting.ca/api/gallery'))).json();
    expect(all.items.map(item => item.filename)).toEqual(projectGallery.map(item => item.file));
    expect(all.items.every(item => item.phase === 'after')).toBe(true);
    const filtered = projectGallery.filter(item => item.category === 'Interior');
    const page = await (await GET(new Request('https://arcanpainting.ca/api/gallery?category=interior&page=2&limit=2'))).json();
    expect(page.total).toBe(filtered.length);
    expect(page.items.map(item => item.filename)).toEqual(filtered.slice(2, 4).map(item => item.file));
  });
});


describe('curated gallery admin visibility', () => {
  it('applies admin hiding before pagination without publishing unreviewed uploads', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://test');
    vi.mocked(sql).mockResolvedValue([
      { filename: projectGallery[0].file, visible: false },
      { filename: projectGallery[1].file, visible: 0 },
      { filename: 'unreviewed.webp', visible: true },
    ]);
    const data = await (await GET(new Request('https://arcanpainting.ca/api/gallery?limit=2'))).json();
    expect(data.total).toBe(projectGallery.length - 2);
    expect(data.items.map(item => item.filename)).toEqual(projectGallery.slice(2, 4).map(item => item.file));
  });
  it('retains reviewed photos when no admin overrides exist', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://test');
    vi.mocked(sql).mockResolvedValue([]);
    const data = await (await GET(new Request('https://arcanpainting.ca/api/gallery'))).json();
    expect(data.total).toBe(projectGallery.length);
  });
  it('does not expose hidden photos when the configured database fails', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://test');
    vi.mocked(sql).mockRejectedValue(new Error('unavailable'));
    const response = await GET(new Request('https://arcanpainting.ca/api/gallery'));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'Gallery temporarily unavailable' });
  });
});
