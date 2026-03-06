import { describe, test, expect } from "vitest";
import { getStatusColor, filterContracts, calculateContractStats } from "@/utils/contractsUtils";

describe("contractsUtils", () => {
  describe("getStatusColor", () => {
    test("returns correct color classes for draft status", () => {
      expect(getStatusColor("draft")).toBe("bg-slate-100 text-slate-700");
    });

    test("returns correct color classes for sent status", () => {
      expect(getStatusColor("sent")).toBe("bg-blue-100 text-blue-700");
    });

    test("returns correct color classes for signed status", () => {
      expect(getStatusColor("signed")).toBe("bg-green-100 text-green-700");
    });

    test("returns correct color classes for completed status", () => {
      expect(getStatusColor("completed")).toBe("bg-emerald-100 text-emerald-700");
    });

    test("returns correct color classes for cancelled status", () => {
      expect(getStatusColor("cancelled")).toBe("bg-red-100 text-red-700");
    });

    test("returns default for unknown status", () => {
      expect(getStatusColor("unknown")).toBe("bg-slate-100 text-slate-700");
    });
  });

  describe("filterContracts", () => {
    const mockContracts = [
      {
        id: 1,
        contract_number: "CNT-001",
        title: "Website Development",
        client_name: "John Doe",
        client_email: "john@example.com",
      },
      {
        id: 2,
        contract_number: "CNT-002",
        title: "Mobile App",
        client_name: "Jane Smith",
        client_email: "jane@example.com",
      },
      {
        id: 3,
        contract_number: "CNT-003",
        title: "Consulting",
        client_name: "Bob Johnson",
        client_email: "bob@example.com",
      },
    ];

    test("returns all contracts when search term is empty", () => {
      const result = filterContracts(mockContracts, "");
      expect(result).toHaveLength(3);
    });

    test("filters by contract number", () => {
      const result = filterContracts(mockContracts, "CNT-001");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    test("filters by client name", () => {
      const result = filterContracts(mockContracts, "Jane");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    test("filters by title", () => {
      const result = filterContracts(mockContracts, "Website");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    test("filters by email", () => {
      const result = filterContracts(mockContracts, "bob@example.com");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(3);
    });

    test("is case insensitive", () => {
      const result = filterContracts(mockContracts, "website");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    test("returns empty array when no matches", () => {
      const result = filterContracts(mockContracts, "nonexistent");
      expect(result).toHaveLength(0);
    });
  });

  describe("calculateContractStats", () => {
    const mockContracts = [
      { id: 1, status: "draft", total_amount: "1000.00" },
      { id: 2, status: "sent", total_amount: "2000.00" },
      { id: 3, status: "sent", total_amount: "3000.00" },
      { id: 4, status: "signed", total_amount: "4000.00" },
      { id: 5, status: "completed", total_amount: "5000.00" },
      { id: 6, status: "cancelled", total_amount: "0" },
    ];

    test("calculates correct stats", () => {
      const result = calculateContractStats(mockContracts);

      expect(result.totalContracts).toBe(6);
      expect(result.awaitingSignature).toBe(2); // "sent" status
      expect(result.signed).toBe(1); // "signed" status
      expect(result.totalValue).toBe(15000); // 1000 + 2000 + 3000 + 4000 + 5000 + 0
    });

    test("handles empty contracts array", () => {
      const result = calculateContractStats([]);

      expect(result.totalContracts).toBe(0);
      expect(result.awaitingSignature).toBe(0);
      expect(result.signed).toBe(0);
      expect(result.totalValue).toBe(0);
    });

    test("handles contracts with invalid total_amount", () => {
      const contracts = [
        { id: 1, status: "draft", total_amount: "invalid" },
        { id: 2, status: "sent", total_amount: "1000.50" },
      ];

      const result = calculateContractStats(contracts);

      expect(result.totalValue).toBe(1000.50);
    });
  });
});