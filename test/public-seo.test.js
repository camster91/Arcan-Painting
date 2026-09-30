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

describe("luxury market pages", () => {
  it("stay noindexed until a market is approved, with a real title", async () => {
    const { MARKET_SLUGS, MARKETS } = await import("@/data/markets");
    for (const slug of MARKET_SLUGS) {
      const seo = getPublicSeo(`/luxury-painting/${slug}`);
      expect(seo.title).toContain(MARKETS[slug].name);
      expect(seo.indexable).toBe(MARKETS[slug].approved);
    }
  });

  it("gives generated city routes a real title instead of Page Not Found", () => {
    const seo = getPublicSeo("/commercial-painting/vaughan");
    expect(seo.title).toBe("Commercial Painting Project Inquiry in Vaughan | Arcan Painting");
    expect(seo.indexable).toBe(false);
  });
});

describe("finish pages", () => {
  it("are indexable, have unique titles and appear in the sitemap", async () => {
    const { FINISH_SLUGS, finishPath } = await import("@/data/landingPages");
    const { GET } = await import("@/app/sitemap.xml/route");
    const xml = await (await GET()).text();
    const titles = new Set();
    for (const slug of FINISH_SLUGS) {
      const seo = getPublicSeo(finishPath(slug));
      expect(seo.indexable).toBe(true);
      titles.add(seo.title);
      expect(xml).toContain(finishPath(slug));
    }
    expect(titles.size).toBe(FINISH_SLUGS.length);
  });
});
