import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/api/utils/auth.js", () => ({
  requireStaff: vi.fn(),
}));

const { requireStaff } = await import("@/app/api/utils/auth.js");
const { protectAdminRoute } = await import("@/app/admin/route-guard.server.js");

describe("admin route guard", () => {
  it("redirects unauthenticated requests and preserves the nested destination", async () => {
    requireStaff.mockResolvedValue(false);

    const response = await protectAdminRoute(
      new Request("https://arcanpainting.ca/admin/leads?status=new"),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      "/account/signin?callbackUrl=%2Fadmin%2Fleads%3Fstatus%3Dnew",
    );
  });

  it("allows an authenticated administrator through", async () => {
    requireStaff.mockResolvedValue(true);

    await expect(
      protectAdminRoute(new Request("https://arcanpainting.ca/admin/leads")),
    ).resolves.toBeNull();
  });
});
