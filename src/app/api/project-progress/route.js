import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get("project_id");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    let whereConditions = [];
    let params = [];
    let paramCount = 0;

    if (project_id) {
      paramCount++;
      whereConditions.push(`pp.project_id = $${paramCount}`);
      params.push(parseInt(project_id));
    }

    if (start_date && end_date) {
      paramCount++;
      whereConditions.push(`DATE(pp.report_date) >= $${paramCount}`);
      params.push(start_date);
      paramCount++;
      whereConditions.push(`DATE(pp.report_date) <= $${paramCount}`);
      params.push(end_date);
    }

    const whereClause =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";

    const progressReports = await sql(
      `
      SELECT 
        pp.*,
        p.project_name,
        tm.name as reported_by_name
      FROM project_progress pp
      JOIN projects p ON pp.project_id = p.id
      LEFT JOIN team_members tm ON pp.reported_by = tm.id
      ${whereClause}
      ORDER BY pp.report_date DESC, pp.created_at DESC
    `,
      params,
    );

    return Response.json({ progressReports });
  } catch (error) {
    console.error("Error fetching project progress:", error);
    return Response.json(
      { error: "Failed to fetch project progress" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      project_id,
      report_date,
      work_description,
      progress_percentage,
      hours_worked,
      team_members_present,
      materials_used,
      challenges_faced,
      next_steps,
      weather_conditions,
      client_interaction,
      quality_notes,
      photos = [],
      reported_by,
      is_milestone = false,
      milestone_description,
    } = body;

    if (!project_id || !report_date || !work_description) {
      return Response.json(
        {
          error: "Project ID, report date, and work description are required",
        },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO project_progress (
        project_id, report_date, work_description, progress_percentage,
        hours_worked, team_members_present, materials_used, challenges_faced,
        next_steps, weather_conditions, client_interaction, quality_notes,
        photos, reported_by, is_milestone, milestone_description
      ) VALUES (
        ${project_id}, ${report_date}, ${work_description}, ${progress_percentage},
        ${hours_worked}, ${team_members_present}, ${materials_used}, ${challenges_faced},
        ${next_steps}, ${weather_conditions}, ${client_interaction}, ${quality_notes},
        ${JSON.stringify(photos)}, ${reported_by}, ${is_milestone}, ${milestone_description}
      )
      RETURNING *
    `;

    // Update project completion percentage if provided
    if (progress_percentage !== null && progress_percentage !== undefined) {
      await sql`
        UPDATE projects 
        SET completion_percentage = ${progress_percentage},
            last_progress_update = CURRENT_TIMESTAMP,
            progress_notes = ${work_description}
        WHERE id = ${project_id}
      `;
    }

    // Get project and client details for notification
    const projectDetails = await sql`
      SELECT p.*, l.name as client_name, l.email as client_email
      FROM projects p
      LEFT JOIN leads l ON p.lead_id = l.id
      WHERE p.id = ${project_id}
    `;

    // Send notification to client if significant progress or milestone
    if (
      projectDetails.length > 0 &&
      (is_milestone || progress_percentage >= 25)
    ) {
      const project = projectDetails[0];

      if (project.client_email) {
        try {
          await fetch(`${process.env.APP_URL}/api/notifications`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "project",
              title: is_milestone
                ? "Project Milestone Reached"
                : "Project Progress Update",
              message: is_milestone
                ? `Great news! We've reached a milestone on your project: ${milestone_description}`
                : `Your painting project is ${progress_percentage}% complete. Today's work: ${work_description}`,
              email: project.client_email,
              related_id: project_id,
              related_type: "project",
              send_email: true,
              data: {
                project_name: project.project_name,
                progress_percentage,
                photos: photos.slice(0, 3), // Include up to 3 photos in email
              },
            }),
          });
        } catch (notificationError) {
          console.error(
            "Error sending progress notification:",
            notificationError,
          );
        }
      }
    }

    return Response.json({ progressReport: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating progress report:", error);
    return Response.json(
      { error: "Failed to create progress report" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return Response.json(
        { error: "Progress report ID is required" },
        { status: 400 },
      );
    }

    const allowedFields = [
      "work_description",
      "progress_percentage",
      "hours_worked",
      "team_members_present",
      "materials_used",
      "challenges_faced",
      "next_steps",
      "weather_conditions",
      "client_interaction",
      "quality_notes",
      "photos",
      "is_milestone",
      "milestone_description",
    ];

    const setClause = [];
    const values = [];
    let paramCount = 0;

    Object.entries(updateFields).forEach(([field, value]) => {
      if (allowedFields.includes(field) && value !== undefined) {
        paramCount++;
        if (field === "photos") {
          setClause.push(`${field} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          setClause.push(`${field} = $${paramCount}`);
          values.push(value);
        }
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
      UPDATE project_progress 
      SET ${setClause.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await sql(query, values);

    if (result.length === 0) {
      return Response.json(
        { error: "Progress report not found" },
        { status: 404 },
      );
    }

    return Response.json({ progressReport: result[0] });
  } catch (error) {
    console.error("Error updating progress report:", error);
    return Response.json(
      { error: "Failed to update progress report" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { error: "Progress report ID is required" },
        { status: 400 },
      );
    }

    const result = await sql`
      DELETE FROM project_progress
      WHERE id = ${parseInt(id)}
      RETURNING id
    `;

    if (result.length === 0) {
      return Response.json(
        { error: "Progress report not found" },
        { status: 404 },
      );
    }

    return Response.json({ message: "Progress report deleted successfully" });
  } catch (error) {
    console.error("Error deleting progress report:", error);
    return Response.json(
      { error: "Failed to delete progress report" },
      { status: 500 },
    );
  }
}
