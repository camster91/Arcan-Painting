import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import ContractsPage from "./page";

const mockContracts = [
  {
    id: 1,
    contract_number: "CNT-001",
    title: "Website Development",
    client_name: "John Doe",
    client_email: "john@example.com",
    total_amount: "5000.00",
    deposit_amount: "1500.00",
    deposit_percentage: 30,
    status: "draft",
    scope_of_work: "Build a modern website",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    contract_number: "CNT-002",
    title: "Mobile App",
    client_name: "Jane Smith",
    client_email: "jane@example.com",
    total_amount: "8000.00",
    deposit_amount: "2400.00",
    deposit_percentage: 30,
    status: "sent",
    scope_of_work: "Develop mobile application",
    created_at: "2024-01-02T00:00:00Z",
  },
];

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ contracts: mockContracts }),
  });
});

afterEach(() => {
  cleanup();
  mockFetch.mockClear();
});

describe("ContractsPage", () => {
  test("renders contracts page with header after loading", async () => {
    render(<ContractsPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText("Loading contracts...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Contracts")).toBeInTheDocument();
    expect(screen.getByText("New Contract")).toBeInTheDocument();
  });

  test("loads and displays contracts", async () => {
    render(<ContractsPage />);

    await waitFor(() => {
      expect(screen.getByText("CNT-001")).toBeInTheDocument();
      expect(screen.getByText("CNT-002")).toBeInTheDocument();
    });
  });

  test("displays stats correctly after loading", async () => {
    render(<ContractsPage />);

    // Wait for loading to complete and stats to display
    await waitFor(() => {
      expect(screen.queryByText("Loading contracts...")).not.toBeInTheDocument();
    });

    // Check for Total Contracts stat label and value
    expect(screen.getByText("Total Contracts")).toBeInTheDocument();
  });

  test("filters contracts by search term", async () => {
    render(<ContractsPage />);

    await waitFor(() => {
      expect(screen.getByText("CNT-001")).toBeInTheDocument();
      expect(screen.getByText("CNT-002")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search contracts by number, title, or client...");
    fireEvent.change(searchInput, { target: { value: "CNT-001" } });

    expect(screen.getByText("CNT-001")).toBeInTheDocument();
    expect(screen.queryByText("CNT-002")).not.toBeInTheDocument();
  });

  test("shows empty state when no contracts", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ contracts: [] }),
    });

    render(<ContractsPage />);

    await waitFor(() => {
      expect(screen.getByText("No contracts found")).toBeInTheDocument();
    });
  });

  test("shows error state when fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));

    render(<ContractsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Error:.*Failed to load contracts/)).toBeInTheDocument();
    });
  });
});
