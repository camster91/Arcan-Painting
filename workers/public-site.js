// Public-site target. The legacy Node CRM is deliberately not bundled here.
export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/contact' && request.method === 'POST') {
      // Add a LEADS_API service binding only after the contact backend is ready.
      // Never accept a destination URL from the browser or forward session cookies.
      if (env.LEADS_API) {
        const headers = new Headers(request.headers);
        headers.delete('cookie');
        headers.delete('authorization');
        headers.delete('x-csrf-token');
        headers.delete('x-arcan-client-ip');
        const clientIp = request.headers.get('cf-connecting-ip');
        if (clientIp) headers.set('x-arcan-client-ip', clientIp);
        try {
          const response = await env.LEADS_API.fetch(new Request(request, { headers }));
          const outgoing = new Response(response.body, response);
          outgoing.headers.set('Cache-Control', 'no-store');
          return outgoing;
        } catch {
          return Response.json({ success: false, error: 'Enquiry service unavailable. Please contact Arcan directly.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
        }
      }
      return Response.json({ success: false, error: 'Enquiry service unavailable. Please contact Arcan directly.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
    if (/^\/(api|admin|account|crew|e|i|uploads)(\/|$)/.test(pathname)) {
      return Response.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const response = await env.ASSETS.fetch(request);
    const outgoing = new Response(response.body, response);
    // Prepared target is a preview until backend integration and content sign-off.
    outgoing.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return outgoing;
  },
};
