import { getCurrentUser } from "../../utils/auth.js";
import sql from "../../utils/sql.js";

// GET /api/marketing/workflows — list all workflow skills with run stats
export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const category = url.searchParams.get("category");

  let skills;
  if (category) {
    skills = await sql`
      SELECT ws.*,
        (SELECT COUNT(*)::int FROM workflow_runs wr WHERE wr.skill_id = ws.id) AS total_runs,
        (SELECT COUNT(*)::int FROM workflow_runs wr WHERE wr.skill_id = ws.id AND wr.status = 'failed') AS failed_runs
      FROM workflow_skills ws
      WHERE ws.category = ${category}
      ORDER BY ws.category, ws.name
    `;
  } else {
    skills = await sql`
      SELECT ws.*,
        (SELECT COUNT(*)::int FROM workflow_runs wr WHERE wr.skill_id = ws.id) AS total_runs,
        (SELECT COUNT(*)::int FROM workflow_runs wr WHERE wr.skill_id = ws.id AND wr.status = 'failed') AS failed_runs
      FROM workflow_skills ws
      ORDER BY ws.category, ws.name
    `;
  }

  return Response.json({ skills });
}

// PATCH /api/marketing/workflows — toggle is_active for a skill
export async function PATCH(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, is_active } = await request.json();
  if (!id || typeof is_active !== "boolean") {
    return Response.json({ error: "id and is_active (boolean) required" }, { status: 400 });
  }

  const result = await sql`
    UPDATE workflow_skills
    SET is_active = ${is_active}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  if (result.length === 0) {
    return Response.json({ error: "Skill not found" }, { status: 404 });
  }

  return Response.json({ skill: result[0] });
}

// POST /api/marketing/workflows — manually trigger a skill
export async function POST(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { skillId, triggerData = {} } = await request.json();
  if (!skillId) {
    return Response.json({ error: "skillId required" }, { status: 400 });
  }

  const skills = await sql`SELECT * FROM workflow_skills WHERE id = ${skillId}`;
  if (skills.length === 0) {
    return Response.json({ error: "Skill not found" }, { status: 404 });
  }

  const skill = skills[0];
  const actions = skill.actions || [];
  const stepsTotal = actions.length;

  // Create workflow run record
  const runs = await sql`
    INSERT INTO workflow_runs (skill_id, trigger_data, status, steps_total)
    VALUES (${skillId}, ${JSON.stringify(triggerData)}, 'running', ${stepsTotal})
    RETURNING *
  `;
  const run = runs[0];

  // Simulate executing each action step
  try {
    for (let i = 0; i < actions.length; i++) {
      await sql`
        UPDATE workflow_runs
        SET steps_completed = ${i + 1}
        WHERE id = ${run.id}
      `;
    }

    // Mark completed
    await sql`
      UPDATE workflow_runs
      SET status = 'completed', completed_at = NOW(), steps_completed = ${stepsTotal},
          result = ${JSON.stringify({ message: "All steps completed successfully", steps: actions.map(a => a.type) })}
      WHERE id = ${run.id}
    `;

    // Update skill run stats
    await sql`
      UPDATE workflow_skills
      SET run_count = run_count + 1, last_run_at = NOW(), updated_at = NOW()
      WHERE id = ${skillId}
    `;

    return Response.json({
      run: { ...run, status: "completed", steps_completed: stepsTotal },
      message: "Workflow completed successfully",
    });
  } catch (err) {
    await sql`
      UPDATE workflow_runs
      SET status = 'failed', completed_at = NOW(), error_message = ${err.message}
      WHERE id = ${run.id}
    `;

    return Response.json(
      { error: "Workflow execution failed", details: err.message },
      { status: 500 }
    );
  }
}
