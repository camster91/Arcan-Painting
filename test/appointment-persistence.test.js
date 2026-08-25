import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
const txSql = vi.fn();
const sendEmail = vi.fn();
sql.transaction = vi.fn(async (callback) => callback(txSql));

vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/send-email", () => ({ sendEmail }));
vi.mock("@/app/api/utils/auth", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/app/api/utils/rate-limit", () => ({ createRateLimiter: vi.fn(() => vi.fn(() => null)) }));

const { POST } = await import("@/app/api/appointments/route");

describe("public appointment persistence", () => {
  beforeEach(() => {
    sql.mockReset();
    txSql.mockReset();
    sql.transaction.mockClear();
    sendEmail.mockReset();
    sendEmail.mockResolvedValue(undefined);
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

  test("escapes visitor data before building appointment email content", async () => {
    txSql
      .mockResolvedValueOnce([{ id: 7, slot_date: "2030-01-02", start_time: "10:00:00", end_time: "11:00:00", capacity: 1, status: "open" }])
      .mockResolvedValueOnce([{ count: 0 }])
      .mockResolvedValueOnce([{ id: 31 }])
      .mockResolvedValueOnce([{ id: 44 }]);

    const response = await POST(new Request("https://arcanpainting.ca/api/appointments", {
      method: "POST",
      body: JSON.stringify({
        slotId: 7,
        name: '<img src=x onerror="alert(1)">\r\nBcc: attacker@example.test',
        email: "customer@example.test",
        address: '<a href="https://attacker.example">address</a>',
        notes: "Meeting details\nBEGIN:VEVENT",
      }),
    }));

    expect(response.status).toBe(200);
    expect(sendEmail).toHaveBeenCalledTimes(2);

    const [customerEmail, teamEmail] = sendEmail.mock.calls;
    expect(customerEmail[0].html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(customerEmail[0].html).toContain("&lt;a href=&quot;https://attacker.example&quot;&gt;address&lt;/a&gt;");
    expect(customerEmail[0].html).not.toContain('<img src=x onerror="alert(1)">');
    expect(teamEmail[0].subject).not.toContain("\r");
    expect(teamEmail[0].subject).not.toContain("\n");

    const encodedIcs = customerEmail[0].html.match(
      /data:text\/calendar;charset=utf-8,([^\"]+)/,
    )?.[1];
    const ics = decodeURIComponent(encodedIcs);
    expect(ics).not.toContain("\r\nBcc:");
    expect(ics).toContain("Notes: Meeting details\\nBEGIN:VEVENT");
  });
});
