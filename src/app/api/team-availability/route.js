import sql from "@/app/api/utils/sql";

// ADD: Ensure table exists before operations
async function ensureTeamAvailabilityTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS team_availability (
      id SERIAL PRIMARY KEY,
      team_member_id INTEGER REFERENCES team_members(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      availability_type VARCHAR(50) DEFAULT 'available',
      notes TEXT,
      is_recurring BOOLEAN DEFAULT false,
      recurrence_pattern VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  // Unique slot per member/time window (best-effort)
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_team_availability_unique 
    ON team_availability(team_member_id, date, start_time, end_time)
  `;
  // Helpful indexes
  await sql`
    CREATE INDEX IF NOT EXISTS idx_team_availability_date ON team_availability(date)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_team_availability_member ON team_availability(team_member_id)
  `;
}

export async function GET(request) {
  try {
    await ensureTeamAvailabilityTable(); // ensure table
    const { searchParams } = new URL(request.url);
    const team_member_id = searchParams.get("team_member_id");
    const date = searchParams.get("date");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    let whereConditions = [];
    let params = [];
    let paramCount = 0;

    if (team_member_id) {
      paramCount++;
      whereConditions.push(`ta.team_member_id = $${paramCount}`);
      params.push(parseInt(team_member_id));
    }

    if (date) {
      paramCount++;
      whereConditions.push(`ta.date = $${paramCount}`);
      params.push(date);
    }

    if (start_date && end_date) {
      paramCount++;
      whereConditions.push(`ta.date >= $${paramCount}`);
      params.push(start_date);
      paramCount++;
      whereConditions.push(`ta.date <= $${paramCount}`);
      params.push(end_date);
    }

    const whereClause =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";

    const availability = await sql(
      `
      SELECT 
        ta.*,
        tm.name as team_member_name,
        tm.role as team_member_role
      FROM team_availability ta
      JOIN team_members tm ON ta.team_member_id = tm.id
      ${whereClause}
      ORDER BY ta.date ASC, ta.start_time ASC
    `,
      params,
    );

    return Response.json({ availability });
  } catch (error) {
    console.error("Error fetching team availability:", error);
    return Response.json(
      { error: "Failed to fetch team availability" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    await ensureTeamAvailabilityTable(); // ensure table
    const body = await request.json();
    const {
      team_member_id,
      date,
      start_time,
      end_time,
      availability_type = "available",
      notes,
      is_recurring = false,
      recurrence_pattern,
    } = body;

    if (!team_member_id || !date || !start_time || !end_time) {
      return Response.json(
        {
          error: "Team member ID, date, start time, and end time are required",
        },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO team_availability (
        team_member_id, date, start_time, end_time,
        availability_type, notes, is_recurring, recurrence_pattern
      ) VALUES (
        ${team_member_id}, ${date}, ${start_time}, ${end_time},
        ${availability_type}, ${notes}, ${is_recurring}, ${recurrence_pattern}
      )
      RETURNING *
    `;

    return Response.json({ availability: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating team availability:", error);
    if (
      String(error.message || "")
        .toLowerCase()
        .includes("duplicate")
    ) {
      return Response.json(
        {
          error: "Availability already exists for this time slot",
        },
        { status: 409 },
      );
    }
    return Response.json(
      { error: "Failed to create availability" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    await ensureTeamAvailabilityTable(); // ensure table
    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return Response.json(
        { error: "Availability ID is required" },
        { status: 400 },
      );
    }

    const allowedFields = [
      "date",
      "start_time",
      "end_time",
      "availability_type",
      "notes",
      "is_recurring",
      "recurrence_pattern",
    ];

    const setClause = [];
    const values = [];
    let paramCount = 0;

    Object.entries(updateFields).forEach(([field, value]) => {
      if (allowedFields.includes(field) && value !== undefined) {
        paramCount++;
        setClause.push(`${field} = $${paramCount}`);
        values.push(value);
      }
    });

    if (setClause.length === 0) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    paramCount++;
    setClause.push(`updated_at = $${paramCount}`);
    values.push(new Date().toISOString());

    paramCount++;
    values.push(id);

    const query = `
      UPDATE team_availability 
      SET ${setClause.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await sql(query, values);

    if (result.length === 0) {
      return Response.json(
        { error: "Availability not found" },
        { status: 404 },
      );
    }

    return Response.json({ availability: result[0] });
  } catch (error) {
    console.error("Error updating team availability:", error);
    return Response.json(
      { error: "Failed to update availability" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    await ensureTeamAvailabilityTable(); // ensure table
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { error: "Availability ID is required" },
        { status: 400 },
      );
    }

    const result = await sql`
      DELETE FROM team_availability
      WHERE id = ${parseInt(id)}
      RETURNING id
    `;

    if (result.length === 0) {
      return Response.json(
        { error: "Availability not found" },
        { status: 404 },
      );
    }

    return Response.json({ message: "Availability deleted successfully" });
  } catch (error) {
    console.error("Error deleting team availability:", error);
    return Response.json(
      { error: "Failed to delete availability" },
      { status: 500 },
    );
  }
}
