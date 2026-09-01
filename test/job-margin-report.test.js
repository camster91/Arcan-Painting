import { beforeEach, describe, expect, test, vi } from "vitest";

const sql = vi.fn();
const getCurrentUser = vi.fn();
const hasPermission = vi.fn();
vi.mock("@/app/api/utils/sql", () => ({ default: sql }));
vi.mock("@/app/api/utils/auth", () => ({ getCurrentUser }));
vi.mock("@/app/api/utils/permissions", () => ({ hasPermission }));
vi.mock("@/app/api/utils/rate-limit", () => ({
  generalLimiter: vi.fn(() => null),
}));
const { GET } = await import("@/app/api/job-margin-report/route");

describe("job margin portfolio report", () => {
  beforeEach(() => {
    sql.mockReset();
    getCurrentUser.mockReset();
    hasPermission.mockReset();
  });

  test("reconciles and ranks projects by projected margin", async () => {
    getCurrentUser.mockResolvedValue({ id: 1, role: "owner" });
    hasPermission.mockReturnValue(true);
    sql.mockResolvedValue([
      {
        id: 1,
        project_name: "Healthy job",
        status: "in_progress",
        contract_value: 10000,
        estimated_labor: 2000,
        estimated_materials: 1000,
        labor_actual: 1800,
        expense_actual: 1200,
        committed_cost: 500,
        invoiced: 7000,
        collected: 5000,
      },
      {
        id: 2,
        project_name: "At-risk job",
        status: "in_progress",
        contract_value: 5000,
        labor_actual: 2500,
        expense_actual: 1500,
        committed_cost: 500,
        invoiced: 5000,
        collected: 1000,
      },
    ]);
    const response = await GET(
      new Request("https://example.test/api/job-margin-report?days=90"),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(sql.mock.calls[0][1]).toEqual([90]);
    expect(body.projects[0].project_name).toBe("At-risk job");
    expect(body.projects[0].projected_margin_percent).toBe(10);
    expect(body.totals.contract_value).toBe(15000);
    expect(body.totals.receivable).toBe(6000);
  });

  test("enforces permission and bounded report periods", async () => {
    getCurrentUser.mockResolvedValue({ id: 2, role: "crew" });
    hasPermission.mockReturnValue(false);
    expect(
      (await GET(new Request("https://example.test/api/job-margin-report")))
        .status,
    ).toBe(403);
    hasPermission.mockReturnValue(true);
    expect(
      (
        await GET(
          new Request("https://example.test/api/job-margin-report?days=7"),
        )
      ).status,
    ).toBe(400);
  });
});
