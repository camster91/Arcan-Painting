import { describe, expect, it, vi } from "vitest";
import { ensureCustomerForLead } from "@/app/api/utils/customers";

const text = (call) => call[0].join("?");

describe("ensureCustomerForLead", () => {
  it("returns the existing link without writing", async () => {
    const db = vi.fn().mockResolvedValueOnce([{ id: 1, customer_id: 9 }]);
    await expect(ensureCustomerForLead(db, 1)).resolves.toBe(9);
    expect(db).toHaveBeenCalledOnce();
  });

  it("joins a customer with the same email", async () => {
    const db = vi.fn()
      .mockResolvedValueOnce([{ id: 2, name: "Sam", email: " Sam@Example.test ", phone: null, customer_id: null }])
      .mockResolvedValueOnce([{ id: 5 }])
      .mockResolvedValueOnce([]);
    await expect(ensureCustomerForLead(db, 2)).resolves.toBe(5);
    expect(db.mock.calls[1][1]).toBe("sam@example.test");
    expect(text(db.mock.calls[2])).toContain("UPDATE leads SET customer_id");
  });

  it("matches on phone digits when there is no email match", async () => {
    const db = vi.fn()
      .mockResolvedValueOnce([{ id: 3, name: "Ana", email: "", phone: "(416) 555-0100", customer_id: null }])
      .mockResolvedValueOnce([{ id: 7, phone: "416-555-0100" }])
      .mockResolvedValueOnce([]);
    await expect(ensureCustomerForLead(db, 3)).resolves.toBe(7);
  });

  it("creates a customer when nothing matches", async () => {
    const db = vi.fn()
      .mockResolvedValueOnce([{ id: 4, name: "Lee", email: "lee@example.test", phone: "", address: "1 Main", customer_id: null }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 11 }])
      .mockResolvedValueOnce([]);
    await expect(ensureCustomerForLead(db, 4)).resolves.toBe(11);
    expect(text(db.mock.calls[2])).toContain("INSERT INTO customers");
  });
});
