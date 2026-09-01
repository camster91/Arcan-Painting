/**
 * Delayed Email Worker
 *
 * Processes the delayed_emails queue. Designed to be called by:
 * - A cron job (e.g., every 5-15 minutes)
 * - The Meta webhook (post-lead-save, fire-and-forget)
 * - Manual trigger from the admin UI
 *
 * For each pending row whose scheduled_for <= NOW(), send the email via
 * sendTemplatedEmail and mark status = 'sent'. If the send fails, increment
 * attempts and store last_error.
 *
 * Auth: requires the x-cron-secret header OR admin auth (same as the
 * cold-email send endpoint).
 */

import sql from "@/app/api/utils/sql";
import { getCurrentUser, unauthorizedResponse } from "@/app/api/utils/auth";
import { sendTemplatedEmail } from "@/app/api/utils/send-email";
import { hasPermission } from "@/app/api/utils/permissions";
import { auditLog } from "@/app/api/utils/audit";

const BATCH_LIMIT = 50;
const MAX_ATTEMPTS = 3;

export async function POST(request) {
  if (process.env.EMAIL_AUTOMATIONS_ENABLED !== "true") {
    return Response.json(
      { error: "Email automations are disabled" },
      { status: 503 },
    );
  }

  // Allow a configured cron secret OR an explicit owner action.
  const cronSecret = request.headers.get("x-cron-secret");
  const configuredCronSecret = process.env.CRON_SECRET;
  const validCron = Boolean(
    configuredCronSecret && cronSecret && cronSecret === configuredCronSecret,
  );
  let actor = validCron
    ? { id: null, username: "cron", role: "service" }
    : null;
  if (!validCron) {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "owner") return unauthorizedResponse();
    actor = user;
  }

  try {
    // Recover jobs abandoned by a crashed worker. Delivery providers can still accept a
    // request just before a crash, so provider message IDs and downstream deduplication
    // remain part of the staging acceptance gate.
    await sql`
      UPDATE delayed_emails
      SET status = 'pending', processing_started_at = NULL,
        last_error = COALESCE(last_error, 'Recovered abandoned worker claim')
      WHERE status = 'processing'
        AND processing_started_at < CURRENT_TIMESTAMP - INTERVAL '15 minutes'
    `;

    // Find pending emails whose time has come. Skip rows that have failed too many times.
    const due = await sql.transaction(
      async (txn) => txn`
      UPDATE delayed_emails SET status = 'processing', processing_started_at = CURRENT_TIMESTAMP
      WHERE id IN (
        SELECT id FROM delayed_emails
        WHERE status = 'pending' AND scheduled_for <= NOW() AND attempts < ${MAX_ATTEMPTS}
        ORDER BY scheduled_for ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${BATCH_LIMIT}
      )
      RETURNING id, workflow_id, template_name, recipient_email, data, scheduled_for,
        attempts, related_type, related_id
    `,
    );

    if (due.length === 0) {
      await auditLog({
        request,
        action: "communications.worker_run",
        userId: actor.id,
        username: actor.username,
        resource: "delayed_email",
        changes: { processed: 0, sent: 0, failed: 0 },
      });
      return Response.json({ processed: 0, message: "No delayed emails due" });
    }

    let sent = 0;
    let failed = 0;
    const errors = [];

    for (const row of due) {
      try {
        if (row.data?.requires_marketing_consent) {
          const leadId = Number(row.data.lead_id);
          const [lead] = Number.isInteger(leadId)
            ? await sql`SELECT marketing_consent_status FROM leads WHERE id = ${leadId} AND deleted_at IS NULL`
            : [];
          if (lead?.marketing_consent_status !== "opted_in") {
            await sql`UPDATE delayed_emails SET status = 'cancelled', last_error = 'Marketing consent is not active', processing_started_at = NULL WHERE id = ${row.id}`;
            continue;
          }
        }
        await sendTemplatedEmail(
          row.template_name,
          row.data || {},
          row.recipient_email,
          {
            relatedType: row.related_type,
            relatedId: row.related_id,
          },
        );
        await sql`
          UPDATE delayed_emails
          SET status = 'sent', sent_at = NOW(), attempts = attempts + 1,
            last_error = NULL, processing_started_at = NULL
          WHERE id = ${row.id}
        `;
        sent++;
      } catch (err) {
        await sql`
          UPDATE delayed_emails
          SET status = 'pending', attempts = attempts + 1,
            last_error = ${err.message || String(err)}, processing_started_at = NULL
          WHERE id = ${row.id}
        `;
        // If we hit MAX_ATTEMPTS, mark as failed so it doesn't keep retrying
        if (row.attempts + 1 >= MAX_ATTEMPTS) {
          await sql`
            UPDATE delayed_emails
            SET status = 'failed'
            WHERE id = ${row.id} AND status = 'pending'
          `;
        }
        failed++;
        errors.push({ id: row.id, error: err.message });
      }
    }

    await auditLog({
      request,
      action: "communications.worker_run",
      userId: actor.id,
      username: actor.username,
      resource: "delayed_email",
      changes: { processed: due.length, sent, failed },
      status: failed > 0 ? "failure" : "success",
    });

    return Response.json({ processed: due.length, sent, failed, errors });
  } catch (error) {
    console.error("delayed-emails worker error:", error);
    return Response.json(
      { error: "Worker failed", details: error.message },
      { status: 500 },
    );
  }
}

// GET — inspect the queue (admin)
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthorizedResponse();
    if (!hasPermission(user, "communications.manage")) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "pending";
    const limit = Math.min(parseInt(url.searchParams.get("limit")) || 50, 200);

    const rows = await sql`
      SELECT id, workflow_id, template_name, recipient_email, scheduled_for, status, attempts, last_error, sent_at, created_at
      FROM delayed_emails
      WHERE status = ${status}
      ORDER BY scheduled_for ASC
      LIMIT ${limit}
    `;

    const stats = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending')::int as pending,
        COUNT(*) FILTER (WHERE status = 'sent')::int as sent,
        COUNT(*) FILTER (WHERE status = 'failed')::int as failed,
        COUNT(*) FILTER (WHERE status = 'pending' AND scheduled_for <= NOW())::int as due_now
      FROM delayed_emails
    `;

    return Response.json({ rows, stats: stats[0] });
  } catch (error) {
    console.error("delayed-emails GET error:", error);
    return Response.json({ error: "Failed to load queue" }, { status: 500 });
  }
}
