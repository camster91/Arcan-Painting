import { describe, expect, it } from "vitest";
import { CITY_SLUGS, SERVICE_SLUGS } from "@/app/[service]/[city]/page";
import { GET } from "@/app/sitemap.xml/route";

describe("service-area sitemap", () => {
  it("contains every supported service and city combination exactly once", async () => {
    const response = await GET();
    const sitemap = await response.text();
    const cityServiceUrls = [...sitemap.matchAll(/<loc>https:\/\/arcanpainting\.ca\/(?:interior-painting|exterior-painting|commercial-painting|wallpaper-services|specialty-finishes)\//g)];

    expect(response.headers.get("Content-Type")).toContain("application/xml");
    expect(cityServiceUrls).toHaveLength(CITY_SLUGS.length * Object.keys(SERVICE_SLUGS).length);
    expect(sitemap).toContain("https://arcanpainting.ca/interior-painting/toronto");
  });
});
