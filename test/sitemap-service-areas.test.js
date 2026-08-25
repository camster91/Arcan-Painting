import { describe, expect, it } from "vitest";
import { GET } from "@/app/sitemap.xml/route";

describe("service-area sitemap", () => {
  it("does not advertise city-specific routes until coverage is verified", async () => {
    const response = await GET();
    const sitemap = await response.text();
    const cityServiceUrls = [...sitemap.matchAll(/<loc>https:\/\/arcanpainting\.ca\/(?:interior-painting|exterior-painting|commercial-painting|wallpaper-services|specialty-finishes)\//g)];

    expect(response.headers.get("Content-Type")).toContain("application/xml");
    expect(cityServiceUrls).toHaveLength(0);
    expect(sitemap).toContain("https://arcanpainting.ca/interior-painting");
  });
});
