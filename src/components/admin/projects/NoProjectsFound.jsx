import { Briefcase, Plus } from "lucide-react";

export default function NoProjectsFound({
  searchTerm,
  statusFilter,
  onCreateProject,
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
      <Briefcase size={48} className="text-slate-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-slate-900 mb-2">
        No projects found
      </h3>
      <p className="text-slate-600 mb-4">
        {searchTerm || statusFilter !== "all"
          ? "Try adjusting your search or filter criteria."
          : "Start by creating your first project from an approved estimate."}
      </p>
      <button
        onClick={onCreateProject}
        className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 mx-auto"
      >
        <Plus size={16} />
        Create First Project
      </button>
    </div>
  );
}
