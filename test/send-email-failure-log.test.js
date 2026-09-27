import { describe, expect, it, vi } from "vitest";
import { compileMysql } from "@/app/api/utils/mysql-dialect";

const sql = vi.fn().mockResolvedValue([]);
vi.mock("@/app/api/utils/sql", () => ({ default: sql }));

const { sendEmail } = await import("@/app/api/utils/send-email");

describe("sendEmail without a Maton key", () => {
  it("logs the failure with string literals, not identifiers", async () => {
    delete process.env.MATON_API_KEY;
    await expect(sendEmail({ to: "a@example.test", subject: "Hi", html: "<p>x</p>" })).rejects.toThrow(/MATON_API_KEY/);

    const [strings, ...values] = sql.mock.calls[0];
    const text = strings.reduce((acc, s, i) => acc + (i ? `$${i}` : "") + s, "");
    expect(text).toContain("'failed'");
    expect(text).not.toContain('"failed"');
    const compiled = compileMysql(text, values);
    expect(compiled.text).toContain("'failed'");
    expect(compiled.text).not.toContain("`failed`");
  });
});
