import { Eye, Send, Copy, Edit, Trash2 } from "lucide-react";
import {
  getStatusInfo,
  formatCurrency,
  formatDate,
} from "@/utils/estimatesUtils";
import { useState } from "react";

export function EstimatesTable({
  estimates,
  onViewEstimate,
  onSendEstimate,
  onDuplicateEstimate,
  onEditEstimate,
  onDeleteEstimate,
}) {
  const [sendingId, setSendingId] = useState(null);
  const [duplicatingId, setDuplicatingId] = useState(null);

  const handleSend = async (estimate) => {
    if (!estimate.lead_email) {
      alert("Cannot send estimate - lead has no email address");
      return;
    }

    setSendingId(estimate.id);
    try {
      await onSendEstimate(estimate);
    } finally {
      setSendingId(null);
    }
  };

  const handleDuplicate = async (estimate) => {
    setDuplicatingId(estimate.id);
    try {
      await onDuplicateEstimate(estimate);
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left py-3 px-4 font-medium text-slate-900">
              Estimate #
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-900">
              Lead
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-900">
              Project
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-900">
              Value
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-900">
              Status
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-900">
              Valid Until
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-900">
              Created
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-900">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {estimates.map((estimate) => {
            const statusInfo = getStatusInfo(estimate.status);
            const StatusIcon = statusInfo.icon;

            return (
              <tr key={estimate.id} className="hover:bg-slate-50">
                <td className="py-3 px-4">
                  <span className="font-medium text-slate-900">
                    {estimate.estimate_number}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      {estimate.lead_name || "No Lead"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {estimate.lead_email || "No email"}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      {estimate.project_title}
                    </p>
                    {estimate.estimated_duration_days && (
                      <p className="text-sm text-slate-500">
                        {estimate.estimated_duration_days} days duration
                      </p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(estimate.total_cost)}
                    </p>
                    <p className="text-sm text-slate-500">
                      Labor: {formatCurrency(estimate.labor_cost)} | Materials:{" "}
                      {formatCurrency(estimate.material_cost)}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}
                  >
                    <StatusIcon size={12} />
                    {statusInfo.label}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-slate-600">
                    {formatDate(estimate.valid_until)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm text-slate-600">
                    <p>{formatDate(estimate.created_at)}</p>
                    {estimate.created_by && (
                      <p className="text-xs text-slate-500">
                        by {estimate.created_by}
                      </p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewEstimate(estimate)}
                      className="text-amber-600 hover:text-amber-700 p-1 rounded"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>

                    {onEditEstimate && (
                      <button
                        onClick={() => onEditEstimate(estimate)}
                        className="text-blue-600 hover:text-blue-700 p-1 rounded"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                    )}

                    {onSendEstimate && (
                      <button
                        onClick={() => handleSend(estimate)}
                        disabled={
                          sendingId === estimate.id || !estimate.lead_email
                        }
                        className={`p-1 rounded ${
                          !estimate.lead_email
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-green-600 hover:text-green-700"
                        }`}
                        title={
                          !estimate.lead_email
                            ? "No email address"
                            : "Send to Client"
                        }
                      >
                        <Send
                          size={16}
                          className={
                            sendingId === estimate.id ? "animate-pulse" : ""
                          }
                        />
                      </button>
                    )}

                    {onDuplicateEstimate && (
                      <button
                        onClick={() => handleDuplicate(estimate)}
                        disabled={duplicatingId === estimate.id}
                        className="text-purple-600 hover:text-purple-700 p-1 rounded"
                        title="Duplicate"
                      >
                        <Copy
                          size={16}
                          className={
                            duplicatingId === estimate.id ? "animate-pulse" : ""
                          }
                        />
                      </button>
                    )}

                    {onDeleteEstimate && (
                      <button
                        onClick={() => onDeleteEstimate(estimate)}
                        className="text-red-600 hover:text-red-700 p-1 rounded"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
