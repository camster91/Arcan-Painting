import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Footer from "../src/components/Footer";

describe("legacy footer links", () => {
  it("points About to a real page and keeps Admin out of public navigation", () => {
    const { container } = render(<Footer />);
    const hrefs = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/about");
    expect(hrefs).not.toContain("/#about");
    expect(hrefs).not.toContain("/admin");
  });
});
