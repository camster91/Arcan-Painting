import { beforeEach, describe, expect, test, vi } from "vitest";

const { sql, tx } = vi.hoisted(() => {
  const sql = vi.fn();
  sql.transaction = vi.fn();
  return { sql, tx: vi.fn() };
});

vi.mock("@/app/api/utils/sql.js", () => ({ default: sql }));

const { addCredits, deductCredits } = await import("@/app/api/utils/credits-db.js");

function queryText(strings) {
  return strings.join(" ").replace(/\s+/g, " ");
}

describe("credits ledger", () => {
  beforeEach(() => {
    sql.mockReset();
    sql.mockResolvedValue([]);
    sql.transaction.mockReset();
    tx.mockReset();
    sql.transaction.mockImplementation((callback) => callback(tx));
  });

  test("records a Stripe checkout and credits its authenticated account in one transaction", async () => {
    tx.mockImplementation((strings) => {
      const text = queryText(strings);
      if (text.includes("INSERT INTO credit_transactions")) return [{ id: 1 }];
      if (text.includes("INSERT INTO credits")) return [{ balance: 100 }];
      throw new Error(`Unexpected query: ${text}`);
    });

    await expect(addCredits("17", 100, "purchase", "Purchased credits_100", "cs_123")).resolves.toBe(100);
    expect(sql.transaction).toHaveBeenCalledOnce();
    expect(tx).toHaveBeenCalledWith(expect.any(Array), "17", 100, "purchase", "Purchased credits_100", "cs_123");
  });

  test("does not credit the same completed Stripe checkout twice", async () => {
    tx.mockImplementation((strings) => {
      const text = queryText(strings);
      if (text.includes("INSERT INTO credit_transactions")) return [];
      if (text.includes("SELECT balance")) return [{ balance: 100 }];
      if (text.includes("INSERT INTO credits")) throw new Error("duplicate checkout must not change balance");
      throw new Error(`Unexpected query: ${text}`);
    });

    await expect(addCredits("17", 100, "purchase", "Purchased credits_100", "cs_123")).resolves.toBe(100);
    expect(sql.transaction).toHaveBeenCalledOnce();
  });

  test("does not allow a deduction below the available balance", async () => {
    tx.mockImplementation((strings) => {
      const text = queryText(strings);
      if (text.includes("UPDATE credits")) return [];
      if (text.includes("SELECT balance")) return [{ balance: 20 }];
      throw new Error(`Unexpected query: ${text}`);
    });

    await expect(deductCredits("17", 25, "chat message")).rejects.toThrow("Insufficient credits: have 20, need 25");
  });
});
