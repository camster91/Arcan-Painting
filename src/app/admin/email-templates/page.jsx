"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, RefreshCw, Plus, Trash2, Save } from "lucide-react";

export default function EmailTemplatesAdminPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    display_name: "",
    subject_template: "",
    html_template: "",
    text_template: "",
    category: "general",
  });
  const [error, setError] = useState("");

  const {
    data,
    isLoading,
    isFetching,
    refetch,
    error: qErr,
  } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const res = await fetch("/api/email-templates");
      if (!res.ok) {
        throw new Error(
          `When fetching /api/email-templates, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const templates = data?.templates || data?.email_templates || [];

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          j?.error || `Failed to create template [${res.status}]`,
        );
      }
      return j;
    },
    onSuccess: () => {
      setForm({
        name: "",
        display_name: "",
        subject_template: "",
        html_template: "",
        text_template: "",
        category: "general",
      });
      qc.invalidateQueries({ queryKey: ["email-templates"] });
    },
    onError: (e) => setError(e.message || "Could not save template"),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Failed to update");
      return j;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch("/api/email-templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Failed to delete [${res.status}]`);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  });

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.display_name || !form.subject_template) {
      setError("Name, Display Name, and Subject are required");
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 rounded-lg">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Email Templates
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Manage the templates used for emails
                </p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-3 py-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <RefreshCw
                size={16}
                className={isFetching ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form
            onSubmit={onSubmit}
            className="bg-white border border-slate-200 rounded-lg p-6 space-y-3"
          >
            <h3 className="font-semibold text-slate-900 mb-1">
              Create Template
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-700">Name*</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">Display Name*</label>
                <input
                  value={form.display_name}
                  onChange={(e) =>
                    setForm({ ...form, display_name: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-700">Category</label>
                <input
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">Subject*</label>
                <input
                  value={form.subject_template}
                  onChange={(e) =>
                    setForm({ ...form, subject_template: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-700">HTML</label>
              <textarea
                rows={4}
                value={form.html_template}
                onChange={(e) =>
                  setForm({ ...form, html_template: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="<div>Hello {{name}}</div>"
              />
            </div>
            <div>
              <label className="text-sm text-slate-700">Text</label>
              <textarea
                rows={3}
                value={form.text_template}
                onChange={(e) =>
                  setForm({ ...form, text_template: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="Hello {{name}}"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg py-2.5 font-medium flex items-center justify-center gap-2"
            >
              <Plus size={16} />{" "}
              {createMutation.isLoading ? "Saving..." : "Create Template"}
            </button>
          </form>

          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Templates</h3>
            {isLoading ? (
              <div className="text-slate-600">Loading...</div>
            ) : templates.length === 0 ? (
              <div className="text-slate-600">No templates yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-2 px-3">Name</th>
                      <th className="text-left py-2 px-3">Subject</th>
                      <th className="text-left py-2 px-3">Category</th>
                      <th className="text-left py-2 px-3">Updated</th>
                      <th className="text-right py-2 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {templates.map((t) => (
                      <TemplateRow
                        key={t.id}
                        t={t}
                        onSave={(updates) =>
                          updateMutation.mutate({ id: t.id, ...updates })
                        }
                        onDelete={() => deleteMutation.mutate(t.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateRow({ t, onSave, onDelete }) {
  const [edit, setEdit] = useState(false);
  const [row, setRow] = useState({
    display_name: t.display_name,
    subject_template: t.subject_template,
    category: t.category || "general",
  });

  return (
    <tr>
      <td className="py-2 px-3">
        <div className="font-medium text-slate-900">{t.name}</div>
        <div className="text-xs text-slate-500">{t.id}</div>
      </td>
      <td className="py-2 px-3">
        {edit ? (
          <input
            value={row.subject_template}
            onChange={(e) =>
              setRow({ ...row, subject_template: e.target.value })
            }
            className="w-full px-2 py-1 border border-slate-300 rounded"
          />
        ) : (
          <div className="text-slate-700 truncate max-w-[280px]">
            {t.subject_template}
          </div>
        )}
      </td>
      <td className="py-2 px-3">
        {edit ? (
          <input
            value={row.category}
            onChange={(e) => setRow({ ...row, category: e.target.value })}
            className="w-full px-2 py-1 border border-slate-300 rounded"
          />
        ) : (
          <div className="text-slate-700">{t.category || "general"}</div>
        )}
      </td>
      <td className="py-2 px-3 text-sm text-slate-500">
        {t.updated_at ? new Date(t.updated_at).toLocaleString() : "—"}
      </td>
      <td className="py-2 px-3 text-right">
        {edit ? (
          <div className="inline-flex gap-2">
            <button
              onClick={() => {
                onSave(row);
                setEdit(false);
              }}
              className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-sm inline-flex items-center gap-1"
            >
              <Save size={14} /> Save
            </button>
            <button
              onClick={() => setEdit(false)}
              className="px-2 py-1 border border-slate-300 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="inline-flex gap-2">
            <button
              onClick={() => setEdit(true)}
              className="px-2 py-1 border border-slate-300 rounded text-sm"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="px-2 py-1 text-red-600 hover:text-red-700 text-sm inline-flex items-center gap-1"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
