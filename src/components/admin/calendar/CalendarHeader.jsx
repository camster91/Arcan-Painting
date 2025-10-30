import { CalendarIcon, Home, ChevronRight } from "lucide-react";

export function CalendarHeader({
  view,
  onViewChange,
  showAvailability,
  onToggleAvailability,
  onRefresh,
}) {
  return (
    <div className="space-y-4 mb-6">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-slate-600">
        <a
          href="/admin"
          className="flex items-center gap-1 hover:text-slate-900"
        >
          <Home size={16} />
          <span>Dashboard</span>
        </a>
        <ChevronRight size={16} className="mx-2 text-slate-400" />
        <span className="text-slate-900 font-medium">Calendar</span>
      </div>

      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon size={24} />
            Calendar
          </h1>
          <p className="text-slate-600">Estimates & project schedule</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Team Availability Toggle */}
          <button
            onClick={onToggleAvailability}
            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
              showAvailability
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
            title="Toggle team availability overlay"
          >
            <span className="hidden sm:inline">
              {showAvailability
                ? "Hide Team Availability"
                : "Show Team Availability"}
            </span>
            <span className="sm:hidden">
              {showAvailability ? "Hide Avail" : "Show Avail"}
            </span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm transition-colors"
          >
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">⟳</span>
          </button>
        </div>
      </div>

      {/* Polished Tabs */}
      <div className="bg-slate-100 rounded-xl p-1 inline-flex">
        <button
          onClick={() => onViewChange("appointments")}
          className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            view === "appointments"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white"
          }`}
        >
          <span className="hidden sm:inline">Appointments</span>
          <span className="sm:hidden">Appts</span>
        </button>
        <button
          onClick={() => onViewChange("projects")}
          className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            view === "projects"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white"
          }`}
        >
          Projects
        </button>
      </div>
    </div>
  );
}
