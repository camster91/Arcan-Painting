import { FileText, Plus } from "lucide-react";

export function NoEstimatesFound({
  searchTerm,
  statusFilter,
  onCreateEstimate,
}) {
  return (
    <div className="p-8 text-center">
      <FileText size={48} className="text-slate-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-slate-900 mb-2">
        No estimates found
      </h3>
      <p className="text-slate-600 mb-4">
        {searchTerm || statusFilter !== "all"
          ? "Try adjusting your search or filter criteria."
          : "Start by creating your first estimate for a lead."}
      </p>
      <button
        onClick={onCreateEstimate}
        className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 mx-auto"
      >
        <Plus size={16} />
        Create First Estimate
      </button>
    </div>
  );
}
