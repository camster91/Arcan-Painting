import sql from "@/app/api/utils/sql";
import { authLimiter } from "@/app/api/utils/rate-limit";
import { auditLog } from "@/app/api/utils/audit";
import { generateSecureToken, parseCookies } from "@/app/api/utils/auth";

const MAX_CODE_ATTEMPTS = 5;

function makeCookie(name, value, maxAgeSeconds) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (maxAgeSeconds !== undefined && maxAgeSeconds !== null) {
    parts.push(`Max-Age=${maxAgeSeconds}`);
  }
  const appUrl = process.env.PUBLIC_APP_URL || process.env.APP_URL || "";
  if (appUrl.startsWith("https://")) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export async function POST(request) {
  const limited = authLimiter(request);
  if (limited) return limited;

  try {
    const body = await request.json().catch(() => ({}));
    const username = ((body.username || body.email) ?? "").trim().toLowerCase();
    const code = (body.code ?? "").trim();

    if (!username || !code) {
      return Response.json({ error: "Email and code are required" }, { status: 400 });
    }

    // Lock the latest code before comparing it so invalid attempts are
    // persisted atomically and cannot race past the per-code limit.
    const verification = await sql.transaction(async (txSql) => {
      const codes = await txSql`
        SELECT id, username, code, expires_at, used_at, failed_attempts, locked_at
        FROM auth_verification_codes
        WHERE username = ${username}
          AND used_at IS NULL
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE
      `;
      const record = codes[0];
      if (!record) return { valid: false };

      const attempts = Number(record.failed_attempts || 0);
      if (record.locked_at || attempts >= MAX_CODE_ATTEMPTS || record.code !== code) {
        await txSql`
          UPDATE auth_verification_codes
          SET failed_attempts = failed_attempts + 1,
              locked_at = CASE WHEN failed_attempts + 1 >= ${MAX_CODE_ATTEMPTS} THEN NOW() ELSE locked_at END
          WHERE id = ${record.id}
        `;
        return { valid: false };
      }

      await txSql`UPDATE auth_verification_codes SET used_at = NOW() WHERE id = ${record.id}`;
      return { valid: true };
    });

    if (!verification.valid) {
      await auditLog({
        request,
        action: "magic_code.verify",
        status: "failure",
        changes: { username, reason: "invalid_or_expired_code" },
      });
      return Response.json({ error: "Invalid or expired code" }, { status: 401 });
    }

    // Look up the user
    const users = await sql`
      SELECT id, username, role FROM auth_users WHERE username = ${username} LIMIT 1
    `;
    const user = users[0];

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 401 });
    }

    // Create cryptographically secure session token (7 days)
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO auth_sessions (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt.toISOString()})
    `;

    await auditLog({
      request,
      action: "magic_code.verify",
      status: "success",
      userId: user.id,
      username: user.username,
    });

    // Token delivered ONLY via httpOnly cookie — not in JSON body
    const cookie = makeCookie("admin_session", token, 90 * 24 * 60 * 60);

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: user.id, username: user.username, role: user.role },
        // NOTE: token intentionally omitted from response — httpOnly cookie only
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
      }
    );
  } catch (error) {
    console.error("Verify code error:", error);
    return Response.json({ error: "Failed to verify code" }, { status: 500 });
  }
}
