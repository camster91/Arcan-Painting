import { useState } from "react";
import MobileModal from "@/components/MobileModal";
import {
  generateEstimateNumber,
  getDefaultValidUntil,
} from "@/utils/estimatesUtils";

export function CreateEstimateModal({ leads, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    lead_id: "",
    project_title: "",
    project_description: "",
    labor_cost: "",
    material_cost: "",
    estimated_duration_days: "",
    valid_until: "",
    notes: "",
    created_by: "Admin",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New lead creation states
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [newLeadData, setNewLeadData] = useState({
    name: "",
    email: "",
    phone: "",
    service_type: "Interior Painting",
    project_description: "",
    address: "",
    preferred_contact: "phone",
  });
  const [creatingLead, setCreatingLead] = useState(false);

  // Calculate total cost
  const totalCost =
    (parseFloat(formData.labor_cost) || 0) +
    (parseFloat(formData.material_cost) || 0);

  // Handle creating new lead
  const handleCreateNewLead = async () => {
    if (!newLeadData.name || !newLeadData.email || !newLeadData.phone) {
      setError("Please fill in all required lead fields (name, email, phone)");
      return;
    }

    setCreatingLead(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newLeadData.name,
          email: newLeadData.email,
          phone: newLeadData.phone,
          serviceType: newLeadData.service_type,
          projectDescription: newLeadData.project_description,
          preferredContact: newLeadData.preferred_contact,
          address: newLeadData.address,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create lead");
      }

      const data = await response.json();
      const newLead = data.lead;

      // Auto-fill estimate form with new lead data
      setFormData({
        ...formData,
        lead_id: newLead.id.toString(),
        project_title: `${newLead.service_type} - ${newLead.name}`,
        project_description: newLead.project_description || "",
      });

      // Reset new lead form and hide it
      setNewLeadData({
        name: "",
        email: "",
        phone: "",
        service_type: "Interior Painting",
        project_description: "",
        address: "",
        preferred_contact: "phone",
      });
      setShowNewLeadForm(false);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error creating lead:", err);
    } finally {
      setCreatingLead(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/estimates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          estimate_number: generateEstimateNumber(),
          total_cost: totalCost,
          valid_until: formData.valid_until || getDefaultValidUntil(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create estimate");
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
      console.error("Error creating estimate:", err);
    } finally {
      setLoading(false);
    }
  };

  const footerContent = (
    <div className="flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={onClose}
        disabled={loading || creatingLead}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 disabled:opacity-50 transition-all duration-200 font-medium"
      >
        Cancel
      </button>
      <button
        type="submit"
        onClick={handleSubmit}
        disabled={
          loading ||
          creatingLead ||
          !formData.lead_id ||
          !formData.project_title ||
          !formData.labor_cost ||
          !formData.material_cost
        }
        className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold px-8 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Creating...
          </>
        ) : (
          "Create Estimate"
        )}
      </button>
    </div>
  );

  return (
    <MobileModal
      isOpen={true}
      onClose={onClose}
      title="Create New Estimate"
      footer={footerContent}
    >
      <form className="space-y-6">
        {/* Lead Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Lead
          </label>
          <div className="space-y-3">
            <select
              required
              value={formData.lead_id}
              onChange={(e) => {
                const leadId = e.target.value;
                if (leadId === "new") {
                  setShowNewLeadForm(true);
                  setFormData({ ...formData, lead_id: "" });
                  return;
                }
                const selectedLead = leads.find(
                  (l) => l.id.toString() === leadId,
                );
                setFormData({
                  ...formData,
                  lead_id: leadId,
                  project_title: selectedLead
                    ? `${selectedLead.service_type} - ${selectedLead.name}`
                    : "",
                  project_description: selectedLead?.project_description || "",
                });
              }}
              className="w-full px-4 py-3 lg:py-2 border border-slate-300 rounded-lg 
                         focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                         text-base lg:text-sm"
            >
              <option value="">Choose a lead...</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name} - {lead.service_type}
                </option>
              ))}
              <option value="new" className="font-semibold text-amber-600">
                + Add New Lead
              </option>
            </select>

            {/* New Lead Form - shown when creating new lead */}
            {showNewLeadForm && (
              <div className="border border-amber-200 rounded-lg p-4 bg-amber-50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-amber-800">
                    Create New Lead
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewLeadForm(false);
                      setNewLeadData({
                        name: "",
                        email: "",
                        phone: "",
                        service_type: "Interior Painting",
                        project_description: "",
                        address: "",
                        preferred_contact: "phone",
                      });
                    }}
                    className="text-amber-600 hover:text-amber-800 text-sm"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newLeadData.name}
                      onChange={(e) =>
                        setNewLeadData({ ...newLeadData, name: e.target.value })
                      }
                      placeholder="Customer name"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={newLeadData.email}
                      onChange={(e) =>
                        setNewLeadData({
                          ...newLeadData,
                          email: e.target.value,
                        })
                      }
                      placeholder="email@example.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newLeadData.phone}
                      onChange={(e) =>
                        setNewLeadData({
                          ...newLeadData,
                          phone: e.target.value,
                        })
                      }
                      placeholder="(555) 123-4567"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Service Type
                    </label>
                    <select
                      value={newLeadData.service_type}
                      onChange={(e) =>
                        setNewLeadData({
                          ...newLeadData,
                          service_type: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                    >
                      <option value="Interior Painting">
                        Interior Painting
                      </option>
                      <option value="Exterior Painting">
                        Exterior Painting
                      </option>
                      <option value="Commercial Painting">
                        Commercial Painting
                      </option>
                      <option value="Cabinet Refinishing">
                        Cabinet Refinishing
                      </option>
                      <option value="Power Washing">Power Washing</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Project Address
                  </label>
                  <input
                    type="text"
                    value={newLeadData.address}
                    onChange={(e) =>
                      setNewLeadData({
                        ...newLeadData,
                        address: e.target.value,
                      })
                    }
                    placeholder="123 Main St, City, State 12345"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Project Description
                  </label>
                  <textarea
                    rows={3}
                    value={newLeadData.project_description}
                    onChange={(e) =>
                      setNewLeadData({
                        ...newLeadData,
                        project_description: e.target.value,
                      })
                    }
                    placeholder="Describe the painting project..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCreateNewLead}
                  disabled={
                    creatingLead ||
                    !newLeadData.name ||
                    !newLeadData.email ||
                    !newLeadData.phone
                  }
                  className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  {creatingLead ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Lead...
                    </div>
                  ) : (
                    "Create Lead & Continue"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Project Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Project Title
            </label>
            <input
              type="text"
              required
              value={formData.project_title}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  project_title: e.target.value,
                })
              }
              className="w-full px-4 py-3 lg:py-2 border border-slate-300 rounded-lg 
                         focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                         text-base lg:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Duration (Days)
            </label>
            <input
              type="number"
              min="1"
              value={formData.estimated_duration_days}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  estimated_duration_days: e.target.value,
                })
              }
              className="w-full px-4 py-3 lg:py-2 border border-slate-300 rounded-lg 
                         focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                         text-base lg:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Project Description
          </label>
          <textarea
            rows={3}
            value={formData.project_description}
            onChange={(e) =>
              setFormData({
                ...formData,
                project_description: e.target.value,
              })
            }
            className="w-full px-4 py-3 lg:py-2 border border-slate-300 rounded-lg 
                       focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                       text-base lg:text-sm resize-none"
          />
        </div>

        {/* Costs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Labor Cost ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.labor_cost}
              onChange={(e) =>
                setFormData({ ...formData, labor_cost: e.target.value })
              }
              className="w-full px-4 py-3 lg:py-2 border border-slate-300 rounded-lg 
                         focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                         text-base lg:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Material Cost ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.material_cost}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  material_cost: e.target.value,
                })
              }
              className="w-full px-4 py-3 lg:py-2 border border-slate-300 rounded-lg 
                         focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                         text-base lg:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Total Cost
            </label>
            <div
              className="w-full px-4 py-3 lg:py-2 bg-slate-50 border border-slate-300 rounded-lg 
                            text-slate-900 font-semibold text-base lg:text-sm"
            >
              ${totalCost.toFixed(2)}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Valid Until
          </label>
          <input
            type="date"
            value={formData.valid_until || getDefaultValidUntil()}
            onChange={(e) =>
              setFormData({ ...formData, valid_until: e.target.value })
            }
            className="w-full px-4 py-3 lg:py-2 border border-slate-300 rounded-lg 
                       focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                       text-base lg:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Notes
          </label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="w-full px-4 py-3 lg:py-2 border border-slate-300 rounded-lg 
                       focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                       text-base lg:text-sm resize-none"
            placeholder="Additional notes or terms..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </form>
    </MobileModal>
  );
}
