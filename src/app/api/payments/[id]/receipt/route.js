import sql from "@/app/api/utils/sql";
import { sendEmail } from "@/app/api/utils/send-email";
import { auth } from "@/auth";

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = params; // payment id
    if (!id) {
      return Response.json(
        { error: "Payment ID is required" },
        { status: 400 },
      );
    }

    // Load payment + invoice + client email
    const rows = await sql`
      SELECT 
        p.id,
        p.amount,
        p.payment_date,
        p.payment_method,
        p.payment_reference,
        p.status,
        i.id as invoice_id,
        i.invoice_number,
        i.title as invoice_title,
        i.total_amount,
        i.tax_rate,
        l.email as client_email,
        l.name as client_name
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN leads l ON i.lead_id = l.id
      WHERE p.id = ${id}
      LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      return Response.json({ error: "Payment not found" }, { status: 404 });
    }

    const p = rows[0];
    if (!p.client_email) {
      return Response.json(
        { error: "Client email not found for this payment" },
        { status: 400 },
      );
    }

    const subject = `Receipt for ${p.invoice_number} — $${Number(p.amount).toFixed(2)}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a;">
        <h2>Payment Receipt</h2>
        <p>Hi ${p.client_name || ""},</p>
        <p>Thank you for your payment. Here are your receipt details:</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 560px;">
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">Invoice</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${p.invoice_number} — ${p.invoice_title || ""}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">Amount</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">$${Number(p.amount).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">Date</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${new Date(p.payment_date).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">Method</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${p.payment_method}${p.payment_reference ? ` (${p.payment_reference})` : ""}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">Status</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${p.status}</td>
            </tr>
          </tbody>
        </table>
        <p style="color: #475569;">If you have any questions, just reply to this email.</p>
      </div>
    `;

    const text = `Receipt for ${p.invoice_number}\nAmount: $${Number(p.amount).toFixed(2)}\nDate: ${new Date(p.payment_date).toLocaleDateString()}\nMethod: ${p.payment_method}${p.payment_reference ? ` (${p.payment_reference})` : ""}\nStatus: ${p.status}`;

    await sendEmail({
      to: p.client_email,
      subject,
      html,
      text,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error sending receipt:", error);
    return Response.json({ error: "Failed to send receipt" }, { status: 500 });
  }
}
