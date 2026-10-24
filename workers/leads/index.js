const MAX_BODY = 16_384;
const SERVICES = new Set(['interior', 'exterior', 'wallpaper', 'specialty', 'commercial', 'other']);
const reply = (status, error) => Response.json({ success: false, lead_saved: false, error }, { status, headers: { 'Cache-Control': 'no-store' } });

async function readJson(request) {
  if (request.headers.get('content-type')?.toLowerCase().split(';')[0].trim() !== 'application/json') throw { status: 415, message: 'Send JSON.' };
  const reader = request.body?.getReader();
  if (!reader) throw { status: 400, message: 'Missing enquiry.' };
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) { await reader.cancel(); throw { status: 413, message: 'Enquiry is too large.' }; }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw { status: 400, message: 'Invalid enquiry.' }; }
}

export function validateEnquiry(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw { status: 400, message: 'Invalid enquiry.' };
  const value = (key, max, required = false) => {
    const raw = body[key] ?? '';
    if (typeof raw !== 'string' || raw.length > max || (required && !raw.trim())) throw { status: 400, message: `Check ${key}.` };
    return raw.trim();
  };
  const lead = {
    name: value('name', 255, true), email: value('email', 255), phone: value('phone', 50),
    serviceType: value('serviceType', 40, true), preferredContact: value('preferredContact', 10, true),
    address: value('address', 255, true), projectDescription: value('projectDescription', 4000, true),
  };
  if (!SERVICES.has(lead.serviceType) || !['email', 'phone'].includes(lead.preferredContact)) throw { status: 400, message: 'Check your service and contact preference.' };
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) throw { status: 400, message: 'Check your email address.' };
  if (lead.phone && (!/^[\d\s()+-]+$/.test(lead.phone) || lead.phone.replace(/\D/g, '').length < 7)) throw { status: 400, message: 'Check your phone number.' };
  if (!lead[lead.preferredContact]) throw { status: 400, message: 'Add your preferred contact details.' };
  const attribution = {};
  for (const key of ['landingPage', 'referrer', 'utmSource', 'utmMedium', 'utmCampaign', 'utmContent', 'utmTerm']) {
    if (typeof body.attribution?.[key] === 'string') attribution[key] = body.attribution[key].slice(0, 500);
  }
  lead.attribution = JSON.stringify(attribution);
  return lead;
}

// Private service-binding target: no workers.dev URL or public route.
export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== '/api/contact') return reply(404, 'Not found.');
    if (request.method !== 'POST') return reply(405, 'Method not allowed.');
    if (!env.LEADS_DB || !env.ENQUIRY_LIMITER) return reply(503, 'Enquiries are temporarily unavailable. Please contact Arcan directly.');
    try {
      const url = new URL(request.url);
      if (request.headers.get('origin') !== url.origin) return reply(403, 'Please submit through the Arcan website.');
      const ip = request.headers.get('x-arcan-client-ip');
      if (!ip) return reply(503, 'Enquiries are temporarily unavailable.');
      const limited = await env.ENQUIRY_LIMITER.limit({ key: `arcan-enquiry:${ip}` });
      if (!limited.success) return reply(429, 'Please wait before trying again.');
      const lead = validateEnquiry(await readJson(request));
      const id = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      // Both the lead and follow-up work must be durable before acknowledging it.
      const results = await env.LEADS_DB.batch([
        env.LEADS_DB.prepare('INSERT INTO enquiries (id, created_at, name, email, phone, service_type, preferred_contact, location, project_description, attribution) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, timestamp, lead.name, lead.email, lead.phone, lead.serviceType, lead.preferredContact, lead.address, lead.projectDescription, lead.attribution),
        env.LEADS_DB.prepare('INSERT INTO enquiry_outbox (enquiry_id, created_at, status) VALUES (?, ?, ?)').bind(id, timestamp, 'pending'),
      ]);
      if (results.length !== 2 || results.some(result => !result.success || result.meta?.changes !== 1)) return reply(503, 'We could not confirm your enquiry. Please contact Arcan directly.');
      return Response.json({ success: true, lead_saved: true }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      if ([400, 413, 415].includes(error?.status)) return reply(error.status, error.message);
      // Do not log request content, database exceptions or contact details.
      return reply(503, 'We could not save your enquiry. Please try again or contact Arcan directly.');
    }
  },
};
