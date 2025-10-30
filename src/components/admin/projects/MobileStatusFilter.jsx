"use client";
export default function MobileStatusFilter({
  statusCounts,
  statusFilter,
  setStatusFilter,
}) {
  const statuses = [
    { key: "all", label: "All", count: statusCounts.all },
    { key: "in_progress", label: "Active", count: statusCounts.in_progress },
    { key: "scheduled", label: "Scheduled", count: statusCounts.scheduled },
    { key: "completed", label: "Done", count: statusCounts.completed },
    { key: "paused", label: "Paused", count: statusCounts.paused },
  ];

  return (
    <div className="lg:hidden mb-4">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {statuses.map((status) => (
          <button
            key={status.key}
            onClick={() => setStatusFilter(status.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              statusFilter === status.key
                ? "bg-amber-100 text-amber-800 border-amber-300"
                : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
            }`}
          >
            {status.label}
            {status.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-slate-200 text-xs rounded-full">
                {status.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
