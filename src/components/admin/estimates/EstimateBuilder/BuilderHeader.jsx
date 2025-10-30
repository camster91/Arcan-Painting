import { Calculator, ArrowLeft } from "lucide-react";

export function BuilderHeader({ editingEstimate, onCancel }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-amber-50 rounded-lg">
          <Calculator className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {editingEstimate
              ? "Edit Estimate"
              : "Professional Estimate Builder"}
          </h2>
          <p className="text-sm text-slate-600">
            Create detailed, professional estimates with multiple rooms and
            comprehensive pricing
          </p>
        </div>
      </div>
      <button
        onClick={onCancel}
        className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to List
      </button>
    </div>
  );
}
