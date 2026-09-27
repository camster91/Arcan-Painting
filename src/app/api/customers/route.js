import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { auditLog } from "@/app/api/utils/audit";

const isAdmin = (user) => user && ["owner", "admin"].includes(user.role);

// GET            → list, with job count and money totals per customer (?search=)
// GET ?id=12     → one customer with their leads, estimates, jobs, invoices and payments
export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!isAdmin(user)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(request.url);
    const id = parseInt(url.searchParams.get("id"), 10);
    if (id) return Response.json(await customerDetail(id));

    const search = (url.searchParams.get("search") || "").trim().toLowerCase();
    const like = `%${search}%`;
    const customers = await sql`
      SELECT c.*,
        (SELECT COUNT(*) FROM projects p JOIN leads l ON p.lead_id = l.id WHERE l.customer_id = c.id) AS job_count,
        (SELECT COALESCE(SUM(i.total_amount), 0) FROM invoices i JOIN leads l ON i.lead_id = l.id
          WHERE l.customer_id = c.id AND i.status <> 'cancelled') AS invoiced_total,
        (SELECT COALESCE(SUM(i.amount_due), 0) FROM invoices i JOIN leads l ON i.lead_id = l.id
          WHERE l.customer_id = c.id AND i.status <> 'cancelled') AS balance_due
      FROM customers c
      WHERE ${search} = ''
        OR LOWER(c.name) LIKE ${like} OR LOWER(COALESCE(c.email, '')) LIKE ${like} OR COALESCE(c.phone, '') LIKE ${like}
      ORDER BY c.name
      LIMIT 500
    `;
    return Response.json({ customers });
  } catch (error) {
    console.error("Error loading customers:", error);
    return Response.json({ error: "Failed to load customers" }, { status: 500 });
  }
}

async function customerDetail(id) {
  const [customer] = await sql`SELECT * FROM customers WHERE id = ${id}`;
  if (!customer) return { customer: null };
  const leads = await sql`
    SELECT id, name, email, phone, status, service_type, lead_source, created_at
    FROM leads WHERE customer_id = ${id} AND deleted_at IS NULL ORDER BY created_at DESC
  `;
  const estimates = await sql`
    SELECT id, estimate_number, project_title, total_cost, status, created_at
    FROM estimates WHERE lead_id IN (SELECT id FROM leads WHERE customer_id = ${id}) ORDER BY created_at DESC
  `;
  const projects = await sql`
    SELECT id, project_name, status, start_date, end_date, estimate_id
    FROM projects WHERE lead_id IN (SELECT id FROM leads WHERE customer_id = ${id}) ORDER BY created_at DESC
  `;
  const invoices = await sql`
    SELECT id, invoice_number, title, invoice_type, status, payment_status, total_amount, amount_due, due_date, project_id
    FROM invoices WHERE lead_id IN (SELECT id FROM leads WHERE customer_id = ${id}) ORDER BY created_at DESC
  `;
  const payments = await sql`
    SELECT p.id, p.payment_number, p.amount, p.payment_method, p.payment_date, p.status, p.invoice_id
    FROM payments p JOIN invoices i ON p.invoice_id = i.id
    WHERE i.lead_id IN (SELECT id FROM leads WHERE customer_id = ${id}) ORDER BY p.payment_date DESC
  `;
  return { customer, leads, estimates, projects, invoices, payments };
}

// PUT { id, name?, email?, phone?, address?, notes? }
export async function PUT(request) {
  const user = await getCurrentUser(request);
  if (!isAdmin(user)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const id = parseInt(body.id, 10);
    if (!id) return Response.json({ error: "Customer id is required" }, { status: 400 });
    if (body.name !== undefined && !String(body.name).trim()) {
      return Response.json({ error: "Name can't be empty" }, { status: 400 });
    }
    const pick = (key) => (body[key] === undefined ? null : String(body[key]).trim().slice(0, key === "address" || key === "notes" ? 5000 : 255));
    const [customer] = await sql`
      UPDATE customers SET
        name = COALESCE(${pick("name")}, name),
        email = COALESCE(${pick("email")?.toLowerCase() ?? null}, email),
        phone = COALESCE(${pick("phone")}, phone),
        address = COALESCE(${pick("address")}, address),
        notes = COALESCE(${pick("notes")}, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    if (!customer) return Response.json({ error: "Customer not found" }, { status: 404 });
    await auditLog({ request, action: "customer.update", userId: user.id, username: user.username, resource: "customer", resourceId: id, changes: body, status: "success" });
    return Response.json({ customer });
  } catch (error) {
    console.error("Error updating customer:", error);
    return Response.json({ error: "Failed to update customer" }, { status: 500 });
  }
}
