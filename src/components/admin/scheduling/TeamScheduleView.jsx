import { MapPin } from "lucide-react";

export default function TeamScheduleView({
  weekDates,
  availability,
  timeEntries,
  teamMembers,
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">
          Team Schedule Overview
        </h3>
        <p className="text-sm text-slate-600">
          Track team member availability and work hours
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-900 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                Team Member
              </th>
              {weekDates.map((date, index) => (
                <th
                  key={index}
                  className="text-center py-3 px-4 font-medium text-slate-900 min-w-[140px]"
                >
                  <div>
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div className="text-sm text-slate-500">{date.getDate()}</div>
                </th>
              ))}
              <th className="text-center py-3 px-4 font-medium text-slate-900 min-w-[100px]">
                Weekly Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {teamMembers.map((member) => {
              let weeklyTotal = 0;

              return (
                <tr key={member.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 sticky left-0 bg-white border-r border-slate-200 z-10">
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-slate-500 capitalize">
                        {member.role}
                      </div>
                      {member.hourly_rate && (
                        <div className="text-xs text-slate-400">
                          ${member.hourly_rate}/hr
                        </div>
                      )}
                    </div>
                  </td>
                  {weekDates.map((date, dateIndex) => {
                    const dateStr = date.toISOString().split("T")[0];
                    const memberAvailability = availability.filter(
                      (a) =>
                        a.team_member_id === member.id && a.date === dateStr,
                    );
                    const memberTimeEntries = timeEntries.filter(
                      (t) =>
                        t.team_member_id === member.id &&
                        t.clock_in_time.split("T")[0] === dateStr,
                    );

                    const dailyHours = memberTimeEntries.reduce(
                      (sum, entry) => {
                        return sum + (parseFloat(entry.total_hours) || 0);
                      },
                      0,
                    );
                    weeklyTotal += dailyHours;

                    return (
                      <td
                        key={dateIndex}
                        className="py-3 px-4 text-center min-w-[140px]"
                      >
                        <div className="space-y-1">
                          {memberAvailability.map((avail) => (
                            <div
                              key={avail.id}
                              className={`text-xs px-2 py-1 rounded ${
                                avail.availability_type === "available"
                                  ? "bg-green-100 text-green-700"
                                  : avail.availability_type === "vacation"
                                    ? "bg-blue-100 text-blue-700"
                                    : avail.availability_type === "sick"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              {avail.start_time?.slice(0, 5)} -{" "}
                              {avail.end_time?.slice(0, 5)}
                            </div>
                          ))}

                          {memberTimeEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className={`text-xs px-2 py-1 rounded ${
                                entry.status === "active"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {entry.total_hours
                                ? `${entry.total_hours.toFixed(1)}h`
                                : "Active"}
                              {entry.project_name && (
                                <div className="text-xs opacity-75">
                                  {entry.project_name}
                                </div>
                              )}
                            </div>
                          ))}

                          {dailyHours > 0 && (
                            <div className="text-xs font-medium text-slate-700 mt-1">
                              {dailyHours.toFixed(1)}h total
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-3 px-4 text-center font-medium">
                    {weeklyTotal > 0 ? `${weeklyTotal.toFixed(1)}h` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
