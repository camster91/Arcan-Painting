import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// GET /api/payments - List payments with filtering or get single payment
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // If ID is provided, get single payment
    if (id) {
      const payments = await sql`
        SELECT 
          p.*,
          i.invoice_number,
          i.title as invoice_title,
          i.total_amount as invoice_total,
          c.contract_number,
          c.title as contract_title,
          l.name as client_name
        FROM payments p
        LEFT JOIN invoices i ON p.invoice_id = i.id
        LEFT JOIN contracts c ON p.contract_id = c.id
        LEFT JOIN leads l ON i.lead_id = l.id OR c.lead_id = l.id
        WHERE p.id = ${id}
      `;

      if (payments.length === 0) {
        return Response.json({ error: "Payment not found" }, { status: 404 });
      }

      return Response.json(payments[0]);
    }

    // List payments with filtering
    const invoiceId = searchParams.get("invoice_id");
    const contractId = searchParams.get("contract_id");
    const paymentMethod = searchParams.get("payment_method");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const limit = parseInt(searchParams.get("limit")) || 50;
    const offset = parseInt(searchParams.get("offset")) || 0;

    let query = `
      SELECT 
        p.*,
        i.invoice_number,
        i.title as invoice_title,
        i.total_amount as invoice_total,
        c.contract_number,
        c.title as contract_title,
        l.name as client_name
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN contracts c ON p.contract_id = c.id
      LEFT JOIN leads l ON i.lead_id = l.id OR c.lead_id = l.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (invoiceId) {
      paramCount++;
      query += ` AND p.invoice_id = $${paramCount}`;
      params.push(invoiceId);
    }

    if (contractId) {
      paramCount++;
      query += ` AND p.contract_id = $${paramCount}`;
      params.push(contractId);
    }

    if (paymentMethod) {
      paramCount++;
      query += ` AND p.payment_method = $${paramCount}`;
      params.push(paymentMethod);
    }

    if (status) {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
    }

    if (dateFrom) {
      paramCount++;
      query += ` AND p.payment_date >= $${paramCount}`;
      params.push(dateFrom);
    }

    if (dateTo) {
      paramCount++;
      query += ` AND p.payment_date <= $${paramCount}`;
      params.push(dateTo);
    }

    query += ` ORDER BY p.payment_date DESC, p.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const payments = await sql(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM payments p WHERE 1=1`;
    const countParams = [];
    let countParamCount = 0;

    if (invoiceId) {
      countParamCount++;
      countQuery += ` AND p.invoice_id = $${countParamCount}`;
      countParams.push(invoiceId);
    }

    if (contractId) {
      countParamCount++;
      countQuery += ` AND p.contract_id = $${countParamCount}`;
      countParams.push(contractId);
    }

    if (paymentMethod) {
      countParamCount++;
      countQuery += ` AND p.payment_method = $${countParamCount}`;
      countParams.push(paymentMethod);
    }

    if (status) {
      countParamCount++;
      countQuery += ` AND p.status = $${countParamCount}`;
      countParams.push(status);
    }

    if (dateFrom) {
      countParamCount++;
      countQuery += ` AND p.payment_date >= $${countParamCount}`;
      countParams.push(dateFrom);
    }

    if (dateTo) {
      countParamCount++;
      countQuery += ` AND p.payment_date <= $${countParamCount}`;
      countParams.push(dateTo);
    }

    const [{ total }] = await sql(countQuery, countParams);

    // If no limit was specified, return simple array for admin page
    if (!searchParams.get("limit")) {
      return Response.json(payments);
    }

    return Response.json({
      payments,
      pagination: {
        total: parseInt(total),
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return Response.json(
      { error: "Failed to fetch payments" },
      { status: 500 },
    );
  }
}

// POST /api/payments - Record new payment
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      invoice_id,
      contract_id,
      payment_method,
      payment_reference,
      amount,
      payment_date,
      status = "pending",
      notes,
      processed_by,
    } = body;

    // Validation
    if (!payment_method || !amount || !payment_date) {
      return Response.json(
        {
          error:
            "Missing required fields: payment_method, amount, payment_date",
        },
        { status: 400 },
      );
    }

    if (
      !["cash", "check", "card", "bank_transfer", "other"].includes(
        payment_method,
      )
    ) {
      return Response.json(
        { error: "Invalid payment method" },
        { status: 400 },
      );
    }

    if (!["pending", "cleared", "failed", "refunded"].includes(status)) {
      return Response.json(
        { error: "Invalid payment status" },
        { status: 400 },
      );
    }

    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0) {
      return Response.json(
        {
          error: "Payment amount must be greater than 0",
        },
        { status: 400 },
      );
    }

    // Verify invoice and contract exist if provided
    if (invoice_id) {
      const invoiceExists =
        await sql`SELECT id FROM invoices WHERE id = ${invoice_id}`;
      if (invoiceExists.length === 0) {
        return Response.json({ error: "Invoice not found" }, { status: 400 });
      }
    }

    if (contract_id) {
      const contractExists =
        await sql`SELECT id FROM contracts WHERE id = ${contract_id}`;
      if (contractExists.length === 0) {
        return Response.json({ error: "Contract not found" }, { status: 400 });
      }
    }

    // Start transaction to update payment and invoice status
    const paymentQueries = [
      sql`
        INSERT INTO payments (
          invoice_id, contract_id, payment_method, payment_reference,
          amount, payment_date, status, notes, processed_by
        ) VALUES (
          ${invoice_id || null}, ${contract_id || null}, ${payment_method}, ${payment_reference || null},
          ${paymentAmount}, ${payment_date}, ${status}, ${notes || null},
          ${processed_by || session.user.username || session.user.email}
        ) RETURNING *
      `,
    ];

    // If payment is for an invoice, update invoice payment status
    if (invoice_id) {
      paymentQueries.push(
        sql`
          UPDATE invoices 
          SET 
            amount_paid = COALESCE((
              SELECT SUM(amount) 
              FROM payments 
              WHERE invoice_id = ${invoice_id} AND status IN ('cleared', 'pending')
            ), 0),
            payment_status = CASE 
              WHEN COALESCE((
                SELECT SUM(amount) 
                FROM payments 
                WHERE invoice_id = ${invoice_id} AND status IN ('cleared', 'pending')
              ), 0) >= total_amount THEN 'paid'
              WHEN COALESCE((
                SELECT SUM(amount) 
                FROM payments 
                WHERE invoice_id = ${invoice_id} AND status IN ('cleared', 'pending')
              ), 0) > 0 THEN 'partial'
              ELSE 'unpaid'
            END,
            amount_due = total_amount - COALESCE((
              SELECT SUM(amount) 
              FROM payments 
              WHERE invoice_id = ${invoice_id} AND status IN ('cleared', 'pending')
            ), 0),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${invoice_id}
          RETURNING *
        `,
      );
    }

    const [payment, updatedInvoice] = await sql.transaction(paymentQueries);

    return Response.json(
      {
        payment,
        updated_invoice: updatedInvoice || null,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error recording payment:", error);
    return Response.json(
      { error: "Failed to record payment" },
      { status: 500 },
    );
  }
}

// PUT /api/payments - Update payment
export async function PUT(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      payment_method,
      payment_reference,
      amount,
      payment_date,
      status,
      notes,
      processed_by,
    } = body;

    if (!id) {
      return Response.json(
        { error: "Payment ID is required" },
        { status: 400 },
      );
    }

    // Check if payment exists
    const existingPayment = await sql`SELECT * FROM payments WHERE id = ${id}`;
    if (existingPayment.length === 0) {
      return Response.json({ error: "Payment not found" }, { status: 404 });
    }

    // Validation
    if (
      payment_method &&
      !["cash", "check", "card", "bank_transfer", "other"].includes(
        payment_method,
      )
    ) {
      return Response.json(
        { error: "Invalid payment method" },
        { status: 400 },
      );
    }

    if (
      status &&
      !["pending", "cleared", "failed", "refunded"].includes(status)
    ) {
      return Response.json(
        { error: "Invalid payment status" },
        { status: 400 },
      );
    }

    if (amount !== undefined) {
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return Response.json(
          { error: "Amount must be a positive number" },
          { status: 400 },
        );
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (payment_method !== undefined) {
      updateFields.push(`payment_method = $${paramCount}`);
      updateValues.push(payment_method);
      paramCount++;
    }
    if (payment_reference !== undefined) {
      updateFields.push(`payment_reference = $${paramCount}`);
      updateValues.push(payment_reference);
      paramCount++;
    }
    if (amount !== undefined) {
      updateFields.push(`amount = $${paramCount}`);
      updateValues.push(parseFloat(amount));
      paramCount++;
    }
    if (payment_date !== undefined) {
      updateFields.push(`payment_date = $${paramCount}`);
      updateValues.push(payment_date);
      paramCount++;
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount}`);
      updateValues.push(status);
      paramCount++;
    }
    if (notes !== undefined) {
      updateFields.push(`notes = $${paramCount}`);
      updateValues.push(notes);
      paramCount++;
    }
    if (processed_by !== undefined) {
      updateFields.push(`processed_by = $${paramCount}`);
      updateValues.push(processed_by);
      paramCount++;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    const updateQuery = `
      UPDATE payments 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const [payment] = await sql(updateQuery, updateValues);

    // If payment amount or status changed and it's linked to an invoice, update invoice totals
    if ((amount !== undefined || status !== undefined) && payment.invoice_id) {
      await sql`
        UPDATE invoices 
        SET 
          amount_paid = COALESCE((
            SELECT SUM(amount) 
            FROM payments 
            WHERE invoice_id = ${payment.invoice_id} AND status IN ('cleared', 'pending')
          ), 0),
          payment_status = CASE 
            WHEN COALESCE((
              SELECT SUM(amount) 
              FROM payments 
              WHERE invoice_id = ${payment.invoice_id} AND status IN ('cleared', 'pending')
            ), 0) >= total_amount THEN 'paid'
            WHEN COALESCE((
              SELECT SUM(amount) 
              FROM payments 
              WHERE invoice_id = ${payment.invoice_id} AND status IN ('cleared', 'pending')
            ), 0) > 0 THEN 'partial'
            ELSE 'unpaid'
          END,
          amount_due = total_amount - COALESCE((
            SELECT SUM(amount) 
            FROM payments 
            WHERE invoice_id = ${payment.invoice_id} AND status IN ('cleared', 'pending')
          ), 0),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${payment.invoice_id}
      `;
    }

    return Response.json(payment);
  } catch (error) {
    console.error("Error updating payment:", error);
    return Response.json(
      { error: "Failed to update payment" },
      { status: 500 },
    );
  }
}

// DELETE /api/payments - Delete payment
export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { error: "Payment ID is required" },
        { status: 400 },
      );
    }

    // Check if payment exists
    const existingPayment = await sql`SELECT * FROM payments WHERE id = ${id}`;
    if (existingPayment.length === 0) {
      return Response.json({ error: "Payment not found" }, { status: 404 });
    }

    const payment = existingPayment[0];

    // Delete payment and update invoice if needed
    const deleteQueries = [sql`DELETE FROM payments WHERE id = ${id}`];

    // If payment was linked to an invoice, recalculate invoice totals
    if (payment.invoice_id) {
      deleteQueries.push(
        sql`
          UPDATE invoices 
          SET 
            amount_paid = COALESCE((
              SELECT SUM(amount) 
              FROM payments 
              WHERE invoice_id = ${payment.invoice_id} AND status IN ('cleared', 'pending') AND id != ${id}
            ), 0),
            payment_status = CASE 
              WHEN COALESCE((
                SELECT SUM(amount) 
                FROM payments 
                WHERE invoice_id = ${payment.invoice_id} AND status IN ('cleared', 'pending') AND id != ${id}
              ), 0) >= total_amount THEN 'paid'
              WHEN COALESCE((
                SELECT SUM(amount) 
                FROM payments 
                WHERE invoice_id = ${payment.invoice_id} AND status IN ('cleared', 'pending') AND id != ${id}
              ), 0) > 0 THEN 'partial'
              ELSE 'unpaid'
            END,
            amount_due = total_amount - COALESCE((
              SELECT SUM(amount) 
              FROM payments 
              WHERE invoice_id = ${payment.invoice_id} AND status IN ('cleared', 'pending') AND id != ${id}
            ), 0),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${payment.invoice_id}
        `,
      );
    }

    await sql.transaction(deleteQueries);

    return Response.json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return Response.json(
      { error: "Failed to delete payment" },
      { status: 500 },
    );
  }
}
