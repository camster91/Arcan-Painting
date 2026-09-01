import sql from "@/app/api/utils/sql";
import { getCurrentUser, unauthorizedResponse } from "@/app/api/utils/auth";
import { generalLimiter } from "@/app/api/utils/rate-limit";
import { auditLog } from "@/app/api/utils/audit";

const transitions = {
  draft: new Set(["sent", "approved", "void"]),
  sent: new Set(["approved", "rejected", "void"]),
  approved: new Set(["void"]),
  rejected: new Set(["void"]),
  void: new Set(),
};

export function canTransitionChangeOrder(from, to) {
  return from === to || Boolean(transitions[from]?.has(to));
}

export function calculateChangeOrder(amount, taxRate) {
  const subtotal = Number(amount); const rate = Number(taxRate);
  if (!Number.isFinite(subtotal) || subtotal < 0) throw new Error("Amount must be non-negative");
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) throw new Error("Tax rate must be between 0 and 100");
  const taxAmount = subtotal * rate / 100;
  return { amount: subtotal, taxRate: rate, taxAmount, totalAmount: subtotal + taxAmount };
}

const number = () => `CO-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
const owner = (user) => user?.role === "owner";

export async function GET(request) {
  const limited = generalLimiter(request); if (limited) return limited;
  const user = await getCurrentUser(request); if (!user) return unauthorizedResponse();
  const projectId = Number(new URL(request.url).searchParams.get("project_id"));
  if (!Number.isInteger(projectId)) return Response.json({ error: "Valid project_id is required" }, { status: 400 });
  const rows = await sql`
    SELECT co.*, p.project_name, l.name AS client_name
    FROM change_orders co
    JOIN projects p ON co.project_id = p.id
    LEFT JOIN leads l ON co.lead_id = l.id
    WHERE co.project_id = ${projectId}
    ORDER BY co.created_at DESC
  `;
  return Response.json({ change_orders: rows });
}

export async function POST(request) {
  const limited = generalLimiter(request); if (limited) return limited;
  const user = await getCurrentUser(request); if (!owner(user)) return Response.json({ error: "Owner access required" }, { status: 403 });
  const body = await request.json().catch(() => ({})); const projectId = Number(body.project_id);
  if (!Number.isInteger(projectId) || !body.title?.trim() || !body.description?.trim()) return Response.json({ error: "Project, title, and description are required" }, { status: 400 });
  let totals;
  try { totals = calculateChangeOrder(body.amount, body.tax_rate ?? 13); }
  catch (error) { return Response.json({ error: error.message }, { status: 400 }); }
  const impact = Number(body.schedule_impact_days || 0);
  if (!Number.isInteger(impact) || impact < 0 || impact > 365) return Response.json({ error: "Schedule impact must be between 0 and 365 days" }, { status: 400 });
  const projects = await sql`SELECT id, lead_id FROM projects WHERE id = ${projectId}`;
  if (!projects.length) return Response.json({ error: "Project not found" }, { status: 404 });
  const [changeOrder] = await sql`
    INSERT INTO change_orders (
      change_order_number, project_id, lead_id, title, description, reason,
      amount, tax_rate, tax_amount, total_amount, schedule_impact_days,
      requested_by, notes
    ) VALUES (
      ${number()}, ${projectId}, ${projects[0].lead_id}, ${body.title.trim()},
      ${body.description.trim()}, ${body.reason || null}, ${totals.amount},
      ${totals.taxRate}, ${totals.taxAmount}, ${totals.totalAmount}, ${impact},
      ${user.username}, ${body.notes || null}
    ) RETURNING *
  `;
  await auditLog({ request, action: "change_order.create", userId: user.id, username: user.username, resource: "change_order", resourceId: changeOrder.id, changes: { project_id: projectId, total_amount: totals.totalAmount, schedule_impact_days: impact }, status: "success" });
  return Response.json({ change_order: changeOrder }, { status: 201 });
}

export async function PUT(request) {
  const user = await getCurrentUser(request); if (!owner(user)) return Response.json({ error: "Owner access required" }, { status: 403 });
  const body = await request.json().catch(() => ({})); const id = Number(body.id);
  if (!Number.isInteger(id)) return Response.json({ error: "Valid change order id is required" }, { status: 400 });

  const result = await sql.transaction(async (txn) => {
    const rows = await txn`SELECT * FROM change_orders WHERE id = ${id} FOR UPDATE`;
    if (!rows.length) return { error: "Change order not found", httpStatus: 404 };
    const current = rows[0]; const nextStatus = body.status || current.status;
    if (!canTransitionChangeOrder(current.status, nextStatus)) return { error: `Change order cannot move from ${current.status} to ${nextStatus}`, httpStatus: 409 };
    if (current.status !== "draft" && ["title", "description", "reason", "amount", "tax_rate", "schedule_impact_days"].some((key) => body[key] !== undefined)) {
      return { error: "Financial scope can only be edited while the change order is a draft", httpStatus: 409 };
    }
    let totals = { amount: Number(current.amount), taxRate: Number(current.tax_rate), taxAmount: Number(current.tax_amount), totalAmount: Number(current.total_amount) };
    try { totals = calculateChangeOrder(body.amount ?? current.amount, body.tax_rate ?? current.tax_rate); }
    catch (error) { return { error: error.message, httpStatus: 400 }; }
    const impact = Number(body.schedule_impact_days ?? current.schedule_impact_days);
    if (!Number.isInteger(impact) || impact < 0 || impact > 365) return { error: "Schedule impact must be between 0 and 365 days", httpStatus: 400 };

    const [updated] = await txn`
      UPDATE change_orders SET
        title = ${body.title?.trim() || current.title},
        description = ${body.description?.trim() || current.description},
        reason = ${body.reason ?? current.reason}, amount = ${totals.amount},
        tax_rate = ${totals.taxRate}, tax_amount = ${totals.taxAmount},
        total_amount = ${totals.totalAmount}, schedule_impact_days = ${impact},
        status = ${nextStatus}, notes = ${body.notes ?? current.notes},
        approved_by = CASE WHEN ${nextStatus} = 'approved' AND status <> 'approved' THEN ${user.username} ELSE approved_by END,
        approved_at = CASE WHEN ${nextStatus} = 'approved' AND status <> 'approved' THEN CURRENT_TIMESTAMP ELSE approved_at END,
        rejected_at = CASE WHEN ${nextStatus} = 'rejected' AND status <> 'rejected' THEN CURRENT_TIMESTAMP ELSE rejected_at END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} RETURNING *
    `;

    if (current.status !== "approved" && nextStatus === "approved") {
      await txn`
        UPDATE projects SET
          final_cost = COALESCE(final_cost, 0) + ${totals.totalAmount},
          end_date = CASE WHEN end_date IS NOT NULL THEN end_date + ${impact} ELSE end_date END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${current.project_id}
      `;
    } else if (current.status === "approved" && nextStatus === "void") {
      await txn`
        UPDATE projects SET
          final_cost = GREATEST(0, COALESCE(final_cost, 0) - ${Number(current.total_amount)}),
          end_date = CASE WHEN end_date IS NOT NULL THEN end_date - ${Number(current.schedule_impact_days)} ELSE end_date END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${current.project_id}
      `;
    }
    return { changeOrder: updated, previousStatus: current.status };
  });
  if (result.error) return Response.json({ error: result.error }, { status: result.httpStatus });
  await auditLog({ request, action: "change_order.update", userId: user.id, username: user.username, resource: "change_order", resourceId: id, changes: { from_status: result.previousStatus, to_status: result.changeOrder.status, total_amount: result.changeOrder.total_amount }, status: "success" });
  return Response.json({ change_order: result.changeOrder });
}
