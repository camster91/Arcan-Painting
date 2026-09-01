import { describe, expect, test } from "vitest";
import {
  calculateJobCostSummary,
  validateProjectExpense,
} from "@/app/api/utils/project-expenses-domain";

describe("project expense and job costing math", () => {
  test("normalizes expense money and keeps tax separate", () => {
    expect(
      validateProjectExpense({
        category: "material",
        description: "Two gallons of primer",
        vendor: "Paint Store",
        amount: "100.005",
        tax_amount: "13",
        incurred_on: "2026-09-01",
        receipt_url: "https://cdn.example.test/receipt.pdf",
      }),
    ).toMatchObject({ amount: 100.01, taxAmount: 13, totalAmount: 113.01 });
    expect(() =>
      validateProjectExpense({
        category: "invalid",
        description: "Valid description",
        amount: 10,
        incurred_on: "2026-09-01",
      }),
    ).toThrow("category");
    expect(() =>
      validateProjectExpense({
        category: "material",
        description: "Valid description",
        amount: 0,
        incurred_on: "2026-09-01",
      }),
    ).toThrow("Amount");
    expect(() =>
      validateProjectExpense({
        category: "material",
        description: "Valid description",
        amount: 10,
        tax_amount: 11,
        incurred_on: "2026-09-01",
      }),
    ).toThrow("Tax");
    expect(() =>
      validateProjectExpense({
        category: "material",
        description: "Valid description",
        amount: 10,
        incurred_on: "2026-09-01",
        receipt_url: "javascript:alert(1)",
      }),
    ).toThrow("HTTPS");
  });

  test("reconciles revenue, actual cost, margin, billing, and cash", () => {
    expect(
      calculateJobCostSummary({
        contractValue: 10000,
        estimatedLabor: 3000,
        estimatedMaterials: 1500,
        laborActual: 2800,
        expenseActual: 1700,
        committedCost: 500,
        invoiced: 8000,
        collected: 5000,
      }),
    ).toMatchObject({
      contract_value: 10000,
      actual_cost: 4500,
      committed_cost: 500,
      projected_cost: 5000,
      gross_profit: 5500,
      projected_profit: 5000,
      projected_margin_percent: 50,
      receivable: 3000,
      customer_credit: 0,
    });
    expect(
      calculateJobCostSummary({ invoiced: 100, collected: 125 }),
    ).toMatchObject({ receivable: 0, customer_credit: 25 });
  });
});
