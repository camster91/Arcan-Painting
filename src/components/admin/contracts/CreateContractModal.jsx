import { useState, useEffect } from "react";
import {
  X,
  FileText,
  DollarSign,
  Calendar,
  User,
  Save,
  Plus,
  File,
} from "lucide-react";
import MobileModal from "@/components/MobileModal";

export default function CreateContractModal({
  isOpen,
  onClose,
  onSuccess,
  leadId,
  estimateId,
  projectId,
}) {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [leads, setLeads] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [projects, setProjects] = useState([]);

  const [formData, setFormData] = useState({
    contract_number: "",
    estimate_id: estimateId || "",
    lead_id: leadId || "",
    project_id: projectId || "",
    title: "",
    description: "",
    scope_of_work: "",
    terms_and_conditions: "",
    payment_terms: "",
    warranty_terms: "",
    total_amount: "",
    deposit_percentage: 25,
    deposit_amount: "",
    start_date: "",
    completion_date: "",
    estimated_duration_days: "",
    notes: "",
  });

  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [errors, setErrors] = useState({});

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      loadLeads();
      loadEstimates();
      loadProjects();
      generateContractNumber();
    }
  }, [isOpen]);

  // Load estimate data when estimate is selected
  useEffect(() => {
    if (formData.estimate_id) {
      loadEstimateData(formData.estimate_id);
    }
  }, [formData.estimate_id]);

  // Calculate deposit amount when total or percentage changes
  useEffect(() => {
    if (formData.total_amount && formData.deposit_percentage) {
      const total = parseFloat(formData.total_amount);
      const percentage = parseInt(formData.deposit_percentage);
      const deposit = (total * percentage) / 100;
      setFormData((prev) => ({ ...prev, deposit_amount: deposit.toFixed(2) }));
    }
  }, [formData.total_amount, formData.deposit_percentage]);

  const generateContractNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const contractNumber = `CTR-${year}${month}${day}-${random}`;
    setFormData((prev) => ({ ...prev, contract_number: contractNumber }));
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/contract-templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const loadLeads = async () => {
    try {
      const response = await fetch("/api/leads");
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
      }
    } catch (error) {
      console.error("Error loading leads:", error);
    }
  };

  const loadEstimates = async () => {
    try {
      const response = await fetch("/api/estimates?status=approved");
      if (response.ok) {
        const data = await response.json();
        setEstimates(data.estimates || []);
      }
    } catch (error) {
      console.error("Error loading estimates:", error);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const loadEstimateData = async (estimateId) => {
    try {
      const response = await fetch(`/api/estimates?id=${estimateId}`);
      if (response.ok) {
        const data = await response.json();
        const estimate = data.estimates?.[0];
        if (estimate) {
          setFormData((prev) => ({
            ...prev,
            lead_id: estimate.lead_id || "",
            title: estimate.project_title || "",
            description: estimate.project_description || "",
            total_amount: estimate.total_cost || "",
            estimated_duration_days: estimate.estimated_duration_days || "",
          }));
        }
      }
    } catch (error) {
      console.error("Error loading estimate data:", error);
    }
  };

  const applyTemplate = async (templateId) => {
    try {
      const response = await fetch(`/api/contract-templates/${templateId}`);
      if (response.ok) {
        const template = await response.json();
        setFormData((prev) => ({
          ...prev,
          scope_of_work: template.scope_template || "",
          terms_and_conditions: template.terms_template || "",
          payment_terms: template.payment_terms_template || "",
          warranty_terms: template.warranty_template || "",
          deposit_percentage: template.default_deposit_percentage || 25,
        }));
      }
    } catch (error) {
      console.error("Error applying template:", error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.scope_of_work.trim())
      newErrors.scope_of_work = "Scope of work is required";
    if (!formData.total_amount)
      newErrors.total_amount = "Total amount is required";
    if (!formData.lead_id) newErrors.lead_id = "Client selection is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create contract");
      }

      const contract = await response.json();
      onSuccess?.(contract);
      handleClose();
    } catch (error) {
      console.error("Error creating contract:", error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      contract_number: "",
      estimate_id: "",
      lead_id: "",
      project_id: "",
      title: "",
      description: "",
      scope_of_work: "",
      terms_and_conditions: "",
      payment_terms: "",
      warranty_terms: "",
      total_amount: "",
      deposit_percentage: 25,
      deposit_amount: "",
      start_date: "",
      completion_date: "",
      estimated_duration_days: "",
      notes: "",
    });
    setSelectedTemplate("");
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const footer = (
    <div className="flex flex-col-reverse sm:flex-row gap-3">
      <button
        type="button"
        onClick={handleClose}
        disabled={loading}
        className="px-6 py-4 lg:py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl lg:rounded-lg font-medium transition-colors"
      >
        Cancel
      </button>
      <button
        type="submit"
        onClick={handleSubmit}
        disabled={loading}
        className="px-6 py-4 lg:py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl lg:rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Save size={18} />
            Create Contract
          </>
        )}
      </button>
    </div>
  );

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Contract"
      footer={footer}
    >
      {/* Scrollable Content (kept the same form content) */}
      <form onSubmit={handleSubmit} className="p-0 space-y-6 sm:space-y-8">
        {/* Template Selection */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <File className="w-5 h-5 text-blue-600" />
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">
              Contract Template
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={selectedTemplate}
              onChange={(e) => {
                setSelectedTemplate(e.target.value);
                if (e.target.value) applyTemplate(e.target.value);
              }}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a template (optional)</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Create Template
            </button>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Contract Number *
            </label>
            <input
              type="text"
              value={formData.contract_number}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  contract_number: e.target.value,
                }))
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="CTR-20241010-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Client *
            </label>
            <select
              value={formData.lead_id}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  lead_id: e.target.value,
                }))
              }
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                errors.lead_id ? "border-red-300" : "border-slate-300"
              }`}
            >
              <option value="">Select a client</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name} - {lead.email}
                </option>
              ))}
            </select>
            {errors.lead_id && (
              <p className="mt-1 text-sm text-red-600">{errors.lead_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Link to Estimate
            </label>
            <select
              value={formData.estimate_id}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  estimate_id: e.target.value,
                }))
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">Select an estimate (optional)</option>
              {estimates.map((estimate) => (
                <option key={estimate.id} value={estimate.id}>
                  {estimate.estimate_number} - {estimate.project_title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Link to Project
            </label>
            <select
              value={formData.project_id}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  project_id: e.target.value,
                }))
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">Select a project (optional)</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.project_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Project Details */}
        <div className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Project Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                errors.title ? "border-red-300" : "border-slate-300"
              }`}
              placeholder="Interior painting - Main floor"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Project Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="Brief description of the project..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Scope of Work *
            </label>
            <textarea
              rows={6}
              value={formData.scope_of_work}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  scope_of_work: e.target.value,
                }))
              }
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                errors.scope_of_work ? "border-red-300" : "border-slate-300"
              }`}
              placeholder="Detailed description of work to be performed..."
            />
            {errors.scope_of_work && (
              <p className="mt-1 text-sm text-red-600">
                {errors.scope_of_work}
              </p>
            )}
          </div>
        </div>

        {/* Financial Details */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">
              Financial Terms
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Total Amount *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    total_amount: e.target.value,
                  }))
                }
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                  errors.total_amount ? "border-red-300" : "border-slate-300"
                }`}
                placeholder="5000.00"
              />
              {errors.total_amount && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.total_amount}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Deposit Percentage
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.deposit_percentage}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    deposit_percentage: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="25"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Deposit Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.deposit_amount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    deposit_amount: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50"
                placeholder="Calculated automatically"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">
              Project Timeline
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Completion Date
              </label>
              <input
                type="date"
                value={formData.completion_date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    completion_date: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Duration (Days)
              </label>
              <input
                type="number"
                value={formData.estimated_duration_days}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    estimated_duration_days: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="5"
              />
            </div>
          </div>
        </div>

        {/* Contract Terms */}
        <div className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Terms and Conditions
            </label>
            <textarea
              rows={4}
              value={formData.terms_and_conditions}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  terms_and_conditions: e.target.value,
                }))
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="General terms and conditions..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Payment Terms
              </label>
              <textarea
                rows={3}
                value={formData.payment_terms}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    payment_terms: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Payment schedule and terms..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Warranty Terms
              </label>
              <textarea
                rows={3}
                value={formData.warranty_terms}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    warranty_terms: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Warranty information..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Additional Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="Any additional notes or special instructions..."
            />
          </div>
        </div>

        {/* Error Display */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{errors.submit}</p>
          </div>
        )}

        {/* Extra spacing for mobile to account for bottom bar */}
        <div className="h-20 sm:hidden" />
      </form>
    </MobileModal>
  );
}
