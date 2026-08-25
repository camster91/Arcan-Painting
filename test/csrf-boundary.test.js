import { describe, expect, test } from "vitest";
import { shouldRequireCsrf } from "@/app/api/utils/csrf";

describe("API CSRF boundary", () => {
  test("protects every unsafe request that uses the ambient admin session", () => {
    const request = new Request("https://arcanpainting.ca/api/projects", {
      method: "POST",
      headers: { cookie: "admin_session=session-token; arcan_csrf=csrf-token" },
    });

    expect(shouldRequireCsrf(request)).toBe(true);
  });

  test("does not impose a browser-CSRF check on safe, anonymous, or bearer requests", () => {
    expect(shouldRequireCsrf(new Request("https://arcanpainting.ca/api/projects"))).toBe(false);
    expect(shouldRequireCsrf(new Request("https://arcanpainting.ca/api/contact", { method: "POST" }))).toBe(false);
    expect(shouldRequireCsrf(new Request("https://arcanpainting.ca/api/agents/lead-qualifier", {
      method: "POST",
      headers: { authorization: "Bearer service-token" },
    }))).toBe(false);
  });
});
