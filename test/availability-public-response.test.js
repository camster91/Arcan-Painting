import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
const requireAdmin = vi.fn();

vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({ requireAdmin }));

const { GET } = await import("@/app/api/availability/route");

const slot = {
  id: 7,
  slot_date: "2030-01-02",
  start_time: "10:00:00",
  end_time: "11:00:00",
  capacity: 3,
  status: "open",
  notes: "Use the rear entrance",
  booked_count: 1,
  remaining: 2,
};

describe("public availability", () => {
  beforeEach(() => {
    sql.mockReset();
    requireAdmin.mockReset();
  });

  test("does not expose internal slot metadata to public scheduler visitors", async () => {
    sql.mockResolvedValue([slot]);

    const response = await GET(
      new Request("https://arcanpainting.ca/api/availability?date=2030-01-02"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      slots: [
        {
          id: 7,
          slot_date: "2030-01-02",
          start_time: "10:00:00",
          end_time: "11:00:00",
          remaining: 2,
        },
      ],
    });
    expect(requireAdmin).not.toHaveBeenCalled();
  });

  test("returns full operational detail only for an authenticated admin request", async () => {
    sql.mockResolvedValue([slot]);
    requireAdmin.mockResolvedValue(true);

    const response = await GET(
      new Request("https://arcanpainting.ca/api/availability?all=1"),
    );

    expect(await response.json()).toEqual({ success: true, slots: [slot] });
    expect(requireAdmin).toHaveBeenCalledOnce();
  });
});
