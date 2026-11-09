import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PremiumInquiry from "./PremiumInquiry";
import ProjectGallery from "./ProjectGallery";

vi.mock("@/utils/analytics", () => ({ getAttribution: () => ({}), trackEvent: vi.fn() }));
afterEach(() => { cleanup(); window.history.replaceState({}, "", "/"); vi.unstubAllGlobals(); });

describe("project enquiry context", () => {
  it("preserves an approved project and its service in the enquiry", async () => {
    window.history.replaceState({}, "", "/contact?project=floral-feature-wall.webp");
    const { container } = render(<PremiumInquiry />);
    await waitFor(() => expect(screen.getByLabelText("Service")).toHaveValue("wallpaper"));
    expect(screen.getByText(/Inspired by: Floral feature wall and sage trim/)).toBeInTheDocument();
    expect(container.querySelector('details')).not.toHaveAttribute("open");
    fireEvent.change(screen.getByLabelText("Approximate budget (optional)"), { target: { value: "12000" } });
    container.querySelector('details').open = true;
    container.querySelector('details').open = false;
    expect(screen.getByLabelText("Approximate budget (optional)")).toHaveValue("12000");
  });
  it("ignores an unknown project rather than reflecting arbitrary URL text", () => {
    window.history.replaceState({}, "", "/contact?project=UNAPPROVED_PROJECT");
    render(<PremiumInquiry />);
    expect(screen.queryByText(/UNAPPROVED_PROJECT/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Service")).toHaveValue("interior");
  });
  it("opens a linked gallery image in the matching service filter and restores focus on close", async () => {
    vi.stubGlobal("requestAnimationFrame", (callback) => { callback(); return 1; });
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value() { this.setAttribute("open", ""); } });
    Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value() { this.removeAttribute("open"); } });
    window.history.replaceState({}, "", "/projects?photo=floral-feature-wall.webp#gallery");
    const { container } = render(<ProjectGallery />);
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAttribute("open"));
    expect(screen.getByRole("button", { name: "Wallpaper", exact: true })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("link", { name: "Enquire about a similar project" })).toHaveAttribute("href", "/contact?project=floral-feature-wall.webp");
    fireEvent.click(screen.getByRole("button", { name: "Close image viewer" }));
    expect(container.querySelector('a[data-gallery-file="floral-feature-wall.webp"]')).toHaveFocus();
    delete HTMLDialogElement.prototype.showModal;
    delete HTMLDialogElement.prototype.close;
  });
});
