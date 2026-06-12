"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Star,
} from "lucide-react";

const ROLE_OPTIONS = [
  { value: "real_estate_agent", label: "Real Estate Agent" },
  { value: "property_manager", label: "Property Manager" },
  { value: "hoa_manager", label: "HOA Manager" },
  { value: "condo_board", label: "Condo Board" },
  { value: "facilities_manager", label: "Facilities Manager" },
];

function getRoleLabel(role) {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label || role || "—";
}

function TemplateForm({ initial, onCancel, onSaved }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(
    initial || {
      name: "",
      target_role: "property_manager",
      sequence_step: 1,
      subject_template: "",
      body_template: "",
      is_active: true,
    },
  );
  const [error, setError] = useState(null);

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const method = initial ? "POST" : "POST";
      const body = initial ? { id: initial.id, ...payload } : payload;
      const res = await fetch("/api/marketing/cold-email/templates", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to save template");
      return j;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cold-email-templates"] });
      onSaved?.();
    },
    onError: (e) => setError(e.message),
  });

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-100 text-green-700">
              <Mail size={18} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              {initial ? "Edit Template" : "New Template"}
            </h2>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 text-xl leading-none">
&times;
          </button>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-3">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="e.g. Property Manager Intro"
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Target Role</label>
              <select
                name="target_role"
                value={form.target_role}
                onChange={onChange}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Sequence Step</label>
              <input
                name="sequence_step"
                type="number"
                min="1"
                value={form.sequence_step}
                onChange={onChange}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Subject Template</label>
            <input
              name="subject_template"
              value={form.subject_template}
              onChange={onChange}
              placeholder="e.g. Quick question about {{company}}"
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Body Template</label>
            <textarea
              name="body_template"
              rows={6}
              value={form.body_template}
              onChange={onChange}
              placeholder="Hi {{name}}, ... (use {{name}}, {{city}}, {{company}} as placeholders)"
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-6 pt-2">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="is_active"
                checked={!!form.is_active}
                onChange={onChange}
              />
              Active
            </label>
          </div>
        </div>
        <div className="p-5 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isLoading}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {saveMutation.isLoading && <Loader2 size={14} className="animate-spin" />}
            {saveMutation.isLoading ? "Saving..." : "Save Template"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["cold-email-templates"],
    queryFn: async () => {
      const res = await fetch("/api/marketing/cold-email/templates");
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to load templates");
      return j;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (t) => {
      const res = await fetch("/api/marketing/cold-email/templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to delete");
      return j;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["cold-email-templates"] }),
  });

  const templates = data?.templates || [];

  // Group by role
  const byRole = ROLE_OPTIONS.reduce((acc, role) => {
    acc[role.value] = templates.filter((t) => t.target_role === role.value);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Email Templates</h1>
            <p className="text-sm text-slate-600 mt-1">
              {templates.length} template{templates.length !== 1 ? "s" : ""} across {Object.keys(byRole).filter((k) => byRole[k].length > 0).length} roles
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-3 py-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm"
            >
              <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={() => { setEditTemplate(null); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium"
            >
              <Plus size={14} /> New Template
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 mb-4">
            {error.message}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <Mail className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-slate-900 mb-1">No templates yet</h3>
            <p className="text-slate-500 text-sm mb-4">Create email templates for each role and sequence step.</p>
            <button
              onClick={() => { setEditTemplate(null); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium"
            >
              <Plus size={14} /> Create First Template
            </button>
          </div>
        ) : (
<div className="space-y-6">
            {ROLE_OPTIONS.map((role) => {
              const roleTemplates = byRole[role.value] || [];
              if (roleTemplates.length === 0) return null;
              return (
                <div key={role.value}>
                  <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                    {role.label}
                  </h2>
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Step</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700 hidden md:table-cell">Subject</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {roleTemplates
                          .sort((a, b) => a.sequence_step - b.sequence_step)
                          .map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50">
                              <td className="py-3 px-4 text-slate-700">{t.sequence_step}</td>
                              <td className="py-3 px-4">
                                <div className="font-medium text-slate-900">{t.name}</div>
                              </td>
                              <td className="py-3 px-4 hidden md:table-cell text-slate-500 text-xs truncate max-w-xs">
                                {t.subject_template || "—"}
                              </td>
                              <td className="py-3 px-4">
                                {t.is_active ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-green-800 bg-green-100 border border-green-200">
                                    <Star size={12} /> Active
                                  </span>
                                ) : (
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200">
                                    Inactive
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => { setEditTemplate(t); setShowForm(true); }}
                                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                                    title="Edit"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => deleteMutation.mutate(t)}
                                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
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
            })}
          </div>
        )}
      </div>

      {showForm && (
        <TemplateForm
          initial={editTemplate}
          onCancel={() => setShowForm(false)}
          onSaved={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
