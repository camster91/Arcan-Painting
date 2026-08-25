import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

function readProjectFile(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("public claim safety", () => {
  test("keeps unsupported proof points out of the homepage and crawler surfaces", () => {
    const homepage = readProjectFile("src/app/page.jsx");
    const hero = readProjectFile("src/components/HeroSection.jsx");
    const root = readProjectFile("src/app/root.tsx");
    const llms = readProjectFile("public/llms.txt");
    const seo = readProjectFile("src/utils/seoUtils.js");
    const publicSurfaces = [homepage, hero, root, llms, seo].join("\n");

    for (const unsupportedClaim of [
      "500+ Happy Clients",
      "Rating on Google",
      "25+Years Experience",
      "Fully Insured & Licensed",
      "2-Year Warranty",
      "5-Year Warranty",
      "aggregateRating",
    ]) {
      expect(publicSurfaces).not.toContain(unsupportedClaim);
    }

    expect(homepage).not.toContain("GoogleReviewsSection");
    expect(homepage).not.toContain("GuaranteeSection");
    expect(homepage).not.toContain("PricingSection");
  });
});
