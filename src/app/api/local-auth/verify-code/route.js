import sql from "@/app/api/utils/sql";
import { authLimiter } from "@/app/api/utils/rate-limit";
import { auditLog } from "@/app/api/utils/audit";

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((pair) => {
    const [k, v] = pair.split("=");
    if (!k) return;
    cookies[k.trim()] = decodeURIComponent((v || "").trim());
  });
  return cookies;
}

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

    // Look up valid (unused, unexpired) code
    const codes = await sql`
      SELECT id, username, code, expires_at, used_at
      FROM auth_verification_codes
      WHERE username = ${username}
        AND code = ${code}
        AND used_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const record = codes[0];

    if (!record) {
      await auditLog({
        request,
        action: "magic_code.verify",
        status: "failure",
        changes: { username, reason: "invalid_or_expired_code" },
      });
      return Response.json({ error: "Invalid or expired code" }, { status: 401 });
    }

    // Mark code as used
    await sql`
      UPDATE auth_verification_codes SET used_at = NOW() WHERE id = ${record.id}
    `;

    // Look up the user
    const users = await sql`
      SELECT id, username, role FROM auth_users WHERE username = ${username} LIMIT 1
    `;
    const user = users[0];

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 401 });
    }

    // Create session (7 days)
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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

    const cookie = makeCookie("admin_session", token, 7 * 24 * 60 * 60);

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: user.id, username: user.username, role: user.role },
        token,
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
