import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
const sendEmail = vi.fn();
const getCurrentUser = vi.fn();
const queueEmailWorkflows = vi.fn();
const hasPermission = vi.fn();
const auditLog = vi.fn();

vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/send-email", () => ({ sendEmail }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser }));
vi.mock("@/app/api/utils/email-workflows", () => ({ queueEmailWorkflows }));
vi.mock("@/app/api/utils/permissions", () => ({ hasPermission }));
vi.mock("@/app/api/utils/audit", () => ({ auditLog }));

const estimateRoute = await import("@/app/api/estimates/[id]/send/route");
const contractRoute = await import("@/app/api/contracts/[id]/send/route");
const invoiceRoute = await import("@/app/api/invoices/[id]/send/route");

describe("customer document send authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockResolvedValue({
      id: 4,
      username: "crew@example.test",
      role: "crew",
    });
    hasPermission.mockReturnValue(false);
  });

  test.each([
    ["estimate", estimateRoute.POST, "estimates.write"],
    ["contract", contractRoute.POST, "contracts.write"],
    ["invoice", invoiceRoute.POST, "finance.write"],
  ])(
    "blocks a logged-in user from sending a %s without permission",
    async (_name, handler, permission) => {
      const response = await handler(
        new Request("https://example.test/api/send", { method: "POST" }),
        { params: { id: "12" } },
      );
      expect(response.status).toBe(403);
      expect(hasPermission).toHaveBeenCalledWith(
        expect.objectContaining({ role: "crew" }),
        permission,
      );
      expect(sql).not.toHaveBeenCalled();
      expect(sendEmail).not.toHaveBeenCalled();
      expect(auditLog).not.toHaveBeenCalled();
    },
  );
});
