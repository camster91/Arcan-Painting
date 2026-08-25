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
    const faq = readProjectFile("src/components/FAQSection.jsx");
    const chat = readProjectFile("src/app/api/utils/gemini.js");
    const quote = readProjectFile("src/app/api/quote/route.js");
    const cityServiceRoute = readProjectFile("src/app/[service]/[city]/page.jsx");
    const sitemap = readProjectFile("src/app/sitemap.xml/route.js");
    const header = readProjectFile("src/components/Header.jsx");
    const footer = readProjectFile("src/components/Footer.jsx");
    const serviceInquiry = readProjectFile("src/components/ServiceInquiryPage.jsx");
    const services = readProjectFile("src/components/ServicesSection.jsx");
    const contact = readProjectFile("src/components/ContactSection.jsx");
    const leadPopup = readProjectFile("src/components/LeadFormPopup.jsx");
    const servicePages = [
      "src/app/interior-painting/page.jsx",
      "src/app/exterior-painting/page.jsx",
      "src/app/commercial-painting/page.jsx",
      "src/app/wallpaper-services/page.jsx",
      "src/app/specialty-finishes/page.jsx",
    ].map(readProjectFile);
    const publicSurfaces = [homepage, hero, root, llms, seo, faq, chat, quote, cityServiceRoute, sitemap, header, footer, serviceInquiry, services, contact, leadPopup, ...servicePages].join("\n");

    for (const unsupportedClaim of [
      "500+ Happy Clients",
      "Rating on Google",
      "25+Years Experience",
      "Fully Insured & Licensed",
      "2-Year Warranty",
      "5-Year Warranty",
      "aggregateRating",
      "fully licensed",
      "comprehensive liability insurance",
      "free on-site estimate within 48 hours",
      "typically within 24 hours",
      "Serving ${city.name} since 1995",
      "Free colour consultation",
      "Serving 30 Cities Across Ontario",
      "Family-owned business with generations of craftsmanship",
      "Get Free Estimate",
      "Get Free Quote",
    ]) {
      expect(publicSurfaces).not.toContain(unsupportedClaim);
    }

    expect(homepage).not.toContain("GoogleReviewsSection");
    expect(homepage).not.toContain("GuaranteeSection");
    expect(homepage).not.toContain("PricingSection");
    expect(cityServiceRoute).toContain('content: "noindex, follow"');
    expect(sitemap).not.toContain("cityServiceUrls");
  });
});
