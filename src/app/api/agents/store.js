/**
 * Agent runs store backed by the `agent_runs` table in Postgres.
 *
 * Replaces the original in-memory array. The API surface is identical
 * (logAgentRun / updateAgentRun / getAgentRuns / getAgentRun /
 * getAgentStats) so callers don't have to change.
 *
 * Times are returned to callers as Unix epoch milliseconds (not Date
 * objects) to match the original in-memory shape and avoid breaking the
 * admin UI which formats them with new Date(ms).
 */
import sql from "../utils/sql.js";

/**
 * Insert a new agent run. Returns a row shaped like the in-memory record
 * the admin UI used to see: numeric `id`, ms-epoch `started_at` /
 * `completed_at` / `duration_ms`, and `input` / `output` parsed from
 * JSONB.
 */
export async function logAgentRun(run) {
  const now = Date.now();
  const startedAt = run.started_at ? new Date(run.started_at) : new Date(now);
  const completedAt =
    run.status && run.status !== "running" && !run.completed_at
      ? new Date(now)
      : run.completed_at
        ? new Date(run.completed_at)
        : null;
  const durationMs =
    run.duration_ms != null
      ? run.duration_ms
      : completedAt
        ? completedAt.getTime() - startedAt.getTime()
        : null;

  const rows = await sql`
    INSERT INTO agent_runs (
      agent_id, agent_name, status, input, output, error,
      reference_type, reference_id, started_at, completed_at, duration_ms
    ) VALUES (
      ${run.agent_id},
      ${run.agent_name || run.agent_id},
      ${run.status || "running"},
      ${JSON.stringify(run.input || {})}::jsonb,
      ${run.output != null ? JSON.stringify(run.output) : null}::jsonb,
      ${run.error || null},
      ${run.reference_type || null},
      ${run.reference_id != null ? String(run.reference_id) : null},
      ${startedAt.toISOString()},
      ${completedAt ? completedAt.toISOString() : null},
      ${durationMs}
    )
    RETURNING *
  `;
  return rowToRecord(rows[0]);
}

/**
 * Update an existing run. Always sets completed_at / duration_ms when
 * status transitions out of "running".
 */
export async function updateAgentRun(id, updates) {
  if (!Number.isFinite(Number(id))) return null;
  const idNum = Number(id);
  const sets = [];
  const params = [];
  let i = 1;
  const push = (sql, val) => {
    sets.push(`${sql} = $${i++}`);
    params.push(val);
  };
  if (updates.status !== undefined) push("status", updates.status);
  if (updates.output !== undefined)
    push("output", updates.output != null ? JSON.stringify(updates.output) : null);
  if (updates.error !== undefined) push("error", updates.error || null);
  if (updates.agent_name !== undefined) push("agent_name", updates.agent_name);

  if (updates.status && updates.status !== "running" && !updates._skipCompletedAt) {
    push("completed_at", new Date().toISOString());
  }
  if (sets.length === 0) {
    const rows = await sql`SELECT * FROM agent_runs WHERE id = ${idNum}`;
    return rows[0] ? rowToRecord(rows[0]) : null;
  }
  params.push(idNum);
  const rows = await sql(
    `UPDATE agent_runs SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
    params,
  );
  if (!rows[0]) return null;
  // Recompute duration_ms when completed_at was just set.
  if (rows[0].started_at && rows[0].completed_at && rows[0].duration_ms == null) {
    const started = new Date(rows[0].started_at).getTime();
    const completed = new Date(rows[0].completed_at).getTime();
    const duration = completed - started;
    await sql`UPDATE agent_runs SET duration_ms = ${duration} WHERE id = ${idNum}`;
    rows[0].duration_ms = duration;
  }
  return rowToRecord(rows[0]);
}

export async function getAgentRuns(filters = {}) {
  const where = [];
  const params = [];
  let i = 1;
  if (filters.agent_id) {
    where.push(`agent_id = $${i++}`);
    params.push(filters.agent_id);
  }
  if (filters.status) {
    where.push(`status = $${i++}`);
    params.push(filters.status);
  }
  if (filters.since) {
    where.push(`started_at >= $${i++}`);
    params.push(new Date(Number(filters.since)).toISOString());
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const limit = Number(filters.limit) || 200;
  const rows = await sql(
    `SELECT * FROM agent_runs ${whereSql} ORDER BY started_at DESC LIMIT ${limit}`,
    params,
  );
  return rows.map(rowToRecord);
}

export async function getAgentRun(id) {
  if (!Number.isFinite(Number(id))) return null;
  const rows = await sql`SELECT * FROM agent_runs WHERE id = ${Number(id)}`;
  return rows[0] ? rowToRecord(rows[0]) : null;
}

export async function getAgentStats() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const rows = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(CASE WHEN status = 'success' THEN 1 END)::int AS success,
      COUNT(CASE WHEN status = 'failure' THEN 1 END)::int AS failure,
      COUNT(CASE WHEN status = 'running' THEN 1 END)::int AS running,
      ROUND(COALESCE(AVG(duration_ms), 0))::int AS avg_duration
    FROM agent_runs
    WHERE started_at >= ${todayStart.toISOString()}
  `;
  const r = rows[0] || {};
  const total = Number(r.total) || 0;
  const success = Number(r.success) || 0;
  return {
    total_runs_today: total,
    success_today: success,
    failure_today: Number(r.failure) || 0,
    running_today: Number(r.running) || 0,
    success_rate: total > 0 ? Math.round((success / total) * 100) : 0,
    avg_duration_ms: Number(r.avg_duration) || 0,
  };
}

/**
 * Convert a raw DB row into the shape the in-memory store used to return
 * and the admin UI still expects: ms-epoch timestamps, parsed JSON, etc.
 */
function rowToRecord(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    agent_id: row.agent_id,
    agent_name: row.agent_name || row.agent_id,
    status: row.status,
    input: row.input || {},
    output: row.output || null,
    error: row.error || null,
    reference_type: row.reference_type || null,
    reference_id: row.reference_id != null ? String(row.reference_id) : null,
    started_at: row.started_at ? new Date(row.started_at).getTime() : null,
    completed_at: row.completed_at ? new Date(row.completed_at).getTime() : null,
    duration_ms: row.duration_ms != null ? Number(row.duration_ms) : null,
  };
}
