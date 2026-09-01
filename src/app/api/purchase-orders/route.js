import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { generalLimiter } from "@/app/api/utils/rate-limit";
import { auditLog } from "@/app/api/utils/audit";
import {
  assertPurchaseTransition,
  validatePurchaseEvidence,
  validatePurchaseOrder,
} from "@/app/api/utils/purchase-order-domain";

const owner = (user) => user?.role === "owner";
const identifier = (value) =>
  Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;

export async function GET(request) {
  const limited = generalLimiter(request);
  if (limited) return limited;
  const user = await getCurrentUser(request);
  if (!owner(user))
    return Response.json({ error: "Owner access required" }, { status: 403 });
  const projectId = identifier(
    new URL(request.url).searchParams.get("project_id"),
  );
  if (!projectId)
    return Response.json(
      { error: "Valid project_id is required" },
      { status: 400 },
    );
  const orders =
    await sql`SELECT * FROM purchase_orders WHERE project_id = ${projectId} ORDER BY created_at DESC`;
  return Response.json({ purchase_orders: orders });
}

export async function POST(request) {
  const limited = generalLimiter(request);
  if (limited) return limited;
  const user = await getCurrentUser(request);
  if (!owner(user))
    return Response.json({ error: "Owner access required" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const projectId = identifier(body.project_id);
  if (!projectId)
    return Response.json(
      { error: "Valid project_id is required" },
      { status: 400 },
    );
  let data;
  try {
    data = validatePurchaseOrder(body);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  const [project] = await sql`SELECT id FROM projects WHERE id = ${projectId}`;
  if (!project)
    return Response.json({ error: "Project not found" }, { status: 404 });
  const number = `PO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const [order] =
    await sql`INSERT INTO purchase_orders (purchase_order_number, project_id, category, vendor, description, amount, tax_amount, total_amount, expected_on, created_by, created_by_name) VALUES (${number}, ${projectId}, ${data.category}, ${data.vendor}, ${data.description}, ${data.amount}, ${data.taxAmount}, ${data.totalAmount}, ${data.expectedOn}, ${user.id}, ${user.username}) RETURNING *`;
  await auditLog({
    request,
    action: "purchase_order.create",
    userId: user.id,
    username: user.username,
    resource: "purchase_order",
    resourceId: order.id,
    changes: { project_id: projectId, total_amount: order.total_amount },
    status: "success",
  });
  return Response.json({ purchase_order: order }, { status: 201 });
}

export async function PUT(request) {
  const limited = generalLimiter(request);
  if (limited) return limited;
  const user = await getCurrentUser(request);
  if (!owner(user))
    return Response.json({ error: "Owner access required" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const id = identifier(body.id);
  const next = body.status;
  if (!id || typeof next !== "string")
    return Response.json(
      { error: "Valid id and status are required" },
      { status: 400 },
    );
  let evidence;
  try {
    evidence = validatePurchaseEvidence(body);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  const result = await sql.transaction(async (txSql) => {
    const [existing] =
      await txSql`SELECT * FROM purchase_orders WHERE id = ${id} FOR UPDATE`;
    if (!existing) return { error: "Purchase order not found", status: 404 };
    try {
      assertPurchaseTransition(existing.status, next);
    } catch (error) {
      return { error: error.message, status: 409 };
    }
    let expenseId = existing.expense_id;
    if (next === "received") {
      const [expense] =
        await txSql`INSERT INTO project_expenses (project_id, category, description, vendor, amount, tax_amount, total_amount, incurred_on, receipt_url, recorded_by, recorded_by_name) VALUES (${existing.project_id}, ${existing.category}, ${existing.description}, ${existing.vendor}, ${existing.amount}, ${existing.tax_amount}, ${existing.total_amount}, CURRENT_DATE, ${evidence.receiptUrl}, ${user.id}, ${user.username}) RETURNING id`;
      expenseId = expense.id;
    }
    const [updated] =
      await txSql`UPDATE purchase_orders SET status = ${next}, order_reference = COALESCE(${evidence.reference}, order_reference), receipt_url = COALESCE(${evidence.receiptUrl}, receipt_url), expense_id = ${expenseId || null}, approved_at = CASE WHEN ${next} = 'approved' THEN CURRENT_TIMESTAMP ELSE approved_at END, ordered_at = CASE WHEN ${next} = 'ordered' THEN CURRENT_TIMESTAMP ELSE ordered_at END, received_at = CASE WHEN ${next} = 'received' THEN CURRENT_TIMESTAMP ELSE received_at END, cancelled_at = CASE WHEN ${next} = 'cancelled' THEN CURRENT_TIMESTAMP ELSE cancelled_at END, updated_at = CURRENT_TIMESTAMP WHERE id = ${id} RETURNING *`;
    return { order: updated, previous_status: existing.status };
  });
  if (result.error)
    return Response.json({ error: result.error }, { status: result.status });
  await auditLog({
    request,
    action: `purchase_order.${next}`,
    userId: user.id,
    username: user.username,
    resource: "purchase_order",
    resourceId: id,
    changes: {
      from: result.previous_status,
      to: next,
      expense_id: result.order.expense_id,
    },
    status: "success",
  });
  return Response.json({ purchase_order: result.order });
}
