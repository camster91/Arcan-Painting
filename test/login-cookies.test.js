import { describe, expect, it } from "vitest";
import { createLoginHeaders } from "@/app/api/utils/login-cookies";

describe("createLoginHeaders", () => {
  it("sends the session and CSRF cookies as separate Set-Cookie headers", () => {
    const headers = createLoginHeaders("admin_session=session-token", "arcan_csrf=csrf-token");
    const cookies = headers.getSetCookie?.() ?? headers.get("set-cookie").split(/, (?=arcan_csrf=)/);

    expect(cookies).toEqual(["admin_session=session-token", "arcan_csrf=csrf-token"]);
  });
});
