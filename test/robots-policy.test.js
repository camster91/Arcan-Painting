import { describe, it, expect } from "vitest";
import { GET } from "../src/app/robots.txt/route.js";

describe("robots.txt policy", () => {
  it("applies private-path rules to every crawler and keeps the GPTBot training block", async () => {
    const text = await (await GET()).text();
    const groups = text.split(/\n\s*\n/).filter((g) => /User-agent:/i.test(g));
    const agents = groups.flatMap((g) => [...g.matchAll(/User-agent:\s*(.+)/gi)].map((m) => m[1].trim()));
    expect(agents.sort()).toEqual(["*", "GPTBot"]);
    for (const path of ["/admin", "/api/", "/account/", "/crew/", "/uploads/", "/thank-you"]) {
      expect(text).toContain(`Disallow: ${path}`);
    }
    expect(text).toMatch(/User-agent: GPTBot\nDisallow: \/\n/);
    expect(text).toContain("Sitemap: https://arcanpainting.ca/sitemap.xml");
  });
});
