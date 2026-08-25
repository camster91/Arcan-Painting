import sql from "../utils/sql.js";
import { sendEmail } from "../utils/send-email.js";
import { requireAdmin } from "../utils/auth.js";
import { createRateLimiter } from "../utils/rate-limit.js";

const appointmentLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 5,
  prefix: "appointment",
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toEmailHeaderValue(value) {
  return String(value).replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function escapeIcsText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/([,;])/g, "\\$1");
}

function validateAppointmentInput(body) {
  const value = body || {};
  const slotId = Number(value.slotId);
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const email = typeof value.email === "string" ? value.email.trim().toLowerCase() : "";
  const phone = typeof value.phone === "string" ? value.phone.trim() : "";
  const address = typeof value.address === "string" ? value.address.trim() : "";
  const notes = typeof value.notes === "string" ? value.notes.trim() : "";
  const serviceType = typeof value.serviceType === "string" ? value.serviceType.trim() : "Estimate";

  if (!Number.isInteger(slotId) || slotId <= 0 || !name || (!email && !phone)) {
    return { error: "slotId, name and either email or phone are required" };
  }
  if (name.length > 255 || email.length > 255 || phone.length > 50 || address.length > 2_000 || notes.length > 4_000 || serviceType.length > 100) {
    return { error: "One or more appointment fields exceed the allowed length" };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Email format is invalid" };
  }

  return { value: { slotId, name, email, phone, address, notes, serviceType } };
}

// helper to format datetimes for calendar URLs
function toCalendarStamp(date) {
  try {
    return (
      new Date(date).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    );
  } catch {
    return "";
  }
}

// List upcoming appointments (ADMIN)
export async function GET(request) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    // Build dynamic query safely
    let q = `
      SELECT a.id, a.slot_id, a.lead_id, a.name, a.email, a.phone, a.address, a.notes, a.status,
             s.slot_date, s.start_time, s.end_time,
             l.name AS lead_name, l.email AS lead_email, l.phone AS lead_phone
      FROM appointments a
      JOIN availability_slots s ON s.id = a.slot_id
      LEFT JOIN leads l ON l.id = a.lead_id
      WHERE a.status = 'booked'`;
    const values = [];

    if (from) {
      q += ` AND s.slot_date >= $${values.length + 1}`;
      values.push(from);
    } else {
      q += ` AND s.slot_date >= CURRENT_DATE`;
    }

    if (to) {
      q += ` AND s.slot_date <= $${values.length + 1}`;
      values.push(to);
    }

    q += ` ORDER BY s.slot_date ASC, s.start_time ASC`;

    const rows = await sql(q, values);

    return Response.json({ success: true, appointments: rows });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return Response.json(
      { error: "Failed to fetch appointments" },
      { status: 500 },
    );
  }
}

