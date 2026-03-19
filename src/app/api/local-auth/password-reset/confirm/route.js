import { hash } from "argon2";
import sql from "@/app/api/utils/sql";
import { passwordLimiter } from "@/app/api/utils/rate-limit";
import { auditLog } from "@/app/api/utils/audit";
import { validateBody, schemas } from "@/app/api/utils/validate";
import { ensureSchema } from "@/migrations/001-initial-schema";

export async function POST(request) {
  // Rate limiting
  const limited = passwordLimiter(request);
  if (limited) return limited;

  try {
    await ensureSchema();

    const [body, validationError] = await validateBody(request, schemas.passwordResetConfirm);
    if (validationError) return validationError;

    const { token, newPassword } = body;

    const rows = await sql`
      SELECT t.id, t.user_id, t.expires_at, t.used
      FROM password_reset_tokens t
      WHERE t.token = ${token}
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) {
      return Response.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    if (row.used) {
      return Response.json({ error: "This reset link has already been used" }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    if (row.expires_at < nowIso) {
      return Response.json({ error: "This reset link has expired" }, { status: 400 });
    }

    // Hash the new password
    const hashed = await hash(newPassword);

    // Use real transaction for atomicity
    await sql.transaction(async (txSql) => {
      await txSql`UPDATE auth_users SET password = ${hashed}, password_is_hashed = TRUE WHERE id = ${row.user_id}`;
      await txSql`UPDATE password_reset_tokens SET used = TRUE WHERE id = ${row.id}`;
    });

    await auditLog({
      request,
      action: "password.reset",
      userId: row.user_id,
      status: "success",
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Password reset confirm error:", error);
    return Response.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
