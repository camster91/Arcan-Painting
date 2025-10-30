import { Bell, Plus } from "lucide-react";

export function NoFollowUpsFound({ hasFilters, onScheduleNew }) {
  return (
    <div className="p-8 text-center">
      <Bell size={48} className="text-slate-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-slate-900 mb-2">
        No follow-ups found
      </h3>
      <p className="text-slate-600 mb-4">
        {hasFilters
          ? "Try adjusting your search or filter criteria."
          : "Schedule your first follow-up to stay connected with customers."}
      </p>
      <button
        onClick={onScheduleNew}
        className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 mx-auto"
      >
        <Plus size={16} />
        Schedule First Follow-up
      </button>
    </div>
  );
}
