import { useEffect } from "react";
import {
  DollarSign,
  Calendar,
  Save,
  Plus,
  File,
} from "lucide-react";
import MobileModal from "@/components/MobileModal";
import useContractForm from "@/hooks/useContractForm";

export default function CreateContractModal({
  isOpen,
  onClose,
  onSuccess,
  leadId,
  estimateId,
  projectId,
}) {
  const {
    formData,
    updateField,
    loading,
    errors,
    templates,
    leads,
    estimates,
    projects,
    selectedTemplate,
    setSelectedTemplate,
    loadAll,
    applyTemplate,
    handleSubmit,
    handleClose,
  } = useContractForm({ estimateId, leadId, projectId, onSuccess, onClose });

  useEffect(() => {
    if (isOpen) loadAll();
  }, [isOpen]);

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
              onChange={(e) => updateField("contract_number", e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="CTR-20241010-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Customer *
            </label>
            <select
              value={formData.lead_id}
              onChange={(e) => updateField("lead_id", e.target.value)}
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
              onChange={(e) => updateField("estimate_id", e.target.value)}
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
              Link to Job
            </label>
            <select
              value={formData.project_id}
              onChange={(e) => updateField("project_id", e.target.value)}
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

        {/* Job Details */}
        <div className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
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
              Job Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
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
              onChange={(e) => updateField("scope_of_work", e.target.value)}
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
                onChange={(e) => updateField("total_amount", e.target.value)}
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
                onChange={(e) => updateField("deposit_percentage", e.target.value)}
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
                onChange={(e) => updateField("deposit_amount", e.target.value)}
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
              Job Timeline
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
                onChange={(e) => updateField("start_date", e.target.value)}
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
                onChange={(e) => updateField("completion_date", e.target.value)}
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
                onChange={(e) => updateField("estimated_duration_days", e.target.value)}
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
              onChange={(e) => updateField("terms_and_conditions", e.target.value)}
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
                onChange={(e) => updateField("payment_terms", e.target.value)}
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
                onChange={(e) => updateField("warranty_terms", e.target.value)}
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
              onChange={(e) => updateField("notes", e.target.value)}
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
