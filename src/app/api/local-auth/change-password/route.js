import sql from "@/app/api/utils/sql";

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

async function requireAuth(request) {
  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const token = cookies["admin_session"];
  if (!token) return null;

  const rows = await sql`
    SELECT u.id, u.username, u.password, u.role, s.expires_at
    FROM auth_sessions s
    JOIN auth_users u ON u.id = s.user_id
    WHERE s.token = ${token}
    LIMIT 1
  `;
  const user = rows[0];
  if (!user) return null;
  const nowIso = new Date().toISOString();
  if (user.expires_at && user.expires_at < nowIso) {
    await sql`DELETE FROM auth_sessions WHERE token = ${token}`;
    return null;
  }
  return user;
}

export async function POST(request) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const currentPassword = (body.currentPassword || "").trim();
    const newPassword = (body.newPassword || "").trim();

    if (!currentPassword || !newPassword) {
      return Response.json(
        { error: "Current and new password are required" },
        { status: 400 },
      );
    }

    if (currentPassword !== user.password) {
      return Response.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    await sql`UPDATE auth_users SET password = ${newPassword} WHERE id = ${user.id}`;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return Response.json(
      { error: "Failed to change password" },
      { status: 500 },
    );
  }
}
