import { beforeEach, describe, expect, test, vi } from "vitest";

const requireAdmin = vi.fn();
const requireCsrf = vi.fn();

vi.mock("@/app/api/utils/auth.js", () => ({ requireAdmin }));
vi.mock("@/app/api/utils/csrf.js", () => ({ requireCsrf }));

const { GET, POST } = await import("@/app/api/agent/tools/route.js");

describe("agent tools API", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireCsrf.mockReset();
  });

  test("rejects anonymous access to the internal tool catalog", async () => {
    requireAdmin.mockResolvedValue(false);

    const response = await GET(new Request("https://arcanpainting.ca/api/agent/tools"));

    expect(response.status).toBe(401);
  });

  test("requires CSRF before staging a tool action", async () => {
    const csrfFailure = Response.json({ error: "CSRF token missing" }, { status: 403 });
    requireCsrf.mockReturnValue(csrfFailure);

    const response = await POST(new Request("https://arcanpainting.ca/api/agent/tools", {
      method: "POST",
      body: JSON.stringify({ tool: "generate_linkedin_post", params: { topic: "painting" } }),
    }));

    expect(response.status).toBe(403);
    expect(requireAdmin).not.toHaveBeenCalled();
  });

  test("labels successful admin actions as staged rather than published", async () => {
    requireCsrf.mockReturnValue(null);
    requireAdmin.mockResolvedValue(true);

    const response = await POST(new Request("https://arcanpainting.ca/api/agent/tools", {
      method: "POST",
      body: JSON.stringify({ tool: "generate_linkedin_post", params: { topic: "painting" } }),
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, status: "staged" });
  });
});
