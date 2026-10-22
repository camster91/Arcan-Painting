import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import Footer from "@/components/Footer";
import { GET } from "@/app/robots.txt/route";
import { isSavedEnquiry } from "@/utils/savedEnquiry";

afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

it("footer links use existing sections and permanent service routes without a public admin link", () => {
  render(<Footer />);
  expect(screen.getByRole("link", { name: "Our Process" })).toHaveAttribute("href", "/#process");
  expect(screen.queryByRole("link", { name: "About Us" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Admin" })).toBeNull();
  for (const route of ["interior-painting", "exterior-painting", "commercial-painting", "wallpaper-services", "specialty-finishes"]) {
    expect(document.querySelector(`a[href="/${route}"]`)).not.toBeNull();
  }
});

describe("robots crawler selection", () => {
  it("all search crawler groups inherit private-route exclusions and public discovery", async () => {
    const text = await (await GET()).text();
    const groups = text.split(/\n\n/).filter(group => group.startsWith("User-agent:"));
    for (const crawler of ["*", "Googlebot", "Bingbot", "OAI-SearchBot", "ChatGPT-User"]) {
      const group = groups.find(group => group.startsWith(`User-agent: ${crawler}\n`));
      expect(group).toBeTruthy();
      const exclusions = [...group.matchAll(/Disallow: (.+)/g)].map(match => match[1].replace(/\*$/, ""));
      for (const route of ["/admin", "/admin/leads", "/api/contact", "/account/signin", "/thank-you"]) {
        expect(exclusions.some(prefix => route.startsWith(prefix)), `${crawler}: ${route}`).toBe(true);
      }
      for (const route of ["/", "/interior-painting", "/quote", "/contact"]) {
        expect(exclusions.some(prefix => route.startsWith(prefix)), `${crawler}: ${route}`).toBe(false);
      }
    }
    expect(text).toContain("User-agent: GPTBot\nDisallow: /");
    expect(text).toContain("Sitemap: https://arcanpainting.ca/sitemap.xml");
  });
  it("isolated staging still blocks all crawlers", async () => {
    vi.stubEnv("PUBLIC_SITE_MODE", "staging");
    const response = await GET();
    expect(await response.text()).toBe("User-agent: *\nDisallow: /\n");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});

it("completed enquiry requires the saved contract and an insertion identifier", () => {
  for (const result of [null, {}, { success: true }, { success: true, lead_saved: false, lead_id: 1 }, { success: true, lead_saved: true }, { success: true, lead_saved: true, lead_id: 0 }]) expect(isSavedEnquiry(result)).toBe(false);
  expect(isSavedEnquiry({ success: true, lead_saved: true, lead_id: 123 })).toBe(true);
  expect(isSavedEnquiry({ success: true, lead_saved: true, lead_id: "123" })).toBe(true);
});
