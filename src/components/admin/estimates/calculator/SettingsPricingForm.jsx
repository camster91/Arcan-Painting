export function SettingsPricingForm({
  hourlyCost,
  setHourlyCost,
  markupPct,
  setMarkupPct,
  taxRate,
  setTaxRate,
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Settings & Pricing
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Hourly Rate ($)
          </label>
          <input
            type="number"
            value={hourlyCost}
            onChange={(e) => setHourlyCost(e.target.value)}
            placeholder="35"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Markup (%)
          </label>
          <input
            type="number"
            value={markupPct}
            onChange={(e) => setMarkupPct(e.target.value)}
            placeholder="20"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Tax Rate (%)
          </label>
          <input
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            placeholder="13"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
      </div>
    </div>
  );
}
