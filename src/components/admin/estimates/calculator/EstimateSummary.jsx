import { Save } from "lucide-react";
import { useMemo } from "react";
import { calculateEstimate } from "@/utils/estimateCalculations";

export function EstimateSummary({
  length,
  width,
  height,
  hourlyCost,
  finishPaintCost,
  markupPct,
  taxRate,
  error,
  notification,
  onSave,
  isLoading,
}) {
  const estimate = useMemo(
    () =>
      calculateEstimate({
        length,
        width,
        height,
        hourlyCost,
        finishPaintCost,
        markupPct,
        taxRate,
      }),
    [length, width, height, hourlyCost, finishPaintCost, markupPct, taxRate],
  );

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 sticky top-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Estimate Summary
      </h3>
      <div className="space-y-3">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-900">
              ${estimate.total.toLocaleString()}
            </div>
            <div className="text-sm text-amber-700">Total Estimate</div>
          </div>
        </div>

        {/* Project Details */}
        {estimate.wallArea > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
            <h4 className="font-medium text-slate-900 mb-2">Project Details</h4>
            <div className="space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Wall Area:</span>
                <span>{Math.round(estimate.wallArea)} sq ft</span>
              </div>
              <div className="flex justify-between">
                <span>Ceiling Area:</span>
                <span>{Math.round(estimate.ceilingArea)} sq ft</span>
              </div>
              <div className="flex justify-between">
                <span>Est. Labor:</span>
                <span>{estimate.laborHours.toFixed(1)} hours</span>
              </div>
              <div className="flex justify-between">
                <span>Paint Needed:</span>
                <span>{estimate.paintGallons.toFixed(1)} gallons</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Labor:</span>
            <span className="font-medium">
              ${estimate.labor.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Materials:</span>
            <span className="font-medium">
              ${estimate.materials.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Markup ({markupPct}%):</span>
            <span className="font-medium">
              ${estimate.markup.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-slate-600">Subtotal:</span>
            <span className="font-medium">
              ${estimate.subtotal.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Tax ({taxRate}%):</span>
            <span className="font-medium">
              ${estimate.tax.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      )}
      {notification && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
          {notification}
        </div>
      )}

      <button
        onClick={onSave}
        disabled={isLoading}
        className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        <Save size={16} />
        {isLoading ? "Saving..." : "Save Estimate"}
      </button>

      <div className="mt-4 text-xs text-slate-500 text-center leading-relaxed">
        <p>Estimate includes labor, materials, prep work, and cleanup.</p>
        <p className="mt-1">Final pricing may vary based on site conditions.</p>
      </div>
    </div>
  );
}
