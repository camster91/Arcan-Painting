import { beforeEach, describe, expect, test, vi } from "vitest";

const { getCurrentUser, requireCsrf, checkoutCreate, getBalance, getTransactions } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  requireCsrf: vi.fn(),
  checkoutCreate: vi.fn(),
  getBalance: vi.fn(),
  getTransactions: vi.fn(),
}));

vi.mock("@/app/api/utils/auth.js", () => ({ getCurrentUser }));
vi.mock("@/app/api/utils/csrf.js", () => ({ requireCsrf }));
vi.mock("stripe", () => ({
  default: class Stripe {
    checkout = { sessions: { create: checkoutCreate } };
  },
}));
vi.mock("@/app/api/utils/credits-db.js", () => ({ getBalance, getTransactions }));

const { POST } = await import("@/app/api/credits/checkout/route.js");
const { GET } = await import("@/app/api/credits/route.js");

describe("credits checkout API", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    requireCsrf.mockReset();
    checkoutCreate.mockReset();
    getBalance.mockReset();
    getTransactions.mockReset();
  });

  test("rejects a missing CSRF token before inspecting the account or creating Stripe checkout", async () => {
    const csrfFailure = Response.json({ error: "CSRF token missing" }, { status: 403 });
    requireCsrf.mockReturnValue(csrfFailure);

    const response = await POST(new Request("https://arcanpainting.ca/api/credits/checkout", {
      method: "POST",
      body: JSON.stringify({ packageId: "credits_100" }),
    }));

    expect(response.status).toBe(403);
    expect(getCurrentUser).not.toHaveBeenCalled();
    expect(checkoutCreate).not.toHaveBeenCalled();
  });

  test("rejects anonymous checkout before creating a Stripe session", async () => {
    requireCsrf.mockReturnValue(null);
    getCurrentUser.mockResolvedValue(null);

    const response = await POST(new Request("https://arcanpainting.ca/api/credits/checkout", {
      method: "POST",
      body: JSON.stringify({ packageId: "credits_100" }),
    }));

    expect(response.status).toBe(401);
    expect(checkoutCreate).not.toHaveBeenCalled();
  });

  test("derives Stripe metadata from the authenticated admin, ignoring a forged body userId", async () => {
    requireCsrf.mockReturnValue(null);
    getCurrentUser.mockResolvedValue({ id: 17, role: "admin" });
    checkoutCreate.mockResolvedValue({ id: "cs_123", url: "https://checkout.stripe.test/session" });

    const response = await POST(new Request("https://arcanpainting.ca/api/credits/checkout", {
      method: "POST",
      body: JSON.stringify({ packageId: "credits_100", userId: "victim-account" }),
    }));

    expect(response.status).toBe(200);
    expect(checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({ user_id: "17" }),
    }));
  });

  test("returns the balance for the authenticated user that checkout credits", async () => {
    getCurrentUser.mockResolvedValue({ id: 17, role: "admin" });
    getBalance.mockResolvedValue(100);
    getTransactions.mockResolvedValue([]);

    const response = await GET(new Request("https://arcanpainting.ca/api/credits"));

    expect(response.status).toBe(200);
    expect(getBalance).toHaveBeenCalledWith("17");
    expect(getTransactions).toHaveBeenCalledWith("17", 20);
  });
});
