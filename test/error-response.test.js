import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { getSafeErrorResponse } from "../__create/error-response";

function createFailingApp() {
  const app = new Hono();
  app.onError((_error, context) => getSafeErrorResponse(context));
  app.get("/failure", () => {
    throw new Error("database password: should-never-reach-a-visitor");
  });
  app.post("/failure", () => {
    throw new Error("database password: should-never-reach-a-visitor");
  });
  return app;
}

describe("safe server error responses", () => {
  it("returns a no-index HTTP 500 page without GET error details", async () => {
    const response = await createFailingApp().request("/failure");
    const body = await response.text();

    expect(response.status).toBe(500);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(body).toContain('name="robots" content="noindex, nofollow"');
    expect(body).not.toContain("database password");
  });

  it("returns a generic HTTP 500 JSON response for mutations", async () => {
    const response = await createFailingApp().request("/failure", { method: "POST" });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "An unexpected error occurred",
    });
  });
});
