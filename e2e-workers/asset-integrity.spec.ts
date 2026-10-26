import { expect, test } from '@playwright/test';
import { services, projects } from '../src/data/premiumSite';

test('every exported page references available, cacheable JS and CSS bundles',async({request})=>{
  const routes=['/',...services.map(s=>s.path),'/projects',...projects.map(p=>'/projects/'+p.slug),'/about','/contact','/quote','/privacy','/thank-you','/design-system'];
  const assets=new Set<string>();
  for(const route of routes){
    const response=await request.get(route);expect(response.status(),route).toBe(200);
    const html=await response.text();
    for(const match of html.matchAll(/<link\b[^>]+>/g)){
      if(!/\brel="(?:modulepreload|stylesheet)"/.test(match[0]))continue;
      const href=match[0].match(/\bhref="([^"]+)"/)?.[1];
      if(href?.startsWith('/assets/'))assets.add(href);
    }
  }
  expect(assets.size).toBeGreaterThan(10);
  for(const path of assets){
    const response=await request.get(path);expect(response.status(),path).toBe(200);
    expect(response.headers()['content-type'],path).toMatch(/javascript|css/);
    if(/-[A-Za-z0-9_-]{8,}\.(?:js|css)$/.test(path))expect(response.headers()['cache-control'],path).toContain('immutable');
  }
});
