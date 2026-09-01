import { beforeEach, describe, expect, test, vi } from "vitest";

const {
  sql,
  tx,
  sendEmail,
  getCurrentUser,
  generateSecureToken,
  requireCsrf,
  ensureSchema,
  passwordLimiter,
  hash,
  auditLog,
} = vi.hoisted(() => {
  const sql = vi.fn();
  sql.transaction = vi.fn();
  return {
    sql,
    tx: vi.fn(),
    sendEmail: vi.fn(),
    getCurrentUser: vi.fn(),
    generateSecureToken: vi.fn(),
    requireCsrf: vi.fn(),
    ensureSchema: vi.fn(),
    passwordLimiter: vi.fn(),
    hash: vi.fn(),
    auditLog: vi.fn(),
  };
});

vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/send-email", () => ({ sendEmail }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser, generateSecureToken }));
vi.mock("@/app/api/utils/csrf", () => ({ requireCsrf }));
vi.mock("@/migrations/001-initial-schema", () => ({ ensureSchema }));
vi.mock("@/app/api/utils/rate-limit", () => ({ passwordLimiter }));
vi.mock("argon2", () => ({ hash }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog }));

const { POST: createInvite } = await import("@/app/api/team-invites/route.js");
const { POST: acceptInvite } = await import("@/app/api/team-invites/accept/route.js");

const invitationToken = "a".repeat(64);

describe("team invitation creation", () => {
  beforeEach(() => {
    sql.mockReset();
    tx.mockReset();
    sql.transaction.mockReset();
    sendEmail.mockReset();
    getCurrentUser.mockReset();
    generateSecureToken.mockReset();
    requireCsrf.mockReset();
    ensureSchema.mockReset();
    passwordLimiter.mockReset();
    hash.mockReset();
    auditLog.mockReset();
    tx.mockResolvedValue([]);
    sql.transaction.mockImplementation((callback) => callback(tx));
    process.env.APP_URL = "https://arcanpainting.ca";
  });

  test("rejects an invalid CSRF request before auth, schema writes, or invitation creation", async () => {
    requireCsrf.mockReturnValue(Response.json({ error: "CSRF token missing" }, { status: 403 }));

    const response = await createInvite(new Request("https://arcanpainting.ca/api/team-invites", {
      method: "POST",
      body: JSON.stringify({ email: "crew@example.com", role: "owner" }),
    }));

    expect(response.status).toBe(403);
    expect(getCurrentUser).not.toHaveBeenCalled();
    expect(ensureSchema).not.toHaveBeenCalled();
    expect(sql).not.toHaveBeenCalled();
  });

  test("rejects an anonymous request without creating a default admin or invite", async () => {
    requireCsrf.mockReturnValue(null);
    getCurrentUser.mockResolvedValue(null);

    const response = await createInvite(new Request("https://arcanpainting.ca/api/team-invites", {
      method: "POST",
      body: JSON.stringify({ email: "crew@example.com", role: "owner" }),
    }));

    expect(response.status).toBe(401);
    expect(ensureSchema).not.toHaveBeenCalled();
    expect(sql).not.toHaveBeenCalled();
  });

  test("uses a secure token, ignores a supplied base URL, and only permits intended roles", async () => {
    requireCsrf.mockReturnValue(null);
    getCurrentUser.mockResolvedValue({ id: 4, role: "owner" });
    generateSecureToken.mockReturnValue(invitationToken);
    sendEmail.mockResolvedValue({ id: "message-1" });

    const response = await createInvite(new Request("https://hostile.test/api/team-invites", {
      method: "POST",
      headers: { "x-forwarded-host": "hostile.test" },
      body: JSON.stringify({ email: "crew@example.com", role: "crew", baseUrl: "https://hostile.test" }),
    }));

    expect(response.status).toBe(200);
    expect(generateSecureToken).toHaveBeenCalledOnce();
    expect(sql.transaction).toHaveBeenCalledOnce();
    expect(tx).toHaveBeenCalledWith(expect.any(Array), "crew@example.com");
    expect(tx).toHaveBeenCalledWith(expect.any(Array), "crew@example.com", "crew", invitationToken, expect.any(String), 4);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      html: expect.stringContaining("https://arcanpainting.ca/account/accept-invite"),
    }));

    const invalidRole = await createInvite(new Request("https://arcanpainting.ca/api/team-invites", {
      method: "POST",
      body: JSON.stringify({ email: "crew@example.com", role: "admin" }),
    }));
    expect(invalidRole.status).toBe(400);
  });

  test("supersedes earlier pending links before creating a replacement invite", async () => {
    requireCsrf.mockReturnValue(null);
    getCurrentUser.mockResolvedValue({ id: 4, role: "owner" });
    generateSecureToken.mockReturnValue(invitationToken);
    sendEmail.mockResolvedValue({ id: "message-2" });

    const response = await createInvite(new Request("https://arcanpainting.ca/api/team-invites", {
      method: "POST",
      body: JSON.stringify({ email: "crew@example.com", role: "office" }),
    }));

    expect(response.status).toBe(200);
    expect(tx.mock.calls[0]).toEqual([expect.any(Array), "crew@example.com"]);
    expect(tx.mock.calls[1]).toEqual([expect.any(Array), "crew@example.com"]);
    expect(tx.mock.calls[2]).toEqual([expect.any(Array), "crew@example.com", "office", invitationToken, expect.any(String), 4]);
  });
});

