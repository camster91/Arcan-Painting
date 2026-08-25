import { afterEach, describe, expect, test } from "vitest";
import { getClientIp } from "@/app/api/utils/rate-limit";

const originalTrustProxy = process.env.TRUST_PROXY;

afterEach(() => {
  if (originalTrustProxy === undefined) delete process.env.TRUST_PROXY;
  else process.env.TRUST_PROXY = originalTrustProxy;
});

describe("rate-limit proxy trust", () => {
  test("does not trust caller-provided forwarding headers by default", () => {
    delete process.env.TRUST_PROXY;
    const request = new Request("https://arcanpainting.ca/api/local-auth/login", {
      headers: { "x-forwarded-for": "198.51.100.3", "x-real-ip": "198.51.100.4" },
    });

    expect(getClientIp(request)).toBe("direct");
  });

  test("uses the proxy-provided client IP only when explicitly enabled", () => {
    process.env.TRUST_PROXY = "true";
    const request = new Request("https://arcanpainting.ca/api/local-auth/login", {
      headers: { "x-forwarded-for": "198.51.100.3, 10.0.0.2" },
    });

    expect(getClientIp(request)).toBe("198.51.100.3");
  });
});
