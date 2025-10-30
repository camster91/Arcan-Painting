"use client";

import { useState } from "react";
import MobileModal from "@/components/MobileModal";

export default function LeadEditModal({
  lead,
  onClose,
  onUpdated,
  mode = "edit",
}) {
  const isCreate = mode === "create" || !lead?.id;
  const [form, setForm] = useState({
    name: lead?.name || "",
    email: lead?.email || "",
    phone: lead?.phone || "",
    service_type: lead?.service_type || "Interior Painting",
    preferred_contact: lead?.preferred_contact || "phone",
    status: lead?.status || "new",
    lead_source: lead?.lead_source || "website",
    estimated_value: lead?.estimated_value ?? "",
    follow_up_date: lead?.follow_up_date || "",
    address: lead?.address || "",
    project_description: lead?.project_description || "",
    notes: lead?.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (isCreate) {
        // Create new lead
        const payload = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          serviceType: form.service_type,
          projectDescription: form.project_description,
          preferredContact: form.preferred_contact,
          address: form.address,
        };
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Failed to create lead`);
        }
        onUpdated?.(data.lead);
      } else {
        // Update existing lead
        const res = await fetch("/api/leads", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: lead.id,
            ...form,
            estimated_value:
              form.estimated_value === "" ? null : form.estimated_value,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Failed to update lead`);
        }
        onUpdated?.(data.lead);
      }

      onClose();
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const footerContent = (
    <div className="flex gap-3">
      <button
        onClick={onClose}
        disabled={saving}
        className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        onClick={handleSave}
        disabled={saving || !form.name || !form.email || !form.phone}
        className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
      >
        {saving ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {isCreate ? "Creating..." : "Saving..."}
          </div>
        ) : isCreate ? (
          "Create Lead"
        ) : (
          "Save Changes"
        )}
      </button>
    </div>
  );

  return (
    <MobileModal
      isOpen={true}
      onClose={onClose}
      title={isCreate ? "Add New Lead" : "Edit Lead"}
      footer={footerContent}
      className="max-h-screen"
    >
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Contact Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
            Contact Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name *
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter customer name"
                className="w-full px-4 py-4 lg:py-3 border border-slate-300 rounded-xl lg:rounded-lg 
                           focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                           text-base placeholder:text-slate-400 bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address *
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="customer@email.com"
                  className="w-full px-4 py-4 lg:py-3 border border-slate-300 rounded-xl lg:rounded-lg 
                             focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                             text-base placeholder:text-slate-400 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number *
                </label>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-4 lg:py-3 border border-slate-300 rounded-xl lg:rounded-lg 
                             focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                             text-base placeholder:text-slate-400 bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Preferred Contact Method
              </label>
              <select
                name="preferred_contact"
                value={form.preferred_contact}
                onChange={handleChange}
                className="w-full px-4 py-4 lg:py-3 border border-slate-300 rounded-xl lg:rounded-lg 
                           focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                           text-base bg-white"
              >
                <option value="phone">Phone Call</option>
                <option value="email">Email</option>
                <option value="text">Text Message</option>
              </select>
            </div>
          </div>
        </div>

        {/* Project Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
            Project Details
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Service Type
              </label>
              <input
                name="service_type"
                value={form.service_type}
                onChange={handleChange}
                placeholder="e.g., Interior Painting, Exterior Painting"
                className="w-full px-4 py-4 lg:py-3 border border-slate-300 rounded-xl lg:rounded-lg 
                           focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                           text-base placeholder:text-slate-400 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Project Address
              </label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="123 Main St, City, State 12345"
                className="w-full px-4 py-4 lg:py-3 border border-slate-300 rounded-xl lg:rounded-lg 
                           focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                           text-base placeholder:text-slate-400 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Project Description
              </label>
              <textarea
                name="project_description"
                rows={4}
                value={form.project_description}
                onChange={handleChange}
                placeholder="Describe the painting project, rooms, surfaces, etc..."
                className="w-full px-4 py-4 lg:py-3 border border-slate-300 rounded-xl lg:rounded-lg 
                           focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                           text-base placeholder:text-slate-400 bg-white resize-none"
              />
            </div>
          </div>
        </div>

        {/* Lead Management Section - Only show when editing */}
        {!isCreate && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
              Lead Management
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full px-4 py-4 lg:py-3 border border-slate-300 rounded-xl lg:rounded-lg 
                             focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                             text-base bg-white"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="estimate_scheduled">Estimate Scheduled</option>
                  <option value="estimate_sent">Estimate Sent</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Estimated Value
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    name="estimated_value"
                    value={form.estimated_value}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-4 lg:py-3 border border-slate-300 rounded-xl lg:rounded-lg 
                               focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                               text-base placeholder:text-slate-400 bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Follow Up Date
              </label>
              <input
                type="date"
                name="follow_up_date"
                value={form.follow_up_date || ""}
                onChange={handleChange}
                className="w-full px-4 py-4 lg:py-3 border border-slate-300 rounded-xl lg:rounded-lg 
                           focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                           text-base bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Internal Notes
              </label>
              <textarea
                name="notes"
                rows={3}
                value={form.notes}
                onChange={handleChange}
                placeholder="Add any internal notes about this lead..."
                className="w-full px-4 py-4 lg:py-3 border border-slate-300 rounded-xl lg:rounded-lg 
                           focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                           text-base placeholder:text-slate-400 bg-white resize-none"
              />
            </div>
          </div>
        )}

        {/* Extra spacing for mobile to account for bottom bar */}
        <div className="h-20 sm:hidden" />
      </div>
    </MobileModal>
  );
}
