import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { hasPermission } from "@/app/api/utils/permissions";
import { auditLog } from "@/app/api/utils/audit";

// GET /api/follow-ups - Get all follow-ups with optional filtering (ADMIN)
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasPermission(user, "customers.read")) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const leadId = searchParams.get("lead_id");

    let query = `
      SELECT 
        f.*,
        l.name as lead_name,
        l.email as lead_email,
        l.phone as lead_phone,
        l.service_type as lead_service_type
      FROM follow_ups f
      LEFT JOIN leads l ON f.lead_id = l.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND f.status = $${params.length + 1}`;
      params.push(status);
    }

    if (type) {
      query += ` AND f.follow_up_type = $${params.length + 1}`;
      params.push(type);
    }

    if (leadId) {
      query += ` AND f.lead_id = $${params.length + 1}`;
      params.push(parseInt(leadId));
    }

    query += ` ORDER BY f.follow_up_date ASC, f.created_at DESC`;

    const followUps = await sql(query, params);

    return Response.json({
      success: true,
      followUps: followUps || [],
    });
  } catch (error) {
    console.error("Error fetching follow-ups:", error);
    return Response.json(
      { success: false, error: "Failed to fetch follow-ups" },
      { status: 500 },
    );
  }
}

// POST /api/follow-ups - Create a new follow-up (ADMIN)
export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasPermission(user, "customers.write")) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const { lead_id, follow_up_date, follow_up_type, notes } = body;

    // Validate required fields
    if (!lead_id || !follow_up_date || !follow_up_type) {
      return Response.json(
        {
          success: false,
          error: "Lead ID, follow-up date, and type are required",
        },
        { status: 400 },
      );
    }

    // Verify the lead exists
    const leadCheck = await sql`
      SELECT id, name FROM leads WHERE id = ${lead_id}
    `;
    if (!leadCheck || leadCheck.length === 0) {
      return Response.json(
        { success: false, error: "Lead not found" },
        { status: 404 },
      );
    }

    // Validate follow-up type
    const validTypes = [
      "phone_call",
      "email",
      "site_visit",
      "estimate_follow_up",
      "project_check_in",
    ];
    if (!validTypes.includes(follow_up_type)) {
      return Response.json(
        { success: false, error: "Invalid follow-up type" },
        { status: 400 },
      );
    }

    // Insert the new follow-up
    const result = await sql`
      INSERT INTO follow_ups (
        lead_id,
        follow_up_date,
        follow_up_type,
        status,
        notes,
        created_at
      ) VALUES (
        ${lead_id},
        ${follow_up_date},
        ${follow_up_type},
        'pending',
        ${notes || null},
        CURRENT_TIMESTAMP
      )
      RETURNING id, lead_id, follow_up_date, follow_up_type, status, created_at
    `;

    const newFollowUp = result[0];

    await auditLog({
      request,
      action: "follow_up.create",
      userId: user.id,
      username: user.username,
      resource: "follow_up",
      resourceId: newFollowUp.id,
      changes: {
        lead_id: newFollowUp.lead_id,
        follow_up_type: newFollowUp.follow_up_type,
        status: newFollowUp.status,
      },
    });

    return Response.json(
      {
        success: true,
        message: "Follow-up scheduled successfully",
        followUp: newFollowUp,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating follow-up:", error);
    return Response.json(
      { success: false, error: "Failed to schedule follow-up" },
      { status: 500 },
    );
  }
}

// PUT /api/follow-ups - Update an existing follow-up (ADMIN)
export async function PUT(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasPermission(user, "customers.write")) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const { id, follow_up_date, follow_up_type, status, notes, completed_at } =
      body;

    if (!id) {
      return Response.json(
        { success: false, error: "Follow-up ID is required" },
        { status: 400 },
      );
    }

    // Verify the follow-up exists
    const existingFollowUp =
      await sql`SELECT id FROM follow_ups WHERE id = ${id}`;
    if (!existingFollowUp || existingFollowUp.length === 0) {
      return Response.json(
        { success: false, error: "Follow-up not found" },
        { status: 404 },
      );
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (follow_up_date !== undefined) {
      updateFields.push(`follow_up_date = $${paramCount}`);
      updateValues.push(follow_up_date);
      paramCount++;
    }

    if (follow_up_type !== undefined) {
      // Validate follow-up type
      const validTypes = [
        "phone_call",
        "email",
        "site_visit",
        "estimate_follow_up",
        "project_check_in",
      ];
      if (!validTypes.includes(follow_up_type)) {
        return Response.json(
          { success: false, error: "Invalid follow-up type" },
          { status: 400 },
        );
      }
      updateFields.push(`follow_up_type = $${paramCount}`);
      updateValues.push(follow_up_type);
      paramCount++;
    }

    if (status !== undefined) {
      // Validate status
      if (!["pending", "completed"].includes(status)) {
        return Response.json(
          { success: false, error: "Invalid status" },
          { status: 400 },
        );
      }
      updateFields.push(`status = $${paramCount}`);
      updateValues.push(status);
      paramCount++;
    }

    if (notes !== undefined) {
      updateFields.push(`notes = $${paramCount}`);
      updateValues.push(notes);
      paramCount++;
    }

    if (completed_at !== undefined) {
      updateFields.push(`completed_at = $${paramCount}`);
      updateValues.push(completed_at);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return Response.json(
        { success: false, error: "No fields to update" },
        { status: 400 },
      );
    }

    // Add id for WHERE clause
    updateValues.push(id);

    const updateQuery = `
      UPDATE follow_ups 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, lead_id, follow_up_date, follow_up_type, status, notes, completed_at
    `;

    const result = await sql(updateQuery, updateValues);
    const updatedFollowUp = result[0];

    await auditLog({
      request,
      action: "follow_up.update",
      userId: user.id,
      username: user.username,
      resource: "follow_up",
      resourceId: id,
      changes: {
        fields: Object.keys(body).filter((field) => field !== "id"),
        status: updatedFollowUp.status,
      },
    });

    return Response.json({
      success: true,
      message: "Follow-up updated successfully",
      followUp: updatedFollowUp,
    });
  } catch (error) {
    console.error("Error updating follow-up:", error);
    return Response.json(
      { success: false, error: "Failed to update follow-up" },
      { status: 500 },
    );
  }
}

// DELETE /api/follow-ups - Delete a follow-up (ADMIN)
export async function DELETE(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasPermission(user, "customers.write")) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { success: false, error: "Follow-up ID is required" },
        { status: 400 },
      );
    }

    const deleted = await sql`
      DELETE FROM follow_ups
      WHERE id = ${id}
      RETURNING id, lead_id, follow_up_type, status
    `;
    if (!deleted.length) {
      return Response.json(
        { success: false, error: "Follow-up not found" },
        { status: 404 },
      );
    }

    await auditLog({
      request,
      action: "follow_up.delete",
      userId: user.id,
      username: user.username,
      resource: "follow_up",
      resourceId: id,
      changes: {
        lead_id: deleted[0].lead_id,
        follow_up_type: deleted[0].follow_up_type,
        status: deleted[0].status,
      },
    });

    return Response.json({
      success: true,
      message: "Follow-up deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting follow-up:", error);
    return Response.json(
      { success: false, error: "Failed to delete follow-up" },
      { status: 500 },
    );
  }
}
