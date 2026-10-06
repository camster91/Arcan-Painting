import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CustomerNoteForm from "@/components/admin/leads/CustomerNoteForm";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); document.cookie = "arcan_csrf=; max-age=0; path=/"; });
function provider() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return { client, wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> };
}

it("preserves a failed note and reuses its key on retry, then clears only on acknowledgement", async () => {
  let fail;
  const fetch = vi.fn().mockImplementationOnce(() => new Promise((resolve) => { fail = resolve; })).mockResolvedValueOnce(Response.json({ success: true, replayed: true }));
  vi.stubGlobal("fetch", fetch);
  document.cookie = "arcan_csrf=valid-token; path=/";
  const { client, wrapper } = provider();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(<CustomerNoteForm leadId={7} />, { wrapper });
  const field = screen.getByLabelText("Add an internal note");
  fireEvent.change(field, { target: { value: "Call completed" } });
  fireEvent.click(screen.getByRole("button", { name: "Save note" }));
  const pending = await screen.findByRole("button", { name: "Saving note…" });
  expect(pending).toBeDisabled(); expect(field).toBeDisabled();
  fireEvent.click(pending);
  expect(fetch).toHaveBeenCalledTimes(1);
  fail(new Response(null, { status: 500 }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Retry the same note");
  expect(field).toHaveValue("Call completed");
  fireEvent.click(screen.getByRole("button", { name: "Save note" }));
  expect(await screen.findByText("Note saved.")).toBeInTheDocument();
  expect(field).toHaveValue("");
  expect(fetch.mock.calls[0][1].body).toBe(fetch.mock.calls[1][1].body);
  expect(fetch.mock.calls[0][1].headers["x-csrf-token"]).toBe("valid-token");
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["customer-timeline", 7] });
});

it("does not transfer a pending note into another customer's form", async () => {
  let acknowledge;
  vi.stubGlobal("fetch", vi.fn(() => new Promise((resolve) => { acknowledge = resolve; })));
  const { wrapper } = provider();
  const view = render(<CustomerNoteForm key={7} leadId={7} />, { wrapper });
  fireEvent.change(screen.getByLabelText("Add an internal note"), { target: { value: "Customer A only" } });
  fireEvent.click(screen.getByRole("button", { name: "Save note" }));
  await waitFor(() => expect(acknowledge).toBeDefined());
  view.rerender(<CustomerNoteForm key={8} leadId={8} />);
  expect(screen.getByLabelText("Add an internal note")).toHaveValue("");
  acknowledge(Response.json({ success: true }));
  await waitFor(() => expect(screen.queryByText("Note saved.")).not.toBeInTheDocument());
});
