import { describe, expect, it, vi } from "vitest";

const transaction = vi.fn();
const sql = vi.fn();
sql.transaction = transaction;

vi.mock("@/app/api/utils/sql", () => ({ default: sql }));

const { insertLead } = await import("@/app/api/utils/insert-lead");

describe("insertLead", () => {
  it("creates the lead and its unread CRM notification in one transaction", async () => {
    const tx = vi.fn();
    tx.mockResolvedValueOnce([{ id: 42 }]).mockResolvedValueOnce([]);
    transaction.mockImplementation(async (callback) => callback(tx));

    await expect(insertLead({
      name: "Taylor Customer",
      email: "taylor@example.test",
      serviceType: "interior painting",
      leadSource: "website_contact",
    })).resolves.toBe(42);

    expect(transaction).toHaveBeenCalledOnce();
    expect(tx).toHaveBeenCalledTimes(2);
    const [notificationSql, message, email, relatedId, metadata] = tx.mock.calls[1];
    expect(notificationSql.join("")).toContain("INSERT INTO notifications");
    expect(notificationSql.join("")).toContain("'New lead received'");
    expect(message).toBe("Taylor Customer requested interior painting.");
    expect(email).toBe("taylor@example.test");
    expect(relatedId).toBe(42);
    expect(metadata).toContain("website_contact");
  });

  it("does not create a notification when lead insertion returns no id", async () => {
    const tx = vi.fn().mockResolvedValueOnce([]);
    transaction.mockImplementation(async (callback) => callback(tx));

    await expect(insertLead({
      name: "Taylor Customer",
      email: "taylor@example.test",
      serviceType: "interior painting",
    })).resolves.toBeNull();

    expect(tx).toHaveBeenCalledOnce();
  });
});
