import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import PremiumShell from "../src/components/premium/PremiumShell";

describe("premium footer links", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  });

  it("lists all six service pages and the navigation's page links", () => {
    const { container } = render(<PremiumShell />);
    const hrefs = (selector) => [...container.querySelectorAll(selector)].map((a) => a.getAttribute("href"));
    const footer = hrefs(".p-footer-links a");
    const servicePages = [
      "/interior-painting",
      "/wallpaper-services",
      "/specialty-finishes",
      "/commercial-painting",
      "/exterior-painting",
      "/projects",
    ];
    expect(footer).toEqual(expect.arrayContaining(servicePages));
    // Telephone actions are not service pages in the footer navigation.
    const navigationPages = hrefs("#premium-navigation a")
      .filter((href) => href?.startsWith("/") && href !== "/contact");
    for (const href of navigationPages) expect(footer).toContain(href);
    expect(footer).toContain("/about");
    expect(footer).not.toContain("/admin");
  });
});
