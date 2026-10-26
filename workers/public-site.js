// Static public website. Legacy Node routes stay on the existing origin at cutover.
const canonicalHosts = new Set(['arcanpainting.ca', 'www.arcanpainting.ca']);
const privatePath = /^\/(api|admin|account|crew|e|i|uploads)(\/|$)/;
const unavailable = () => Response.json({ success: false, lead_saved: false, error: 'Enquiries are temporarily unavailable. Please email info@arcanpainting.ca or call 416 727 2148.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
// Short-lived operator-only staging access; never enables general preview intake.
async function stagingTestAccess(request, env) {
  if (env.SITE_MODE !== 'staging' || env.ENQUIRIES_ENABLED !== 'test') return false;
  const remaining = Number(env.STAGING_TEST_UNTIL) - Date.now();
  const supplied = request.headers.get('x-arcan-staging-test') || '';
  if (!(remaining > 0 && remaining <= 3_600_000) || !env.STAGING_TEST_KEY || supplied.length > 128) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(env.STAGING_TEST_KEY), {name:'HMAC',hash:'SHA-256'}, false, ['sign','verify']);
  // The operator supplies the secret header; compare it through the crypto API.
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(supplied));
  return crypto.subtle.verify('HMAC', key, signature, encoder.encode(env.STAGING_TEST_KEY));
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const legacyRequest = privatePath.test(url.pathname.replace(/\.data$/, '')) || url.pathname === '/__manifest';
    const production = env.SITE_MODE === 'production' && canonicalHosts.has(url.hostname);
    if (production && url.protocol === 'http:') {
      if (!['GET','HEAD'].includes(request.method)) return new Response('Use HTTPS',{status:400,headers:{'Cache-Control':'no-store'}});
      url.protocol = 'https:';
      if (url.pathname === '/thank-you') url.search = '';
      return Response.redirect(url.toString(),308);
    }
    // Production origin functionality is retained only on the canonical host.
    // fetch(request) on a Worker Route reaches its DNS origin without recursing.
    if (production && env.LEGACY_ORIGIN === 'enabled' && legacyRequest && url.pathname !== '/api/contact') {
      const response = await fetch(request);
      const outgoing = new Response(response.body, response);
      outgoing.headers.set('X-Robots-Tag', 'noindex, nofollow');
      outgoing.headers.set('Cache-Control', 'no-store');
      return outgoing;
    }
    // Old thank-you links may contain personal details. Strip them before serving HTML.
    if (url.pathname === '/thank-you' && url.search) {
      return new Response(null, { status: 303, headers: { Location: '/thank-you', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow' } });
    }
    if (production && url.hostname === 'www.arcanpainting.ca' && !privatePath.test(url.pathname)) {
      url.hostname = 'arcanpainting.ca';
      return Response.redirect(url.toString(), 308);
    }
    if (url.pathname === '/release.json') return new Response('Not found',{status:404,headers:{'X-Robots-Tag':'noindex, nofollow'}});
    const legacyService = url.pathname.match(/^\/(interior-painting|exterior-painting|commercial-painting|wallpaper-services|specialty-finishes)\/[^/.]+\/?$/);
    if (legacyService) return new Response(null,{status:308,headers:{Location:'/'+legacyService[1],'Cache-Control':'public, max-age=3600'}});
    if (url.pathname === '/api/contact' && request.method === 'POST') {
      if (!env.LEADS_API || !(env.ENQUIRIES_ENABLED === 'true' || await stagingTestAccess(request, env))) return unavailable();
      // An active production backend must not accept submissions on alternate hosts.
      if (env.SITE_MODE === 'production' && !production) return unavailable();
      if (request.headers.get('origin') !== url.origin || request.headers.get('sec-fetch-site') === 'cross-site') {
        return Response.json({success:false,lead_saved:false,error:'Please submit through the Arcan website.'},{status:403,headers:{'Cache-Control':'no-store'}});
      }
      const headers = new Headers({ 'Content-Type': request.headers.get('content-type') || '', Origin: url.origin });
      // Cloudflare sets CF-Connecting-IP at the edge. Caller-supplied internal
      // forwarding headers, cookies and authorization are never passed through.
      const clientIp = request.headers.get('cf-connecting-ip');
      if (!clientIp) return unavailable();
      headers.set('x-arcan-client-ip', clientIp);
      try {
        const response = await env.LEADS_API.fetch(new Request(request, { headers }));
        const outgoing = new Response(response.body, response);
        outgoing.headers.set('Cache-Control', 'no-store');
        outgoing.headers.set('Referrer-Policy', 'no-referrer');
        return outgoing;
      } catch { return unavailable(); }
    }
    if (legacyRequest) return Response.json({error:'Not found'},{status:404,headers:{'Cache-Control':'no-store'}});
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
    const response = await env.ASSETS.fetch(request);
    if (production && env.LEGACY_ORIGIN === 'enabled' && response.status === 404 && url.pathname.startsWith('/assets/')) return fetch(request);
    const outgoing = new Response(response.body, response);
    if (!production || url.pathname === '/design-system' || url.pathname === '/thank-you' || response.status >= 400) outgoing.headers.set('X-Robots-Tag','noindex, nofollow');
    // Vite hashes change with content; stable URLs and HTML must revalidate.
    if (response.status === 200 && /^\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.(?:js|css|woff2?)$/.test(url.pathname)) {
      outgoing.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
    if (url.pathname === '/sw.js') outgoing.headers.set('Cache-Control','no-store');
    outgoing.headers.set('Referrer-Policy','strict-origin');
    outgoing.headers.set('X-Content-Type-Options','nosniff');
    outgoing.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    outgoing.headers.set('Content-Security-Policy',"frame-ancestors 'self'; object-src 'none'; base-uri 'self'");
    return outgoing;
  },
};
