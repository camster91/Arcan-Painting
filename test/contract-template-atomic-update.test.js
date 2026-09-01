import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
sql.transaction = vi.fn();
const getCurrentUser = vi.fn();
const auditLog = vi.fn();
vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog }));
const { POST, PUT } = await import("@/app/api/contract-templates/route");

describe("contract template atomic update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockResolvedValue({
      id: 1,
      username: "owner@example.test",
      role: "owner",
    });
  });

  test("creates a new default and unsets the previous default atomically", async () => {
    const txn = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 10,
          name: "Commercial",
          is_active: true,
          is_default: true,
          default_deposit_percentage: 0,
        },
      ]);
    sql.transaction.mockImplementation((callback) => callback(txn));

    const response = await POST(
      new Request("https://example.test/api/contract-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Commercial",
          is_default: true,
          default_deposit_percentage: 0,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(sql.transaction).toHaveBeenCalledOnce();
    expect(txn).toHaveBeenCalledTimes(2);
    expect(String(txn.mock.calls[0][0])).toContain(
      "UPDATE contract_templates SET is_default = false",
    );
    expect(txn.mock.calls[1][0]).toEqual(
      expect.arrayContaining([expect.stringContaining("INSERT INTO contract_templates")]),
    );
    expect(txn.mock.calls[1]).toContain(0);
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "contract_template.create" }),
    );
  });

  test("rejects an unsafe deposit before changing the current default", async () => {
    const response = await POST(
      new Request("https://example.test/api/contract-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Unsafe",
          is_default: true,
          default_deposit_percentage: -1,
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(sql.transaction).not.toHaveBeenCalled();
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
