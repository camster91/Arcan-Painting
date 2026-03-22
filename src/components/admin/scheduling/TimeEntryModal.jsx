import { useState } from "react";

export default function TimeEntryModal({
  entry,
  onClose,
  onSubmit,
  teamMembers,
  projects,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    team_member_id: entry?.team_member_id || "",
    project_id: entry?.project_id || "",
    clock_in_time:
      entry?.clock_in_time || new Date().toISOString().slice(0, 16),
    clock_out_time: entry?.clock_out_time || "",
    work_description: entry?.work_description || "",
    location: entry?.location || "",
    notes: entry?.notes || "",
    hourly_rate: entry?.hourly_rate || "",
    break_duration_minutes: entry?.break_duration_minutes || 0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      team_member_id: parseInt(formData.team_member_id),
      project_id: formData.project_id ? parseInt(formData.project_id) : null,
      hourly_rate: formData.hourly_rate
        ? parseFloat(formData.hourly_rate)
        : null,
      break_duration_minutes: parseInt(formData.break_duration_minutes) || 0,
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              {entry ? "Edit Time Entry" : "Log Time Entry"}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Team Member *
              </label>
              <select
                required
                value={formData.team_member_id}
                onChange={(e) =>
                  setFormData({ ...formData, team_member_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select team member</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} - {member.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Project (optional)
              </label>
              <select
                value={formData.project_id}
                onChange={(e) =>
                  setFormData({ ...formData, project_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.project_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Clock In *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.clock_in_time}
                  onChange={(e) =>
                    setFormData({ ...formData, clock_in_time: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Clock Out
                </label>
                <input
                  type="datetime-local"
                  value={formData.clock_out_time}
                  onChange={(e) =>
                    setFormData({ ...formData, clock_out_time: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Break (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.break_duration_minutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      break_duration_minutes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Hourly Rate
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourly_rate: e.target.value })
                  }
                  placeholder="25.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Work Description
              </label>
              <textarea
                rows={3}
                value={formData.work_description}
                onChange={(e) =>
                  setFormData({ ...formData, work_description: e.target.value })
                }
                placeholder="What work was performed..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Job site address or office"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg transition-colors"
              >
                {isLoading ? "Saving..." : entry ? "Update Entry" : "Log Time"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
