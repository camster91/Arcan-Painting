import { safeAttribution } from "../../src/utils/attribution.js";
import { deliverNotifications } from './notifications.js';
const MAX_BODY = 16_384;
const SERVICES = new Set(['interior', 'exterior', 'wallpaper', 'specialty', 'commercial', 'other']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const AMBIGUOUS_SAVE_MESSAGE = 'We could not confirm whether your enquiry was saved. Please wait a moment before trying again or contact Arcan directly.';
const reply = (status, error) => Response.json({ success: false, lead_saved: false, error }, { status, headers: { 'Cache-Control': 'no-store' } });

const success = () => Response.json({ success: true, lead_saved: true }, { headers: { 'Cache-Control': 'no-store' } });

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
  const rawSubmissionId = body.submissionId ?? '';
  if (typeof rawSubmissionId !== 'string' || rawSubmissionId.length > 36 || (rawSubmissionId.trim() && !UUID.test(rawSubmissionId.trim()))) {
    throw { status: 400, message: 'Check your enquiry submission.' };
  }
  const lead = {
    name: value('name', 255, true), email: value('email', 255), phone: value('phone', 50),
    serviceType: value('serviceType', 40, true), preferredContact: value('preferredContact', 10, true),
    address: value('address', 255, true), projectDescription: value('projectDescription', 4000, true),
  };
  if (!SERVICES.has(lead.serviceType) || !['email', 'phone'].includes(lead.preferredContact)) throw { status: 400, message: 'Check your service and contact preference.' };
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) throw { status: 400, message: 'Check your email address.' };
  if (lead.phone && (!/^[\d\s()+-]+$/.test(lead.phone) || lead.phone.replace(/\D/g, '').length < 7)) throw { status: 400, message: 'Check your phone number.' };
  if (!lead[lead.preferredContact]) throw { status: 400, message: 'Add your preferred contact details.' };
  lead.submissionId = rawSubmissionId.trim().toLowerCase() || null;
  lead.attribution = JSON.stringify(safeAttribution(body.attribution));
  return lead;
}

function normalizeLead(lead) {
  return {
    name: lead.name,
    email: lead.email.toLowerCase(),
    phone: lead.phone.replace(/\s+/g, ' '),
    serviceType: lead.serviceType,
    preferredContact: lead.preferredContact,
    address: lead.address.replace(/\s+/g, ' '),
    projectDescription: lead.projectDescription.replace(/\r\n?/g, '\n'),
    attribution: JSON.parse(lead.attribution),
  };
}

async function hashLead(lead) {
  const bytes = new TextEncoder().encode(JSON.stringify(normalizeLead(lead)));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function findExistingResponse(env, submissionId, payloadHash) {
  if (!submissionId) return null;
  try {
    const row = await env.LEADS_DB.prepare(`SELECT e.id, e.payload_hash, o.enquiry_id
      FROM enquiries e LEFT JOIN enquiry_outbox o ON o.enquiry_id = e.id
      WHERE e.submission_id = ? LIMIT 1`).bind(submissionId).first();
    if (!row) return null;
    if (row.payload_hash !== payloadHash) return reply(409, 'This enquiry submission was already used with different details.');
    if (!row.enquiry_id) return reply(503, AMBIGUOUS_SAVE_MESSAGE);
    return success();
  } catch {
    return null;
  }
}

// Private service-binding target: no workers.dev URL or public route.
export default {
  async scheduled(_event, env) {
    const result = await deliverNotifications(env);
    console.log(JSON.stringify({ event: "enquiry_notification_batch", ...result }));
  },
  async fetch(request, env) {
    if (new URL(request.url).pathname !== '/api/contact') return reply(404, 'Not found.');
    if (request.method !== 'POST') return reply(405, 'Method not allowed.');
    if (!env.LEADS_DB || !env.ENQUIRY_LIMITER) return reply(503, 'Enquiries are temporarily unavailable. Please contact Arcan directly.');
    let submissionId;
    let payloadHash;
    try {
      const url = new URL(request.url);
      if (request.headers.get('origin') !== url.origin) return reply(403, 'Please submit through the Arcan website.');
      const ip = request.headers.get('x-arcan-client-ip');
      if (!ip) return reply(503, 'Enquiries are temporarily unavailable.');
      const limited = await env.ENQUIRY_LIMITER.limit({ key: `arcan-enquiry:${ip}` });
      if (!limited.success) return reply(429, 'Please wait before trying again.');
      const lead = validateEnquiry(await readJson(request));
      submissionId = lead.submissionId || crypto.randomUUID();
      payloadHash = await hashLead(lead);
      const id = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      // Both the lead and follow-up work must be durable before acknowledging it.
      const results = await env.LEADS_DB.batch([
        env.LEADS_DB.prepare('INSERT INTO enquiries (id, submission_id, payload_hash, created_at, name, email, phone, service_type, preferred_contact, location, project_description, attribution) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, submissionId, payloadHash, timestamp, lead.name, lead.email, lead.phone, lead.serviceType, lead.preferredContact, lead.address, lead.projectDescription, lead.attribution),
        env.LEADS_DB.prepare('INSERT INTO enquiry_outbox (enquiry_id, created_at, status) VALUES (?, ?, ?)').bind(id, timestamp, 'pending'),
      ]);
      if (results.length !== 2 || results.some(result => !result.success || result.meta?.changes !== 1)) {
        return (await findExistingResponse(env, submissionId, payloadHash)) || reply(503, AMBIGUOUS_SAVE_MESSAGE);
      }
      return success();
    } catch (error) {
      if ([400, 413, 415].includes(error?.status)) return reply(error.status, error.message);
      if (submissionId && payloadHash) {
        const duplicate = await findExistingResponse(env, submissionId, payloadHash);
        if (duplicate) return duplicate;
      }
      // Do not log request content, database exceptions or contact details.
      return reply(503, AMBIGUOUS_SAVE_MESSAGE);
    }
  },
};
