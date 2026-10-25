// @vitest-environment node
import { readdirSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { projectGallery } from './projectGallery';
describe('original gallery preservation',()=>{
 it('makes every original full-size asset browsable exactly once with its thumbnail',()=>{
  const originals=readdirSync(new URL('../../public/gallery/images/',import.meta.url)).filter(f=>f.endsWith('.webp')).sort();
  const files=projectGallery.map(item=>item.file).sort();
  expect(files).toEqual(originals);
  expect(new Set(files).size).toBe(files.length);
  for(const item of projectGallery){
   expect(existsSync(new URL(`../../public/gallery/thumbnails/${item.file.replace('.webp','_thumb.webp')}`,import.meta.url))).toBe(true);
   expect(item.alt.trim().length).toBeGreaterThan(10);
   if(item.file.includes('_video.webp'))expect(item.isVideoStill).toBe(true);
  }
 });
});
