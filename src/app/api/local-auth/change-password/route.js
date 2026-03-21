import { hash, verify as argon2Verify } from "argon2";
import sql from "@/app/api/utils/sql";
import { authLimiter } from "@/app/api/utils/rate-limit";
import { auditLog } from "@/app/api/utils/audit";
import { validateBody, schemas } from "@/app/api/utils/validate";
import { getCurrentUser } from "@/app/api/utils/auth";

export async function POST(request) {
  // Rate limiting
  const limited = authLimiter(request);
  if (limited) return limited;

  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [body, validationError] = await validateBody(request, schemas.changePassword);
    if (validationError) return validationError;

    const { currentPassword, newPassword } = body;

    // Fetch full user record (need password hash)
    const rows = await sql`SELECT id, username, password FROM auth_users WHERE id = ${user.id} LIMIT 1`;
    const fullUser = rows[0];
    if (!fullUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password (argon2 only — plain-text no longer accepted)
    let currentValid = false;
    try {
      currentValid = await argon2Verify(fullUser.password, currentPassword);
    } catch {
      currentValid = false;
    }

    if (!currentValid) {
      await auditLog({
        request,
        action: "password.change",
        userId: user.id,
        username: user.username,
        status: "failure",
        changes: { reason: "wrong_current_password" },
      });
      return Response.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    // Hash new password
    const hashed = await hash(newPassword);
    await sql`UPDATE auth_users SET password = ${hashed}, password_is_hashed = TRUE WHERE id = ${user.id}`;

    await auditLog({
      request,
      action: "password.change",
      userId: user.id,
      username: user.username,
      status: "success",
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return Response.json({ error: "Failed to change password" }, { status: 500 });
  }
}
