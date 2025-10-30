import { Eye, AlertTriangle, Clock } from "lucide-react";
import {
  getTypeInfo,
  getStatusColor,
  formatDate,
  isOverdue,
  isToday,
} from "@/utils/followUpUtils";

export function FollowUpsTable({ followUps, onSelectFollowUp }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left py-3 px-4 font-medium text-slate-900">
              Customer
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-900">
              Type
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-900">
              Due Date
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-900">
              Status
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-900">
              Priority
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-900">
              Notes
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-900">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {followUps.map((followUp) => {
            const typeInfo = getTypeInfo(followUp.follow_up_type);
            const TypeIcon = typeInfo.icon;
            const overdue = isOverdue(followUp.follow_up_date, followUp.status);
            const today = isToday(followUp.follow_up_date);

            return (
              <tr
                key={followUp.id}
                className={`hover:bg-slate-50 ${overdue ? "bg-red-50" : today ? "bg-amber-50" : ""}`}
              >
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      {followUp.lead_name}
                    </p>
                    {followUp.lead_email && (
                      <p className="text-sm text-slate-500">
                        {followUp.lead_email}
                      </p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeInfo.color}`}
                  >
                    <TypeIcon size={12} />
                    {typeInfo.label}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p
                      className={`text-sm ${overdue ? "text-red-600 font-medium" : today ? "text-amber-600 font-medium" : "text-slate-900"}`}
                    >
                      {formatDate(followUp.follow_up_date)}
                    </p>
                    {overdue && <p className="text-xs text-red-500">Overdue</p>}
                    {today && (
                      <p className="text-xs text-amber-600">Due Today</p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(followUp.status)}`}
                  >
                    {followUp.status === "pending" ? "Pending" : "Completed"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {overdue && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                      <AlertTriangle size={10} />
                      Urgent
                    </span>
                  )}
                  {today && !overdue && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                      <Clock size={10} />
                      Today
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <p className="text-sm text-slate-600 truncate max-w-xs">
                    {followUp.notes || "No notes"}
                  </p>
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onSelectFollowUp(followUp)}
                    className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1"
                  >
                    <Eye size={14} />
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
