import { describe, expect, it } from "vitest";
import { buildStructuredData, getPublicSeo } from "@/utils/publicSeo";

describe("public SEO policy", () => {
  it("gives indexable pages unique canonical metadata", () => {
    const routes = ["/", "/interior-painting", "/exterior-painting", "/commercial-painting", "/wallpaper-services", "/specialty-finishes", "/contact", "/quote", "/privacy"];
    const pages = routes.map(getPublicSeo);
    expect(new Set(pages.map((page) => page.title)).size).toBe(routes.length);
    expect(new Set(pages.map((page) => page.description)).size).toBe(routes.length);
    expect(pages.every((page) => page.indexable && page.canonical.startsWith("https://arcanpainting.ca/"))).toBe(true);
  });

  it("keeps private, completion, unknown, and generated location pages out of search", () => {
    for (const route of ["/admin", "/account/signin", "/thank-you", "/missing", "/interior-painting/toronto"]) {
      expect(getPublicSeo(route).indexable, route).toBe(false);
    }
  });

  it("emits visible-fact business, service, webpage, website, and breadcrumb entities", () => {
    const data = buildStructuredData(getPublicSeo("/interior-painting"));
    const types = data["@graph"].map((entity) => entity["@type"]);
    expect(types).toEqual(expect.arrayContaining(["ProfessionalService", "WebSite", "WebPage", "Service", "BreadcrumbList", "FAQPage"]));
    const keys = [];
    JSON.stringify(data, (key, value) => { if (key) keys.push(key); return value; });
    expect(keys).not.toEqual(expect.arrayContaining(["aggregateRating", "review", "address", "openingHours", "priceRange", "areaServed"]));
  });
});
