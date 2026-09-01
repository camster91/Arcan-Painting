import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("hero performance stability", () => {
  it("does not replace the LCP image on an automatic timer", () => {
    const source = readFileSync("src/components/HeroSection.jsx", "utf8");

    expect(source).not.toContain("setInterval(");
    expect(source).toContain("onClick={() => setCurrentSlide(i)}");
  });
});