describe("team invitation acceptance", () => {
  beforeEach(() => {
    sql.mockReset();
    tx.mockReset();
    sql.transaction.mockReset();
    sendEmail.mockReset();
    getCurrentUser.mockReset();
    generateSecureToken.mockReset();
    requireCsrf.mockReset();
    ensureSchema.mockReset();
    passwordLimiter.mockReset();
    hash.mockReset();
    auditLog.mockReset();
    passwordLimiter.mockReturnValue(null);
  });

  test("rejects malformed and expired invitations before expensive password hashing", async () => {
    const malformed = await acceptInvite(new Request("https://arcanpainting.ca/api/team-invites/accept", {
      method: "POST",
      body: JSON.stringify({ token: "invalid", name: "Crew Member", password: "secure-password" }),
    }));
    expect(malformed.status).toBe(400);
    expect(hash).not.toHaveBeenCalled();

    sql.mockResolvedValueOnce([{ id: 7, role: "painter", expires_at: "2020-01-01T00:00:00.000Z", accepted_at: null }]);
    const expired = await acceptInvite(new Request("https://arcanpainting.ca/api/team-invites/accept", {
      method: "POST",
      body: JSON.stringify({ token: invitationToken, name: "Crew Member", password: "secure-password" }),
    }));
    expect(expired.status).toBe(400);
    expect(hash).not.toHaveBeenCalled();
  });

  test("rate limits public acceptance before database work", async () => {
    passwordLimiter.mockReturnValue(Response.json({ error: "Too many requests" }, { status: 429 }));

    const response = await acceptInvite(new Request("https://arcanpainting.ca/api/team-invites/accept", {
      method: "POST",
      body: JSON.stringify({ token: invitationToken, name: "Crew Member", password: "secure-password" }),
    }));

    expect(response.status).toBe(429);
    expect(ensureSchema).not.toHaveBeenCalled();
    expect(sql).not.toHaveBeenCalled();
  });

  test("audits successful acceptance without recording token, email, name, or password", async () => {
    const accepted = { inviteId: 7, role: "crew", userId: 13 };
    sql.mockResolvedValueOnce([{ id: 7, role: "crew", expires_at: "2099-01-01T00:00:00.000Z", accepted_at: null }]);
    sql.transaction.mockResolvedValueOnce(accepted);

    const response = await acceptInvite(new Request("https://arcanpainting.ca/api/team-invites/accept", {
      method: "POST",
      body: JSON.stringify({ token: invitationToken, name: "Crew Member", password: "secure-password" }),
    }));

    expect(response.status).toBe(200);
    expect(auditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: "team_invite.accept",
      userId: 13,
      username: "invited-user",
      resourceId: 13,
      changes: { invite_id: 7, role: "crew" },
    }));
    const payload = JSON.stringify(auditLog.mock.calls[0][0]);
    expect(payload).not.toContain(invitationToken);
    expect(payload).not.toContain("Crew Member");
    expect(payload).not.toContain("secure-password");
  });
});
