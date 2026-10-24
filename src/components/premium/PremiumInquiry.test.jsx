import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PremiumInquiry from "./PremiumInquiry";

const { navigate, trackEvent, getAttribution } = vi.hoisted(() => ({
  navigate: vi.fn(),
  trackEvent: vi.fn(),
  getAttribution: vi.fn(() => ({ utmSource: "search", landingPage: "/" })),
}));
vi.mock("@/utils/analytics", () => ({ getAttribution, trackEvent }));

function complete() {
  fireEvent.change(screen.getByLabelText("Your name"), {
    target: { value: "Test Client" },
  });
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "client@example.test" },
  });
  fireEvent.change(screen.getByLabelText("Project location"), {
    target: { value: "Vaughan" },
  });
  fireEvent.change(screen.getByLabelText("Tell us about your project"), {
    target: { value: "A full residence painting project." },
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn());
  vi.stubGlobal("location", { assign: navigate });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("PremiumInquiry", () => {
  it("submits the existing API contract and attribution, then navigates without personal data", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, lead_saved: true }),
    });
    render(<PremiumInquiry initialService="wallpaper" />);
    complete();
    fireEvent.change(screen.getByLabelText("Approximate budget (optional)"), {
      target: { value: "15000" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Send project enquiry" }),
    );
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/thank-you"));
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe("/api/contact");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toMatchObject({
      name: "Test Client",
      email: "client@example.test",
      serviceType: "wallpaper",
      preferredContact: "email",
      address: "Vaughan",
      attribution: { utmSource: "search" },
    });
    expect(JSON.parse(options.body).projectDescription).toContain(
      "Approximate budget (CAD): 15000",
    );
    expect(JSON.stringify(trackEvent.mock.calls)).not.toContain(
      "client@example.test",
    );
    expect(JSON.stringify(trackEvent.mock.calls)).not.toContain("Test Client");
  });

  it("retains details and exposes an accessible retry error when persistence fails", async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Database unavailable" }),
    });
    render(<PremiumInquiry />);
    complete();
    fireEvent.click(
      screen.getByRole("button", { name: "Send project enquiry" }),
    );
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Your details are still here");
    expect(screen.getByLabelText("Your name")).toHaveValue("Test Client");
    expect(navigate).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Send project enquiry" }),
    ).toBeEnabled();
  });

  it.each([
    { success: true },
    { success: true, lead_saved: false },
    { success: true, lead_saved: "true" },
  ])("rejects an unconfirmed saved-enquiry response: %j", async (result) => {
    fetch.mockResolvedValue({ ok: true, json: async () => result });
    render(<PremiumInquiry />);
    complete();
    fireEvent.click(screen.getByRole("button", { name: "Send project enquiry" }));
    await screen.findByRole("alert");
    expect(navigate).not.toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalledWith("lead_submit_success", expect.anything());
    expect(screen.getByLabelText("Your name")).toHaveValue("Test Client");
  });

  it("requires the selected contact method and prevents duplicate requests while pending", async () => {
    let resolveRequest;
    fetch.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const { container } = render(<PremiumInquiry />);
    complete();
    fireEvent.change(
      screen.getByLabelText("How would you prefer us to respond?"),
      { target: { value: "phone" } },
    );
    expect(screen.getByLabelText("Phone number")).toBeRequired();
    expect(
      screen.getByLabelText("Email address (optional)"),
    ).not.toBeRequired();
    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "416 555 0100" },
    });
    fireEvent.submit(container.querySelector("form"));
    fireEvent.submit(container.querySelector("form"));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: "Sending your enquiry…" }),
    ).toBeDisabled();
    resolveRequest({
      ok: true,
      json: async () => ({ success: true, lead_saved: true }),
    });
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/thank-you"));
  });
});
