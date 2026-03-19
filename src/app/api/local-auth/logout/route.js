import sql from "@/app/api/utils/sql";
import { authLimiter } from "@/app/api/utils/rate-limit";
import { auditLog } from "@/app/api/utils/audit";
import { parseCookies } from "@/app/api/utils/auth";

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
    const cookieHeader = request.headers.get("cookie");
    const cookies = parseCookies(cookieHeader);
    const token = cookies["admin_session"];

    if (token) {
      try {
        // Get user before deleting session for audit log
        const sessions = await sql`
          SELECT u.id, u.username FROM auth_sessions s
          JOIN auth_users u ON u.id = s.user_id
          WHERE s.token = ${token} LIMIT 1
        `;
        const sessionUser = sessions[0];
        // Soft-delete session (preserve audit trail instead of hard DELETE)
        await sql`UPDATE auth_sessions SET deleted_at = NOW() WHERE token = ${token} AND deleted_at IS NULL`;
        if (sessionUser) {
          await auditLog({ request, action: "logout", userId: sessionUser.id, username: sessionUser.username, status: "success" });
        }
      } catch {}
    }

    const clearCookie = makeCookie("admin_session", "", 0);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": clearCookie,
      },
    });
  } catch (error) {
    console.error("Logout error:", error);
    return Response.json({ error: "Failed to logout" }, { status: 500 });
  }
}
