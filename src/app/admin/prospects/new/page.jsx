"use client";

import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";

const ROLE_OPTIONS = [
  { value: "real_estate_agent", label: "Real Estate Agent" },
  { value: "property_manager", label: "Property Manager" },
  { value: "hoa_manager", label: "HOA Manager" },
  { value: "condo_board", label: "Condo Board" },
  { value: "facilities_manager", label: "Facilities Manager" },
];

export default function NewProspectPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    role: "property_manager",
    city: "Toronto",
  });
  const [error, setError] = useState(null);

  const addMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/marketing/cold-email/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_manual", ...payload }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to add prospect");
      return j;
    },
    onSuccess: () => {
      navigate("/admin/prospects");
    },
    onError: (e) => setError(e.message),
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <a
              href="/admin/prospects"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
            </a>
            <h1 className="text-2xl font-bold text-slate-900">Add Prospect</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="john@company.com"
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
                  placeholder="ABC Property Management"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">City</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={onChange}
                  className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Toronto"
                />
              </div>
            </div>

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
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
            <a
              href="/admin/prospects"
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200"
            >
              Cancel
            </a>
            <button
              onClick={() => addMutation.mutate(form)}
              disabled={addMutation.isLoading || !form.email}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {addMutation.isLoading && <Loader2 size={14} className="animate-spin" />}
              {addMutation.isLoading ? "Adding..." : "Add Prospect"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
