import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import LeadFormPopup from "../src/components/LeadFormPopup";

describe("legacy lead form service choices", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  });
  it("offers Wallpaper alongside the other advertised services", () => {
    render(<LeadFormPopup isOpen onClose={() => {}} />);
    for (const name of ["Interior", "Exterior", "Commercial", "Wallpaper", "Specialty Finishes"]) {
      expect(screen.getByRole("button", { name })).toBeTruthy();
    }
  });
});
