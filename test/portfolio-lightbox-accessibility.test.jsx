import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import PortfolioSection from "@/components/PortfolioSection";

class MockIntersectionObserver {
  observe() {}
  disconnect() {}
}

describe("PortfolioSection lightbox accessibility", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("focuses the close control and restores focus after Escape", () => {
    render(<PortfolioSection />);
    const trigger = screen.getAllByRole("button", { name: /open project photo/i })[0];
    trigger.focus();

    fireEvent.click(trigger);

    expect(screen.getByRole("dialog", { name: "Project photo viewer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "Project photo viewer" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("defers gallery thumbnails and prioritizes the opened project photo", () => {
    render(<PortfolioSection />);

    const thumbnails = screen
      .getAllByRole("img")
      .filter((image) => image.getAttribute("src")?.includes("/gallery/thumbnails/"));

    expect(thumbnails.length).toBeGreaterThan(0);
    for (const thumbnail of thumbnails) {
      expect(thumbnail).toHaveAttribute("loading", "lazy");
      expect(thumbnail).toHaveAttribute("decoding", "async");
    }

    fireEvent.click(screen.getAllByRole("button", { name: /open project photo/i })[0]);
    const lightboxImage = screen.getByRole("dialog", { name: "Project photo viewer" }).querySelector("img");

    expect(lightboxImage).toHaveAttribute("loading", "eager");
    expect(lightboxImage).toHaveAttribute("decoding", "async");
  });
});
