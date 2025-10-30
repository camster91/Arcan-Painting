import { FileText } from "lucide-react";

export function NoContractsFound({ onCreateContract, hasFilters }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          No contracts found
        </h3>
        <p className="text-slate-600 mb-6">
          {hasFilters
            ? "Try adjusting your search or filters"
            : "Get started by creating your first contract"}
        </p>
        {!hasFilters && (
          <button
            onClick={onCreateContract}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Create First Contract
          </button>
        )}
      </div>
    </div>
  );
}
