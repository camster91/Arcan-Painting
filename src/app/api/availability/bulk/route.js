import sql from "../../utils/sql.js";
import { requireAdmin } from "../../utils/auth.js";

function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function pad2(n) {
  return n.toString().padStart(2, "0");
}

function toDateStr(d) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

// Admin: bulk generate weekday slots
export async function POST(request) {
  try {
    const authorized = await requireAdmin(request);
    if (!authorized) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const startDateStr = body.startDate; // yyyy-mm-dd
    const days = Number(body.days) || 14; // default next 14 days
    const slotsPerDay = Number(body.slotsPerDay) || 4; // default 4
    const startTimeStr = body.startTime || "09:00";
    const endTimeStr = body.endTime || "17:00";
    const capacity = Number(body.capacity) || 1;
    const notes = body.notes || "Auto-generated";

    let startDate;
    if (startDateStr) {
      startDate = new Date(startDateStr + "T00:00:00");
    } else {
      startDate = new Date();
    }

    // parse start/end hours and compute slot durations
    const [startH, startM] = startTimeStr.split(":").map((n) => Number(n));
    const [endH, endM] = endTimeStr.split(":").map((n) => Number(n));
    const totalMinutes = endH * 60 + endM - (startH * 60 + startM);
    if (totalMinutes <= 0) {
      return Response.json(
        { error: "endTime must be after startTime" },
        { status: 400 },
      );
    }
    const slotMinutes = Math.floor(totalMinutes / slotsPerDay);

    let inserted = 0;
    let attempted = 0;

    for (let i = 0; i < days; i++) {
      const d = addDays(startDate, i);
      const dow = d.getDay(); // 0 Sun .. 6 Sat
      if (dow === 0 || dow === 6) {
        continue; // skip weekends
      }
      const dateStr = toDateStr(d);

      for (let s = 0; s < slotsPerDay; s++) {
        const minutesFromStart = s * slotMinutes;
        const stMin = startH * 60 + startM + minutesFromStart;
        const enMin = Math.min(stMin + slotMinutes, endH * 60 + endM);
        const stHh = pad2(Math.floor(stMin / 60));
        const stMm = pad2(stMin % 60);
        const enHh = pad2(Math.floor(enMin / 60));
        const enMm = pad2(enMin % 60);
        const startT = `${stHh}:${stMm}`;
        const endT = `${enHh}:${enMm}`;

        attempted++;

        // Insert only if not exists for same date/time
        const rows = await sql(
          `
            INSERT INTO availability_slots (slot_date, start_time, end_time, capacity, status, notes)
            SELECT $1, $2, $3, $4, 'open', $5
            WHERE NOT EXISTS (
              SELECT 1 FROM availability_slots WHERE slot_date = $1 AND start_time = $2 AND end_time = $3
            )
            RETURNING id
          `,
          [dateStr, startT, endT, capacity, notes],
        );
        if (rows && rows[0] && rows[0].id) {
          inserted++;
        }
      }
    }

    return Response.json({ success: true, attempted, inserted });
  } catch (error) {
    console.error("Bulk availability create error:", error);
    return Response.json(
      { error: "Failed to generate slots" },
      { status: 500 },
    );
  }
}
