import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import PremiumShell from "../src/components/premium/PremiumShell";

describe("premium footer links", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  });

  it("lists every service from the main navigation", () => {
    const { container } = render(<PremiumShell />);
    const hrefs = (selector) => [...container.querySelectorAll(selector)].map((a) => a.getAttribute("href"));
    const footer = hrefs(".p-footer-links a");
    for (const href of hrefs("#premium-navigation a")) {
      if (href !== "/contact") expect(footer).toContain(href);
    }
    expect(footer).toContain("/about");
    expect(footer).not.toContain("/admin");
  });
});
