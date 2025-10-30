import { FileText, Plus, Home, ChevronRight } from "lucide-react";

export function ContractsHeader({ onCreateContract }) {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-8">
      <div className="py-4">
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
          <span className="text-slate-900 font-medium">Contracts</span>
        </div>

        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText size={24} />
              Contracts
            </h1>
            <p className="text-slate-600">
              Manage contracts and digital signatures
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Create Contract Button */}
            <button
              onClick={onCreateContract}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New Contract</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
