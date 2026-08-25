import { beforeEach, describe, expect, it, vi } from "vitest";

const sql = vi.fn();

vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({
  requireAdmin: vi.fn().mockResolvedValue({ id: 1, role: "admin" }),
  getCurrentUser: vi.fn(),
}));

const { GET } = await import("@/app/api/leads/route");

describe("GET /api/leads search", () => {
  beforeEach(() => {
    sql.mockReset();
    sql.mockResolvedValueOnce([]).mockResolvedValueOnce([{ total: "0" }]);
  });

  it("places search filtering before ORDER BY", async () => {
    const response = await GET(new Request("https://example.test/api/leads?search=paint"));
    const query = sql.mock.calls[0][0];

    expect(response.status).toBe(200);
    expect(query.indexOf("AND (\n        LOWER(name)")).toBeLessThan(query.indexOf("ORDER BY created_at DESC"));
  });
});
