import { useState, useEffect } from "react";
import MobileModal from "@/components/MobileModal";

export function CreateFollowUpModal({ leads, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    lead_id: "",
    follow_up_date: "",
    follow_up_type: "phone_call",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormData((prev) => ({
      ...prev,
      follow_up_date: tomorrow.toISOString().split("T")[0],
    }));
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/follow-ups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to schedule follow-up");
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
      console.error("Error creating follow-up:", err);
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
        disabled={loading || !formData.lead_id || !formData.follow_up_date}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold px-8 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Scheduling...
          </>
        ) : (
          "Schedule Follow-up"
        )}
      </button>
    </div>
  );

  return (
    <MobileModal
      isOpen={true}
      onClose={onClose}
      title="Schedule Follow-up"
      footer={footer}
      className="lg:max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Customer
          </label>
          <select
            required
            value={formData.lead_id}
            onChange={(e) =>
              setFormData({ ...formData, lead_id: e.target.value })
            }
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">Choose a customer...</option>
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.name} - {lead.email} ({lead.service_type})
              </option>
            ))}
          </select>
        </div>

        {/* Follow-up Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Follow-up Type
            </label>
            <select
              value={formData.follow_up_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  follow_up_type: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="phone_call">Phone Call</option>
              <option value="email">Email</option>
              <option value="site_visit">Site Visit</option>
              <option value="estimate_follow_up">Estimate Follow-up</option>
              <option value="project_check_in">Project Check-in</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              required
              value={formData.follow_up_date}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  follow_up_date: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Notes
          </label>
          <textarea
            rows={4}
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Follow-up purpose, talking points, or special instructions..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </form>
    </MobileModal>
  );
}
