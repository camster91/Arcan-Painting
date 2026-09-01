import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
const sendEmail = vi.fn();
const getCurrentUser = vi.fn();
const hasPermission = vi.fn();
const requireCsrf = vi.fn();
const auditLog = vi.fn();

vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/send-email", () => ({ sendEmail }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser }));
vi.mock("@/app/api/utils/permissions", () => ({ hasPermission }));
vi.mock("@/app/api/utils/csrf", () => ({ requireCsrf }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog }));

const { POST } = await import("@/app/api/payments/[id]/receipt/route.js");

const request = () => new Request("https://example.test/api/payments/4/receipt", {
  method: "POST",
});

describe("payment receipt delivery controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireCsrf.mockReturnValue(null);
    getCurrentUser.mockResolvedValue({ id: 9, username: "staff", role: "office" });
  });

  test("blocks staff without finance write permission before loading payment data", async () => {
    hasPermission.mockReturnValue(false);

    const response = await POST(request(), { params: { id: "4" } });

    expect(response.status).toBe(403);
    expect(sql).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  test.each(["pending", "failed", "refunded"])(
    "does not email a %s payment receipt",
    async (status) => {
      hasPermission.mockReturnValue(true);
      sql.mockResolvedValueOnce([{
        id: 4,
        invoice_id: 8,
        client_email: "customer@example.test",
        status,
      }]);

      const response = await POST(request(), { params: { id: "4" } });

      expect(response.status).toBe(409);
      expect(sendEmail).not.toHaveBeenCalled();
      expect(auditLog).not.toHaveBeenCalled();
    },
  );
});
