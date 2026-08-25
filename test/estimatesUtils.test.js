import { describe, test, expect, vi } from "vitest";
import { 
  getStatusInfo, 
  formatCurrency, 
  formatDate, 
  formatDateLong, 
  generateEstimateNumber, 
  getDefaultValidUntil,
  getEstimatesStats,
  filterEstimates
} from "@/utils/estimatesUtils";
import { Edit, Send, CheckCircle, XCircle, Clock } from "lucide-react";

describe("estimatesUtils", () => {
  describe("getStatusInfo", () => {
    test("returns correct info for draft status", () => {
      const result = getStatusInfo("draft");
      expect(result.color).toBe("bg-gray-100 text-gray-800 border-gray-200");
      expect(result.icon).toBe(Edit);
      expect(result.label).toBe("Draft");
    });

    test("returns correct info for sent status", () => {
      const result = getStatusInfo("sent");
      expect(result.color).toBe("bg-blue-100 text-blue-800 border-blue-200");
      expect(result.icon).toBe(Send);
      expect(result.label).toBe("Sent");
    });

    test("returns correct info for approved status", () => {
      const result = getStatusInfo("approved");
      expect(result.color).toBe("bg-green-100 text-green-800 border-green-200");
      expect(result.icon).toBe(CheckCircle);
      expect(result.label).toBe("Approved");
    });

    test("returns correct info for rejected status", () => {
      const result = getStatusInfo("rejected");
      expect(result.color).toBe("bg-red-100 text-red-800 border-red-200");
      expect(result.icon).toBe(XCircle);
      expect(result.label).toBe("Rejected");
    });

    test("returns correct info for expired status", () => {
      const result = getStatusInfo("expired");
      expect(result.color).toBe("bg-orange-100 text-orange-800 border-orange-200");
      expect(result.icon).toBe(Clock);
      expect(result.label).toBe("Expired");
    });

    test("returns draft info for unknown status", () => {
      const result = getStatusInfo("unknown");
      expect(result.label).toBe("Draft");
    });
  });

  describe("formatCurrency", () => {
    test("formats USD currency correctly", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
      expect(formatCurrency(0)).toBe("$0.00");
      expect(formatCurrency(1000)).toBe("$1,000.00");
    });

    test("handles invalid amounts", () => {
      expect(formatCurrency(null)).toBe("$0.00");
      expect(formatCurrency(undefined)).toBe("$0.00");
      expect(formatCurrency("invalid")).toBe("$0.00");
    });
  });

  describe("formatDate", () => {
    test("formats date string correctly", () => {
      const dateStr = "2024-01-15T12:00:00Z";
      const result = formatDate(dateStr);
      // Format depends on locale, but should contain Jan 15, 2024
      expect(result).toContain("Jan");
      expect(result).toContain("15");
      expect(result).toContain("2024");
    });

    test("returns N/A for invalid date", () => {
      expect(formatDate(null)).toBe("N/A");
      expect(formatDate("")).toBe("N/A");
      expect(formatDate("invalid-date")).toBe("N/A");
    });
  });

  describe("formatDateLong", () => {
    test("formats date string with long format", () => {
      // Mock a specific date to avoid timezone issues
      const date = new Date("2024-01-15T12:00:00Z");
      const originalDate = global.Date;
      vi.spyOn(global, "Date").mockImplementation(() => date);
      
      const result = formatDateLong("2024-01-15T12:00:00Z");
      expect(result).toContain("Monday");
      expect(result).toContain("January");
      expect(result).toContain("15");
      expect(result).toContain("2024");
      
      global.Date = originalDate;
    });

    test("returns N/A for invalid date", () => {
      expect(formatDateLong(null)).toBe("N/A");
    });
  });

  describe("generateEstimateNumber", () => {
    test("generates estimate number with correct format", () => {
      const mockDate = new Date("2024-01-15T12:00:00Z");
      vi.spyOn(global, "Date").mockImplementation(() => mockDate);
      
      const result = generateEstimateNumber();
      expect(result).toMatch(/^EST-20240115-\d{3}$/);
      
      vi.restoreAllMocks();
    });

    test("includes random 3-digit suffix", () => {
      const mockDate = new Date("2024-01-15T12:00:00Z");
      vi.spyOn(global, "Date").mockImplementation(() => mockDate);
      vi.spyOn(Math, "random").mockReturnValue(0.123); // Will produce 123
      
      const result = generateEstimateNumber();
      expect(result).toBe("EST-20240115-123");
      
      vi.restoreAllMocks();
    });
  });

  describe("getDefaultValidUntil", () => {
    test("returns date 30 days from now", () => {
      const mockDate = new Date("2024-01-15T12:00:00Z");
      vi.spyOn(global, "Date").mockImplementation(() => mockDate);
      
      const result = getDefaultValidUntil();
      const expectedDate = new Date("2024-02-14T12:00:00Z").toISOString().split("T")[0];
      expect(result).toBe(expectedDate);
      
      vi.restoreAllMocks();
    });
  });

  describe("getEstimatesStats", () => {
    const mockEstimates = [
      { id: 1, status: "draft", total_cost: "1000.00" },
      { id: 2, status: "sent", total_cost: "2000.00" },
      { id: 3, status: "sent", total_cost: "3000.00" },
      { id: 4, status: "approved", total_cost: "4000.00" },
      { id: 5, status: "approved", total_cost: "5000.00" },
      { id: 6, status: "rejected", total_cost: "6000.00" },
    ];

    test("calculates correct stats", () => {
      const result = getEstimatesStats(mockEstimates);

      expect(result.total).toBe(6);
      expect(result.draft).toBe(1);
      expect(result.sent).toBe(2);
      expect(result.approved).toBe(2);
      expect(result.totalValue).toBe(21000); // 1000 + 2000 + 3000 + 4000 + 5000 + 6000
      expect(result.approvedValue).toBe(9000); // 4000 + 5000
    });

    test("handles empty array", () => {
      const result = getEstimatesStats([]);

      expect(result.total).toBe(0);
      expect(result.draft).toBe(0);
      expect(result.sent).toBe(0);
      expect(result.approved).toBe(0);
      expect(result.totalValue).toBe(0);
      expect(result.approvedValue).toBe(0);
    });

    test("handles invalid total_cost values", () => {
      const estimates = [
        { id: 1, status: "draft", total_cost: "invalid" },
        { id: 2, status: "sent", total_cost: "1500.50" },
      ];

      const result = getEstimatesStats(estimates);
      expect(result.totalValue).toBe(1500.50);
    });
  });

  describe("filterEstimates", () => {
    const mockEstimates = [
      { id: 1, project_title: "Website Redesign", estimate_number: "EST-001", created_by: "John" },
      { id: 2, project_title: "Mobile App", estimate_number: "EST-002", created_by: "Jane" },
      { id: 3, project_title: "Consulting", estimate_number: "EST-003", created_by: "Bob" },
    ];

    test("filters by project title", () => {
      const result = filterEstimates(mockEstimates, "Website");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    test("filters by estimate number", () => {
      const result = filterEstimates(mockEstimates, "EST-002");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    test("filters by created by", () => {
      const result = filterEstimates(mockEstimates, "Jane");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    test("is case insensitive", () => {
      const result = filterEstimates(mockEstimates, "website");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    test("returns empty when no matches", () => {
      const result = filterEstimates(mockEstimates, "nonexistent");
      expect(result).toHaveLength(0);
    });

    test("returns all when search term is empty", () => {
      const result = filterEstimates(mockEstimates, "");
      expect(result).toHaveLength(3);
    });
  });
});
