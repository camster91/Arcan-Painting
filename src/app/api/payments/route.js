// Generate a unique payment number like PAY-YYYYMMDD-XXXX
function generatePaymentNumber() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PAY-${y}${m}${d}-${rand}`;
}

import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";
import { paymentLimiter, generalLimiter } from "@/app/api/utils/rate-limit";
import { auditLog } from "@/app/api/utils/audit";
import { recalcInvoiceTotals } from "@/app/api/utils/invoice-totals";
import { validateBody, schemas } from "@/app/api/utils/validate";

// GET /api/payments - List payments with filtering or get single payment
export async function GET(request) {
  const limited = generalLimiter(request);
  if (limited) return limited;

  try {
    const user = await getCurrentUser(request);
    if (!user) {
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
  const limited = paymentLimiter(request);
  if (limited) return limited;

  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [body, validationError] = await validateBody(request, schemas.payment);
    if (validationError) return validationError;

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

    const paymentAmount = parseFloat(amount);
    const payment_number = generatePaymentNumber();

    // Verify invoice and contract exist if provided
    if (invoice_id) {
      const invoiceExists = await sql`SELECT id FROM invoices WHERE id = ${invoice_id}`;
      if (invoiceExists.length === 0) {
        return Response.json({ error: "Invoice not found" }, { status: 400 });
      }
    }

    if (contract_id) {
      const contractExists = await sql`SELECT id FROM contracts WHERE id = ${contract_id}`;
      if (contractExists.length === 0) {
        return Response.json({ error: "Contract not found" }, { status: 400 });
      }
    }

    // Real PostgreSQL transaction
    const { payment, updatedInvoice } = await sql.transaction(async (txSql) => {
      const [payment] = await txSql`
        INSERT INTO payments (
          payment_number, invoice_id, contract_id, payment_method, payment_reference,
          amount, payment_date, status, notes, processed_by
        ) VALUES (
          ${payment_number}, ${invoice_id || null}, ${contract_id || null}, ${payment_method}, ${payment_reference || null},
          ${paymentAmount}, ${payment_date}, ${status}, ${notes || null},
          ${processed_by || user.username}
        ) RETURNING *
      `;

      const updatedInvoice = invoice_id ? await recalcInvoiceTotals(txSql, invoice_id) : null;

      return { payment, updatedInvoice };
    });

    await auditLog({
      request,
      action: "payment.create",
      userId: user.id,
      username: user.username,
      resource: "payment",
      resourceId: payment.id,
      changes: { amount: paymentAmount, payment_method, invoice_id, contract_id },
      status: "success",
    });

    return Response.json({ payment, updated_invoice: updatedInvoice || null }, { status: 201 });
  } catch (error) {
    console.error("Error recording payment:", error);
    return Response.json({ error: "Failed to record payment" }, { status: 500 });
  }
}

// PUT /api/payments - Update payment
export async function PUT(request) {
  const limited = paymentLimiter(request);
  if (limited) return limited;

  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [body, validationError] = await validateBody(request, schemas.paymentUpdate);
    if (validationError) return validationError;

    const { id, payment_method, payment_reference, amount, payment_date, status, notes, processed_by } = body;

    // Check if payment exists
    const existingPayment = await sql`SELECT * FROM payments WHERE id = ${id}`;
    if (existingPayment.length === 0) {
      return Response.json({ error: "Payment not found" }, { status: 404 });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (payment_method !== undefined) { updateFields.push(`payment_method = $${paramCount}`); updateValues.push(payment_method); paramCount++; }
    if (payment_reference !== undefined) { updateFields.push(`payment_reference = $${paramCount}`); updateValues.push(payment_reference); paramCount++; }
    if (amount !== undefined) { updateFields.push(`amount = $${paramCount}`); updateValues.push(parseFloat(amount)); paramCount++; }
    if (payment_date !== undefined) { updateFields.push(`payment_date = $${paramCount}`); updateValues.push(payment_date); paramCount++; }
    if (status !== undefined) { updateFields.push(`status = $${paramCount}`); updateValues.push(status); paramCount++; }
    if (notes !== undefined) { updateFields.push(`notes = $${paramCount}`); updateValues.push(notes); paramCount++; }
    if (processed_by !== undefined) { updateFields.push(`processed_by = $${paramCount}`); updateValues.push(processed_by); paramCount++; }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    const updateQuery = `UPDATE payments SET ${updateFields.join(", ")} WHERE id = $${paramCount} RETURNING *`;
    const [payment] = await sql(updateQuery, updateValues);

    // If payment amount or status changed and it's linked to an invoice, update invoice totals
    if ((amount !== undefined || status !== undefined) && payment.invoice_id) {
      await recalcInvoiceTotals(sql, payment.invoice_id);
    }

    await auditLog({
      request,
      action: "payment.update",
      userId: user.id,
      username: user.username,
      resource: "payment",
      resourceId: id,
      changes: { amount, status, payment_method },
      status: "success",
    });

    return Response.json(payment);
  } catch (error) {
    console.error("Error updating payment:", error);
    return Response.json({ error: "Failed to update payment" }, { status: 500 });
  }
}

// DELETE /api/payments - Delete payment
export async function DELETE(request) {
  const limited = paymentLimiter(request);
  if (limited) return limited;

  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Payment ID is required" }, { status: 400 });
    }

    const existingPayment = await sql`SELECT * FROM payments WHERE id = ${id}`;
    if (existingPayment.length === 0) {
      return Response.json({ error: "Payment not found" }, { status: 404 });
    }

    const payment = existingPayment[0];

    // Real transaction: delete payment + recalculate invoice
    await sql.transaction(async (txSql) => {
      await txSql`DELETE FROM payments WHERE id = ${id}`;

      if (payment.invoice_id) {
        await recalcInvoiceTotals(txSql, payment.invoice_id);
      }
    });

    await auditLog({
      request,
      action: "payment.delete",
      userId: user.id,
      username: user.username,
      resource: "payment",
      resourceId: id,
      changes: { amount: payment.amount, payment_method: payment.payment_method },
      status: "success",
    });

    return Response.json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return Response.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}
