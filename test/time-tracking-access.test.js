import { beforeEach, expect, it, vi } from "vitest";
import { GET, POST, PUT, DELETE } from "@/app/api/time-tracking/route";
const mocks = vi.hoisted(() => ({ db: vi.fn(), user: vi.fn() }));
vi.mock("@/app/api/utils/sql", () => ({ default: mocks.db }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser: mocks.user, parseCookies: (value) => Object.fromEntries((value || "").split(";").filter(Boolean).map((part) => part.trim().split("="))) }));
const user = { role: "painter", username: "painter@example.test" };
const request = (method, body, query = "") => new Request(`https://example.test/api/time-tracking${query}`, { method, ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue(user); mocks.db.mockResolvedValue([]); });

it("keeps the identity predicate when a painter supplies another member ID", async () => {
  mocks.db.mockResolvedValue([{ id: 1, hourly_rate: 50, total_cost: 100, total_hours: 2 }]);
  const response = await GET(request("GET", null, "?team_member_id=99"));
  const [query, params] = mocks.db.mock.calls[0];
  expect(query).toContain("tm.email = $1");
  expect(query).toContain("tt.team_member_id = $2");
  expect(params).toEqual([user.username, 99]);
  expect(await response.json()).toEqual({ timeEntries: [{ id: 1, total_hours: 2 }] });
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
});
it("preserves owner-wide access and owner cost visibility", async () => {
  mocks.user.mockResolvedValue({ role: "owner" }); mocks.db.mockResolvedValue([{ hourly_rate: 50, total_cost: 100 }]);
  const response = await GET(request("GET"));
  expect(mocks.db.mock.calls[0][0]).not.toContain("tm.email =");
  expect(await response.json()).toMatchObject({ timeEntries: [{ total_cost: 100 }] });
});
it("blocks creation for another member before insertion", async () => {
  const response = await POST(request("POST", { team_member_id: 99, clock_in_time: "2026-10-05T12:00:00Z" }));
  expect(response.status).toBe(403);
  expect(mocks.db).toHaveBeenCalledTimes(1);
  expect(mocks.db.mock.calls[0][0].join("?")).not.toContain("INSERT");
});
it.each(["hourly_rate", "total_cost", "total_hours"])("blocks painter supplied %s on creation and updates", async (field) => {
  expect((await POST(request("POST", { team_member_id: 7, clock_in_time: "2026-10-05T12:00:00Z", [field]: 99 }))).status).toBe(403);
  expect((await PUT(request("PUT", { id: 7, [field]: 99 }))).status).toBe(403);
  expect(mocks.db).not.toHaveBeenCalled();
});
it("allows a painter's own entry and redacts returned costs", async () => {
  mocks.db.mockResolvedValueOnce([{ id: 7 }]).mockResolvedValueOnce([{ id: 2, hourly_rate: null, total_cost: null }]);
  const response = await POST(request("POST", { team_member_id: 7, clock_in_time: "2026-10-05T12:00:00Z" }));
  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({ timeEntry: { id: 2 } });
});
it("preserves the Today screen's me timer-start payload", async () => {
  mocks.db.mockResolvedValueOnce([{ id: 7 }]).mockResolvedValueOnce([{ id: 7 }]).mockResolvedValueOnce([{ id: 2, status: "active", hourly_rate: null, total_cost: null }]);
  const response = await POST(request("POST", { team_member_id: "me", project_id: 3, clock_in_time: "2026-10-05T12:00:00Z" }));
  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({ timeEntry: { id: 2, status: "active" } });
});
it("preserves own clock-out while hiding server-calculated cost", async () => {
  mocks.db.mockResolvedValueOnce([{ id: 7 }]).mockResolvedValueOnce([{ id: 2 }]).mockResolvedValueOnce([{ id: 2, clock_in_time: "2026-10-05T12:00:00Z", hourly_rate: 50 }]).mockResolvedValueOnce([{ id: 2, status: "completed", total_hours: 1, total_cost: 50, hourly_rate: 50 }]);
  const response = await PUT(request("PUT", { id: 2, clock_out_time: "2026-10-05T13:00:00Z" }));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ timeEntry: { id: 2, status: "completed", total_hours: 1 } });
});
it.each([GET, POST, PUT, DELETE])("rejects customer sessions before database access", async (handler) => {
  mocks.user.mockResolvedValue({ role: "customer" });
  expect((await handler(request(handler === GET ? "GET" : "POST", handler === GET ? null : { id: 7 }))).status).toBe(403);
  expect(mocks.db).not.toHaveBeenCalled();
});
it("requires CSRF for cookie-authenticated writes", async () => {
  const req = new Request("https://example.test/api/time-tracking", { method: "POST", headers: { cookie: "admin_session=token", "Content-Type": "application/json" }, body: JSON.stringify({ team_member_id: 7 }) });
  expect((await POST(req)).status).toBe(403);
  expect(mocks.db).not.toHaveBeenCalled();
});
it.each(["0", "7abc", "-1", "9007199254740993"])("rejects malformed requested member %s", async (id) => {
  expect((await GET(request("GET", null, `?team_member_id=${id}`))).status).toBe(400);
  expect(mocks.db).not.toHaveBeenCalled();
});
