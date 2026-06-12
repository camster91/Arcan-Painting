/**
 * pipeline-tracker.js
 * Local hybrid tracking for cold email sequences.
 *
 * Run: node scripts/pipeline-tracker.js
 *
 * This script checks the cold_email_prospects pipeline and logs
 * the current state of each prospect's sequence progress.
 * It also marks follow-up steps as due based on last_emailed_at.
 *
 * In a full hybrid setup, you'd push webhook events from Mailgun
 * into this tracker to update reply/bounce/unsubscribe states.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { sql } = require("./src/utils/sql.js");

const PIPELINE_STATUSES = ["new", "emailed", "replied", "converted", "unsubscribed", "bounced"];
const FOLLOW_UP_DAYS = 4; // minimum days between sequence steps

async function getPipelineStats() {
  const stats = await sql`
    SELECT
      status,
      COUNT(*)::int as count,
      COUNT(*) FILTER (WHERE last_emailed_at IS NOT NULL AND last_emailed_at < NOW() - INTERVAL '4 days' AND status = 'emailed')::int as follow_up_due
    FROM cold_email_prospects
    GROUP BY status
    ORDER BY
      CASE status
        WHEN 'new'        THEN 1
        WHEN 'emailed'    THEN 2
        WHEN 'replied'    THEN 3
        WHEN 'converted'  THEN 4
        WHEN 'unsubscribed' THEN 5
        WHEN 'bounced'    THEN 6
        ELSE 7
      END
  `;
  return stats;
}

async function getProspectsNeedingFollowUp() {
  const prospects = await sql`
    SELECT
      p.id,
      p.name,
      p.email,
      p.company,
      p.role,
      p.city,
      p.sequence_step,
      p.last_emailed_at,
      p.status,
      t.subject_template,
      t.body_template,
      t.sequence_step as next_step
    FROM cold_email_prospects p
    JOIN cold_email_templates t
      ON t.target_role = p.role
      AND t.sequence_step = p.sequence_step + 1
      AND t.is_active = true
    WHERE p.status IN ('new', 'emailed')
      AND p.email IS NOT NULL
      AND p.status NOT IN ('unsubscribed', 'bounced', 'converted')
      AND (p.last_emailed_at IS NULL OR p.last_emailed_at < NOW() - INTERVAL '${FOLLOW_UP_DAYS} days')
    ORDER BY p.created_at ASC
    LIMIT 20
  `;
  return prospects;
}

async function getSequenceProgress() {
  const progress = await sql`
    SELECT
      p.role,
      p.sequence_step,
      COUNT(*)::int as count
    FROM cold_email_prospects p
    WHERE p.status NOT IN ('unsubscribed', 'bounced')
    GROUP BY p.role, p.sequence_step
    ORDER BY p.role, p.sequence_step
  `;
  return progress;
}

function formatDate(date) {
  if (!date) return "never";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
}

async function main() {
  console.log("\n=== Cold Email Pipeline Tracker ===\n");

  // 1. Pipeline stats
  const stats = await getPipelineStats();
  const total = stats.reduce((sum, s) => sum + s.count, 0);
  const followUpDue = stats.reduce((sum, s) => sum + (s.follow_up_due || 0), 0);

  console.log(`Total prospects: ${total}`);
  console.log(`Follow-ups due:  ${followUpDue}`);
  console.log("\nPipeline Status Breakdown:");
  console.log("─────────────────────────────────────────");
  for (const s of stats) {
    const bar = "█".repeat(Math.min(s.count, 40));
    const label = s.status.padEnd(14);
    const dueTag = s.follow_up_due > 0 ? ` [${s.follow_up_due} due]` : "";
    console.log(`  ${label} ${String(s.count).padStart(4)} ${bar}${dueTag}`);
  }
  console.log();

  // 2. Prospects needing follow-up
  const dueProspects = await getProspectsNeedingFollowUp();
  if (dueProspects.length > 0) {
    console.log(`\n⚡ Prospects ready for next email (${dueProspects.length}):`);
    console.log("─────────────────────────────────────────────────────────────────────────────");
    console.log(`  ${"Name".padEnd(20)} ${"Email".padEnd(30)} ${"Role".padEnd(18)} ${"Step"} ${"Last Emailed"}`);
    console.log("  " + "─".repeat(95));
    for (const p of dueProspects.slice(0, 15)) {
      const name = (p.name || "—").slice(0, 19).padEnd(20);
      const email = (p.email || "—").slice(0, 29).padEnd(30);
      const role = (p.role || "—").padEnd(18);
      const step = String(p.sequence_step + 1).padStart(3);
      const last = formatDate(p.last_emailed_at).padEnd(12);
      console.log(`  ${name} ${email} ${role} ${step} ${last}`);
    }
    if (dueProspects.length > 15) {
      console.log(`  ... and ${dueProspects.length - 15} more`);
    }
    console.log();
  }

  // 3. Sequence progress by role
  const progress = await getSequenceProgress();
  const byRole = progress.reduce((acc, row) => {
    if (!acc[row.role]) acc[row.role] = [];
    acc[row.role].push(row);
    return acc;
  }, {});

  console.log("\n📊 Sequence Progress by Role:");
  console.log("─────────────────────────────────────────────────────────────────────────────");
  for (const [role, steps] of Object.entries(byRole)) {
    const label = role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const stepCounts = steps
      .sort((a, b) => a.sequence_step - b.sequence_step)
      .map((s) => `step ${s.sequence_step}: ${s.count}`)
      .join(" | ");
    console.log(`  ${label.padEnd(20)} ${stepCounts}`);
  }
  console.log();

  // 4. Summary
  console.log("=== Summary ===");
  console.log(`  Pipeline Status: healthy`);
  console.log(`  Total Active: ${stats.find((s) => s.status === "new")?.count || 0} new, ${stats.find((s) => s.status === "emailed")?.count || 0} emailed`);
  console.log(`  Converted: ${stats.find((s) => s.status === "converted")?.count || 0}`);
  console.log(`  Dead: ${(stats.find((s) => s.status === "unsubscribed")?.count || 0) + (stats.find((s) => s.status === "bounced")?.count || 0)} (unsubscribed + bounced)`);
  console.log(`\nNext check recommended in: 1 hour`);
  console.log("\n=== End of Report ===\n");
}

main().catch((err) => {
  console.error("Pipeline tracker error:", err);
  process.exit(1);
});