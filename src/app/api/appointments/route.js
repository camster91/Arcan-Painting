import sql from "../utils/sql.js";
import { sendEmail } from "../utils/send-email.js";

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
  try {
    const body = await request.json();
    const {
      slotId,
      name,
      email = "",
      phone = "",
      address = "",
      notes = "",
      serviceType = "Estimate",
    } = body || {};

    if (!slotId || !name || (!email && !phone)) {
      return Response.json(
        { error: "slotId, name and either email or phone are required" },
        { status: 400 },
      );
    }

    // Create a lead first (email/phone may be empty strings to satisfy NOT NULL)
    const leadRows = await sql`
      INSERT INTO leads (name, email, phone, service_type, status, lead_source, address, follow_up_date)
      VALUES (
        ${name.trim()},
        ${email.trim().toLowerCase()},
        ${phone.trim()},
        ${serviceType},
        'estimate_scheduled',
        'website',
        ${address},
        (SELECT slot_date FROM availability_slots WHERE id = ${slotId} LIMIT 1)
      )
      RETURNING id
    `;

    const leadId = leadRows[0]?.id;

    // Guarded insert into appointments to prevent overbooking using a CTE and row lock
    const rows = await sql(
      `
      WITH slot AS (
        SELECT s.id, s.capacity, s.status
        FROM availability_slots s
        WHERE s.id = $1 AND s.slot_date > CURRENT_DATE
        FOR UPDATE
      ),
      booked AS (
        SELECT COUNT(*)::int AS cnt FROM appointments a WHERE a.slot_id = $1 AND a.status = 'booked'
      )
      INSERT INTO appointments (slot_id, lead_id, name, email, phone, address, notes, status)
      SELECT $1, $2, $3, $4, $5, $6, $7, 'booked'
      FROM slot, booked
      WHERE slot.status = 'open' AND (slot.capacity - booked.cnt) > 0
      RETURNING id
    `,
      [
        slotId,
        leadId || null,
        name.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        address,
        notes,
      ],
    );

    if (!rows[0]) {
      return Response.json(
        { error: "Selected time is no longer available" },
        { status: 409 },
      );
    }

    // Fetch slot details for calendar invite
    const slotInfo =
      await sql`SELECT slot_date, start_time, end_time FROM availability_slots WHERE id = ${slotId} LIMIT 1`;
    const s = slotInfo[0];

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
      `UID:appointment-${rows[0].id}@arcanpainting.ca`,
      `DTSTAMP:${toCalendarStamp(new Date())}`,
      `DTSTART:${startStamp}`,
      `DTEND:${endStamp}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
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
        <p style="margin:0 0 12px">${recipientName ? `${recipientName}, ` : ""}we scheduled your on‑site estimate.</p>
        <ul style="padding:0;margin:0 0 12px;list-style:none">
          <li><strong>When:</strong> ${startLocal.toLocaleString()} – ${endLocal.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</li>
          <li><strong>Where:</strong> ${location}</li>
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
        subject: `New estimate booked: ${name}`,
        html: htmlBody("Team"),
        text: `New estimate. Client: ${name}. When: ${startLocal.toISOString()} - ${endLocal.toISOString()} Where: ${location}. Add to Google: ${googleUrl}`,
      });
    } catch (e) {
      console.error("Email send failed (non-blocking)", e);
      // Do not fail the booking if emails fail
    }

    return Response.json({ success: true, appointmentId: rows[0].id, leadId });
  } catch (error) {
    console.error("Error booking appointment:", error);
    return Response.json(
      { error: "Failed to book appointment" },
      { status: 500 },
    );
  }
}
