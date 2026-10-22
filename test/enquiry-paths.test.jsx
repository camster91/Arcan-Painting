import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import ServiceInquiryPage from "@/components/ServiceInquiryPage";
import QuoteCalculatorSection from "@/components/QuoteCalculatorSection";
import { ENQUIRY_SERVICES } from "@/utils/enquiryServices";

vi.mock("@/components/Header", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("@/utils/analytics", () => ({ trackEvent: vi.fn(), getAttribution: () => ({ utmSource: "fixture" }) }));
afterEach(cleanup);

describe("service enquiry entry points", () => {
  for (const service of ENQUIRY_SERVICES.filter((item) => item.pageName)) {
    for (const label of ["Discuss Your Project", "Contact the Team"]) {
      it(`${service.pageName}: ${label} opens with service context and returns focus`, () => {
        render(<ServiceInquiryPage serviceName={service.pageName} />);
        const trigger = screen.getByRole("button", { name: label });
        trigger.focus();
        fireEvent.click(trigger);
        expect(screen.getByRole("dialog")).toBeVisible();
        expect(screen.getByRole("button", { name: service.label, exact: true })).toHaveAttribute("aria-pressed", "true");
        fireEvent.keyDown(document, { key: "Escape" });
        expect(screen.queryByRole("dialog")).toBeNull();
        expect(trigger).toHaveFocus();
      });
    }
  }
});

it("calculator enquiry retains editable planning inputs across close/reopen without changing the URL", () => {
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
  render(<QuoteCalculatorSection />);
  const originalUrl = window.location.href;
  fireEvent.click(screen.getByRole("button", { name: /Exterior/ }));
  const trigger = screen.getByRole("button", { name: "Lock in a free exact quote" });
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = within(screen.getByRole("dialog"));
  expect(dialog.getByRole("button", { name: "Exterior", exact: true })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(dialog.getByRole("button", { name: "Exterior", exact: true }));
  fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Fixture Person" } });
  fireEvent.click(screen.getByRole("button", { name: "Go to next step" }));
  fireEvent.click(screen.getByRole("button", { name: /Email/ }));
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "fixture@example.test" } });
  fireEvent.click(screen.getByRole("button", { name: "Go to next step" }));
  expect(screen.getByRole("textbox").value).toContain("600 sq ft; 3 rooms; standard paint; 2 coats");
  fireEvent.keyDown(document, { key: "Escape" });
  expect(trigger).toHaveFocus();
  fireEvent.click(trigger);
  expect(screen.getAllByRole("dialog")).toHaveLength(1);
  expect(window.location.href).toBe(originalUrl);
  vi.unstubAllGlobals();
});
