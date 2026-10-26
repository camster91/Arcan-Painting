import { describe, expect, it } from "vitest";
import { buildStructuredData, getPublicSeo } from "@/utils/publicSeo";
import { PUBLIC_ROUTES } from "@/app/sitemap.xml/route";

describe("public SEO policy", () => {
  it("gives indexable pages unique canonical metadata", () => {
    const routes = ["/", "/interior-painting", "/exterior-painting", "/commercial-painting", "/wallpaper-services", "/specialty-finishes", "/contact", "/privacy"];
    const pages = routes.map(getPublicSeo);
    expect(new Set(pages.map((page) => page.title)).size).toBe(routes.length);
    expect(new Set(pages.map((page) => page.description)).size).toBe(routes.length);
    expect(pages.every((page) => page.indexable && page.canonical.startsWith("https://arcanpainting.ca/"))).toBe(true);
  });

  it("keeps the legacy quote route available as a canonical contact alias", () => {
    expect(getPublicSeo("/quote")).toMatchObject({
      canonical: "https://arcanpainting.ca/contact",
      indexable: true,
    });
    expect(PUBLIC_ROUTES.map(([path]) => path)).not.toContain("/quote");
    expect(PUBLIC_ROUTES.every(([path]) => getPublicSeo(path).indexable)).toBe(true);
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

    const business = data["@graph"].find((entity) => entity["@type"] === "ProfessionalService");
    expect(business.logo).toBe("https://arcanpainting.ca/brand/arcan-painting-logo.png");
    expect(business.sameAs).toEqual(expect.arrayContaining([
      "https://www.instagram.com/arcanpaint",
      "https://maps.app.goo.gl/WY8Rh5myeWX6JJhR6",
    ]));
  });
});
