import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

describe("estimate scope handoff", () => {
  test("captures coating selections and field constraints in the estimator", () => {
    const state = read("src/hooks/useEstimateBuilder.js");
    const surfaces = read(
      "src/components/admin/estimates/EstimateBuilder/SurfaceSettings.jsx",
    );
    const area = read(
      "src/components/admin/estimates/EstimateBuilder/AreaCard.jsx",
    );
    expect(state).toContain('wallsCoating: ""');
    expect(state).toContain('productionAssumptions: ""');
    expect(surfaces).toContain('aria-label="Wall coating product"');
    expect(surfaces).toContain('aria-label="Ceiling sheen"');
    expect(area).toContain("Items explicitly not included");
  });

  test("persists prep, product, color, sheen, exclusions, and assumptions", () => {
    const payload = read("src/utils/estimateBuilderApi.js");
    const route = read("src/app/api/estimate-builder/route.js");
    const migration = read("src/migrations/001-initial-schema.js");
    expect(payload).toContain("prep_items:");
    expect(payload).toContain("coating_product:");
    expect(route).toContain("production_assumptions");
    expect(route).toContain("coating_product, color_name, sheen");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS exclusions");
  });

  test("returns a pricing-free sold scope to assigned field users", () => {
    const route = read("src/app/api/field/today/route.js");
    const page = read("src/app/admin/today/page.jsx");
    const scope = route.slice(
      route.indexOf("jsonb_build_object("),
      route.indexOf("AS job_scope"),
    );
    expect(scope).toContain("estimate_prep_items");
    expect(scope).toContain("coating_product");
    expect(scope).not.toContain("total_cost");
    expect(scope).not.toContain("labor_cost");
    expect(page).toContain("Sold painting scope");
    expect(page).toContain("area.production_assumptions");
  });
});
