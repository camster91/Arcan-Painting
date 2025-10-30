import React, { useState, useEffect } from "react";
import MobileModal from "@/components/MobileModal";
import {
  CheckCircle2,
  Circle,
  Clock,
  User,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
} from "lucide-react";

function CompletionWorkflowsModal({ project, onClose, onUpdate }) {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [newStep, setNewStep] = useState({
    step_title: "",
    step_description: "",
    step_order: 1,
    is_required: true,
    estimated_hours: "",
  });

  useEffect(() => {
    loadWorkflows();
  }, [project.id]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/completion-workflows?project_id=${project.id}`,
      );
      if (!response.ok) {
        throw new Error("Failed to load workflow steps");
      }

      const data = await response.json();
      setWorkflows(data.steps || []);
    } catch (err) {
      console.error("Error loading workflows:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStepCompletion = async (stepId, isCompleted) => {
    try {
      setUpdating(true);

      const response = await fetch("/api/completion-workflows", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: stepId,
          is_completed: !isCompleted,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update step");
      }

      const data = await response.json();

      // Update local state
      setWorkflows((prev) =>
        prev.map((step) => (step.id === stepId ? data.step : step)),
      );

      // Notify parent component
      onUpdate?.();
    } catch (err) {
      console.error("Error updating step:", err);
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const addWorkflowStep = async () => {
    try {
      if (!newStep.step_title.trim()) {
        setError("Step title is required");
        return;
      }

      const response = await fetch("/api/completion-workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newStep,
          project_id: project.id,
          step_order: workflows.length + 1,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add workflow step");
      }

      // Reload workflows
      await loadWorkflows();

      // Reset form
      setNewStep({
        step_title: "",
        step_description: "",
        step_order: 1,
        is_required: true,
        estimated_hours: "",
      });
    } catch (err) {
      console.error("Error adding step:", err);
      setError(err.message);
    }
  };

  const getCompletionStats = () => {
    const total = workflows.length;
    const completed = workflows.filter((step) => step.is_completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percentage };
  };

  const stats = getCompletionStats();

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const footer = (
    <div className="flex items-center justify-end">
      <button
        onClick={onClose}
        className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
      >
        Close
      </button>
    </div>
  );

  return (
    <MobileModal
      isOpen={true}
      onClose={onClose}
      title="Project Completion Checklist"
      footer={footer}
      className="lg:max-w-4xl"
    >
      {/* Progress Overview */}
      <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-amber-900">Overall Progress</h3>
            <p className="text-sm text-amber-700">
              {stats.completed} of {stats.total} steps completed
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-amber-900">
              {stats.percentage}%
            </div>
            <div className="w-24 h-2 bg-amber-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            <span className="ml-3 text-slate-600">
              Loading workflow steps...
            </span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Workflow Steps */}
            {workflows.length > 0 ? (
              <div className="space-y-3">
                {workflows
                  .sort((a, b) => a.step_order - b.step_order)
                  .map((step) => (
                    <div
                      key={step.id}
                      className={`border rounded-lg p-4 transition-all duration-200 ${
                        step.is_completed
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <button
                          onClick={() =>
                            toggleStepCompletion(step.id, step.is_completed)
                          }
                          disabled={updating}
                          className={`mt-1 p-1 rounded-full transition-colors ${
                            step.is_completed
                              ? "text-green-600 hover:text-green-700"
                              : "text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          {step.is_completed ? (
                            <CheckCircle2 size={20} />
                          ) : (
                            <Circle size={20} />
                          )}
                        </button>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4
                                className={`font-semibold ${
                                  step.is_completed
                                    ? "text-green-900 line-through"
                                    : "text-slate-900"
                                }`}
                              >
                                {step.step_title}
                              </h4>
                              {step.step_description && (
                                <p
                                  className={`text-sm mt-1 ${
                                    step.is_completed
                                      ? "text-green-700"
                                      : "text-slate-600"
                                  }`}
                                >
                                  {step.step_description}
                                </p>
                              )}
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center gap-2 ml-4">
                              {step.is_required && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                  Required
                                </span>
                              )}
                              {step.estimated_hours && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center gap-1">
                                  <Clock size={12} />
                                  {step.estimated_hours}h
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Completion Details */}
                          {step.is_completed && (
                            <div className="mt-3 p-3 bg-green-100 rounded-lg">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-green-700">
                                  <CheckCircle2 size={14} />
                                  <span>
                                    Completed {formatDate(step.completed_at)}
                                  </span>
                                </div>
                                {step.completed_by_name && (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <User size={14} />
                                    <span>{step.completed_by_name}</span>
                                  </div>
                                )}
                              </div>
                              {step.actual_hours && (
                                <div className="mt-2 text-sm text-green-700">
                                  Actual time: {step.actual_hours} hours
                                </div>
                              )}
                              {step.notes && (
                                <div className="mt-2 text-sm text-green-700">
                                  Notes: {step.notes}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2
                  size={48}
                  className="mx-auto mb-4 text-slate-300"
                />
                <p className="text-lg font-medium">No workflow steps defined</p>
                <p className="text-sm">
                  Add steps below to create a completion checklist for this
                  project.
                </p>
              </div>
            )}

            {/* Add New Step Form */}
            <div className="border-t border-slate-200 pt-6 mt-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Plus size={18} />
                Add New Step
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Step Title *
                    </label>
                    <input
                      type="text"
                      value={newStep.step_title}
                      onChange={(e) =>
                        setNewStep({ ...newStep, step_title: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="e.g., Apply primer to all surfaces"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={newStep.estimated_hours}
                      onChange={(e) =>
                        setNewStep({
                          ...newStep,
                          estimated_hours: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="2.5"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newStep.step_description}
                    onChange={(e) =>
                      setNewStep({
                        ...newStep,
                        step_description: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Additional details about this step..."
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newStep.is_required}
                      onChange={(e) =>
                        setNewStep({
                          ...newStep,
                          is_required: e.target.checked,
                        })
                      }
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm text-slate-700">
                      Required step
                    </span>
                  </label>
                </div>
                <button
                  onClick={addWorkflowStep}
                  disabled={!newStep.step_title.trim()}
                  className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Step
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileModal>
  );
}

export default CompletionWorkflowsModal;
