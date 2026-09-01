import { beforeEach, describe, expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const sql = vi.fn();
const getCurrentUser = vi.fn();
const auditLog = vi.fn();
vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog }));
vi.mock("@/app/api/utils/rate-limit", () => ({
  generalLimiter: vi.fn(() => null),
}));
const { POST, PUT } = await import("@/app/api/contracts/route");

describe("contract consent lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockResolvedValue({
      id: 1,
      username: "owner@example.test",
      role: "owner",
    });
  });

  test("does not let contract creation approve an estimate", async () => {
    sql.mockResolvedValueOnce([{ id: 5, status: "sent" }]);
    const response = await POST(
      new Request("https://example.test/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimate_id: 5,
          title: "Interior repaint",
          scope_of_work: "Two coats",
          total_amount: 2500,
        }),
      }),
    );
    expect(response.status).toBe(409);
    expect(sql).toHaveBeenCalledOnce();
    expect(auditLog).not.toHaveBeenCalled();
  });

  test("rejects manual signed status on generic updates", async () => {
    sql.mockResolvedValueOnce([{ id: 7, status: "sent" }]);
    const response = await PUT(
      new Request("https://example.test/api/contracts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: 7, status: "signed" }),
      }),
    );
    expect(response.status).toBe(409);
    expect(sql).toHaveBeenCalledOnce();
  });

  test("admin UI no longer fabricates customer signature evidence", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/components/admin/contracts/ContractDetailModal.jsx",
      ),
      "utf8",
    );
    expect(source).not.toContain("Mark Signed");
    expect(source).not.toContain("client_signed_at");
    expect(source).toContain("consent-backed customer portal");
  });
});
