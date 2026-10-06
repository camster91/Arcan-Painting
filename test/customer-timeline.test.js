import { beforeEach, describe, expect, it, vi } from "vitest";
import { compileMysql } from "@/app/api/utils/mysql-dialect";
import { loadCustomerTimeline, timelineQueries } from "@/app/api/utils/customer-timeline";
import { GET } from "@/app/api/leads/[id]/timeline/route";

const mocks = vi.hoisted(() => ({ user: vi.fn(), db: vi.fn(), limiter: vi.fn() }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/app/api/utils/sql", () => ({ default: mocks.db }));
vi.mock("@/app/api/utils/rate-limit", () => ({ generalLimiter: mocks.limiter }));
const request = () => new Request("https://example.test/api/leads/7/timeline");
const get = (id = "7") => GET(request(), { params: { id } });

describe("internal customer timeline security", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue({ id: 1, role: "owner" }); mocks.limiter.mockReturnValue(null); mocks.db.mockResolvedValue([]); });
  it("rejects anonymous sessions without reading customer records", async () => {
    mocks.user.mockResolvedValue(null);
    expect((await get()).status).toBe(401);
    expect(mocks.db).not.toHaveBeenCalled();
  });
  it.each(["painter", "crew", "customer", "estimator", "project_manager", "finance_readonly", "office", "unknown"])("rejects %s before reading records", async (role) => {
    mocks.user.mockResolvedValue({ role });
    expect((await get()).status).toBe(403);
    expect(mocks.db).not.toHaveBeenCalled();
  });
  it.each(["0", "-1", "7abc", "1.5", "9007199254740993"])("rejects invalid identifier %s", async (id) => {
    expect((await get(id)).status).toBe(400);
    expect(mocks.db).not.toHaveBeenCalled();
  });
  it("does not load activity for a missing or deleted lead", async () => {
    expect((await get()).status).toBe(404);
    expect(mocks.db).toHaveBeenCalledTimes(1);
    expect(mocks.db.mock.calls[0][0].join("?")).toContain("deleted_at IS NULL");
  });
  it.each(["owner", "admin"])("allows %s and prevents caching", async (role) => {
    mocks.user.mockResolvedValue({ role });
    mocks.db.mockResolvedValueOnce([{ id: 7, name: "Customer" }]);
    const response = await get();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toMatchObject({ visibility: "internal", events: [] });
  });
  it("fails visibly rather than dropping a failed event source", async () => {
    mocks.db.mockResolvedValueOnce([{ id: 7 }]).mockRejectedValueOnce(new Error("private database detail"));
    const response = await get();
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("private database detail");
  });
  it("honours rate limiting before authentication or data access", async () => {
    mocks.limiter.mockReturnValue(new Response(null, { status: 429 }));
    expect((await get()).status).toBe(429);
    expect(mocks.user).not.toHaveBeenCalled();
  });
});

describe("portable persisted event projection", () => {
  it("compiles every parameterized query through main's MySQL adapter", () => {
    for (const source of timelineQueries) {
      const compiled = compileMysql(source.query, [7]);
      expect(compiled).toBeDefined();
      expect(source.query).toContain("ORDER BY");
      expect(source.query).toContain("LIMIT 201");
      expect(source.query).not.toMatch(/::|FILTER|LATERAL/);
    }
  });
  it("scopes communication by explicit entity links and omits mailbox/error contents", () => {
    const query = timelineQueries.find((source) => source.type === "email").query;
    expect(query).toContain("related_type = 'estimate'");
    expect(query).not.toMatch(/to_email|from_email|subject|error_message|metadata/);
  });
  it("sorts milestones deterministically, labels visibility and keeps stable IDs on retries", async () => {
    const db = vi.fn(async (query) => query.includes("FROM leads WHERE") ? [{ id: 7, detail: "website", amount: null, occurred_at: "2026-10-01T10:00:00Z" }] : query.includes("accepted_at AS") ? [{ id: 2, detail: "E-2", amount: "123.45", actor_id: 9, occurred_at: "2026-10-05T10:00:00Z" }] : []);
    const first = await loadCustomerTimeline(db, 7);
    const second = await loadCustomerTimeline(db, 7);
    expect(first).toEqual(second);
    expect(first.events.map((event) => event.id)).toEqual(["estimate:2:accepted", "lead:7:created"]);
    expect(first.events[0]).toMatchObject({ visibility: "internal", actor: null, amount: "123.45" });
    expect(db.mock.calls.every(([, params]) => params[0] === 7)).toBe(true);
  });
  it("caps results and reports truncation", async () => {
    const db = vi.fn(async (query) => query.includes("FROM leads WHERE") ? Array.from({ length: 201 }, (_, id) => ({ id, occurred_at: "2026-10-01T10:00:00Z" })) : []);
    const result = await loadCustomerTimeline(db, 7);
    expect(result.events).toHaveLength(200);
    expect(result.truncated).toBe(true);
  });
});
