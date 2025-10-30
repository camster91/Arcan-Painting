"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Flag,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Pencil,
  Trash2,
} from "lucide-react";

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

  const renderStatusPill = (status) => {
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
  };

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
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div className="relative">
              <Filter
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="pr-8 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <User
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="">All assignees</option>
                {teamMembers.map((tm) => (
                  <option key={tm.id} value={tm.id}>
                    {tm.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={onlyOverdue}
                onChange={(e) => setOnlyOverdue(e.target.checked)}
                className="rounded border-slate-300"
              />
              Overdue only
            </label>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {tasks.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No tasks found
              </h3>
              <p className="text-slate-600 mb-4">
                Try adjusting your filters or create a new task.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
              >
                Create Task
              </button>
            </div>
          ) : (
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
                              onClick={() =>
                                updateMutation.mutate({
                                  id: t.id,
                                  status: "done",
                                })
                              }
                              className="text-green-600 hover:text-green-700 text-sm font-medium inline-flex items-center gap-1"
                            >
                              <CheckCircle2 size={16} /> Mark Done
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                updateMutation.mutate({
                                  id: t.id,
                                  status: "todo",
                                })
                              }
                              className="text-slate-600 hover:text-slate-700 text-sm font-medium inline-flex items-center gap-1"
                            >
                              <AlertCircle size={16} /> Reopen
                            </button>
                          )}
                          <button
                            onClick={() => setEditingTask(t)}
                            className="text-amber-600 hover:text-amber-700 text-sm font-medium inline-flex items-center gap-1"
                          >
                            <Pencil size={16} /> Edit
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(t.id)}
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
          )}
        </div>
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
