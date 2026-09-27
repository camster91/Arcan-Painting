import { ensureCustomerForLead } from "@/app/api/utils/customers";

/**
 * Mark an estimate approved and create its job, once. Used by the owner's
 * Approve button and by the customer's Accept button on the public page.
 *
 * @param tx a transaction handle from sql.transaction
 * @returns { project, created } or { error, status }
 */
export async function approveEstimate(tx, estimateId, { projectName, acceptedName } = {}) {
  const [est] = await tx`
    SELECT id, lead_id, project_title, total_cost, status FROM estimates WHERE id = ${estimateId} FOR UPDATE
  `;
  if (!est) return { error: "Estimate not found", status: 404 };
  if (["rejected", "expired"].includes(est.status)) {
    return { error: `This estimate is ${est.status} and can't be accepted.`, status: 409 };
  }

  if (acceptedName) {
    await tx`
      UPDATE estimates SET status = 'approved', accepted_at = CURRENT_TIMESTAMP, accepted_name = ${acceptedName},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${estimateId}
    `;
  } else {
    await tx`UPDATE estimates SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ${estimateId}`;
  }
  if (est.lead_id) await ensureCustomerForLead(tx, est.lead_id);

  // Approving again (or accepting an already-approved estimate) reuses the job.
  const [existing] = await tx`SELECT id, project_name, status FROM projects WHERE estimate_id = ${estimateId} LIMIT 1`;
  if (existing) return { project: existing, created: false };

  const [project] = await tx`
    INSERT INTO projects (
      estimate_id, lead_id, project_name, status, final_cost, completion_percentage, created_at, updated_at
    ) VALUES (
      ${est.id}, ${est.lead_id}, ${projectName || est.project_title}, 'scheduled', ${est.total_cost || null}, 0,
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) RETURNING id, project_name, status
  `;
  return { project, created: true };
}
