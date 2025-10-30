import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Calculator,
  FileText,
  DollarSign,
  Calendar,
} from "lucide-react";

export default function MobileEstimateFlow({ leadId, onComplete, onCancel }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    project_title: "",
    project_description: "",
    labor_cost: "",
    material_cost: "",
    estimated_duration_days: "",
    valid_until: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const steps = [
    {
      id: "project",
      title: "Project Details",
      icon: FileText,
      fields: ["project_title", "project_description"],
    },
    {
      id: "costs",
      title: "Cost Breakdown",
      icon: Calculator,
      fields: ["labor_cost", "material_cost"],
    },
    {
      id: "timeline",
      title: "Timeline & Terms",
      icon: Calendar,
      fields: ["estimated_duration_days", "valid_until"],
    },
    {
      id: "review",
      title: "Review & Send",
      icon: Check,
      fields: ["notes"],
    },
  ];

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateStep = (stepIndex) => {
    const step = steps[stepIndex];
    const requiredFields = step.fields.filter((field) =>
      ["project_title", "labor_cost", "material_cost"].includes(field),
    );

    return requiredFields.every((field) => {
      const value = formData[field];
      return value && value.toString().trim() !== "";
    });
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) {
      setError("Please fill in all required fields");
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setError("");
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError("");
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const totalCost =
        parseFloat(formData.labor_cost || 0) +
        parseFloat(formData.material_cost || 0);
      const estimateNumber = `EST-${Date.now()}`;

      const payload = {
        lead_id: leadId,
        estimate_number: estimateNumber,
        project_title: formData.project_title,
        project_description: formData.project_description,
        labor_cost: parseFloat(formData.labor_cost || 0),
        material_cost: parseFloat(formData.material_cost || 0),
        total_cost: totalCost,
        estimated_duration_days: parseInt(
          formData.estimated_duration_days || 0,
        ),
        valid_until: formData.valid_until || null,
        notes: formData.notes,
        status: "draft",
      };

      const response = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create estimate");
      }

      onComplete?.(result);
    } catch (err) {
      console.error("Estimate submission error:", err);
      setError(err.message || "Failed to create estimate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value || 0);
    return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  const totalCost =
    parseFloat(formData.labor_cost || 0) +
    parseFloat(formData.material_cost || 0);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col lg:relative lg:bg-transparent lg:z-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between lg:hidden">
        <button
          onClick={currentStep === 0 ? onCancel : prevStep}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {currentStep === 0 ? <X size={24} /> : <ChevronLeft size={24} />}
        </button>
        <h1 className="font-semibold text-slate-900">New Estimate</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Progress Indicator */}
      <div className="px-4 py-4 bg-slate-50">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index < currentStep
                    ? "bg-green-500 text-white"
                    : index === currentStep
                      ? "bg-amber-500 text-white"
                      : "bg-slate-200 text-slate-600"
                }`}
              >
                {index < currentStep ? <Check size={16} /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-2 ${
                    index < currentStep ? "bg-green-500" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h2 className="font-semibold text-slate-900">
            {steps[currentStep].title}
          </h2>
          <p className="text-sm text-slate-500">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentStep === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                value={formData.project_title}
                onChange={(e) =>
                  updateFormData("project_title", e.target.value)
                }
                placeholder="e.g., Interior Living Room Paint"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Project Description
              </label>
              <textarea
                rows={4}
                value={formData.project_description}
                onChange={(e) =>
                  updateFormData("project_description", e.target.value)
                }
                placeholder="Describe the scope of work, areas to be painted, special requirements..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-base resize-none"
              />
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Labor Cost *
              </label>
              <div className="relative">
                <DollarSign
                  size={20}
                  className="absolute left-3 top-3.5 text-slate-400"
                />
                <input
                  type="number"
                  step="0.01"
                  value={formData.labor_cost}
                  onChange={(e) => updateFormData("labor_cost", e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-base"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Material Cost *
              </label>
              <div className="relative">
                <DollarSign
                  size={20}
                  className="absolute left-3 top-3.5 text-slate-400"
                />
                <input
                  type="number"
                  step="0.01"
                  value={formData.material_cost}
                  onChange={(e) =>
                    updateFormData("material_cost", e.target.value)
                  }
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-base"
                />
              </div>
            </div>
            {(formData.labor_cost || formData.material_cost) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-amber-800">Total Cost</span>
                  <span className="text-lg font-bold text-amber-900">
                    {formatCurrency(totalCost)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Estimated Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                value={formData.estimated_duration_days}
                onChange={(e) =>
                  updateFormData("estimated_duration_days", e.target.value)
                }
                placeholder="e.g., 3"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Valid Until
              </label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={(e) => updateFormData("valid_until", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-base"
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Estimate Summary */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-4">
                Estimate Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Project</span>
                  <span className="font-medium">{formData.project_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Labor</span>
                  <span>{formatCurrency(formData.labor_cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Materials</span>
                  <span>{formatCurrency(formData.material_cost)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="font-bold text-lg text-slate-900">
                    {formatCurrency(totalCost)}
                  </span>
                </div>
                {formData.estimated_duration_days && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Duration</span>
                    <span>{formData.estimated_duration_days} days</span>
                  </div>
                )}
                {formData.valid_until && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Valid Until</span>
                    <span>
                      {new Date(formData.valid_until).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Additional Notes
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => updateFormData("notes", e.target.value)}
                placeholder="Any additional notes for the client..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-base resize-none"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4">
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={prevStep}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
          )}
          {currentStep < steps.length - 1 ? (
            <button
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
              className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              Next <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !validateStep(currentStep)}
              className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white rounded-lg transition-colors font-medium"
            >
              {isSubmitting ? "Creating..." : "Create Estimate"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
