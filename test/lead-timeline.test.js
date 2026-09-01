import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
const getCurrentUser = vi.fn();
vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({
  getCurrentUser,
  unauthorizedResponse: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
}));
vi.mock("@/app/api/utils/rate-limit", () => ({ generalLimiter: vi.fn(() => null) }));

const { GET } = await import("@/app/api/leads/[id]/timeline/route");

describe("customer activity timeline", () => {
  beforeEach(() => { sql.mockReset(); getCurrentUser.mockReset(); });

  test("requires an authenticated operator", async () => {
    getCurrentUser.mockResolvedValue(null);
    const response = await GET(new Request("https://example.test/api/leads/4/timeline"), { params: { id: "4" } });
    expect(response.status).toBe(401);
    expect(sql).not.toHaveBeenCalled();
  });

  test("returns connected revenue and delivery events", async () => {
    getCurrentUser.mockResolvedValue({ id: 1, role: "owner" });
    sql
      .mockResolvedValueOnce([{ id: 4, name: "Alex Client" }])
      .mockResolvedValueOnce([{ event_type: "invoice", entity_id: "8", title: "Invoice INV-8", status: "unpaid", amount: "1200", occurred_at: "2030-01-01T00:00:00Z" }]);
    const response = await GET(new Request("https://example.test/api/leads/4/timeline"), { params: { id: "4" } });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ lead: { id: 4 }, events: [{ event_type: "invoice", amount: "1200" }] });
    expect(String(sql.mock.calls[1][0])).toContain("FROM payments");
    expect(String(sql.mock.calls[1][0])).toContain("FROM email_logs");
  });
});
