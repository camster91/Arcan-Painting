// @vitest-environment node
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import sql from "../src/app/api/utils/sql.js";
import { closeMysql } from "../src/app/api/utils/mysql.js";
import { recordCheckoutPayment } from "../src/app/api/utils/stripe-payments.js";
import { POST, PUT, DELETE } from "../src/app/api/payments/route.js";

// Only auth, rate-limit and audit edges are isolated; routes, validation, SQL,
// transactions, locks and Stripe recording run their production implementations.
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser: async () => ({ id: 7, username: "fixture@example.test", role: "owner" }) }));
vi.mock("@/app/api/utils/rate-limit", () => ({ paymentLimiter: () => null, generalLimiter: () => null }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog: async () => {} }));

const enabled = process.env.ARCAN_PAYMENT_DB_TEST === "1";
if (enabled) {
  const url = new URL(process.env.DATABASE_URL || "http://missing");
  if (!["postgresql:", "mysql:"].includes(url.protocol) ||
      !["127.0.0.1", "localhost"].includes(url.hostname) ||
      url.pathname !== "/arcan_payments_ci" || process.env.ARCAN_DISPOSABLE_DB !== "1") {
    throw new Error("Payment database tests require explicit opt-in and an empty loopback arcan_payments_ci database");
  }
}

const createdTables = [];
const request = (method, body, id) => new Request(`http://example.test/api/payments${id ? `?id=${id}` : ""}`, {
  method, ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
});
const create = (amount = 100, invoiceId = 1, status = "cleared") => POST(request("POST", {
  invoice_id: invoiceId, payment_method: "cash", amount, payment_date: "2026-10-21", status,
}));
const update = (id, fields) => PUT(request("PUT", { id, ...fields }));
const remove = (id) => DELETE(request("DELETE", null, id));
const checkout = (id, amount = 100) => ({ id, payment_status: "paid", metadata: { invoice_id: "1" }, amount_total: amount * 100 });
const transaction = sql.transaction;

async function balance(invoiceId = 1) {
  const [invoice] = await sql`SELECT * FROM invoices WHERE id = ${invoiceId}`;
  const [{ paid }] = await sql`SELECT COALESCE(SUM(amount), 0) AS paid FROM payments WHERE invoice_id = ${invoiceId} AND status = 'cleared'`;
  expect(Number(invoice.amount_paid)).toBe(Number(paid));
  expect(Number(invoice.amount_due)).toBe(Number(invoice.total_amount) - Number(paid));
  return invoice;
}

