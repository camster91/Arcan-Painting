import { Home, ChevronRight, Bell, RefreshCw, Plus } from "lucide-react";

export function FollowUpsHeader({ onRefresh, onScheduleNew }) {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="px-4 py-4">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-slate-600 mb-4">
          <a
            href="/admin"
            className="flex items-center gap-1 hover:text-slate-900"
          >
            <Home size={16} />
            <span>Dashboard</span>
          </a>
          <ChevronRight size={16} className="mx-2 text-slate-400" />
          <span className="text-slate-900 font-medium">Follow-ups</span>
        </div>

        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Bell size={24} />
              Follow-up Management
            </h1>
            <p className="text-slate-600">
              Never miss an important customer touchpoint
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              className="px-3 py-2 text-sm rounded-lg border transition-colors bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              title="Refresh follow-ups"
            >
              <RefreshCw size={16} />
              <span className="hidden sm:inline ml-2">Refresh</span>
            </button>

            {/* Schedule Follow-up Button */}
            <button
              onClick={onScheduleNew}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Schedule Follow-up</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
