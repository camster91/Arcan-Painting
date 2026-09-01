import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
sql.transaction = vi.fn();
const getCurrentUser = vi.fn();
const auditLog = vi.fn();
vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog }));
const { PUT } = await import("@/app/api/contract-templates/route");

describe("contract template atomic update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockResolvedValue({
      id: 1,
      username: "owner@example.test",
      role: "owner",
    });
  });

  test("persists all changed legal template fields in one transaction", async () => {
    const txn = vi
      .fn()
      .mockResolvedValueOnce([
        { id: 9, name: "Residential", terms_template: "Updated terms" },
      ]);
    sql.transaction.mockImplementation((callback) => callback(txn));
    const response = await PUT(
      new Request("https://example.test/api/contract-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: 9,
          name: "Residential",
          terms_template: "Updated terms",
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(txn).toHaveBeenCalledOnce();
    expect(String(txn.mock.calls[0][0])).toContain("name = $1");
    expect(String(txn.mock.calls[0][0])).toContain("terms_template = $2");
    expect(txn.mock.calls[0][1]).toEqual(["Residential", "Updated terms", 9]);
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "contract_template.update" }),
    );
  });

  test("rejects an unsafe default deposit percentage", async () => {
    const response = await PUT(
      new Request("https://example.test/api/contract-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: 9, default_deposit_percentage: 125 }),
      }),
    );
    expect(response.status).toBe(400);
    expect(sql.transaction).not.toHaveBeenCalled();
  });
});
