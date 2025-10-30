"use client";

import { useState } from "react";
import MobileModal from "@/components/MobileModal";

export default function CreateProjectModal({ estimates, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    estimate_id: "",
    project_name: "",
    start_date: "",
    end_date: "",
    crew_assigned: "",
    notes: "",
    final_cost: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
      console.error("Error creating project:", err);
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="flex gap-4 justify-between">
      <button
        type="button"
        onClick={onClose}
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all duration-200 font-medium"
      >
        Cancel
      </button>
      <button
        type="submit"
        onClick={handleSubmit}
        disabled={loading || !formData.estimate_id || !formData.project_name}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold px-8 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Creating...
          </>
        ) : (
          "Create Project"
        )}
      </button>
    </div>
  );

  return (
    <MobileModal
      isOpen={true}
      onClose={onClose}
      title="Create New Project"
      footer={footer}
      className="lg:max-w-2xl"
    >
      <div className="">
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Approved Estimate
            </label>
            <select
              required
              value={formData.estimate_id}
              onChange={(e) => {
                const estimateId = e.target.value;
                const selectedEstimate = estimates.find(
                  (est) => est.id.toString() === estimateId,
                );
                setFormData({
                  ...formData,
                  estimate_id: estimateId,
                  project_name: selectedEstimate
                    ? selectedEstimate.project_title
                    : "",
                  final_cost: selectedEstimate
                    ? selectedEstimate.total_cost
                    : "",
                });
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">Choose an approved estimate...</option>
              {estimates.map((estimate) => (
                <option key={estimate.id} value={estimate.id}>
                  {estimate.estimate_number} - {estimate.project_title} (
                  {estimate.total_cost ? `$${estimate.total_cost}` : "No cost"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              required
              value={formData.project_name}
              onChange={(e) =>
                setFormData({ ...formData, project_name: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Crew Assigned
              </label>
              <input
                type="text"
                value={formData.crew_assigned}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    crew_assigned: e.target.value,
                  })
                }
                placeholder="e.g., Team Alpha, John & Mike"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Final Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.final_cost}
                onChange={(e) =>
                  setFormData({ ...formData, final_cost: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Project Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Special instructions, materials, or notes..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </form>
      </div>
    </MobileModal>
  );
}
