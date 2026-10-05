import { beforeEach, describe, expect, it, vi } from "vitest";
import { compileMysql } from "@/app/api/utils/mysql-dialect";
import { customerActivityDDL } from "@/migrations/002-customer-activity";
import { saveCustomerNote } from "@/app/api/utils/customer-activity";
import { POST } from "@/app/api/leads/[id]/notes/route";
import { PUT } from "@/app/api/leads/route";

const mocks = vi.hoisted(() => ({ db: Object.assign(vi.fn(), { transaction: vi.fn() }), user: vi.fn() }));
vi.mock("@/app/api/utils/sql", () => ({ default: mocks.db }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser: mocks.user, requireAdmin: vi.fn(), parseCookies: (value) => Object.fromEntries((value || "").split(";").filter(Boolean).map((part) => part.trim().split("="))) }));
vi.mock("@/app/api/utils/rate-limit", () => ({ generalLimiter: () => null }));
vi.mock("@/app/api/utils/validate", () => ({ schemas: {}, validateBody: async (request) => [await request.json(), null] }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog: vi.fn() }));
vi.mock("@/app/api/utils/customers", () => ({ ensureCustomerForLead: vi.fn().mockResolvedValue(42) }));
const user = { id: 1, username: "Office staff", role: "admin" };
const key = "save-request-123456789";
const headers = { "Content-Type": "application/json", cookie: "arcan_csrf=token", "x-csrf-token": "token" };
const noteRequest = (body = { text: "Call completed", requestId: key }, extra = {}) => new Request("https://example.test/api/leads/7/notes", { method: "POST", headers: { ...headers, ...extra }, body: JSON.stringify(body) });

function transactionStore({ deleted = false, failInsert = false } = {}) {
  const events = [];
  const queries = [];
  const tx = vi.fn(async (parts, ...values) => {
    const query = typeof parts === "string" ? parts : parts.join("?");
    queries.push(query);
    if (query.includes("FROM leads")) return deleted ? [] : [{ id: 7, status: "new" }];
    if (query.includes("SELECT id, content_hash")) return events.filter((event) => event.event_key === values[0]);
    if (query.includes("INSERT INTO customer_activity_events")) {
      if (failInsert) throw new Error("Insert unavailable");
      const [event_key, content_hash, lead_id, type, summary, actor_id, actor_name] = values;
      const row = { id: events.length + 1, event_key, content_hash, lead_id, type, summary, actor_id, actor_name };
      events.push(row); return [row];
    }
    if (query.includes("UPDATE leads")) return [{ id: 7, status: "contacted" }];
    return [];
  });
  const db = { transaction: vi.fn(async (callback) => callback(tx)) };
  return { events, queries, tx, db };
}

describe("persisted customer notes", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue(user); });
  it("saves author snapshots and replays an identical request once", async () => {
    const store = transactionStore();
    const input = { leadId: 7, key, text: "Call completed", user };
    expect(await saveCustomerNote(store.db, input)).toEqual({ id: 1, replayed: false });
    expect(await saveCustomerNote(store.db, input)).toEqual({ id: 1, replayed: true });
    expect(store.events).toHaveLength(1);
    expect(store.events[0]).toMatchObject({ lead_id: 7, actor_id: 1, actor_name: "Office staff", summary: "Call completed", type: "staff_note" });
    expect(store.queries[0]).toContain("FOR UPDATE");
  });
  it("rejects changed content with the same save key", async () => {
    const store = transactionStore();
    await saveCustomerNote(store.db, { leadId: 7, key, text: "First", user });
    expect(await saveCustomerNote(store.db, { leadId: 7, key, text: "Changed", user })).toMatchObject({ status: 409 });
    expect(store.events).toHaveLength(1);
  });
  it("scopes save keys to the lead and author", async () => {
    const store = transactionStore();
    for (const input of [{ leadId: 7, user }, { leadId: 8, user }, { leadId: 7, user: { ...user, id: 2 } }]) await saveCustomerNote(store.db, { ...input, key, text: "Call" });
    expect(new Set(store.events.map((event) => event.event_key)).size).toBe(3);
  });
  it("rejects deleted leads and propagates insertion failure", async () => {
    const deleted = transactionStore({ deleted: true });
    expect(await saveCustomerNote(deleted.db, { leadId: 7, key, text: "Call", user })).toMatchObject({ status: 404 });
    expect(deleted.events).toHaveLength(0);
    await expect(saveCustomerNote(transactionStore({ failInsert: true }).db, { leadId: 7, key, text: "Call", user })).rejects.toThrow("Insert unavailable");
  });
  it("compiles the additive schema for MariaDB", () => {
    for (const query of customerActivityDDL) expect(compileMysql(query).text).toContain("customer_activity");
    expect(compileMysql(customerActivityDDL[0]).text).toContain("AUTO_INCREMENT");
  });
  it.each([null, { role: "crew" }, { role: "customer" }])("rejects unauthorized sessions without a transaction", async (session) => {
    mocks.user.mockResolvedValue(session);
    expect((await POST(noteRequest(), { params: { id: "7" } })).status).toBe(session ? 403 : 401);
    expect(mocks.db.transaction).not.toHaveBeenCalled();
  });
  it("requires matching CSRF tokens", async () => {
    expect((await POST(noteRequest(undefined, { "x-csrf-token": "wrong" }), { params: { id: "7" } })).status).toBe(403);
    expect(mocks.db.transaction).not.toHaveBeenCalled();
  });
  it.each([{ text: " ", requestId: key }, { text: "a".repeat(2001), requestId: key }, { text: "Call", requestId: "short" }])("validates note content and save key", async (body) => {
    expect((await POST(noteRequest(body), { params: { id: "7" } })).status).toBe(400);
    expect(mocks.db.transaction).not.toHaveBeenCalled();
  });
  it("acknowledges replay without creating duplicate notes", async () => {
    const store = transactionStore(); mocks.db.transaction.mockImplementation(store.db.transaction);
    expect((await POST(noteRequest(), { params: { id: "7" } })).status).toBe(201);
    const response = await POST(noteRequest(), { params: { id: "7" } });
    expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ replayed: true });
    expect(store.events).toHaveLength(1);
  });
});

describe("transactional lead status history", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue(user); });
  const update = (status) => PUT(new Request("https://example.test/api/leads", { method: "PUT", headers, body: JSON.stringify({ id: 7, status }) }));
  it("records changed status with the update inside the same transaction", async () => {
    const store = transactionStore(); mocks.db.transaction.mockImplementation(store.db.transaction);
    expect((await update("contacted")).status).toBe(200);
    expect(store.events[0]).toMatchObject({ type: "lead_status", summary: "Lead status changed from new to contacted", actor_id: 1 });
    expect(mocks.db).not.toHaveBeenCalled();
  });
  it("does not append an event when the status is unchanged", async () => {
    const store = transactionStore(); mocks.db.transaction.mockImplementation(store.db.transaction);
    expect((await update("new")).status).toBe(200);
    expect(store.events).toHaveLength(0);
  });
  it("rejects the whole transaction when event insertion fails", async () => {
    const store = transactionStore({ failInsert: true }); mocks.db.transaction.mockImplementation(store.db.transaction);
    expect((await update("contacted")).status).toBe(500);
    await expect(store.db.transaction.mock.results[0].value).rejects.toThrow("Insert unavailable");
  });
});
