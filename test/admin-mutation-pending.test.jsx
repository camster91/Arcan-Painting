import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Availability from "@/app/admin/availability/page";

afterEach(() => vi.unstubAllGlobals());

function setup(fetch) {
  vi.stubGlobal("fetch", fetch);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><Availability /></QueryClientProvider>);
}

describe("booking slot mutation states", () => {
  it("disables creation while saving, rejects a duplicate click, and recovers after failure", async () => {
    let finish;
    const pending = new Promise((resolve) => { finish = resolve; });
    const fetch = vi.fn((_url, options) => options?.method === "POST" ? pending :
      Promise.resolve({ ok: true, json: async () => ({ slots: [] }) }));
    setup(fetch);
    fireEvent.change(screen.getAllByLabelText("Date")[0], { target: { value: "2026-10-12" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Slot" }));
    const saving = await screen.findByRole("button", { name: "Creating..." });
    expect(saving).toBeDisabled();
    fireEvent.click(saving);
    expect(fetch.mock.calls.filter(([, options]) => options?.method === "POST")).toHaveLength(1);
    finish({ ok: false, status: 409, statusText: "Conflict" });
    await waitFor(() => expect(screen.getByRole("button", { name: "Create Slot" })).toBeEnabled());
    expect(screen.getByRole("alert")).toHaveTextContent("Create slot failed");
    expect(screen.getByLabelText("Date")).toHaveValue("2026-10-12");
  });

  it("shows a query failure instead of a misleading empty booking list", async () => {
    setup(vi.fn().mockRejectedValue(new Error("Network unavailable")));
    expect(await screen.findByRole("alert")).toHaveTextContent("could not be loaded");
    expect(screen.queryByText("No slots yet.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  });

  it("requires confirmation before deleting and shows a failed deletion", async () => {
    const confirm = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    vi.stubGlobal("confirm", confirm);
    const fetch = vi.fn((_url, options) => Promise.resolve(options?.method === "DELETE" ?
      { ok: false, status: 409, statusText: "Slot is booked" } :
      { ok: true, json: async () => ({ slots: [{ id: 4, slot_date: "2026-10-12", start_time: "09:00", end_time: "10:00", capacity: 1 }] }) }));
    setup(fetch);
    const button = await screen.findByRole("button", { name: "Delete" });
    fireEvent.click(button);
    expect(fetch.mock.calls.filter(([, options]) => options?.method === "DELETE")).toHaveLength(0);
    fireEvent.click(button);
    expect(await screen.findByRole("alert")).toHaveTextContent("Slot is booked");
  });
});
