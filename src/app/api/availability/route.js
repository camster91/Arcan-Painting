import sql from "../utils/sql.js";

// Reuse auth helper from leads route
async function ensureAuthTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS auth_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL
    )
  `;
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((pair) => {
    const [k, v] = pair.split("=");
    if (!k) return;
    cookies[k.trim()] = decodeURIComponent((v || "").trim());
  });
  return cookies;
}

async function requireAdmin(request) {
  try {
    await ensureAuthTables();
  } catch {}
  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const token = cookies["admin_session"];
  if (!token) return false;
  const rows = await sql`
    SELECT u.id, s.expires_at FROM auth_sessions s
    JOIN auth_users u ON u.id = s.user_id
    WHERE s.token = ${token}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return false;
  const nowIso = new Date().toISOString();
  if (row.expires_at && row.expires_at < nowIso) {
    await sql`DELETE FROM auth_sessions WHERE token = ${token}`;
    return false;
  }
  return true;
}

// Public: list available slots
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    const includeAll = url.searchParams.get("all") === "1"; // admin only

    const isAdmin = includeAll && (await requireAdmin(request));

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

    return Response.json({ success: true, slots: result });
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
  try {
    const authorized = await requireAdmin(request);
    if (!authorized) {
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

    return Response.json({ success: true, id: rows[0].id });
  } catch (error) {
    console.error("Error creating slot:", error);
    return Response.json({ error: "Failed to create slot" }, { status: 500 });
  }
}

// Admin: delete a slot
export async function DELETE(request) {
  try {
    const authorized = await requireAdmin(request);
    if (!authorized) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body || {};
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });

    await sql`DELETE FROM availability_slots WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting slot:", error);
    return Response.json({ error: "Failed to delete slot" }, { status: 500 });
  }
}
