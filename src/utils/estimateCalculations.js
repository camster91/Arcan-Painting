export function calculateEstimate({
  length,
  width,
  height,
  hourlyCost,
  finishPaintCost,
  markupPct,
  taxRate,
}) {
  const l = parseFloat(length) || 0;
  const w = parseFloat(width) || 0;
  const h = parseFloat(height) || 0;

  if (!l || !w || !h) {
    return {
      labor: 0,
      materials: 0,
      markup: 0,
      subtotal: 0,
      tax: 0,
      total: 0,
    };
  }

  const wallArea = 2 * (l + w) * h;
  const ceilingArea = l * w;
  const laborHours = (wallArea * 2) / 120 + ceilingArea / 100;
  const laborCost = laborHours * (parseFloat(hourlyCost) || 35);
  const materialCost =
    ((wallArea + ceilingArea) / 350) * (parseFloat(finishPaintCost) || 42) + 50;
  const subtotalBeforeMarkup = laborCost + materialCost;
  const markup = (subtotalBeforeMarkup * (parseFloat(markupPct) || 20)) / 100;
  const subtotal = subtotalBeforeMarkup + markup;
  const tax = (subtotal * (parseFloat(taxRate) || 13)) / 100;
  const total = subtotal + tax;

  return {
    labor: Math.round(laborCost),
    materials: Math.round(materialCost),
    markup: Math.round(markup),
    subtotal: Math.round(subtotal),
    tax: Math.round(tax),
    total: Math.round(total),
    // Additional details for summary display
    wallArea,
    ceilingArea,
    laborHours: Math.round(laborHours * 10) / 10,
    paintGallons: Math.round(((wallArea + ceilingArea) / 350) * 10) / 10,
  };
}
