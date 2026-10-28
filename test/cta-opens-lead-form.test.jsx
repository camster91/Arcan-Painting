import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";

vi.mock("../src/components/Header", () => ({ default: () => null }));
vi.mock("../src/components/Footer", () => ({ default: () => null }));
vi.mock("../src/components/LeadFormPopup", () => ({
  default: ({ isOpen, source }) => (isOpen ? <div role="dialog">form:{source}</div> : null),
}));

import ServiceInquiryPage from "../src/components/ServiceInquiryPage";
import QuoteCalculatorSection from "../src/components/QuoteCalculatorSection";

describe("enquiry CTAs open the lead form", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  });

  it("opens from the service page body buttons", () => {
    render(<MemoryRouter><ServiceInquiryPage serviceName="Interior Painting" /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Contact the Team" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("opens from the quote calculator final button", async () => {
    render(<MemoryRouter><QuoteCalculatorSection /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Lock in a free exact quote" }));
    await waitFor(() => expect(screen.getByRole("dialog").textContent).toContain("quote_calculator"));
  });
});
