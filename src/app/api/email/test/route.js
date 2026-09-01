import { getCurrentUser } from "@/app/api/utils/auth";
import { generalLimiter } from "@/app/api/utils/rate-limit";
import { sendEmail } from "@/app/api/utils/send-email";
import { auditLog } from "@/app/api/utils/audit";

export async function POST(request) {
  const limited = generalLimiter(request);
  if (limited) return limited;
  const user = await getCurrentUser(request);
  if (!user || user.role !== "owner") return Response.json({ error: "Owner access required" }, { status: 403 });
  const { to, subject, message } = await request.json().catch(() => ({}));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to || "")) return Response.json({ error: "A valid recipient email is required" }, { status: 400 });
  if (!subject?.trim() || !message?.trim()) return Response.json({ error: "Subject and message are required" }, { status: 400 });
  try {
    const delivery = await sendEmail({
      to: to.trim().toLowerCase(),
      subject: subject.trim().slice(0, 300),
      text: message.trim(),
      html: `<div style="font-family:Arial,sans-serif;white-space:pre-wrap">${escapeHtml(message.trim())}</div>`,
      templateName: "operator_test",
      userId: user.id,
      metadata: { initiated_by: user.username },
    });
    await auditLog({ request, action: "email.test_send", userId: user.id, username: user.username, resource: "email", changes: { to }, status: "success" });
    return Response.json({ success: true, id: delivery.id || null });
  } catch (error) {
    await auditLog({ request, action: "email.test_send", userId: user.id, username: user.username, resource: "email", changes: { to, error: error.message }, status: "failure" });
    return Response.json({ error: error.message || "Email delivery failed" }, { status: 503 });
  }
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
