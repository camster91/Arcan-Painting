import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
const txSql = vi.fn();
sql.transaction = vi.fn(async (callback) => callback(txSql));

vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/send-email", () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/app/api/utils/auth", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/app/api/utils/rate-limit", () => ({ createRateLimiter: vi.fn(() => vi.fn(() => null)) }));

const { POST } = await import("@/app/api/appointments/route");

describe("public appointment persistence", () => {
  beforeEach(() => {
    sql.mockReset();
    txSql.mockReset();
    sql.transaction.mockClear();
  });

  test("creates the lead and appointment in the same locked transaction", async () => {
    txSql
      .mockResolvedValueOnce([{ id: 7, slot_date: "2030-01-02", start_time: "10:00:00", end_time: "11:00:00", capacity: 1, status: "open" }])
      .mockResolvedValueOnce([{ count: 0 }])
      .mockResolvedValueOnce([{ id: 31 }])
      .mockResolvedValueOnce([{ id: 44 }]);

    const response = await POST(new Request("https://arcanpainting.ca/api/appointments", {
      method: "POST",
      body: JSON.stringify({ slotId: 7, name: "Test Customer", email: "customer@example.test" }),
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, appointmentId: 44, leadId: 31 });
    expect(sql.transaction).toHaveBeenCalledOnce();
    expect(txSql).toHaveBeenCalledTimes(4);
  });

  test("does not create a lead when the slot is unavailable", async () => {
    txSql.mockResolvedValueOnce([]);

    const response = await POST(new Request("https://arcanpainting.ca/api/appointments", {
      method: "POST",
      body: JSON.stringify({ slotId: 7, name: "Test Customer", email: "customer@example.test" }),
    }));

    expect(response.status).toBe(409);
    expect(txSql).toHaveBeenCalledOnce();
  });
});
