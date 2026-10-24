// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import worker from './public-site';

describe('public Workers boundary', () => {
  it('does not report a saved enquiry when no backend is bound', async () => {
    const assets = vi.fn();
    const response = await worker.fetch(new Request('https://example.test/api/contact', { method: 'POST', body: '{}' }), { ASSETS: { fetch: assets } });
    expect(response.status).toBe(503);
    expect((await response.json()).success).toBe(false);
    expect(assets).not.toHaveBeenCalled();
  });
  it('forwards contact requests only to the configured service without session credentials', async () => {
    const backend = vi.fn(async request => {
      expect(request.headers.has('cookie')).toBe(false);
      expect(request.headers.has('authorization')).toBe(false);
      expect(request.headers.get('x-arcan-client-ip')).toBe('192.0.2.1');
      expect(await request.json()).toEqual({ name: 'Test' });
      return Response.json({ success: true, lead_saved: true });
    });
    const response = await worker.fetch(new Request('https://example.test/api/contact', { method: 'POST', headers: { cookie: 'session=private', 'cf-connecting-ip': '192.0.2.1', 'x-arcan-client-ip': 'spoofed', Origin: 'https://example.test', authorization: 'Bearer private', 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test' }) }), { ENQUIRIES_ENABLED: 'true', LEADS_API: { fetch: backend } });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(backend).toHaveBeenCalledOnce();
  });
  it.each(['/admin', '/admin/leads', '/crew', '/api/leads', '/uploads/photo.jpg'])('blocks unavailable private path %s', async path => {
    const assets = vi.fn();
    expect((await worker.fetch(new Request(`https://example.test${path}`), { ASSETS: { fetch: assets } })).status).toBe(404);
    expect(assets).not.toHaveBeenCalled();
  });
  it('serves assets with a preview noindex header', async () => {
    const response = await worker.fetch(new Request('https://example.test/projects'), { ASSETS: { fetch: async () => new Response('Projects') } });
    expect(await response.text()).toBe('Projects');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  });
});

it('keeps intake disabled until delivery acceptance is verified',async()=>{
 const backend=vi.fn();const r=await worker.fetch(new Request('https://example.test/api/contact',{method:'POST',body:'{}'}),{LEADS_API:{fetch:backend},ENQUIRIES_ENABLED:'false'});
 expect(r.status).toBe(503);expect(backend).not.toHaveBeenCalled();
});
it('rejects cross-origin and alternate-host production submissions',async()=>{
 const backend=vi.fn();const env={SITE_MODE:'production',ENQUIRIES_ENABLED:'true',LEADS_API:{fetch:backend}};
 for(const url of ['https://arcan-public-site.example.workers.dev/api/contact','https://arcanpainting.ca/api/contact']){
 const r=await worker.fetch(new Request(url,{method:'POST',headers:{Origin:'https://other.example','cf-connecting-ip':'192.0.2.1'},body:'{}'}),env);
 expect([403,503]).toContain(r.status);
 }expect(backend).not.toHaveBeenCalled();
});
it('strips old thank-you query strings before rendering',async()=>{
 const r=await worker.fetch(new Request('https://arcanpainting.ca/thank-you?email=test@example.test'),{});
 expect(r.status).toBe(303);expect(r.headers.get('location')).toBe('/thank-you');expect(r.headers.get('referrer-policy')).toBe('no-referrer');
});
it('only indexes canonical production pages, keeping internal and missing pages out',async()=>{
 const env={SITE_MODE:'production',ASSETS:{fetch:async()=>new Response('public')}};
 expect((await worker.fetch(new Request('https://arcanpainting.ca/projects'),env)).headers.has('x-robots-tag')).toBe(false);
 expect((await worker.fetch(new Request('https://preview.example/projects'),env)).headers.get('x-robots-tag')).toContain('noindex');
 expect((await worker.fetch(new Request('https://arcanpainting.ca/design-system'),env)).headers.get('x-robots-tag')).toContain('noindex');
});
it('preserves legacy sessions, data loaders, and missing legacy assets on the origin',async()=>{
 const origin=vi.fn(async()=>new Response('legacy'));vi.stubGlobal('fetch',origin);
 try{
 const env={SITE_MODE:'production',LEGACY_ORIGIN:'enabled',ASSETS:{fetch:async()=>new Response('missing',{status:404})}};
 for(const path of ['/admin','/admin.data','/account/signin','/uploads/file.png','/api/local-auth/session','/__manifest','/assets/old-legacy-hash.js']){
 const request=new Request('https://arcanpainting.ca'+path,{headers:{cookie:'test=session'}});
 const r=await worker.fetch(request,env);expect(await r.text()).toBe('legacy');expect(origin.mock.calls.at(-1)[0]).toBe(request);
 }
 }finally{vi.unstubAllGlobals();}
});
it('limits controlled staging intake to a matching unexpired operator credential', async()=>{
 const backend=vi.fn(async()=>Response.json({success:true,lead_saved:true}));
 const env={SITE_MODE:'staging',ENQUIRIES_ENABLED:'test',STAGING_TEST_KEY:'a-test-only-secret',STAGING_TEST_UNTIL:String(Date.now()+60000),LEADS_API:{fetch:backend}};
 const req=token=>new Request('https://staging.example/api/contact',{method:'POST',headers:{Origin:'https://staging.example','cf-connecting-ip':'192.0.2.1','x-arcan-staging-test':token},body:'{}'});
 expect((await worker.fetch(req('wrong'),env)).status).toBe(503);
 expect((await worker.fetch(req('a-test-only-secret'),env)).status).toBe(200);
 env.STAGING_TEST_UNTIL='1';expect((await worker.fetch(req('a-test-only-secret'),env)).status).toBe(503);
 expect(backend).toHaveBeenCalledTimes(1);
});
it('strips personal thank-you queries before www canonicalization',async()=>{
 const r=await worker.fetch(new Request('https://www.arcanpainting.ca/thank-you?email=test@example.test'),{SITE_MODE:'production'});
 expect(r.status).toBe(303);expect(r.headers.get('location')).toBe('/thank-you');
});
it('preserves legacy service-area URLs by redirecting to the verified service page',async()=>{
 const r=await worker.fetch(new Request('https://arcanpainting.ca/interior-painting/toronto'),{});
 expect(r.status).toBe(308);expect(r.headers.get('location')).toBe('/interior-painting');
});
it('does not expose the internal release manifest',async()=>{
 expect((await worker.fetch(new Request('https://arcanpainting.ca/release.json'),{})).status).toBe(404);
});
it('rejects a same-origin submission on an alternate production hostname',async()=>{
 const backend=vi.fn();const url='https://alternate.example.workers.dev/api/contact';
 const r=await worker.fetch(new Request(url,{method:'POST',headers:{Origin:new URL(url).origin,'cf-connecting-ip':'192.0.2.1'},body:'{}'}),{SITE_MODE:'production',ENQUIRIES_ENABLED:'true',LEADS_API:{fetch:backend}});
 expect(r.status).toBe(503);expect(backend).not.toHaveBeenCalled();
});
it('prevents caching the legacy service-worker neutralizer',async()=>{
 const r=await worker.fetch(new Request('https://arcanpainting.ca/sw.js'),{SITE_MODE:'production',ASSETS:{fetch:async()=>new Response('/* neutralizer */',{headers:{'Cache-Control':'public, max-age=86400'}})}});
 expect(r.headers.get('cache-control')).toBe('no-store');
});
