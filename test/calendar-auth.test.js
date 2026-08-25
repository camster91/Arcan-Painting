import { beforeEach, describe, expect, test, vi } from "vitest";

const requireAdmin = vi.fn();
const getCalendarClient = vi.fn();

vi.mock("@/app/api/utils/auth.js", () => ({ requireAdmin }));
vi.mock("@/lib/google.js", () => ({ getCalendarClient }));

const { GET } = await import("@/app/api/calendar/route.js");

describe("calendar API", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    getCalendarClient.mockReset();
  });

  test("rejects unauthenticated reads before accessing business calendar events", async () => {
    requireAdmin.mockResolvedValue(false);

    const response = await GET(new Request("https://arcanpainting.ca/api/calendar"));

    expect(response.status).toBe(401);
    expect(getCalendarClient).not.toHaveBeenCalled();
  });

  test("keeps the existing calendar response shape for an authenticated admin", async () => {
    requireAdmin.mockResolvedValue(true);
    const list = vi.fn().mockResolvedValue({
      data: {
        items: [{
          id: "event-1",
          summary: "Estimate",
          start: { dateTime: "2026-08-25T10:00:00.000Z" },
          end: { dateTime: "2026-08-25T11:00:00.000Z" },
          location: "Toronto",
          status: "confirmed",
        }],
      },
    });
    getCalendarClient.mockReturnValue({ events: { list } });

    const response = await GET(new Request("https://arcanpainting.ca/api/calendar"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      events: [{
        id: "event-1",
        summary: "Estimate",
        start: "2026-08-25T10:00:00.000Z",
        end: "2026-08-25T11:00:00.000Z",
        location: "Toronto",
        status: "confirmed",
      }],
    });
  });
});