describe.runIf(enabled)("payment writes on a disposable real database", () => {
  beforeAll(async () => {
    const schema = process.env.DATABASE_URL.startsWith("mysql:") ? "arcan_payments_ci" : "public";
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = ${schema} AND table_type = 'BASE TABLE'`;
    expect(tables, "Refuse to reuse a nonempty database").toHaveLength(0);
    // Production column types and the real invoice/payment FK. Unrelated app
    // tables are omitted; this is not a full migration/authentication fixture.
    await sql(`CREATE TABLE invoices (
      id SERIAL PRIMARY KEY, total_amount DECIMAL(12,2), amount_paid DECIMAL(12,2) DEFAULT 0,
      amount_due DECIMAL(12,2), status VARCHAR(50) DEFAULT 'sent',
      payment_status VARCHAR(50) DEFAULT 'unpaid', updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    createdTables.push("invoices");
    await sql(`CREATE TABLE payments (
      id SERIAL PRIMARY KEY, payment_number VARCHAR(50) UNIQUE NOT NULL,
      invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL, contract_id INTEGER,
      payment_method VARCHAR(50), payment_reference VARCHAR(255), amount DECIMAL(12,2), payment_date DATE,
      status VARCHAR(50), notes TEXT, processed_by VARCHAR(255), stripe_payment_intent_id VARCHAR(255),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    createdTables.push("payments");
    await sql(`CREATE TABLE notifications (
      id SERIAL PRIMARY KEY, type VARCHAR(50), title VARCHAR(255), message TEXT,
      related_type VARCHAR(50), related_id INTEGER, is_read BOOLEAN
    )`);
    createdTables.push("notifications");
  });

  beforeEach(async () => {
    await sql("DELETE FROM notifications");
    await sql("DELETE FROM payments");
    await sql("DELETE FROM invoices");
    await sql("INSERT INTO invoices(id,total_amount,amount_due) VALUES (1,1000,1000),(2,500,500)");
    let number = 1;
    // Keep the existing four-digit payment-number generator from introducing
    // unrelated random collisions into the concurrency regression fixture.
    vi.spyOn(Math, "random").mockImplementation(() => number++ / 9000);
  });
  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => {
    for (const table of createdTables.reverse()) await sql(`DROP TABLE ${table}`);
    await closeMysql();
  });

  it("serializes simultaneous cleared inserts without FK lock-upgrade deadlocks", async () => {
    // Widen the original stale-SUM window without changing the database lock.
    vi.spyOn(sql, "transaction").mockImplementation((fn) => transaction(async (tx) => fn(async (parts, ...values) => {
      const rows = await tx(parts, ...values);
      if (typeof parts !== "string" && parts.join("").includes("AS paid")) await new Promise(r => setTimeout(r, 30));
      return rows;
    })));
    const responses = await Promise.all(Array.from({ length: 8 }, () => create(100)));
    expect(responses.map(r => r.status)).toEqual(Array(8).fill(201));
    expect(Number((await balance()).amount_paid)).toBe(800);
  });

  it("reconciles concurrent amount edits, clearing, refunding, deletion and creation", async () => {
    const seeded = await Promise.all(Array.from({ length: 4 }, () => create(100)));
    const ids = await Promise.all(seeded.map(async r => (await r.json()).payment.id));
    const responses = await Promise.all([
      update(ids[0], { amount: 250 }), update(ids[1], { status: "refunded" }),
      remove(ids[2]), create(50), update(ids[3], { status: "pending" }),
    ]);
    expect(responses.map(r => r.status)).toEqual([200, 200, 200, 201, 200]);
    expect(Number((await balance()).amount_paid)).toBe(300);
    expect((await update(ids[3], { status: "cleared" })).status).toBe(200);
    expect(Number((await balance()).amount_paid)).toBe(400);
  });

  it("serializes Stripe retries with a manual payment and records one notification", async () => {
    const results = await Promise.all([
      ...Array.from({ length: 6 }, () => recordCheckoutPayment(sql, checkout("cs_fixture_1", 200))),
      create(100),
    ]);
    expect(results.slice(0, 6).filter(r => r.recorded)).toHaveLength(1);
    expect(results[6].status).toBe(201);
    expect(Number((await balance()).amount_paid)).toBe(300);
    expect(Number((await sql("SELECT COUNT(*) AS n FROM notifications"))[0].n)).toBe(1);
  });

  it.each(["create", "update", "delete", "stripe"])("rolls back %s when balance persistence fails", async (operation) => {
    const seed = await (await create(100)).json();
    const id = seed.payment.id;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(sql, "transaction").mockImplementation((fn) => transaction(async (tx) => fn(async (parts, ...values) => {
      const rows = await tx(parts, ...values);
      if (typeof parts !== "string" && /UPDATE invoices/.test(parts.join(""))) {
        // An actual database error after both writes must roll back both.
        await tx("SELECT * FROM deliberately_missing_payment_test_table");
      }
      return rows;
    })));
    if (operation === "stripe") {
      await expect(recordCheckoutPayment(sql, checkout("cs_rollback", 200))).rejects.toThrow();
    } else {
      const response = operation === "create" ? await create(200) : operation === "update" ? await update(id, { amount: 250 }) : await remove(id);
      expect(response.status).toBe(500);
    }
    const payments = await sql("SELECT id, amount FROM payments");
    expect(payments).toHaveLength(1);
    expect(Number(payments[0].amount)).toBe(100);
    expect(Number((await balance()).amount_paid)).toBe(100);
    expect(Number((await sql("SELECT COUNT(*) AS n FROM notifications"))[0].n)).toBe(0);
  });

  it("returns one success and one 404 for competing deletions", async () => {
    const { payment } = await (await create(100)).json();
    const responses = await Promise.all([remove(payment.id), remove(payment.id)]);
    expect(responses.map(r => r.status).sort()).toEqual([200, 404]);
    expect(Number((await balance()).amount_paid)).toBe(0);
  });

  it("retains paid/sent/cancelled transitions and contract-only records", async () => {
    const { payment } = await (await create(1000)).json();
    expect((await balance()).status).toBe("paid");
    await update(payment.id, { status: "refunded" });
    expect((await balance()).status).toBe("sent");
    await sql("UPDATE invoices SET status='cancelled' WHERE id=1");
    await update(payment.id, { status: "cleared" });
    expect((await balance()).status).toBe("cancelled");
    const standalone = await (await create(50, null)).json();
    expect((await update(standalone.payment.id, { amount: 60 })).status).toBe(200);
    expect((await remove(standalone.payment.id)).status).toBe(200);
  });

  it("does not block writes to another invoice", async () => {
    let release, locked;
    const gate = new Promise(r => { release = r; });
    const ready = new Promise(r => { locked = r; });
    const holder = transaction(async tx => {
      await tx`SELECT id FROM invoices WHERE id = ${1} FOR UPDATE`;
      locked(); await gate;
    });
    await ready;
    try { expect((await create(100, 2)).status).toBe(201); }
    finally { release(); await holder; }
    expect(Number((await balance(2)).amount_paid)).toBe(100);
  });

  it("handles missing invoice and payment records without writes", async () => {
    expect((await create(100, 99)).status).toBe(400);
    expect((await update(99999, { amount: 100 })).status).toBe(404);
    expect((await remove(99999)).status).toBe(404);
    expect(await recordCheckoutPayment(sql, { ...checkout("cs_missing"), metadata: { invoice_id: "99" } })).toMatchObject({ recorded: false });
    expect(Number((await balance()).amount_paid)).toBe(0);
  });
});
