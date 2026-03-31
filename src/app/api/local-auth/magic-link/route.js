import sql from "@/app/api/utils/sql";
import { authLimiter } from "@/app/api/utils/rate-limit";
import { auditLog } from "@/app/api/utils/audit";
import { generateSecureToken } from "@/app/api/utils/auth";

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
  try {
    if (process.env.AUTH_URL && process.env.AUTH_URL.startsWith("https")) {
      parts.push("Secure");
    }
  } catch {}
  return parts.join("; ");
}

export async function GET(request) {
  const limited = authLimiter(request);
  if (limited) return limited;

  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const email = (url.searchParams.get("email") || "").trim().toLowerCase();

    if (!token || !email) {
      return Response.redirect(new URL("/admin?error=link_expired", url.origin));
    }

    // Look up valid (unused, unexpired) code
    const codes = await sql`
      SELECT id, username, code, expires_at, used_at
      FROM auth_verification_codes
      WHERE username = ${email}
        AND code = ${token}
        AND used_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const record = codes[0];

    if (!record) {
      await auditLog({
        request,
        action: "magic_link.verify",
        status: "failure",
        changes: { email, reason: "invalid_or_expired_link" },
      });
      return Response.redirect(new URL("/admin?error=link_expired", url.origin));
    }

    // Mark code as used
    await sql`
      UPDATE auth_verification_codes SET used_at = NOW() WHERE id = ${record.id}
    `;

    // Look up the user
    const users = await sql`
      SELECT id, username, role FROM auth_users WHERE username = ${email} LIMIT 1
    `;
    const user = users[0];

    if (!user) {
      return Response.redirect(new URL("/admin?error=link_expired", url.origin));
    }

    // Create session (90 days)
    const sessionToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO auth_sessions (user_id, token, expires_at)
      VALUES (${user.id}, ${sessionToken}, ${expiresAt.toISOString()})
    `;

    await auditLog({
      request,
      action: "magic_link.verify",
      status: "success",
      userId: user.id,
      username: user.username,
    });

    // Set session cookie and redirect to admin
    const cookie = makeCookie("admin_session", sessionToken, 90 * 24 * 60 * 60);

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/admin",
        "Set-Cookie": cookie,
      },
    });
  } catch (error) {
    console.error("Magic link error:", error);
    const url = new URL(request.url);
    return Response.redirect(new URL("/admin?error=link_expired", url.origin));
  }
}
