import sql from "@/app/api/utils/sql";
import { getCurrentUser } from "@/app/api/utils/auth";

// (estimate_settings / estimate_areas / estimate_surfaces /
// estimate_prep_items / estimate_materials are now created by
// src/migrations/001-initial-schema.js — not at runtime. The old
// `ensureEstimateBuilderTables` function was removed in 2026-06-11 to
// eliminate the first-request race and the duplicate schema definitions.)

// NEW: load latest app settings to use as defaults
async function getAppSettings() {
  try {
    const rows = await sql`SELECT * FROM app_settings ORDER BY id DESC LIMIT 1`;
    return rows[0] || {};
  } catch (e) {
    return {};
  }
}

// Defaults used when client doesn't provide rates
const DEFAULTS = {
  coverage: {
    finish: { roll: 350, spray: 275 },
    primer: { roll: 300, spray: 250 },
  },
  production: {
    walls: { roll: 175, spray: 240 }, // sqft/hr
    ceiling: { roll: 150, spray: 220 },
    trim: { roll: 60, spray: 80 }, // lf/hr
    door: { roll: 45, spray: 55 }, // sqft/hr
  },
  waste: { paint: 10 },
  hours: { crewHourlyCost: 35 },
  paintUnitCost: 45,
  doorSqftPerSide: 21,
};

function ceilHalf(x) {
  return Math.ceil(x * 2) / 2;
}

function numberOr(n, d) {
  const v = parseFloat(n);
  return isNaN(v) ? d : v;
}