// Create a booking (public)
export async function POST(request) {
  const limited = appointmentLimiter(request);
  if (limited) return limited;

  try {
    const parsed = validateAppointmentInput(await request.json().catch(() => null));
    if (parsed.error) return Response.json({ error: parsed.error }, { status: 400 });
    const { slotId, name, email, phone, address, notes, serviceType } = parsed.value;

    // Lock the slot, then create both records in one transaction. A failed or
    // full slot leaves no orphan CRM lead behind.
    const booking = await sql.transaction(async (txSql) => {
      const slots = await txSql`
        SELECT id, slot_date, start_time, end_time, capacity, status
        FROM availability_slots
        WHERE id = ${slotId} AND slot_date > CURRENT_DATE
        FOR UPDATE
      `;
      const slot = slots[0];
      if (!slot || slot.status !== "open") return null;

      const booked = await txSql`
        SELECT COUNT(*)::int AS count FROM appointments
        WHERE slot_id = ${slotId} AND status = 'booked'
      `;
      if ((booked[0]?.count || 0) >= slot.capacity) return null;

      const leads = await txSql`
        INSERT INTO leads (name, email, phone, service_type, status, lead_source, address, follow_up_date)
        VALUES (${name}, ${email}, ${phone}, ${serviceType}, 'estimate_scheduled', 'website', ${address}, ${slot.slot_date})
        RETURNING id
      `;
      const leadId = leads[0]?.id;
      const appointments = await txSql`
        INSERT INTO appointments (slot_id, lead_id, name, email, phone, address, notes, status)
        VALUES (${slotId}, ${leadId}, ${name}, ${email}, ${phone}, ${address}, ${notes}, 'booked')
        RETURNING id
      `;
      return { appointmentId: appointments[0]?.id, leadId, slot };
    });

    if (!booking?.appointmentId) {
      return Response.json(
        { error: "Selected time is no longer available" },
        { status: 409 },
      );
    }

    const { leadId, appointmentId, slot: s } = booking;

    // Build event datetimes
    const startLocal = new Date(
      `${s.slot_date}T${String(s.start_time).slice(0, 8)}`,
    );
    const endLocal = new Date(
      `${s.slot_date}T${String(s.end_time).slice(0, 8)}`,
    );
    const startStamp = toCalendarStamp(startLocal);
    const endStamp = toCalendarStamp(endLocal);

    const title = "On‑Site Estimate – Arcan Painting";
    const description = `Estimate for ${name}${notes ? `\\nNotes: ${notes}` : ""}`;
    const location = address || "Customer location";

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startStamp}/${endStamp}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Arcan Painting//Estimate//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:REQUEST",
      "BEGIN:VEVENT",
      `UID:appointment-${appointmentId}@arcanpainting.ca`,
      `DTSTAMP:${toCalendarStamp(new Date())}`,
      `DTSTART:${startStamp}`,
      `DTEND:${endStamp}`,
      `SUMMARY:${escapeIcsText(title)}`,
      `DESCRIPTION:${escapeIcsText(description)}`,
      `LOCATION:${escapeIcsText(location)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const icsDataUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;

    // Send emails (best-effort)
    const notifyTo =
      process.env.ESTIMATE_NOTIFICATIONS_TO || "info@arcanpainting.ca";

    const htmlBody = (recipientName) => `
      <div style="font-family:Inter,system-ui,Segoe UI,Arial,sans-serif;color:#0f172a">
        <h2 style="margin:0 0 8px">You're booked!</h2>
        <p style="margin:0 0 12px">${recipientName ? `${escapeHtml(recipientName)}, ` : ""}we scheduled your on‑site estimate.</p>
        <ul style="padding:0;margin:0 0 12px;list-style:none">
          <li><strong>When:</strong> ${startLocal.toLocaleString()} – ${endLocal.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</li>
          <li><strong>Where:</strong> ${escapeHtml(location)}</li>
        </ul>
        <p style="margin:12px 0">
          <a href="${googleUrl}" style="background:#f59e0b;color:#111827;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:600">Add to Google Calendar</a>
          <a href="${icsDataUrl}" style="margin-left:10px;color:#0ea5e9;text-decoration:none">Download .ics</a>
        </p>
        <p style="margin:16px 0 0;color:#475569;font-size:14px">If anything changes, reply to this email and we'll adjust your time.</p>
      </div>`;

    try {
      // Client email
      if (email) {
        await sendEmail({
          to: email,
          subject: "Your on‑site estimate is scheduled",
          html: htmlBody(name),
          text: `You're booked! When: ${startLocal.toISOString()} - ${endLocal.toISOString()} Where: ${location}\nAdd to Google: ${googleUrl}`,
        });
      }

      // Team notification
      await sendEmail({
        to: notifyTo,
        subject: `New estimate booked: ${toEmailHeaderValue(name)}`,
        html: htmlBody("Team"),
        text: `New estimate. Client: ${name}. When: ${startLocal.toISOString()} - ${endLocal.toISOString()} Where: ${location}. Add to Google: ${googleUrl}`,
      });
    } catch (e) {
      console.error("Email send failed (non-blocking)", e);
      // Do not fail the booking if emails fail
    }

    return Response.json({ success: true, appointmentId, leadId });
  } catch (error) {
    console.error("Error booking appointment:", error);
    return Response.json(
      { error: "Failed to book appointment" },
      { status: 500 },
    );
  }
}
