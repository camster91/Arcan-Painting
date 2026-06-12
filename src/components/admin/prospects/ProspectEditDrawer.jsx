"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2 } from "lucide-react";

const ROLE_OPTIONS = [
  { value: "real_estate_agent", label: "Real Estate Agent" },
  { value: "property_manager", label: "Property Manager" },
  { value: "hoa_manager", label: "HOA Manager" },
  { value: "condo_board", label: "Condo Board" },
  { value: "facilities_manager", label: "Facilities Manager" },
];

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "emailed", label: "Emailed" },
  { value: "replied", label: "Replied" },
  { value: "converted", label: "Converted" },
  { value: "unsubscribed", label: "Unsubscribed" },
  { value: "bounced", label: "Bounced" },
];

export default function ProspectEditDrawer({ prospect, onClose }) {
  const queryClient = useQueryClient();
  const isNew = !prospect;

  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    role: "property_manager",
    city: "Toronto",
    status: "new",
    sequence_step: 0,
    notes: "",
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (prospect) {
      setForm({
        name: prospect.name || "",
        email: prospect.email || "",
        company: prospect.company || "",
        role: prospect.role || "property_manager",
        city: prospect.city || "Toronto",
        status: prospect.status || "new",
        sequence_step: prospect.sequence_step ?? 0,
        notes: prospect.notes || "",
      });
    }
  }, [prospect]);

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (isNew) {
        const res = await fetch("/api/marketing/cold-email/prospects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "add_manual", ...payload }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error || "Failed to add prospect");
        return j;
      } else {
        const res = await fetch("/api/marketing/cold-email/prospects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update_prospect", prospectId: prospect.id, ...payload }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error || "Failed to update prospect");
        return j;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cold-email-prospects"] });
      onClose();
    },
    onError: (e) => setError(e.message),
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white shadow-xl flex flex-col h-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {isNew ? "Add Prospect" : "Edit Prospect"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
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
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Email *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                required={isNew}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Company</label>
              <input
                name="company"
                value={form.company}
                onChange={onChange}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">City</label>
              <input
                name="city"
                value={form.city}
                onChange={onChange}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={onChange}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={onChange}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Sequence Step</label>
            <input
              name="sequence_step"
              type="number"
              min="0"
              value={form.sequence_step}
              onChange={onChange}
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              name="notes"
              rows={3}
              value={form.notes}
              onChange={onChange}
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Internal notes about this prospect..."
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isLoading}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {saveMutation.isLoading && <Loader2 size={14} className="animate-spin" />}
            {saveMutation.isLoading ? "Saving..." : isNew ? "Add Prospect" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
