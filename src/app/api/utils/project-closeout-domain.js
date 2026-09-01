export const DEFAULT_CLOSEOUT_STEPS = [
  ["Final walkthrough completed", "Record the customer walkthrough and any agreed follow-up.", 10],
  ["Punch list resolved", "Confirm all required touch-ups and quality items are closed.", 20],
  ["Completion photos uploaded", "Attach customer-safe completion evidence to the final progress report.", 30],
  ["Care instructions delivered", "Provide coating, cure-time, cleaning, and touch-up guidance.", 40],
];

export function validateProjectCloseout({ completionPercentage, requiredSteps, incompleteRequiredSteps, openIssues, activeTimers }) {
  if (Number(completionPercentage) !== 100) return "Set project completion to 100% before closeout";
  if (Number(requiredSteps) < 1) return "Add and complete a required closeout checklist before completion";
  if (Number(incompleteRequiredSteps) > 0) return `${incompleteRequiredSteps} required closeout step(s) remain incomplete`;
  if (Number(openIssues) > 0) return `${openIssues} site issue(s) must be resolved or voided before completion`;
  if (Number(activeTimers) > 0) return `${activeTimers} active crew timer(s) must be clocked out before completion`;
  return null;
}

export async function seedProjectCloseout(sql, projectId) {
  await sql`
    INSERT INTO completion_workflows (project_id, step_title, step_description, step_order, is_required)
    SELECT ${projectId}, seed.step_title, seed.step_description, seed.step_order, TRUE
    FROM (VALUES
      (${DEFAULT_CLOSEOUT_STEPS[0][0]}, ${DEFAULT_CLOSEOUT_STEPS[0][1]}, ${DEFAULT_CLOSEOUT_STEPS[0][2]}),
      (${DEFAULT_CLOSEOUT_STEPS[1][0]}, ${DEFAULT_CLOSEOUT_STEPS[1][1]}, ${DEFAULT_CLOSEOUT_STEPS[1][2]}),
      (${DEFAULT_CLOSEOUT_STEPS[2][0]}, ${DEFAULT_CLOSEOUT_STEPS[2][1]}, ${DEFAULT_CLOSEOUT_STEPS[2][2]}),
      (${DEFAULT_CLOSEOUT_STEPS[3][0]}, ${DEFAULT_CLOSEOUT_STEPS[3][1]}, ${DEFAULT_CLOSEOUT_STEPS[3][2]})
    ) AS seed(step_title, step_description, step_order)
    WHERE NOT EXISTS (
      SELECT 1 FROM completion_workflows existing
      WHERE existing.project_id = ${projectId} AND existing.step_title = seed.step_title
    )
  `;
}
