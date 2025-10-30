import { Save } from "lucide-react";

export function EstimateSummary({
  totals,
  markupPct,
  taxRate,
  error,
  isLoading,
  editingEstimate,
  onSave,
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 sticky top-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Estimate Summary
      </h3>
      <div className="space-y-3">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-900">
              ${totals.total.toLocaleString()}
            </div>
            <div className="text-sm text-amber-700">Total Estimate</div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Labor:</span>
            <span className="font-medium">
              ${totals.labor.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Materials:</span>
            <span className="font-medium">
              ${totals.materials.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Markup ({markupPct}%):</span>
            <span className="font-medium">
              ${totals.markup.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-slate-600">Subtotal:</span>
            <span className="font-medium">
              ${totals.subtotalWithMarkup.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Tax ({taxRate}%):</span>
            <span className="font-medium">${totals.tax.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={onSave}
        disabled={isLoading}
        className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        <Save size={16} />
        {isLoading
          ? "Saving..."
          : editingEstimate
            ? "Update Estimate"
            : "Save Estimate"}
      </button>
    </div>
  );
}
