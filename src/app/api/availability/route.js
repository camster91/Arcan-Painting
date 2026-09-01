import sql from "../utils/sql.js";
import { getCurrentUser, requireAdmin } from "../utils/auth.js";
import { requireCsrf } from "../utils/csrf.js";
import { auditLog } from "../utils/audit.js";

function isAdminUser(user) {
  return user?.role === "owner" || user?.role === "admin";
}

// Public: list available slots
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    const includeAll = url.searchParams.get("all") === "1"; // admin only

    const isAdmin = Boolean(includeAll && (await requireAdmin(request)));

    // Build query for slots with remaining capacity
    let params = [];
    let whereClauses = ["1=1"]; // will AND conditions

    if (date) {
      whereClauses.push("slot_date = $" + (params.push(date) && params.length));
    } else if (start && end) {
      whereClauses.push(
        "slot_date BETWEEN $" +
          (params.push(start) && params.length) +
          " AND $" +
          (params.push(end) && params.length),
      );
    } else {
      // default: upcoming 30 days
      const today = new Date();
      const in30 = new Date();
      in30.setDate(today.getDate() + 30);
      const t = today.toISOString().split("T")[0];
      const e = in30.toISOString().split("T")[0];
      whereClauses.push(
        "slot_date BETWEEN $" +
          (params.push(t) && params.length) +
          " AND $" +
          (params.push(e) && params.length),
      );
    }

    if (!isAdmin) {
      whereClauses.push("status = 'open'");
    }

    const where = whereClauses.join(" AND ");

    const query = `
      SELECT
        s.id,
        s.slot_date,
        s.start_time,
        s.end_time,
        s.capacity,
        s.status,
        s.notes,
        COALESCE(a.booked_count, 0) AS booked_count,
        (s.capacity - COALESCE(a.booked_count, 0)) AS remaining
      FROM availability_slots s
      LEFT JOIN (
        SELECT slot_id, COUNT(*) AS booked_count
        FROM appointments
        WHERE status = 'booked'
        GROUP BY slot_id
      ) a ON a.slot_id = s.id
      WHERE ${where}
      ORDER BY s.slot_date ASC, s.start_time ASC
    `;

    const slots = await sql(query, params);

    // If not admin, only return those with remaining > 0
    const result = isAdmin
      ? slots
      : slots.filter((r) => Number(r.remaining) > 0);

    // Public scheduling needs a slot identifier, time window, and remaining
    // capacity only. Keep staff notes and internal capacity/status metadata
    // within the explicitly-admin `?all=1` response.
    const publicSlots = result.map(
      ({ id, slot_date, start_time, end_time, remaining }) => ({
        id,
        slot_date,
        start_time,
        end_time,
        remaining,
      }),
    );

    return Response.json({ success: true, slots: isAdmin ? result : publicSlots });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return Response.json(
      { error: "Failed to fetch availability" },
      { status: 500 },
    );
  }
}

// Admin: create a slot
export async function POST(request) {
  const csrfError = requireCsrf(request);
  if (csrfError) return csrfError;

  try {
    const user = await getCurrentUser(request);
    if (!isAdminUser(user)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      slotDate,
      startTime,
      endTime,
      capacity = 1,
      status = "open",
      notes = "",
    } = body || {};

    if (!slotDate || !startTime || !endTime) {
      return Response.json(
        { error: "slotDate, startTime and endTime are required" },
        { status: 400 },
      );
    }

    // Basic validation
    const cap = Number(capacity) || 1;

    const rows = await sql`
      INSERT INTO availability_slots (slot_date, start_time, end_time, capacity, status, notes)
      VALUES (${slotDate}, ${startTime}, ${endTime}, ${cap}, ${status}, ${notes})
      RETURNING id
    `;

    await auditLog({
      request,
      action: "availability_slot.create",
      userId: user.id,
      username: user.username,
      resource: "availability_slot",
      resourceId: rows[0].id,
      changes: { slot_date: slotDate, start_time: startTime, end_time: endTime },
    });

    return Response.json({ success: true, id: rows[0].id });
  } catch (error) {
    console.error("Error creating slot:", error);
    return Response.json({ error: "Failed to create slot" }, { status: 500 });
  }
}

// Admin: close or reopen a slot without deleting appointment history.
export async function PUT(request) {
  const csrfError = requireCsrf(request);
  if (csrfError) return csrfError;

  try {
    const user = await getCurrentUser(request);
    if (!isAdminUser(user)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id, status } = (await request.json().catch(() => null)) || {};
    if (!Number.isInteger(Number(id)) || !["open", "closed"].includes(status)) {
      return Response.json(
        { error: "A valid id and status of open or closed are required" },
        { status: 400 },
      );
    }
    const rows = await sql`
      UPDATE availability_slots
      SET status = ${status}
      WHERE id = ${Number(id)}
      RETURNING id, status
    `;
    if (!rows.length) {
      return Response.json({ error: "Availability slot not found" }, { status: 404 });
    }
    await auditLog({
      request,
      action: "availability_slot.status_update",
      userId: user.id,
      username: user.username,
      resource: "availability_slot",
      resourceId: rows[0].id,
      changes: { status: rows[0].status },
    });
    return Response.json({ success: true, slot: rows[0] });
  } catch (error) {
    console.error("Error updating slot:", error);
    return Response.json({ error: "Failed to update slot" }, { status: 500 });
  }
}

// Admin: delete a slot
export async function DELETE(request) {
  const csrfError = requireCsrf(request);
  if (csrfError) return csrfError;

  try {
    const user = await getCurrentUser(request);
    if (!isAdminUser(user)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body || {};
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });

    const outcome = await sql.transaction(async (txn) => {
      const [slot] = await txn`
        SELECT id, slot_date, start_time, end_time
        FROM availability_slots
        WHERE id = ${id}
        FOR UPDATE
      `;
      if (!slot) return { status: "missing" };
      const [appointments] = await txn`
        SELECT COUNT(*)::integer AS count
        FROM appointments
        WHERE slot_id = ${id}
      `;
      if (appointments.count > 0) return { status: "retained", slot };
      await txn`DELETE FROM availability_slots WHERE id = ${id}`;
      return { status: "deleted", slot };
    });
    if (outcome.status === "missing") {
      return Response.json({ error: "Availability slot not found" }, { status: 404 });
    }
    if (outcome.status === "retained") {
      return Response.json(
        { error: "Slots with appointment history cannot be deleted. Close the slot instead." },
        { status: 409 },
      );
    }

    await auditLog({
      request,
      action: "availability_slot.delete",
      userId: user.id,
      username: user.username,
      resource: "availability_slot",
      resourceId: id,
      changes: {
        slot_date: outcome.slot.slot_date,
        start_time: outcome.slot.start_time,
        end_time: outcome.slot.end_time,
      },
    });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting slot:", error);
    return Response.json({ error: "Failed to delete slot" }, { status: 500 });
  }
}
