// Attribution is metadata, never a copy of arbitrary URL parameters or private IDs.
const publicPaths = new Set(['/', '/interior-painting', '/exterior-painting', '/commercial-painting', '/wallpaper-services', '/specialty-finishes', '/projects', '/projects/pattern-and-atmosphere', '/projects/a-study-in-contrast', '/about', '/contact', '/quote', '/privacy', '/thank-you']);
export function publicPath(value) {
  try {
    const path = new URL(value, 'https://arcanpainting.ca').pathname.replace(/\/$/, '') || '/';
    return publicPaths.has(path) ? path : '/other';
  } catch { return '/other'; }
}
export function safeAttribution(input = {}) {
  const output = {};
  if (typeof input?.landingPage === 'string') output.landingPage = publicPath(input.landingPage);
  if (typeof input?.referrer === 'string') {
    try { const url = new URL(input.referrer); if (['https:', 'http:'].includes(url.protocol)) output.referrer = url.origin; } catch { /* No referrer. */ }
  }
  for (const key of ['utmSource', 'utmMedium', 'utmCampaign', 'utmContent', 'utmTerm']) {
    const value = input?.[key];
    if (typeof value === 'string' && /^[a-z0-9][a-z0-9 _.-]{0,199}$/i.test(value) && value.replace(/\D/g, '').length < 7) output[key] = value;
  }
  return output;
}
