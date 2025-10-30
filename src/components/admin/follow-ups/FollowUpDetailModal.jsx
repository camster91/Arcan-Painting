import { useState } from "react";
import { getTypeInfo, formatDateLong } from "@/utils/followUpUtils";

export function FollowUpDetailModal({ followUp, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    follow_up_date: followUp.follow_up_date,
    follow_up_type: followUp.follow_up_type,
    status: followUp.status,
    notes: followUp.notes || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const typeInfo = getTypeInfo(followUp.follow_up_type);
  const TypeIcon = typeInfo.icon;

  const handleUpdate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/follow-ups", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: followUp.id,
          ...editData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update follow-up");
      }

      setIsEditing(false);
      onUpdate();
    } catch (err) {
      setError(err.message);
      console.error("Error updating follow-up:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/follow-ups", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: followUp.id,
          status: "completed",
          completed_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete follow-up");
      }

      onUpdate();
      onClose();
    } catch (err) {
      setError(err.message);
      console.error("Error completing follow-up:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Follow-up Details
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
                    Customer
                  </label>
                  <p className="text-lg font-bold text-slate-900">
                    {followUp.lead_name}
                  </p>
                  {followUp.lead_email && (
                    <p className="text-sm text-slate-600">
                      {followUp.lead_email}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Type
                  </label>
                  <div className="mt-1">
                    {isEditing ? (
                      <select
                        value={editData.follow_up_type}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            follow_up_type: e.target.value,
                          })
                        }
                        className="px-3 py-1 border border-slate-300 rounded-lg text-sm"
                      >
                        <option value="phone_call">Phone Call</option>
                        <option value="email">Email</option>
                        <option value="site_visit">Site Visit</option>
                        <option value="estimate_follow_up">
                          Estimate Follow-up
                        </option>
                        <option value="project_check_in">
                          Project Check-in
                        </option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${typeInfo.color}`}
                      >
                        <TypeIcon size={14} />
                        {typeInfo.label}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                        followUp.status === "completed"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-yellow-100 text-yellow-800 border-yellow-200"
                      }`}
                    >
                      {followUp.status === "completed"
                        ? "Completed"
                        : "Pending"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Follow-up Details */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">
                Follow-up Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Due Date
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editData.follow_up_date}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          follow_up_date: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1 border border-slate-300 rounded-lg text-sm"
                    />
                  ) : (
                    <p className="text-slate-900">
                      {formatDateLong(followUp.follow_up_date)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Scheduled
                  </label>
                  <p className="text-slate-900">
                    {formatDateLong(followUp.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Notes</h3>
              {isEditing ? (
                <textarea
                  rows={4}
                  value={editData.notes}
                  onChange={(e) =>
                    setEditData({ ...editData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Follow-up notes, outcomes, next steps..."
                />
              ) : (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-slate-700">
                    {followUp.notes || "No notes added"}
                  </p>
                </div>
              )}
            </div>

            {/* Completion Info */}
            {followUp.status === "completed" && followUp.completed_at && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">
                  Completion
                </h3>
                <p className="text-slate-700">
                  Completed on {formatDateLong(followUp.completed_at)}
                </p>
              </div>
            )}

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
                    Edit Follow-up
                  </button>
                  {followUp.status === "pending" && (
                    <button
                      onClick={handleComplete}
                      disabled={loading}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {loading ? "Completing..." : "Mark Complete"}
                    </button>
                  )}
                  {followUp.lead_email && (
                    <a
                      href={`mailto:${followUp.lead_email}?subject=Follow-up: ${followUp.lead_name}&body=Hi ${followUp.lead_name},%0D%0A%0D%0A`}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Email Customer
                    </a>
                  )}
                  {followUp.lead_phone && (
                    <a
                      href={`tel:${followUp.lead_phone}`}
                      className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Call Customer
                    </a>
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
