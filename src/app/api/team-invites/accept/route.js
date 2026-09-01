import sql from "@/app/api/utils/sql";
import { hash } from "argon2";
import { passwordLimiter } from "@/app/api/utils/rate-limit";
import { ensureSchema } from "@/migrations/001-initial-schema";

const INVITABLE_ROLES = new Set(["crew", "office", "estimator", "project_manager", "finance_readonly"]);

class InviteError extends Error {}

function validateInvite(invite) {
  if (!invite || invite.accepted_at) throw new InviteError("Invalid or expired invite");
  const expiresAt = new Date(invite.expires_at);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
    throw new InviteError("Invalid or expired invite");
  }
  if (!INVITABLE_ROLES.has(invite.role)) throw new InviteError("Invalid invite role");
}

export async function POST(request) {
  const limited = passwordLimiter(request);
  if (limited) return limited;

  try {
    const body = await request.json();
    const token = (body.token || "").trim();
    const name = (body.name || "").trim();
    const password = (body.password || "").trim();

    if (!/^[a-f0-9]{64}$/i.test(token) || !name || name.length > 255 || password.length < 6 || password.length > 128) {
      return Response.json(
        { error: "Please provide a valid invite, name, and password of at least 6 characters" },
        { status: 400 },
      );
    }

    await ensureSchema();
    // Avoid costly password hashing for invalid, expired, or consumed tokens.
    const preflight = await sql`SELECT id, role, expires_at, accepted_at FROM team_invites WHERE token = ${token} LIMIT 1`;
    validateInvite(preflight[0]);

    await sql.transaction(async (tx) => {
      const [invite] = await tx`SELECT * FROM team_invites WHERE token = ${token} FOR UPDATE`;
      validateInvite(invite);
      const hashedPassword = await hash(password);
      const existingUsers = await tx`SELECT id FROM auth_users WHERE username = ${invite.email} LIMIT 1`;
      let userId;
      if (existingUsers.length) {
        userId = existingUsers[0].id;
        await tx`UPDATE auth_users SET password = ${hashedPassword}, password_is_hashed = TRUE, role = ${invite.role} WHERE id = ${userId}`;
      } else {
        const [inserted] = await tx`
          INSERT INTO auth_users (username, password, password_is_hashed, role)
          VALUES (${invite.email}, ${hashedPassword}, TRUE, ${invite.role})
          RETURNING id
        `;
        userId = inserted.id;
      }

      const existingMembers = await tx`SELECT id FROM team_members WHERE email = ${invite.email} LIMIT 1`;
      if (existingMembers.length) {
        await tx`UPDATE team_members SET name = ${name}, role = ${invite.role}, status = 'active', updated_at = NOW() WHERE id = ${existingMembers[0].id}`;
      } else {
        await tx`INSERT INTO team_members (name, email, role, status) VALUES (${name}, ${invite.email}, ${invite.role}, 'active')`;
      }
      await tx`UPDATE team_invites SET accepted_at = NOW() WHERE id = ${invite.id}`;
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof InviteError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("Accept invite error:", error);
    return Response.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}
