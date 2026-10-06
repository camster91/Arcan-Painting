import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CustomerTimeline from "@/components/admin/leads/CustomerTimeline";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
const event = (id, title) => ({ id, event_type: "email", title, detail: "invoice_send", occurred_at: "2026-10-05T14:00:00Z", visibility: "internal", actor: null, delivery_status: "failed" });

it("shows loading, failure and retry without pretending an error is empty history", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 500 })).mockResolvedValueOnce(Response.json({ events: [] }));
  vi.stubGlobal("fetch", fetch);
  render(<CustomerTimeline leadId={7} />, { wrapper: wrapper() });
  expect(screen.getByRole("status")).toHaveTextContent("Loading");
  expect(await screen.findByRole("alert")).toHaveTextContent("Could not load");
  expect(screen.queryByText("No recorded activity for this selection.")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Refresh customer activity" }));
  expect(await screen.findByText("No recorded activity for this selection.")).toBeInTheDocument();
});

it("isolates a newly selected customer and aborts the previous request", async () => {
  let resolveFirst;
  let firstSignal;
  vi.stubGlobal("fetch", vi.fn((url, { signal }) => url.includes("/7/") ? new Promise((resolve) => { resolveFirst = resolve; firstSignal = signal; }) : Promise.resolve(Response.json({ events: [event("b", "Customer B activity")] }))));
  const view = render(<CustomerTimeline leadId={7} />, { wrapper: wrapper() });
  await waitFor(() => expect(firstSignal).toBeDefined());
  view.rerender(<CustomerTimeline leadId={8} />);
  expect(await screen.findByText("Customer B activity")).toBeInTheDocument();
  expect(firstSignal.aborted).toBe(true);
  resolveFirst(Response.json({ events: [event("a", "Customer A private activity")] }));
  await waitFor(() => expect(screen.queryByText("Customer A private activity")).not.toBeInTheDocument());
});

it("exposes failed delivery, internal visibility, bounded history and filters", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ events: [event("e", "Email delivery attempt")], truncated: true })));
  render(<CustomerTimeline leadId={7} />, { wrapper: wrapper() });
  expect(await screen.findByText("Delivery status: failed")).toBeInTheDocument();
  expect(screen.getByText(/Actor not recorded · Internal only/)).toBeInTheDocument();
  expect(screen.getByText(/latest 200 recorded events/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Activity type"), { target: { value: "jobs" } });
  expect(screen.queryByText("Email delivery attempt")).not.toBeInTheDocument();
  expect(screen.getByText("No recorded activity for this selection.")).toBeInTheDocument();
});
