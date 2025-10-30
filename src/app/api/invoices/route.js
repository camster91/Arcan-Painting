import sql from "@/app/api/utils/sql";
import { getCurrentUser, unauthorizedResponse } from "@/app/api/utils/auth";

// Generate invoice number
function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const timestamp = Date.now().toString().slice(-4);
  return `INV-${year}${month}${day}-${timestamp}`;
}

// GET /api/invoices - List invoices with filtering
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("payment_status");
    const leadId = searchParams.get("lead_id");
    const contractId = searchParams.get("contract_id");
    const projectId = searchParams.get("project_id");
    const overdue = searchParams.get("overdue") === "true";
    const limit = parseInt(searchParams.get("limit")) || 50;
    const offset = parseInt(searchParams.get("offset")) || 0;

    let query = `
      SELECT 
        i.*,
        l.name as client_name,
        l.email as client_email,
        l.phone as client_phone,
        c.contract_number,
        p.project_name,
        COUNT(ili.id) as line_items_count,
        COALESCE(SUM(payments.amount), 0) as total_paid
      FROM invoices i
      LEFT JOIN leads l ON i.lead_id = l.id
      LEFT JOIN contracts c ON i.contract_id = c.id
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN invoice_line_items ili ON i.id = ili.invoice_id
      LEFT JOIN payments ON i.id = payments.invoice_id AND payments.status = 'cleared'
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND i.status = $${paramCount}`;
      params.push(status);
    }

    if (paymentStatus) {
      paramCount++;
      query += ` AND i.payment_status = $${paramCount}`;
      params.push(paymentStatus);
    }

    if (leadId) {
      paramCount++;
      query += ` AND i.lead_id = $${paramCount}`;
      params.push(leadId);
    }

    if (contractId) {
      paramCount++;
      query += ` AND i.contract_id = $${paramCount}`;
      params.push(contractId);
    }

    if (projectId) {
      paramCount++;
      query += ` AND i.project_id = $${paramCount}`;
      params.push(projectId);
    }

    if (overdue) {
      query += ` AND i.due_date < CURRENT_DATE AND i.payment_status != 'paid'`;
    }

    query += ` 
      GROUP BY i.id, l.name, l.email, l.phone, c.contract_number, p.project_name
      ORDER BY i.created_at DESC 
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    params.push(limit, offset);

    const invoices = await sql(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(DISTINCT i.id) as total FROM invoices i WHERE 1=1`;
    const countParams = [];
    let countParamCount = 0;

    if (status) {
      countParamCount++;
      countQuery += ` AND i.status = $${countParamCount}`;
      countParams.push(status);
    }

    if (paymentStatus) {
      countParamCount++;
      countQuery += ` AND i.payment_status = $${countParamCount}`;
      countParams.push(paymentStatus);
    }

    if (leadId) {
      countParamCount++;
      countQuery += ` AND i.lead_id = $${countParamCount}`;
      countParams.push(leadId);
    }

    if (contractId) {
      countParamCount++;
      countQuery += ` AND i.contract_id = $${countParamCount}`;
      countParams.push(contractId);
    }

    if (projectId) {
      countParamCount++;
      countQuery += ` AND i.project_id = $${countParamCount}`;
      countParams.push(projectId);
    }

    if (overdue) {
      countQuery += ` AND i.due_date < CURRENT_DATE AND i.payment_status != 'paid'`;
    }

    const [{ total }] = await sql(countQuery, countParams);

    return Response.json({
      invoices,
      pagination: {
        total: parseInt(total),
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return Response.json(
      { error: "Failed to fetch invoices" },
      { status: 500 },
    );
  }
}

// POST /api/invoices - Create new invoice
export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const {
      contract_id,
      project_id,
      lead_id,
      title,
      description,
      invoice_type = "progress",
      tax_rate = 13.0, // Default HST for Ontario
      issue_date,
      due_date,
      line_items = [],
      notes,
    } = body;

    // Validation
    if (!title || !issue_date || !due_date) {
      return Response.json(
        {
          error: "Missing required fields: title, issue_date, due_date",
        },
        { status: 400 },
      );
    }

    if (!contract_id && !project_id && !lead_id) {
      return Response.json(
        {
          error:
            "At least one of contract_id, project_id, or lead_id is required",
        },
        { status: 400 },
      );
    }

    if (!line_items || line_items.length === 0) {
      return Response.json(
        {
          error: "At least one line item is required",
        },
        { status: 400 },
      );
    }

    // Calculate totals
    const subtotal = line_items.reduce((sum, item) => {
      return (
        sum + parseFloat(item.quantity || 1) * parseFloat(item.unit_price || 0)
      );
    }, 0);

    const tax_amount = (subtotal * parseFloat(tax_rate)) / 100;
    const total_amount = subtotal + tax_amount;
    const invoice_number = generateInvoiceNumber();

    // Create invoice and line items in a single transaction
    const results = await sql.transaction(async (txn) => {
      // Insert invoice
      const [invoice] = await txn`
        INSERT INTO invoices (
          invoice_number, contract_id, project_id, lead_id,
          title, description, invoice_type, subtotal, tax_rate,
          tax_amount, total_amount, amount_due, issue_date, due_date,
          created_by, notes
        ) VALUES (
          ${invoice_number}, ${contract_id}, ${project_id}, ${lead_id},
          ${title}, ${description}, ${invoice_type}, ${subtotal}, ${tax_rate},
          ${tax_amount}, ${total_amount}, ${total_amount}, ${issue_date}, ${due_date},
          ${user.username}, ${notes}
        ) RETURNING *
      `;

      // Insert line items with the invoice_id
      const lineItemResults = [];
      for (const item of line_items) {
        const line_total =
          parseFloat(item.quantity || 1) * parseFloat(item.unit_price || 0);
        const [lineItem] = await txn`
          INSERT INTO invoice_line_items (
            invoice_id, description, quantity, unit_price, line_total, category
          ) VALUES (
            ${invoice.id}, ${item.description}, ${item.quantity || 1}, 
            ${item.unit_price}, ${line_total}, ${item.category || null}
          ) RETURNING *
        `;
        lineItemResults.push(lineItem);
      }

      return { invoice, lineItems: lineItemResults };
    });

    return Response.json(
      {
        ...results.invoice,
        line_items: results.lineItems,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating invoice:", error);
    return Response.json(
      { error: "Failed to create invoice" },
      { status: 500 },
    );
  }
}
