import { beforeEach, describe, expect, test, vi } from "vitest";

const { sql, spawnAgent, parseAgentJSON, notifyGerardo, isTrustedInternalRequest, requireAdmin, requireCsrf } = vi.hoisted(() => ({
  sql: vi.fn(),
  spawnAgent: vi.fn(),
  parseAgentJSON: vi.fn(),
  notifyGerardo: vi.fn(),
  isTrustedInternalRequest: vi.fn(),
  requireAdmin: vi.fn(),
  requireCsrf: vi.fn(),
}));

vi.mock("@/app/api/utils/sql.js", () => ({ default: sql }));
vi.mock("@/app/api/agents/openclaw.js", () => ({ spawnAgent, parseAgentJSON }));
vi.mock("@/app/api/utils/telegram.js", () => ({ notifyGerardo }));
vi.mock("@/app/api/utils/auth.js", () => ({ isTrustedInternalRequest, requireAdmin }));
vi.mock("@/app/api/utils/csrf.js", () => ({ requireCsrf }));

const { POST } = await import("@/app/api/agents/customer-support/route.js");

describe("customer support agent API", () => {
  beforeEach(() => {
    sql.mockReset();
    spawnAgent.mockReset();
    parseAgentJSON.mockReset();
    notifyGerardo.mockReset();
    isTrustedInternalRequest.mockReset();
    requireAdmin.mockReset();
    requireCsrf.mockReset();
  });

  test("rejects an anonymous request before spawning an agent or updating messages", async () => {
    isTrustedInternalRequest.mockReturnValue(false);
    const csrfFailure = Response.json({ error: "CSRF token missing" }, { status: 403 });
    requireCsrf.mockReturnValue(csrfFailure);

    const response = await POST(new Request("https://arcanpainting.ca/api/agents/customer-support", {
      method: "POST",
      body: JSON.stringify({ messageText: "Please call me" }),
    }));

    expect(response.status).toBe(403);
    expect(spawnAgent).not.toHaveBeenCalled();
    expect(sql).not.toHaveBeenCalled();
  });

  test("allows the trusted server-to-server chat path", async () => {
    isTrustedInternalRequest.mockReturnValue(true);
    spawnAgent.mockResolvedValue({ success: true, result: '{"category":"general","urgency":"low"}' });
    parseAgentJSON.mockReturnValue({ category: "general", urgency: "low" });

    const response = await POST(new Request("https://arcanpainting.ca/api/agents/customer-support", {
      method: "POST",
      headers: { "x-internal-api-token": "test-token" },
      body: JSON.stringify({ messageText: "Please call me" }),
    }));

    expect(response.status).toBe(200);
    expect(spawnAgent).toHaveBeenCalledOnce();
    expect(requireAdmin).not.toHaveBeenCalled();
  });

  test("keeps manual triage available to an authenticated admin with CSRF", async () => {
    isTrustedInternalRequest.mockReturnValue(false);
    requireCsrf.mockReturnValue(null);
    requireAdmin.mockResolvedValue(true);
    spawnAgent.mockResolvedValue({ success: true, result: '{"category":"general","urgency":"low"}' });
    parseAgentJSON.mockReturnValue({ category: "general", urgency: "low" });

    const response = await POST(new Request("https://arcanpainting.ca/api/agents/customer-support", {
      method: "POST",
      headers: { "x-csrf-token": "test-token" },
      body: JSON.stringify({ messageText: "Please call me" }),
    }));

    expect(response.status).toBe(200);
    expect(requireAdmin).toHaveBeenCalledOnce();
    expect(spawnAgent).toHaveBeenCalledOnce();
  });
});
