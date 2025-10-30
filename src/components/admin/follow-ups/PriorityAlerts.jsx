import { useState } from "react";
import { AlertTriangle, Calendar, ChevronUp, ChevronDown } from "lucide-react";
import { getTypeInfo, formatDate } from "@/utils/followUpUtils";

export function PriorityAlerts({
  overdueFollowUps,
  todayFollowUps,
  onSelectFollowUp,
}) {
  const [showOverdue, setShowOverdue] = useState(false);

  if (overdueFollowUps.length === 0 && todayFollowUps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Overdue Alert */}
      {overdueFollowUps.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">
                  {overdueFollowUps.length} Overdue Follow-up
                  {overdueFollowUps.length !== 1 ? "s" : ""}
                </h3>
                <p className="text-sm text-red-700">
                  These follow-ups are past due and need immediate attention
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowOverdue(!showOverdue)}
              className="text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              {showOverdue ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
              {showOverdue ? "Hide" : "View"}
            </button>
          </div>

          {showOverdue && (
            <div className="mt-4 space-y-2">
              {overdueFollowUps.slice(0, 5).map((followUp) => {
                const typeInfo = getTypeInfo(followUp.follow_up_type);
                const TypeIcon = typeInfo.icon;

                return (
                  <div
                    key={followUp.id}
                    className="bg-white p-3 rounded border border-red-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TypeIcon size={16} className="text-red-600" />
                        <div>
                          <p className="font-medium text-slate-900">
                            {followUp.lead_name}
                          </p>
                          <p className="text-sm text-slate-600">
                            {typeInfo.label} - Due{" "}
                            {formatDate(followUp.follow_up_date)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onSelectFollowUp(followUp)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Handle Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Today's Follow-ups */}
      {todayFollowUps.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-amber-600" />
            <div>
              <h3 className="font-semibold text-amber-900">
                {todayFollowUps.length} Follow-up
                {todayFollowUps.length !== 1 ? "s" : ""} Due Today
              </h3>
              <p className="text-sm text-amber-700">
                Don't forget these important touchpoints
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
