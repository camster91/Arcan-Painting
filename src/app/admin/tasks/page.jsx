"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Calendar,
  Flag,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import TaskFilters from "@/components/admin/tasks/TaskFilters";
import TaskList from "@/components/admin/tasks/TaskList";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];
const PRIORITY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function InternalTasksPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => [
      "internal-tasks",
      { statusFilter, priorityFilter, assigneeFilter, search, onlyOverdue },
    ],
    [statusFilter, priorityFilter, assigneeFilter, search, onlyOverdue],
  );
  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (statusFilter !== "all") p.set("status", statusFilter);
    if (priorityFilter !== "all") p.set("priority", priorityFilter);
    if (assigneeFilter) p.set("assignee_id", assigneeFilter);
    if (search) p.set("search", search);
    if (onlyOverdue) p.set("overdue", "true");
    return p.toString();
  }, [statusFilter, priorityFilter, assigneeFilter, search, onlyOverdue]);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(
        `/api/internal-tasks${queryString ? `?${queryString}` : ""}`,
      );
      if (!res.ok) {
        throw new Error(
          `When fetching /api/internal-tasks, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const tasks = data?.tasks || [];
  const stats = data?.stats || {};
  const teamMembers = data?.teamMembers || [];

  const createMutation = useMutation({
    mutationFn: async (body) => {
      const res = await fetch("/api/internal-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to create task");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      const res = await fetch("/api/internal-tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to update task");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/internal-tasks?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to delete task");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Internal Tasks
            </h1>
            <p className="text-slate-600 text-sm">
              Track and manage team tasks
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> New Task
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard
            label="To do"
            value={stats?.todo || 0}
            color="text-slate-900"
            icon={<AlertCircle className="text-slate-600" size={20} />}
          />
          <StatCard
            label="In Progress"
            value={stats?.in_progress || 0}
            color="text-blue-600"
            icon={<Calendar className="text-blue-600" size={20} />}
          />
          <StatCard
            label="Blocked"
            value={stats?.blocked || 0}
            color="text-orange-600"
            icon={<XCircle className="text-orange-600" size={20} />}
          />
          <StatCard
            label="Done"
            value={stats?.done || 0}
            color="text-green-600"
            icon={<CheckCircle2 className="text-green-600" size={20} />}
          />
          <StatCard
            label="Overdue"
            value={data?.overdue || 0}
            color="text-red-600"
            icon={<Flag className="text-red-600" size={20} />}
          />
        </div>

        {/* Filters */}
        <TaskFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          assigneeFilter={assigneeFilter}
          onAssigneeFilterChange={setAssigneeFilter}
          onlyOverdue={onlyOverdue}
          onOnlyOverdueChange={setOnlyOverdue}
          teamMembers={teamMembers}
        />

        {/* Table */}
        <TaskList
          tasks={tasks}
          onShowCreate={() => setShowCreate(true)}
          onUpdateStatus={(id, status) =>
            updateMutation.mutate({ id, status })
          }
          onEdit={setEditingTask}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      </div>

      {showCreate && (
        <TaskModal
          title="Create Task"
          teamMembers={teamMembers}
          onClose={() => setShowCreate(false)}
          onSave={(payload) =>
            createMutation.mutate(payload, {
              onSuccess: () => setShowCreate(false),
            })
          }
        />
      )}

      {editingTask && (
        <TaskModal
          title="Edit Task"
          teamMembers={teamMembers}
          initial={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={(payload) =>
            updateMutation.mutate(
              { id: editingTask.id, ...payload },
              { onSuccess: () => setEditingTask(null) },
            )
          }
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="text-sm text-slate-600">{label}</p>
        </div>
      </div>
    </div>
  );
}

function TaskModal({ title, onClose, onSave, teamMembers, initial }) {
  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    status: initial?.status || "todo",
    priority: initial?.priority || "medium",
    assignee_id: initial?.assignee_id || "",
    due_date: initial?.due_date ? String(initial.due_date).slice(0, 10) : "",
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError(null);
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description?.trim() || "",
        status: form.status,
        priority: form.priority,
        assignee_id: form.assignee_id ? Number(form.assignee_id) : null,
        due_date: form.due_date || null,
      };
      await onSave(payload);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title
              </label>
              <input
                aria-label="Task title"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Task title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Details, links, steps..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                >
                  {STATUS_OPTIONS.filter((o) => o.value !== "all").map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priority: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                >
                  {PRIORITY_OPTIONS.filter((o) => o.value !== "all").map(
                    (o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Assignee
                </label>
                <select
                  value={form.assignee_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, assignee_id: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((tm) => (
                    <option key={tm.id} value={tm.id}>
                      {tm.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, due_date: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-medium rounded-lg"
              >
                {saving ? "Saving..." : "Save Task"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
