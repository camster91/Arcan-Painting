import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LeadFormPopup from "@/components/LeadFormPopup";
import ContactSection from "@/components/ContactSection";
import { trackEvent } from "@/utils/analytics";

vi.mock("@/utils/analytics", () => ({ trackEvent: vi.fn(), getAttribution: () => ({ utmSource: "fixture" }) }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

for (const form of ["popup", "embedded"]) {
  it(`${form} does not report an unsaved HTTP 200 response as a completed lead`, async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ success: true, lead_saved: false, lead_id: null }) })));
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    render(<QueryClientProvider client={queryClient}>{form === "popup" ? <LeadFormPopup isOpen onClose={() => {}} /> : <ContactSection />}</QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Interior", exact: true }));
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Saved Fixture" } });
    fireEvent.click(screen.getByRole("button", { name: "Go to next step" }));
    fireEvent.click(screen.getByRole("button", { name: "Email", exact: true }));
    fireEvent.change(screen.getByLabelText(form === "popup" ? "Email address" : "Email", { exact: true }), { target: { value: "fixture@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Go to next step" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit", exact: true }));
    await waitFor(() => expect(screen.getByText("Failed to submit")).toBeVisible());
    expect(trackEvent.mock.calls.some(([name]) => name === "lead_submit_success")).toBe(false);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
}
