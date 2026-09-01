import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import CreateInvoiceModal from "@/components/admin/invoices/CreateInvoiceModal";

const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("CreateInvoiceModal", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ leads: [{ id: 4, name: "Alex Client", email: "alex@example.test" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ projects: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ contracts: [] }) });
  });

  test("creates a linked invoice with normalized line-item numbers", async () => {
    const onCreated = vi.fn();
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 91, invoice_number: "INV-TEST" }) });
    render(<CreateInvoiceModal onClose={vi.fn()} onCreated={onCreated} />);

    await screen.findByRole("option", { name: "Alex Client — alex@example.test" });
    fireEvent.change(screen.getByLabelText("Customer"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Invoice title *"), { target: { value: "Interior painting deposit" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Project deposit" } });
    fireEvent.change(screen.getByLabelText("Unit price"), { target: { value: "1000" } });
    fireEvent.click(screen.getByRole("button", { name: "Create invoice" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith({ id: 91, invoice_number: "INV-TEST" }));
    const request = fetchMock.mock.calls.find(([url]) => url === "/api/invoices");
    expect(request).toBeTruthy();
    expect(JSON.parse(request[1].body)).toMatchObject({
      lead_id: "4",
      title: "Interior painting deposit",
      tax_rate: 13,
      line_items: [{ description: "Project deposit", quantity: 1, unit_price: 1000 }],
    });
  });

  test("blocks a due date before the issue date", async () => {
    render(<CreateInvoiceModal onClose={vi.fn()} onCreated={vi.fn()} />);
    await screen.findByRole("option", { name: "Alex Client — alex@example.test" });
    fireEvent.change(screen.getByLabelText("Issue date *"), { target: { value: "2030-02-10" } });
    fireEvent.change(screen.getByLabelText("Due date *"), { target: { value: "2030-02-09" } });
    fireEvent.change(screen.getByLabelText("Customer"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Invoice title *"), { target: { value: "Final invoice" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Final balance" } });
    fireEvent.change(screen.getByLabelText("Unit price"), { target: { value: "500" } });
    fireEvent.submit(screen.getByRole("button", { name: "Create invoice" }).closest("form"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Due date cannot be before the issue date");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
