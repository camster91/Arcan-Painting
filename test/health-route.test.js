import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();

vi.mock("@/app/api/utils/sql.js", () => ({ default: sql }));

const { GET } = await import("@/app/api/health/route.js");

describe("GET /api/health", () => {
  beforeEach(() => {
    sql.mockReset();
  });

  test("reports healthy only after Postgres responds", async () => {
    sql.mockResolvedValue([{ connected: 1 }]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "ok" });
    expect(sql).toHaveBeenCalledOnce();
  });

  test("does not mark the CRM healthy when Postgres is unavailable", async () => {
    sql.mockRejectedValue(new Error("connection refused"));

    const response = await GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ status: "unavailable" });
  });
});
