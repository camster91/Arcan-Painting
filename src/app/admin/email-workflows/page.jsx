"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Workflow,
  RefreshCw,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

export default function EmailWorkflowsAdminPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    trigger_event: "estimate_sent",
    template_id: "",
    delay_hours: 0,
    is_active: true,
  });
  const [error, setError] = useState("");

  const {
    data: workflowsData,
    isLoading: wfLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["email-workflows"],
    queryFn: async () => {
      const res = await fetch("/api/email-workflows");
      if (!res.ok) throw new Error(`Failed to fetch workflows [${res.status}]`);
      return res.json();
    },
  });

  const { data: templatesData } = useQuery({
    queryKey: ["email-templates:options"],
    queryFn: async () => {
      const res = await fetch("/api/email-templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });

  const workflows =
    workflowsData?.workflows || workflowsData?.email_workflows || [];
  const templates =
    templatesData?.templates || templatesData?.email_templates || [];

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/email-workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(j?.error || `Failed to create [${res.status}]`);
      return j;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-workflows"] });
      setForm({
        name: "",
        trigger_event: "estimate_sent",
        template_id: "",
        delay_hours: 0,
        is_active: true,
      });
    },
    onError: (e) => setError(e.message || "Could not save workflow"),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/email-workflows", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Failed to update");
      return j;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-workflows"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch("/api/email-workflows", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Failed to delete [${res.status}]`);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-workflows"] }),
  });

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.template_id) {
      setError("Name and Template are required");
      return;
    }
    createMutation.mutate({
      name: form.name,
      trigger_event: form.trigger_event,
      template_id: parseInt(form.template_id, 10),
      delay_hours: parseInt(form.delay_hours, 10) || 0,
      is_active: !!form.is_active,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 rounded-lg">
                <Workflow className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Email Workflows
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Automate follow-ups and notifications
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
              Create Workflow
            </h3>
            <div>
              <label className="text-sm text-slate-700">Name*</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-700">Trigger</label>
              <select
                value={form.trigger_event}
                onChange={(e) =>
                  setForm({ ...form, trigger_event: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="estimate_sent">Estimate Sent</option>
                <option value="estimate_approved">Estimate Approved</option>
                <option value="invoice_sent">Invoice Sent</option>
                <option value="payment_received">Payment Received</option>
                <option value="project_start">Project Start</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-700">Template*</label>
                <select
                  value={form.template_id}
                  onChange={(e) =>
                    setForm({ ...form, template_id: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="">Select template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.display_name || t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-700">Delay (hours)</label>
                <input
                  type="number"
                  min="0"
                  value={form.delay_hours}
                  onChange={(e) =>
                    setForm({ ...form, delay_hours: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
              />
              <label htmlFor="is_active" className="text-sm text-slate-700">
                Active
              </label>
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
              {createMutation.isLoading ? "Saving..." : "Create Workflow"}
            </button>
          </form>

          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Workflows</h3>
            {wfLoading ? (
              <div className="text-slate-600">Loading...</div>
            ) : workflows.length === 0 ? (
              <div className="text-slate-600">No workflows yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-2 px-3">Name</th>
                      <th className="text-left py-2 px-3">Trigger</th>
                      <th className="text-left py-2 px-3">Template</th>
                      <th className="text-left py-2 px-3">Delay</th>
                      <th className="text-left py-2 px-3">Active</th>
                      <th className="text-right py-2 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {workflows.map((w) => (
                      <tr key={w.id}>
                        <td className="py-2 px-3">
                          <div className="font-medium text-slate-900">
                            {w.name}
                          </div>
                          <div className="text-xs text-slate-500">{w.id}</div>
                        </td>
                        <td className="py-2 px-3">{w.trigger_event}</td>
                        <td className="py-2 px-3">
                          {w.template_display_name ||
                            w.template_name ||
                            w.template_id}
                        </td>
                        <td className="py-2 px-3">{w.delay_hours || 0}h</td>
                        <td className="py-2 px-3">
                          <button
                            onClick={() =>
                              updateMutation.mutate({
                                id: w.id,
                                is_active: !w.is_active,
                              })
                            }
                            className="inline-flex items-center gap-2 px-2 py-1 border border-slate-300 rounded"
                          >
                            {w.is_active ? (
                              <ToggleRight
                                size={16}
                                className="text-green-600"
                              />
                            ) : (
                              <ToggleLeft
                                size={16}
                                className="text-slate-400"
                              />
                            )}{" "}
                            {w.is_active ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => deleteMutation.mutate(w.id)}
                            className="px-2 py-1 text-red-600 hover:text-red-700 text-sm inline-flex items-center gap-1"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </td>
                      </tr>
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
