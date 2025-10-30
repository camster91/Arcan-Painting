import {
  Plus,
  Grid3X3,
  List,
  Home,
  ChevronRight,
  Briefcase,
  RefreshCw,
} from "lucide-react";

export default function ProjectsHeader({
  stats,
  onRefresh,
  onCreateProject,
  viewMode,
  onViewModeChange,
}) {
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
          <span className="text-slate-900 font-medium">Projects</span>
        </div>

        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Briefcase size={24} />
              Projects
            </h1>
            <p className="text-slate-600">
              {stats.total} total • {stats.inProgress} active projects
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="hidden sm:flex bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => onViewModeChange("cards")}
                className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                  viewMode === "cards"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => onViewModeChange("table")}
                className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                  viewMode === "table"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
              >
                <List size={16} />
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              className="px-3 py-2 text-sm rounded-lg border transition-colors bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              title="Refresh projects"
            >
              <RefreshCw size={16} />
              <span className="hidden sm:inline ml-2">Refresh</span>
            </button>

            {/* Create Project Button */}
            <button
              onClick={onCreateProject}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Create Project</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
