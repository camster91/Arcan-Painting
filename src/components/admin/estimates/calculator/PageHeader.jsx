import { Calculator } from "lucide-react";

export function PageHeader() {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-lg">
              <Calculator className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Estimate Calculator
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Professional painting estimate calculator with detailed pricing
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
