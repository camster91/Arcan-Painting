import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ContractsPage from "./page";

// Mock fetch
global.fetch = jest.fn();

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

beforeEach(() => {
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ contracts: mockContracts }),
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("ContractsPage", () => {
  test("renders contracts page with header", async () => {
    render(<ContractsPage />);

    expect(screen.getByText("Contracts")).toBeInTheDocument();
    expect(
      screen.getByText("Manage contracts and digital signatures"),
    ).toBeInTheDocument();
    expect(screen.getByText("New Contract")).toBeInTheDocument();
  });

  test("loads and displays contracts", async () => {
    render(<ContractsPage />);

    await waitFor(() => {
      expect(screen.getByText("CNT-001")).toBeInTheDocument();
      expect(screen.getByText("CNT-002")).toBeInTheDocument();
      expect(screen.getByText("Website Development")).toBeInTheDocument();
      expect(screen.getByText("Mobile App")).toBeInTheDocument();
    });
  });

  test("displays stats correctly", async () => {
    render(<ContractsPage />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument(); // Total contracts
      expect(screen.getByText("1")).toBeInTheDocument(); // Awaiting signature (sent status)
      expect(screen.getByText("$13,000")).toBeInTheDocument(); // Total value
    });
  });

  test("filters contracts by search term", async () => {
    render(<ContractsPage />);

    await waitFor(() => {
      expect(screen.getByText("CNT-001")).toBeInTheDocument();
      expect(screen.getByText("CNT-002")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search contracts...");
    fireEvent.change(searchInput, { target: { value: "CNT-001" } });

    expect(screen.getByText("CNT-001")).toBeInTheDocument();
    expect(screen.queryByText("CNT-002")).not.toBeInTheDocument();
  });

  test("filters contracts by status", async () => {
    render(<ContractsPage />);

    await waitFor(() => {
      expect(screen.getByText("CNT-001")).toBeInTheDocument();
      expect(screen.getByText("CNT-002")).toBeInTheDocument();
    });

    const statusFilter = screen.getByDisplayValue("All Status");
    fireEvent.change(statusFilter, { target: { value: "draft" } });

    await waitFor(() => {
      expect(screen.getByText("CNT-001")).toBeInTheDocument();
      expect(screen.queryByText("CNT-002")).not.toBeInTheDocument();
    });
  });

  test("opens contract detail modal when view button is clicked", async () => {
    render(<ContractsPage />);

    await waitFor(() => {
      expect(screen.getByText("CNT-001")).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByTitle("View Details");
    fireEvent.click(viewButtons[0]);

    expect(screen.getByText("Contract Details")).toBeInTheDocument();
    expect(screen.getByText("Website Development")).toBeInTheDocument();
  });

  test("closes contract detail modal", async () => {
    render(<ContractsPage />);

    await waitFor(() => {
      expect(screen.getByText("CNT-001")).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByTitle("View Details");
    fireEvent.click(viewButtons[0]);

    expect(screen.getByText("Contract Details")).toBeInTheDocument();

    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);

    expect(screen.queryByText("Contract Details")).not.toBeInTheDocument();
  });

  test("shows empty state when no contracts", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ contracts: [] }),
    });

    render(<ContractsPage />);

    await waitFor(() => {
      expect(screen.getByText("No contracts found")).toBeInTheDocument();
      expect(
        screen.getByText("Get started by creating your first contract"),
      ).toBeInTheDocument();
    });
  });

  test("shows error state when fetch fails", async () => {
    fetch.mockRejectedValueOnce(new Error("Failed to fetch"));

    render(<ContractsPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load contracts")).toBeInTheDocument();
    });
  });
});
