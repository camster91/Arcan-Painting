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
});
