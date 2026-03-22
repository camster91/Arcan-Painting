import {
  User,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
} from "lucide-react";

function renderStatusPill(status) {
  const map = {
    todo: {
      cls: "bg-slate-100 text-slate-800 border-slate-200",
      label: "To do",
    },
    in_progress: {
      cls: "bg-blue-100 text-blue-800 border-blue-200",
      label: "In Progress",
    },
    blocked: {
      cls: "bg-orange-100 text-orange-800 border-orange-200",
      label: "Blocked",
    },
    done: {
      cls: "bg-green-100 text-green-800 border-green-200",
      label: "Done",
    },
  };
  const m = map[status] || map.todo;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${m.cls}`}
    >
      {m.label}
    </span>
  );
}

export default function TaskList({
  tasks,
  onShowCreate,
  onUpdateStatus,
  onEdit,
  onDelete,
}) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-8 text-center">
          <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            No tasks found
          </h3>
          <p className="text-slate-600 mb-4">
            Try adjusting your filters or create a new task.
          </p>
          <button
            onClick={onShowCreate}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
          >
            Create Task
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-900">
                Task
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">
                Status
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">
                Priority
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">
                Assignee
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">
                Due Date
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {tasks.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      {t.title}
                    </p>
                    {t.description && (
                      <p className="text-sm text-slate-500 line-clamp-2">
                        {t.description}
                      </p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  {renderStatusPill(t.status)}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      t.priority === "urgent"
                        ? "bg-red-100 text-red-800 border-red-200"
                        : t.priority === "high"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : t.priority === "medium"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-slate-100 text-slate-800 border-slate-200"
                    }`}
                  >
                    {t.priority.charAt(0).toUpperCase() +
                      t.priority.slice(1)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-slate-400" />
                    <span className="text-sm text-slate-700">
                      {t.assignee_name || "Unassigned"}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-slate-700">
                  {t.due_date
                    ? new Date(t.due_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    {t.status !== "done" ? (
                      <button
                        onClick={() => onUpdateStatus(t.id, "done")}
                        className="text-green-600 hover:text-green-700 text-sm font-medium inline-flex items-center gap-1"
                      >
                        <CheckCircle2 size={16} /> Mark Done
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateStatus(t.id, "todo")}
                        className="text-slate-600 hover:text-slate-700 text-sm font-medium inline-flex items-center gap-1"
                      >
                        <AlertCircle size={16} /> Reopen
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(t)}
                      className="text-amber-600 hover:text-amber-700 text-sm font-medium inline-flex items-center gap-1"
                    >
                      <Pencil size={16} /> Edit
                    </button>
                    <button
                      onClick={() => onDelete(t.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium inline-flex items-center gap-1"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