// Compute totals from nested payload
function computeTotals(payload) {
  const taxRate = numberOr(payload?.settings?.tax_rate, 0);
  const crewCost = numberOr(
    payload?.settings?.crew_hourly_cost,
    DEFAULTS.hours.crewHourlyCost,
  );
  const paintPrice = numberOr(
    payload?.settings?.paint_unit_cost,
    DEFAULTS.paintUnitCost,
  );
  const wastePct = numberOr(
    payload?.settings?.waste_paint_pct,
    DEFAULTS.waste.paint,
  );

  let laborHours = 0;
  let materialGallons = 0;

  const areas = payload?.areas || [];

  for (const area of areas) {
    const surfaces = area.surfaces || [];
    for (const s of surfaces) {
      const type = s.surface_type;
      const method = s.method || "roll";
      const coats = s.coats ?? (type === "trim" ? 1 : 2);
      const primer = !!s.primer;

      // normalize measurement into sqft for walls/ceiling/door; trim remains lf
      let sqft = 0;
      if (type === "walls" || type === "ceiling") {
        if (s.unit === "sqft") sqft = numberOr(s.measurement, 0);
        else if (type === "ceiling" && area.length && area.width) {
          sqft = numberOr(area.length, 0) * numberOr(area.width, 0);
        } else if (
          type === "walls" &&
          area.length &&
          area.width &&
          area.height
        ) {
          const perimeter =
            2 * (numberOr(area.length, 0) + numberOr(area.width, 0));
          sqft =
            perimeter * numberOr(area.height, 0) - numberOr(s.opening_sqft, 0);
        } else {
          sqft = numberOr(s.measurement, 0);
        }
      } else if (type === "door") {
        const count = s.unit === "count" ? numberOr(s.measurement, 0) : 0;
        const sides = s.door_sides ?? 2;
        sqft = count * DEFAULTS.doorSqftPerSide * sides;
      }

      // production rates and coverage
      const prodRate = numberOr(
        s.production_rate,
        DEFAULTS.production[type]?.[method] || 150,
      );
      const finishCoverage = numberOr(
        s.coverage_rate,
        DEFAULTS.coverage.finish[method],
      );
      const primerCoverage = DEFAULTS.coverage.primer[method];

      // hours
      if (type === "trim") {
        const lf = s.unit === "lf" ? numberOr(s.measurement, 0) : 0;
        laborHours += (lf / prodRate) * (coats || 1);
      } else {
        if (primer) {
          laborHours += (sqft / prodRate) * 1; // primer counted as 1 coat
        }
        laborHours += (sqft / prodRate) * (coats || 1);
      }

      // materials
      if (type !== "trim") {
        if (primer) {
          const galPrimer = (sqft / primerCoverage) * (1 + wastePct / 100);
          materialGallons += galPrimer;
        }
        const galFinish =
          ((sqft * (coats || 1)) / finishCoverage) * (1 + wastePct / 100);
        materialGallons += galFinish;
      }
    }

    // Prep items
    const preps = area.prep_items || [];
    for (const p of preps) {
      const t = (p.prep_type || "").toLowerCase();
      if (t === "minor_patch") {
        const eachMin = numberOr(p.minutes_each, 7);
        const count = numberOr(p.quantity, 0);
        laborHours += (eachMin * count) / 60;
      } else if (t === "major_patch") {
        const sqft = numberOr(p.quantity, 0);
        const sqftPerHour = numberOr(p.rate, 50);
        laborHours += sqft / sqftPerHour;
      } else if (t === "caulk") {
        const lf = numberOr(p.quantity, 0);
        const lfPerHour = numberOr(p.rate, 120);
        laborHours += lf / lfPerHour;
      } else if (t === "masking" || t === "taping") {
        const lf = numberOr(p.quantity, 0);
        const lfPerHour = numberOr(p.rate, 200);
        laborHours += lf / lfPerHour;
      } else if (t === "floor_protection" || t === "plastic") {
        const sqft = numberOr(p.quantity, 0);
        const sqftPerHour = numberOr(p.rate, 400);
        laborHours += sqft / sqftPerHour;
      } else if (t === "spot_prime") {
        const count = numberOr(p.quantity, 0);
        const minEach = numberOr(p.minutes_each, 5);
        laborHours += (count * minEach) / 60;
      }
    }

    // Setup/Cleanup per area
    const setupMins = numberOr(payload?.settings?.setup_minutes_per_area, 10);
    const cleanupPct = numberOr(payload?.settings?.cleanup_buffer_pct, 5);
    laborHours += setupMins / 60;
    laborHours += laborHours * (cleanupPct / 100);
  }

  const laborCost = laborHours * crewCost;
  const materialCost = materialGallons * paintPrice;
  const overheadPct = numberOr(payload?.settings?.overhead_pct, 0);
  const markupPct = numberOr(payload?.settings?.markup_pct, 0);

  const base = laborCost + materialCost;
  const overhead = base * (overheadPct / 100);
  const priceBeforeTax = base + overhead;
  const priceWithMarkup = priceBeforeTax * (1 + markupPct / 100);
  const tax = priceWithMarkup * (taxRate / 100);
  const grandTotal = priceWithMarkup + tax;

  return {
    laborHours: Number(laborHours.toFixed(2)),
    laborCost: Number(laborCost.toFixed(2)),
    materialGallons: Number(ceilHalf(materialGallons).toFixed(2)),
    materialCost: Number(materialCost.toFixed(2)),
    overhead: Number(overhead.toFixed(2)),
    priceBeforeTax: Number(priceBeforeTax.toFixed(2)),
    subtotalWithMarkup: Number(priceWithMarkup.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
  };
}

function generateEstimateNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  const r = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `EST-${y}${m}${da}-${r}`;
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // estimate_settings / estimate_areas / estimate_surfaces /
    // estimate_prep_items / estimate_materials are created in
    // src/migrations/001-initial-schema.js — the old runtime ensure function
    // was removed; the migration is the single source of truth for these
    // tables. If you re-deployed an old container and hit "relation does not
    // exist" here, restart with the new image after `ensureSchema()` runs.

    const body = await request.json();
    const {
      lead_id,
      project_title,
      project_description,
      settings = {},
      areas = [],
      estimate_number,
      notes,
      valid_until,
    } = body;

    if (!lead_id || !project_title) {
      return Response.json(
        { error: "lead_id and project_title are required" },
        { status: 400 },
      );
    }

    // NEW: merge app settings for missing values
    const app = await getAppSettings();
    const mergedSettings = {
      ...settings,
      tax_rate:
        settings.tax_rate ??
        (app.tax_rate != null ? Number(app.tax_rate) : undefined),
      markup_pct:
        settings.markup_pct ??
        (app.markup_pct != null ? Number(app.markup_pct) : undefined),
      currency: settings.currency ?? app.currency ?? undefined,
      crew_hourly_cost:
        settings.crew_hourly_cost ??
        (app.hourly_rate != null ? Number(app.hourly_rate) : undefined),
    };

    // compute totals
    const totals = computeTotals({ settings: mergedSettings, areas });

    // create estimate row
    const estNo = estimate_number || generateEstimateNumber();
    const inserted = await sql`
      INSERT INTO estimates (
        lead_id, estimate_number, project_title, project_description,
        labor_cost, material_cost, total_cost, status, valid_until, notes, created_by, created_at, updated_at
      ) VALUES (
        ${lead_id}, ${estNo}, ${project_title}, ${project_description || null},
        ${totals.laborCost}, ${totals.materialCost}, ${totals.grandTotal}, 'draft', ${valid_until || null}, ${notes || null}, ${user.username}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING id
    `;
    const estimateId = inserted[0].id;

    // insert settings (persist merged so future edits reflect defaults)
    await sql`
      INSERT INTO estimate_settings (
        estimate_id, tax_rate, overhead_pct, markup_pct, currency, crew_hourly_cost, billable_rate, default_method, default_coats, primer_on, waste_paint_pct, waste_tape_pct, waste_poly_pct, setup_minutes_per_area, cleanup_buffer_pct, travel_minutes
      ) VALUES (
        ${estimateId}, ${mergedSettings.tax_rate || null}, ${mergedSettings.overhead_pct || null}, ${mergedSettings.markup_pct || null}, ${mergedSettings.currency || null}, ${mergedSettings.crew_hourly_cost || null}, ${mergedSettings.billable_rate || null}, ${mergedSettings.default_method || null}, ${mergedSettings.default_coats || null}, ${mergedSettings.primer_on || null}, ${mergedSettings.waste_paint_pct || null}, ${mergedSettings.waste_tape_pct || null}, ${mergedSettings.waste_poly_pct || null}, ${mergedSettings.setup_minutes_per_area || null}, ${mergedSettings.cleanup_buffer_pct || null}, ${mergedSettings.travel_minutes || null}
      )
    `;

    // insert areas + surfaces + prep
    for (const area of areas) {
      const areaInsert = await sql`
        INSERT INTO estimate_areas (estimate_id, name, length, width, height, wall_sqft, ceiling_sqft, notes, exclusions, production_assumptions)
        VALUES (${estimateId}, ${area.name || null}, ${area.length || null}, ${area.width || null}, ${area.height || null}, ${area.wall_sqft || null}, ${area.ceiling_sqft || null}, ${area.notes || null}, ${area.exclusions || null}, ${area.production_assumptions || null})
        RETURNING id
      `;
      const areaId = areaInsert[0].id;

      for (const s of area.surfaces || []) {
        await sql`
          INSERT INTO estimate_surfaces (area_id, surface_type, measurement, unit, method, coats, primer, production_rate, coverage_rate, door_sides, profile_type, opening_sqft, coating_product, color_name, sheen)
          VALUES (${areaId}, ${s.surface_type || null}, ${s.measurement || null}, ${s.unit || null}, ${s.method || null}, ${s.coats || null}, ${s.primer || null}, ${s.production_rate || null}, ${s.coverage_rate || null}, ${s.door_sides || null}, ${s.profile_type || null}, ${s.opening_sqft || null}, ${s.coating_product || null}, ${s.color_name || null}, ${s.sheen || null})
        `;
      }

      for (const p of area.prep_items || []) {
        await sql`
          INSERT INTO estimate_prep_items (area_id, prep_type, quantity, unit, rate, hours)
          VALUES (${areaId}, ${p.prep_type || null}, ${p.quantity || null}, ${p.unit || null}, ${p.rate || null}, ${p.hours || null})
        `;
      }
    }

    return Response.json({
      success: true,
      estimate_id: estimateId,
      totals,
    });
  } catch (e) {
    console.error("estimate-builder POST error", e);
    return Response.json(
      { error: "Failed to create estimate" },
      { status: 500 },
    );
  }
}
