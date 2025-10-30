import { useMemo } from "react";
import { Wrench, ArrowLeftRight } from "lucide-react";
import { groupProjectsByStart, toISODate } from "@/utils/calendarUtils";
import { AvailabilityChips } from "./AvailabilityChips";

export function ProjectsList({
  projects,
  isLoading,
  error,
  onReschedule,
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
  const groupedProjects = useMemo(
    () => groupProjectsByStart(projects),
    [projects],
  );

  if (isLoading) {
    return <div className="text-slate-600 text-center py-8">Loading…</div>;
  }

  if (error) {
    return (
      <div className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mx-2 sm:mx-0">
        {(error && error.message) || "Failed to load projects"}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 text-center text-slate-600 mx-2 sm:mx-0">
        No scheduled projects yet.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {groupedProjects.map(([date, items]) => (
        <div
          key={date}
          className="bg-white border border-slate-200 rounded-xl overflow-hidden mx-2 sm:mx-0"
        >
          <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-slate-900 font-semibold text-sm sm:text-base">
              {date === "Unscheduled"
                ? "Unscheduled"
                : new Date(date).toLocaleDateString()}
            </h2>
            <span className="text-xs text-slate-500">
              {items.length} project{items.length > 1 ? "s" : ""}
            </span>
          </div>
          {date !== "Unscheduled" ? (
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
          ) : null}
          <ul className="divide-y divide-slate-200">
            {items.map((p) => (
              <li key={p.id} className="p-3 sm:p-4 flex flex-col gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded text-xs sm:text-sm">
                      <Wrench size={12} className="sm:size-[14px]" />
                      {p.status.replace("_", " ")}
                    </span>
                    <span className="text-slate-900 font-semibold truncate text-sm sm:text-base">
                      {p.project_name}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-3 mb-3">
                    {p.lead_name ? <span>{p.lead_name}</span> : null}
                    {p.start_date ? (
                      <span>
                        Start: {new Date(p.start_date).toLocaleDateString()}
                      </span>
                    ) : (
                      <span>Start: —</span>
                    )}
                    {p.end_date ? (
                      <span>
                        End: {new Date(p.end_date).toLocaleDateString()}
                      </span>
                    ) : (
                      <span>End: —</span>
                    )}
                    {p.crew_assigned ? (
                      <span>Crew: {p.crew_assigned}</span>
                    ) : null}
                  </div>
                  {p.notes && (
                    <p className="text-xs text-slate-500 mb-3">
                      Notes: {p.notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  <a
                    href="/admin/projects"
                    className="text-amber-600 hover:text-amber-700 text-xs sm:text-sm font-medium"
                  >
                    Open Projects
                  </a>
                  <button
                    onClick={() => onReschedule(p)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 text-xs sm:text-sm"
                  >
                    <ArrowLeftRight size={12} className="sm:size-[14px]" />{" "}
                    Reschedule
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
