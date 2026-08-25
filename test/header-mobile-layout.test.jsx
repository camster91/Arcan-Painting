import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Header from "@/components/Header";

vi.mock("@/utils/useTheme", () => ({
  useTheme: () => ({ mounted: true }),
  getThemeColors: () => ({
    bg: "#fff",
    border: "#e2e8f0",
    text: "#0f172a",
    textSecondary: "#475569",
    bgSecondary: "#f8fafc",
  }),
}));

vi.mock("@/components/LeadFormPopup", () => ({ default: () => null }));

describe("Header mobile layout", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("max-width"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it("uses compact mobile dimensions and keeps the primary action on one line", () => {
    render(<Header />);

    expect(screen.getByAltText("Arcan Painting logo"))
      .toHaveClass("w-[120px]", "h-[66px]", "sm:w-[170px]", "sm:h-[95px]");
    expect(screen.getByRole("button", { name: /Get Free Estimate Get Quote/ }))
      .toHaveClass("text-sm", "px-3", "py-2");
    expect(screen.getByText("Get Quote")).toHaveClass("whitespace-nowrap");
  });
});
