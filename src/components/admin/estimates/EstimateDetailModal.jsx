import {
  getStatusInfo,
  formatCurrency,
  formatDateLong,
} from "@/utils/estimatesUtils";
import { useState } from "react";

export function EstimateDetailModal({
  estimate,
  onClose,
  onUpdated,
  onNotification,
}) {
  const statusInfo = getStatusInfo(estimate.status);
  const StatusIcon = statusInfo.icon;

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [approving, setApproving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [form, setForm] = useState({
    project_title: estimate.project_title,
    project_description: estimate.project_description || "",
    labor_cost: estimate.labor_cost,
    material_cost: estimate.material_cost,
    total_cost: estimate.total_cost,
    estimated_duration_days: estimate.estimated_duration_days || "",
    status: estimate.status,
    valid_until: estimate.valid_until || "",
    notes: estimate.notes || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/estimates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: estimate.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update estimate");
      }
      setIsEditing(false);
      onUpdated?.(data.estimate);
      onClose();
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    try {
      setSending(true);
      setError(null);
      const res = await fetch(`/api/estimates/${estimate.id}/send`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to send");
      }
      onUpdated?.();
      onNotification?.("Estimate sent successfully to client!");
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      setDuplicating(true);
      setError(null);
      const res = await fetch(`/api/estimates/${estimate.id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to duplicate estimate");
      }
      onUpdated?.();
      onNotification?.(
        `Estimate duplicated successfully! New estimate: ${data.estimate_number}`,
      );
      onClose();
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setDuplicating(false);
    }
  };

  const handleDownload = () => {
    window.open(`/api/estimates/${estimate.id}/pdf`, "_blank");
  };

  const handleApprove = async () => {
    try {
      setApproving(true);
      setError(null);
      const res = await fetch(`/api/estimates/${estimate.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_name: form.project_title }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to approve");
      }
      onUpdated?.();
      onNotification?.("Project created successfully from estimate!");
      onClose();
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Estimate Details
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Header Info */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Estimate Number
                  </label>
                  <p className="text-lg font-bold text-slate-900">
                    {estimate.estimate_number}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <div className="mt-1">
                    {isEditing ? (
                      <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="px-3 py-1 border border-slate-300 rounded-lg text-sm"
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="expired">Expired</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.color}`}
                      >
                        <StatusIcon size={14} />
                        {statusInfo.label}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Total Value
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      name="total_cost"
                      value={form.total_cost}
                      onChange={handleChange}
                      className="w-full px-3 py-1 border border-slate-300 rounded-lg text-sm"
                    />
                  ) : (
                    <p className="text-lg font-bold text-amber-600">
                      {formatCurrency(estimate.total_cost)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">
                Project Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Project Title
                  </label>
                  {isEditing ? (
                    <input
                      name="project_title"
                      value={form.project_title}
                      onChange={handleChange}
                      className="w-full px-3 py-1 border border-slate-300 rounded-lg text-sm"
                    />
                  ) : (
                    <p className="text-slate-900">{estimate.project_title}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Estimated Duration (days)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="estimated_duration_days"
                      value={form.estimated_duration_days}
                      onChange={handleChange}
                      className="w-full px-3 py-1 border border-slate-300 rounded-lg text-sm"
                    />
                  ) : (
                    <p className="text-slate-900">
                      {estimate.estimated_duration_days || "Not specified"} days
                    </p>
                  )}
                </div>
              </div>
              {isEditing ? (
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    name="project_description"
                    rows={3}
                    value={form.project_description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              ) : (
                estimate.project_description && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Description
                    </label>
                    <div className="bg-slate-50 p-3 rounded-lg mt-1">
                      <p className="text-slate-700">
                        {estimate.project_description}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Cost Breakdown */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">
                Cost Breakdown
              </h3>
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">Labor Cost:</span>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        name="labor_cost"
                        value={form.labor_cost}
                        onChange={handleChange}
                        className="w-32 px-2 py-1 border border-slate-300 rounded"
                      />
                    ) : (
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(estimate.labor_cost)}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">Material Cost:</span>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        name="material_cost"
                        value={form.material_cost}
                        onChange={handleChange}
                        className="w-32 px-2 py-1 border border-slate-300 rounded"
                      />
                    ) : (
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(estimate.material_cost)}
                      </span>
                    )}
                  </div>
                  {!isEditing && <hr className="border-slate-300" />}
                  {!isEditing && (
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-semibold text-slate-900">
                        Total:
                      </span>
                      <span className="font-bold text-amber-600">
                        {formatCurrency(estimate.total_cost)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Timeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Created
                  </label>
                  <p className="text-slate-900">
                    {formatDateLong(estimate.created_at)}
                  </p>
                  {estimate.created_by && (
                    <p className="text-sm text-slate-500">
                      by {estimate.created_by}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Valid Until
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="valid_until"
                      value={form.valid_until || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-1 border border-slate-300 rounded-lg text-sm"
                    />
                  ) : (
                    <p className="text-slate-900">
                      {formatDateLong(estimate.valid_until)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Notes</h3>
              {isEditing ? (
                <textarea
                  name="notes"
                  rows={3}
                  value={form.notes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              ) : (
                estimate.notes && (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-slate-700">{estimate.notes}</p>
                  </div>
                )
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex flex-wrap gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Edit Estimate
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {sending ? "Sending..." : "Send to Customer"}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={handleDuplicate}
                    disabled={duplicating}
                    className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {duplicating ? "Duplicating..." : "Duplicate Estimate"}
                  </button>
                  {estimate.status !== "approved" && (
                    <button
                      onClick={handleApprove}
                      disabled={approving}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {approving
                        ? "Creating Project..."
                        : "Approve → Create Project"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
