const emailPattern = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const MAX_ATTEMPTS = 12;
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

// Scheduled delivery only. No public endpoint can trigger mail or choose recipients.
export async function deliverNotifications(env, now = Date.now) {
  const clock = typeof now === 'function' ? now : () => now;
  if (!env.LEADS_DB || !env.EMAIL || !emailPattern.test(env.NOTIFY_FROM || '') || !emailPattern.test(env.NOTIFY_TO || '')) {
    return { configured: false, accepted: 0, retrying: 0 };
  }
  const db = env.LEADS_DB;
  const due = await db.prepare(`SELECT e.*, o.attempts FROM enquiry_outbox o JOIN enquiries e ON e.id = o.enquiry_id
    WHERE o.status = 'pending' AND o.attempts < ${MAX_ATTEMPTS} AND o.next_attempt_at <= ? AND o.lease_until <= ? ORDER BY o.created_at LIMIT 10`).bind(clock(), clock()).all();
  if (!due.success) throw new Error('Notification selection unavailable');
  let accepted = 0;
  let retrying = 0;
  for (const row of due.results) {
    const token = crypto.randomUUID();
    const claimedAt = clock();
    const claim = await db.prepare(`UPDATE enquiry_outbox SET lease_token = ?, lease_until = ?, attempts = attempts + 1
      WHERE enquiry_id = ? AND status = 'pending' AND lease_until <= ? AND next_attempt_at <= ?`).bind(token, claimedAt + 300_000, row.id, claimedAt, claimedAt).run();
    if (!claim.success) throw new Error('Notification claim unavailable');
    if (claim.meta.changes !== 1) continue;
    try {
      const text = [
        `Arcan project enquiry — ${row.id}`, `Received: ${row.created_at}`,
        `Name: ${row.name}`, `Email: ${row.email || 'Not provided'}`, `Phone: ${row.phone || 'Not provided'}`,
        `Preferred contact: ${row.preferred_contact}`, `Service: ${row.service_type}`, `Location: ${row.location}`, '', row.project_description,
      ].join('\n');
      const result = await env.EMAIL.send({
        from: { email: env.NOTIFY_FROM, name: 'Arcan Painting' }, to: env.NOTIFY_TO,
        subject: `Arcan project enquiry ${row.id}`, text,
        html: `<pre style="white-space:pre-wrap;font-family:Arial,sans-serif">${escapeHtml(text)}</pre>`,
      });
      if (typeof result?.messageId !== 'string' || !result.messageId) throw new Error('No provider acknowledgement');
      const saved = await db.prepare(`UPDATE enquiry_outbox SET status = 'sent', provider_message_id = ?, accepted_at = ?, lease_until = 0, lease_token = NULL
        WHERE enquiry_id = ? AND lease_token = ? AND status = 'pending'`).bind(result.messageId, new Date(clock()).toISOString(), row.id, token).run();
      if (!saved.success || saved.meta.changes !== 1) throw new Error('Notification acknowledgement unavailable');
      accepted++;
    } catch {
      // Retry remains durable. No provider exception or personal details enter logs.
      const delay = Math.min(3_600_000, 60_000 * 2 ** Math.min(row.attempts, 6));
      const reset = await db.prepare(`UPDATE enquiry_outbox SET next_attempt_at = ?, lease_until = 0, lease_token = NULL
        WHERE enquiry_id = ? AND lease_token = ? AND status = 'pending'`).bind(clock() + delay, row.id, token).run();
      if (!reset.success) throw new Error('Notification retry unavailable');
      retrying++;
    }
  }
  const retained = await db.prepare(`SELECT COUNT(*) AS count FROM enquiry_outbox WHERE status = 'pending' AND attempts >= ?`).bind(MAX_ATTEMPTS).all();
  if (!retained.success) throw new Error('Notification monitoring unavailable');
  return { configured: true, accepted, retrying, retained: retained.results[0]?.count || 0 };
}
