import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
const requireAdmin = vi.fn();

vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({ requireAdmin }));

const { GET } = await import("@/app/api/appointments/route.js");

describe("appointments API", () => {
  beforeEach(() => {
    sql.mockReset();
    requireAdmin.mockReset();
  });

  test("rejects unauthenticated reads before querying customer appointments", async () => {
    requireAdmin.mockResolvedValue(false);

    const response = await GET(new Request("https://arcanpainting.ca/api/appointments"));

    expect(response.status).toBe(401);
    expect(sql).not.toHaveBeenCalled();
  });
});
