// Calculate totals for an area
export const calculateAreaTotals = (area, hourlyRate) => {
  const l = parseFloat(area.length) || 0;
  const w = parseFloat(area.width) || 0;
  const h = parseFloat(area.height) || 0;

  if (!l || !w || !h) return { labor: 0, materials: 0, total: 0 };

  const wallArea = 2 * (l + w) * h;
  const ceilingArea = area.paintCeiling ? l * w : 0; // Only calculate if painting ceiling
  const doorsArea = parseInt(area.doorsCount || "0") * 21;
  const paintableWallArea = Math.max(0, wallArea - doorsArea);

  // Labor calculation
  const wallCoats = parseInt(area.wallsCoats) || 2;
  const ceilCoats = parseInt(area.ceilCoats) || 1;

  let laborHours = 0;
  laborHours +=
    (paintableWallArea * wallCoats) /
    (area.wallsMethod === "spray" ? 150 : 120);

  // Only add ceiling labor if painting ceiling
  if (area.paintCeiling) {
    laborHours +=
      (ceilingArea * ceilCoats) / (area.ceilMethod === "spray" ? 180 : 100);
  }

  laborHours += parseFloat(area.trimLf || "0") / 25;
  laborHours += parseInt(area.doorsCount || "0") * 1.5;

  // Prep work hours
  const prep = area.prepWork;
  laborHours += parseFloat(prep.minorPatches || "0") * 0.25;
  laborHours += parseFloat(prep.majorPatchSqft || "0") * 0.5;
  laborHours += parseFloat(prep.caulkLf || "0") / 30;
  laborHours += parseFloat(prep.tapeLf || "0") / 50;
  laborHours += parseFloat(prep.plasticSqft || "0") / 200;

  const laborCost = laborHours * parseFloat(hourlyRate);

  // Material calculation
  const paintCoverage = 350;
  const wallPaintGallons = (paintableWallArea * wallCoats) / paintCoverage;
  const ceilPaintGallons = area.paintCeiling
    ? (ceilingArea * ceilCoats) / paintCoverage
    : 0; // Only calculate if painting ceiling
  const totalGallons = wallPaintGallons + ceilPaintGallons;

  let materialCost = totalGallons * 42; // paint cost
  materialCost += (parseFloat(prep.tapeLf || "0") / 60) * 5; // tape
  materialCost += (parseFloat(prep.plasticSqft || "0") / 400) * 18; // plastic
  materialCost += (parseFloat(prep.caulkLf || "0") / 50) * 4; // caulk
  materialCost += 25; // sundries

  return {
    labor: Math.round(laborCost),
    materials: Math.round(materialCost),
    total: Math.round(laborCost + materialCost),
  };
};

// Calculate overall totals
export const calculateTotals = (areas, hourlyRate, markupPct, taxRate) => {
  const totals = areas.reduce(
    (acc, area) => {
      const areaTotals = calculateAreaTotals(area, hourlyRate);
      return {
        labor: acc.labor + areaTotals.labor,
        materials: acc.materials + areaTotals.materials,
        subtotal: acc.subtotal + areaTotals.total,
      };
    },
    { labor: 0, materials: 0, subtotal: 0 },
  );

  const markup = (totals.subtotal * parseFloat(markupPct)) / 100;
  const subtotalWithMarkup = totals.subtotal + markup;
  const tax = (subtotalWithMarkup * parseFloat(taxRate)) / 100;
  const total = subtotalWithMarkup + tax;

  return {
    ...totals,
    markup: Math.round(markup),
    subtotalWithMarkup: Math.round(subtotalWithMarkup),
    tax: Math.round(tax),
    total: Math.round(total),
  };
};
