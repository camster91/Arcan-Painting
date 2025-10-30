"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Plus,
  CheckCircle2,
  Star,
  Trash2,
  Pencil,
  ToggleRight,
} from "lucide-react";

function TemplateForm({ initial, onCancel, onSaved }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(
    initial || {
      name: "",
      description: "",
      scope_template: "",
      terms_template: "",
      payment_terms_template: "",
      warranty_template: "",
      default_deposit_percentage: 25,
      is_active: true,
      is_default: false,
    },
  );
  const [error, setError] = useState(null);

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const method = initial ? "PUT" : "POST";
      const res = await fetch("/api/contract-templates", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          initial ? { id: initial.id, ...payload } : payload,
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to save template");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-templates"] });
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
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <FileText size={18} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              {initial ? "Edit Template" : "New Template"}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-800"
          >
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-3">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Default Deposit %
              </label>
              <input
                name="default_deposit_percentage"
                type="number"
                min="0"
                max="100"
                value={form.default_deposit_percentage}
                onChange={onChange}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Short Description
            </label>
            <input
              name="description"
              value={form.description}
              onChange={onChange}
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Scope of Work
            </label>
            <textarea
              name="scope_template"
              rows={4}
              value={form.scope_template}
              onChange={onChange}
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Terms & Conditions
              </label>
              <textarea
                name="terms_template"
                rows={4}
                value={form.terms_template}
                onChange={onChange}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Payment Terms
              </label>
              <textarea
                name="payment_terms_template"
                rows={4}
                value={form.payment_terms_template}
                onChange={onChange}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Warranty
            </label>
            <textarea
              name="warranty_template"
              rows={3}
              value={form.warranty_template}
              onChange={onChange}
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex items-center gap-6 pt-2">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="is_active"
                checked={!!form.is_active}
                onChange={onChange}
              />{" "}
              Active
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="is_default"
                checked={!!form.is_default}
                onChange={onChange}
              />{" "}
              Default
            </label>
          </div>
        </div>
        <div className="p-5 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isLoading}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
          >
            {saveMutation.isLoading ? "Saving..." : "Save Template"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContractTemplatesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["contract-templates"],
    queryFn: async () => {
      const res = await fetch("/api/contract-templates");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load templates");
      return data;
    },
  });

  const setDefault = useMutation({
    mutationFn: async (t) => {
      const res = await fetch("/api/contract-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id, is_default: true, is_active: true }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to set default");
      return j;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["contract-templates"] }),
  });

  const toggleActive = useMutation({
    mutationFn: async (t) => {
      const res = await fetch("/api/contract-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id, is_active: !t.is_active }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to update status");
      return j;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["contract-templates"] }),
  });

  const remove = useMutation({
    mutationFn: async (t) => {
      const res = await fetch(`/api/contract-templates?id=${t.id}`, {
        method: "DELETE",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to delete");
      return j;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["contract-templates"] }),
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            Contract Templates
          </h1>
          <button
            onClick={() => {
              setEditTemplate(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
          >
            <Plus size={16} /> New Template
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 mb-4">
            {error.message}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Deposit %
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : (data || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No templates yet
                    </td>
                  </tr>
                ) : (
                  (data || []).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {t.name}
                        </div>
                        <div className="text-sm text-slate-600">
                          {t.description}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm">
                          {t.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-green-800 bg-green-100 border border-green-200">
                              <CheckCircle2 size={14} /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-slate-800 bg-slate-100 border border-slate-200">
                              Inactive
                            </span>
                          )}
                          {t.is_default && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-amber-900 bg-amber-100 border border-amber-200">
                              <Star size={14} /> Default
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700">
                        {t.default_deposit_percentage || 25}%
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditTemplate(t);
                              setShowForm(true);
                            }}
                            className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          {!t.is_default && (
                            <button
                              onClick={() => setDefault.mutate(t)}
                              className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                              title="Make Default"
                            >
                              <Star size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => toggleActive.mutate(t)}
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Toggle Active"
                          >
                            <ToggleRight size={16} />
                          </button>
                          {!t.is_default && (
                            <button
                              onClick={() => remove.mutate(t)}
                              className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <TemplateForm
            initial={editTemplate}
            onCancel={() => setShowForm(false)}
            onSaved={() => setShowForm(false)}
          />
        )}
      </div>
    </div>
  );
}
