"use client";

import { useState } from "react";
import MobileModal from "@/components/MobileModal";
import {
  formatDate,
  formatCurrency,
  getStatusInfo,
} from "@/utils/projectsUtils";
import useUpload from "@/utils/useUpload";

export default function ProjectDetailModal({ project, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    completion_percentage: project.completion_percentage || 0,
    status: project.status,
    crew_assigned: project.crew_assigned || "",
    notes: project.notes || "",
    // NEW: allow editing dates and site coordinates
    start_date: project.start_date || "",
    end_date: project.end_date || "",
    site_lat: project.site_lat ?? "",
    site_lng: project.site_lng ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // NEW: progress form state
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [progressDescription, setProgressDescription] = useState("");
  const [progressFiles, setProgressFiles] = useState([]);
  const [progressSubmitting, setProgressSubmitting] = useState(false);
  const [upload, { loading: uploading }] = useUpload();
  const [progressError, setProgressError] = useState(null);
  const [progressSuccess, setProgressSuccess] = useState(false);

  const statusInfo = getStatusInfo(project.status);
  const StatusIcon = statusInfo.icon;

  const handleUpdate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/projects", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: project.id,
          ...editData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update project");
      }

      setIsEditing(false);
      onUpdate();
      onClose();
    } catch (err) {
      setError(err.message);
      console.error("Error updating project:", err);
    } finally {
      setLoading(false);
    }
  };

  // NEW: submit progress with photos
  const handleSubmitProgress = async () => {
    try {
      setProgressError(null);
      setProgressSuccess(false);
      setProgressSubmitting(true);

      // upload files to get URLs
      const urls = [];
      for (const file of progressFiles) {
        const { url, error: upErr } = await upload({ file });
        if (upErr) {
          throw new Error(upErr);
        }
        if (url) urls.push(url);
      }

      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const report_date = `${yyyy}-${mm}-${dd}`;

      const res = await fetch("/api/project-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: project.id,
          report_date,
          work_description: progressDescription || "Progress update",
          progress_percentage: editData.completion_percentage,
          photos: urls,
        }),
      });
      if (!res.ok) {
        throw new Error(`Failed to save progress (${res.status})`);
      }

      setProgressSuccess(true);
      setProgressDescription("");
      setProgressFiles([]);
      // refresh parent data
      onUpdate();
    } catch (e) {
      console.error(e);
      setProgressError(e.message || "Failed to save progress");
    } finally {
      setProgressSubmitting(false);
    }
  };

  const footer = (
    <div className="flex flex-wrap gap-3 justify-between">
      <div className="text-sm text-slate-600">{project.project_name}</div>
      <div className="flex gap-3">
        {isEditing ? (
          <>
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? "Saving..." : "Save Changes"}
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
              Edit Project
            </button>
            {project.lead_email && (
              <a
                href={`mailto:${project.lead_email}?subject=Project Update - ${project.project_name}&body=Hi ${project.lead_name},%0D%0A%0D%0AHere's an update on your ${project.project_name} project.`}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Email Customer
              </a>
            )}
          </>
        )}
        <button
          onClick={onClose}
          className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <MobileModal
      isOpen={true}
      onClose={onClose}
      title="Project Details"
      footer={footer}
      className="lg:max-w-5xl"
    >
      <div className="space-y-6">
        <div className="bg-slate-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Project Name
              </label>
              <p className="text-lg font-bold text-slate-900">
                {project.project_name}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Status
              </label>
              <div className="mt-1">
                {isEditing ? (
                  <select
                    value={editData.status}
                    onChange={(e) =>
                      setEditData({ ...editData, status: e.target.value })
                    }
                    className="px-3 py-1 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
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
                Progress
              </label>
              <div className="mt-1">
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editData.completion_percentage}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        completion_percentage: parseInt(e.target.value) || 0,
                      })
                    }
                    className="px-3 py-1 border border-slate-300 rounded-lg text-sm w-20"
                  />
                ) : (
                  <p className="text-lg font-bold text-amber-600">
                    {project.completion_percentage || 0}%
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Value
              </label>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(project.final_cost)}
              </p>
            </div>
          </div>
        </div>

        {project.lead_name && (
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Customer
                </label>
                <p className="text-slate-900">{project.lead_name}</p>
              </div>
              {project.lead_email && (
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <p className="text-slate-900">
                    <a
                      href={`mailto:${project.lead_email}`}
                      className="text-amber-600 hover:text-amber-700"
                    >
                      {project.lead_email}
                    </a>
                  </p>
                </div>
              )}
              {project.lead_phone && (
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Phone
                  </label>
                  <p className="text-slate-900">
                    <a
                      href={`tel:${project.lead_phone}`}
                      className="text-amber-600 hover:text-amber-700"
                    >
                      {project.lead_phone}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-semibold text-slate-900 mb-3">Project Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Start Date
              </label>
              <div className="mt-1">
                {isEditing ? (
                  <input
                    type="date"
                    value={editData.start_date || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        start_date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1 border border-slate-300 rounded-lg text-sm"
                  />
                ) : (
                  <p className="text-slate-900">
                    {formatDate(project.start_date)}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                End Date
              </label>
              <div className="mt-1">
                {isEditing ? (
                  <input
                    type="date"
                    value={editData.end_date || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, end_date: e.target.value })
                    }
                    className="w-full px-3 py-1 border border-slate-300 rounded-lg text-sm"
                  />
                ) : (
                  <p className="text-slate-900">
                    {formatDate(project.end_date)}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Crew Assigned
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.crew_assigned}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      crew_assigned: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1 border border-slate-300 rounded-lg text-sm"
                  placeholder="Team name or members"
                />
              ) : (
                <p className="text-slate-900">
                  {project.crew_assigned || "Not assigned"}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Duration
              </label>
              <p className="text-slate-900">
                {project.actual_duration_days
                  ? `${project.actual_duration_days} days (actual)`
                  : project.start_date && project.end_date
                    ? `${Math.ceil((new Date(project.end_date) - new Date(project.start_date)) / (1000 * 60 * 60 * 24))} days (planned)`
                    : "Not specified"}
              </p>
            </div>
          </div>

          {/* NEW: Site Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Site Latitude
              </label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.00000001"
                  value={editData.site_lat}
                  onChange={(e) =>
                    setEditData({ ...editData, site_lat: e.target.value })
                  }
                  className="w-full px-3 py-1 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g., 43.6532"
                />
              ) : (
                <p className="text-slate-900">{project.site_lat ?? "—"}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Site Longitude
              </label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.00000001"
                  value={editData.site_lng}
                  onChange={(e) =>
                    setEditData({ ...editData, site_lng: e.target.value })
                  }
                  className="w-full px-3 py-1 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g., -79.3832"
                />
              ) : (
                <p className="text-slate-900">{project.site_lng ?? "—"}</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-slate-900 mb-3">Project Notes</h3>
          {isEditing ? (
            <textarea
              rows={4}
              value={editData.notes}
              onChange={(e) =>
                setEditData({ ...editData, notes: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Project notes, special instructions, etc."
            />
          ) : (
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-slate-700">
                {project.notes || "No notes added"}
              </p>
            </div>
          )}
        </div>

        {/* NEW: Quick progress entry with photos */}
        <div className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-900">
              Add Progress Update
            </h3>
            <button
              type="button"
              onClick={() => setShowProgressForm((v) => !v)}
              className="text-sm text-amber-600 hover:text-amber-700"
            >
              {showProgressForm ? "Hide" : "Add"}
            </button>
          </div>
          {showProgressForm && (
            <div className="space-y-3">
              <textarea
                rows={3}
                value={progressDescription}
                onChange={(e) => setProgressDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="What was done today?"
              />
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  setProgressFiles(Array.from(e.target.files || []))
                }
                className="block text-sm"
              />
              {progressError && (
                <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700">
                  {progressError}
                </div>
              )}
              {progressSuccess && (
                <div className="bg-green-50 border border-green-200 rounded p-2 text-sm text-green-700">
                  Saved progress
                </div>
              )}
              <button
                type="button"
                disabled={progressSubmitting || uploading}
                onClick={handleSubmitProgress}
                className="px-4 py-2 bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm"
              >
                {progressSubmitting || uploading ? "Saving…" : "Save Progress"}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>
    </MobileModal>
  );
}
