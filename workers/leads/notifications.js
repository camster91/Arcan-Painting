const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

// Scheduled delivery only. No public endpoint can trigger mail or choose recipients.
export async function deliverNotifications(env, now = Date.now()) {
  if (!env.LEADS_DB || !env.EMAIL || !emailPattern.test(env.NOTIFY_FROM || '') || !emailPattern.test(env.NOTIFY_TO || '')) {
    return { configured: false, accepted: 0, retrying: 0 };
  }
  const db = env.LEADS_DB;
  const due = await db.prepare(`SELECT e.*, o.attempts FROM enquiry_outbox o JOIN enquiries e ON e.id = o.enquiry_id
    WHERE o.status = 'pending' AND o.next_attempt_at <= ? AND o.lease_until <= ? ORDER BY o.created_at LIMIT 10`).bind(now, now).all();
  if (!due.success) throw new Error('Notification selection unavailable');
  let accepted = 0;
  let retrying = 0;
  for (const row of due.results) {
    const token = crypto.randomUUID();
    const claim = await db.prepare(`UPDATE enquiry_outbox SET lease_token = ?, lease_until = ?, attempts = attempts + 1
      WHERE enquiry_id = ? AND status = 'pending' AND lease_until <= ? AND next_attempt_at <= ?`).bind(token, now + 300_000, row.id, now, now).run();
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
        WHERE enquiry_id = ? AND lease_token = ? AND status = 'pending'`).bind(result.messageId, new Date(now).toISOString(), row.id, token).run();
      if (!saved.success || saved.meta.changes !== 1) throw new Error('Notification acknowledgement unavailable');
      accepted++;
    } catch {
      // Retry remains durable. No provider exception or personal details enter logs.
      const delay = Math.min(3_600_000, 60_000 * 2 ** Math.min(row.attempts, 6));
      const reset = await db.prepare(`UPDATE enquiry_outbox SET next_attempt_at = ?, lease_until = 0, lease_token = NULL
        WHERE enquiry_id = ? AND lease_token = ? AND status = 'pending'`).bind(now + delay, row.id, token).run();
      if (!reset.success) throw new Error('Notification retry unavailable');
      retrying++;
    }
  }
  return { configured: true, accepted, retrying };
}
