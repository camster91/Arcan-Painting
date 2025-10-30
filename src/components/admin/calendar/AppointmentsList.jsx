import { useMemo } from "react";
import { Clock, Mail, Phone, MapPin } from "lucide-react";
import { groupByDate, formatTime, toISODate } from "@/utils/calendarUtils";
import { AvailabilityChips } from "./AvailabilityChips";

export function AppointmentsList({
  appointments,
  isLoading,
  error,
  availabilityByDate,
  availLoading,
  availError,
  teamMembersData,
  teamMembersLoading,
  teamMembersError,
  startDateISO,
  endDateISO,
  createAvailability,
  updateAvailability,
  deleteAvailability,
}) {
  const grouped = useMemo(() => groupByDate(appointments), [appointments]);

  if (isLoading) {
    return <div className="text-slate-600 text-center py-8">Loading…</div>;
  }

  if (error) {
    return (
      <div className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mx-2 sm:mx-0">
        {(error && error.message) || "Failed to load appointments"}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 text-center text-slate-600 mx-2 sm:mx-0">
        No scheduled estimates yet.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {grouped.map(([date, items]) => (
        <div
          key={date}
          className="bg-white border border-slate-200 rounded-xl overflow-hidden mx-2 sm:mx-0"
        >
          <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-slate-900 font-semibold text-sm sm:text-base">
              {new Date(date).toLocaleDateString()}
            </h2>
            <span className="text-xs text-slate-500">
              {items.length} appointment{items.length > 1 ? "s" : ""}
            </span>
          </div>
          <AvailabilityChips
            date={toISODate(date)}
            availabilityByDate={availabilityByDate}
            availLoading={availLoading}
            availError={availError}
            teamMembersData={teamMembersData}
            teamMembersLoading={teamMembersLoading}
            teamMembersError={teamMembersError}
            startDateISO={startDateISO}
            endDateISO={endDateISO}
            createAvailability={createAvailability}
            updateAvailability={updateAvailability}
            deleteAvailability={deleteAvailability}
          />
          <ul className="divide-y divide-slate-200">
            {items.map((a) => (
              <li
                key={a.id}
                className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded text-xs sm:text-sm">
                      <Clock size={12} className="sm:size-[14px]" />
                      <span className="hidden sm:inline">
                        {formatTime(String(a.start_time).slice(0, 5))} –{" "}
                        {formatTime(String(a.end_time).slice(0, 5))}
                      </span>
                      <span className="sm:hidden">
                        {formatTime(String(a.start_time).slice(0, 5))}
                      </span>
                    </span>
                    <span className="text-slate-900 font-semibold truncate text-sm sm:text-base">
                      {a.lead_name || a.name}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-3">
                    {a.lead_email || a.email ? (
                      <span className="inline-flex items-center gap-1">
                        <Mail size={12} className="sm:size-[14px]" />
                        <span className="truncate">
                          {a.lead_email || a.email}
                        </span>
                      </span>
                    ) : null}
                    {a.lead_phone || a.phone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={12} className="sm:size-[14px]" />
                        {a.lead_phone || a.phone}
                      </span>
                    ) : null}
                    {a.address ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} className="sm:size-[14px]" />
                        <span className="truncate">{a.address}</span>
                      </span>
                    ) : null}
                  </div>
                  {a.notes && (
                    <p className="text-xs sm:text-sm text-slate-500 mb-3">
                      Notes: {a.notes}
                    </p>
                  )}
                </div>
                <a
                  href={`/admin/leads?lead_id=${a.lead_id || ""}`}
                  className="text-amber-600 hover:text-amber-700 text-xs sm:text-sm font-medium self-start sm:self-auto flex-shrink-0"
                >
                  View Lead
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
