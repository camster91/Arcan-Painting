import { afterEach, describe, expect, test } from "vitest";
import { isTrustedInternalRequest } from "@/app/api/utils/auth";

const originalToken = process.env.INTERNAL_API_TOKEN;

afterEach(() => {
  if (originalToken === undefined) delete process.env.INTERNAL_API_TOKEN;
  else process.env.INTERNAL_API_TOKEN = originalToken;
});

describe("isTrustedInternalRequest", () => {
  test("rejects a request when the production token is not configured", () => {
    delete process.env.INTERNAL_API_TOKEN;
    expect(isTrustedInternalRequest(new Request("https://arcanpainting.ca/api/agents/lead-qualifier"))).toBe(false);
  });

  test("accepts only the configured internal token", () => {
    process.env.INTERNAL_API_TOKEN = "test-internal-token";

    expect(isTrustedInternalRequest(new Request("https://arcanpainting.ca/api/agents/lead-qualifier", {
      headers: { "x-internal-api-token": "wrong-token" },
    }))).toBe(false);
    expect(isTrustedInternalRequest(new Request("https://arcanpainting.ca/api/agents/lead-qualifier", {
      headers: { "x-internal-api-token": "test-internal-token" },
    }))).toBe(true);
  });
});
