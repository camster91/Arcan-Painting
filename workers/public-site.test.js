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
      expect(await request.json()).toEqual({ name: 'Test' });
      return Response.json({ success: true, lead_saved: true });
    });
    const response = await worker.fetch(new Request('https://example.test/api/contact', { method: 'POST', headers: { cookie: 'session=private', authorization: 'Bearer private', 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test' }) }), { LEADS_API: { fetch: backend } });
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
