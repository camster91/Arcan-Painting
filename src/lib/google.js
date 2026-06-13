// Google services via Maton.ai gateway — stripped in 2026-06-13 per
// "Remove maton and telegram we stripped those out". Replaced with no-ops
// so the routes that import these still build and run, they just don't
// talk to Google anymore.
//
// If Maton/Google services come back: the original code used sendGmailEmail
// (via Maton gateway), getCalendarClient (Google Calendar), sendEmail
// (via Maton). The export signatures below match what callers expect, so
// the real impl is a drop-in replacement.

// sendGmailEmail({to, subject, body, ...}) — was Maton-gated Gmail send
export async function sendGmailEmail(_opts = {}) {
  console.log('[google-stub] sendGmailEmail called but Maton integration was removed — no-op');
  return { ok: false, reason: 'maton-removed' };
}

// getCalendarClient() — was Google Calendar API client. The original
// Maton/Google integration was stripped 2026-06-13. The stub throws
// so the caller's catch block returns 503 (Calendar not configured)
// instead of silently returning an empty array. That matches the
// pre-strip behavior when MATON_API_KEY was missing.
export function getCalendarClient() {
  throw new Error('Missing Maton API key. Set MATON_API_KEY in your project secrets. (Integration was removed 2026-06-13.)');
}

// sendEmail({to, subject, html/text, ...}) — was Maton-gated Gmail send (used by
// the cold-email send/send-next routes, payment receipts, password reset, magic
// link, etc.). All those callers now no-op too.
export async function sendEmail(_opts = {}) {
  console.log('[google-stub] sendEmail called but Maton integration was removed — no-op');
  return { ok: false, reason: 'maton-removed' };
}
