import { describe, expect, it } from "vitest";
import { loader } from "@/app/[service]/[city]/page";

describe("city service route loader", () => {
  it("allows a supported service and city", () => {
    expect(loader({ params: { service: "interior-painting", city: "toronto" } })).toBeNull();
  });

  it("returns a real 404 response for an unsupported combination", () => {
    try {
      loader({ params: { service: "interior-painting", city: "not-a-service-area" } });
      throw new Error("Expected the loader to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      expect(error.status).toBe(404);
    }
  });
});
