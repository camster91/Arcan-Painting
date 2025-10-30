import { Eye, Mail, Phone, DollarSign, Calendar, Edit3 } from "lucide-react";

function getStatusColor(status) {
  const colors = {
    new: "bg-blue-100 text-blue-800 border-blue-200",
    contacted: "bg-yellow-100 text-yellow-800 border-yellow-200",
    estimate_scheduled: "bg-purple-100 text-purple-800 border-purple-200",
    estimate_sent: "bg-orange-100 text-orange-800 border-orange-200",
    follow_up: "bg-amber-100 text-amber-800 border-amber-200",
    won: "bg-green-100 text-green-800 border-green-200",
    lost: "bg-red-100 text-red-800 border-red-200",
  };
  return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  return d.toLocaleDateString();
}

function formatAppt(a) {
  if (!a) return null;
  try {
    const start = new Date(
      `${a.slot_date}T${String(a.start_time).slice(0, 8)}`,
    );
    const end = new Date(`${a.slot_date}T${String(a.end_time).slice(0, 8)}`);
    return `${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return null;
  }
}

export default function LeadsTable({
  leads,
  nextAppointmentsMap,
  onQuickView,
  onAction,
}) {
  return (
    <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-900">
                Name
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">
                Contact
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">
                Service
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">
                Status
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">
                Next Visit
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">
                Created
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">
                Est. Value
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {leads.map((lead) => {
              const appt = nextAppointmentsMap?.get?.(lead.id);
              const apptText = formatAppt(appt);
              return (
                <tr key={lead.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-900 truncate">
                      {lead.name}
                    </p>
                    {lead.address && (
                      <p className="text-xs text-slate-500 truncate">
                        {lead.address}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-slate-700">
                      <p className="flex items-center gap-1">
                        <Mail size={12} className="text-slate-400" />
                        {lead.email}
                      </p>
                      <p className="flex items-center gap-1">
                        <Phone size={12} className="text-slate-400" />
                        {lead.phone}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium text-slate-800">
                      {lead.service_type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}
                    >
                      {lead.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {apptText ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        <Calendar size={12} /> {apptText}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-slate-600">
                      {formatDate(lead.created_at)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {lead.estimated_value ? (
                      <span className="text-sm font-semibold text-green-700 flex items-center gap-1">
                        <DollarSign size={12} />
                        {Number(lead.estimated_value).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          onQuickView
                            ? onQuickView(lead)
                            : onAction?.("quick_view", lead)
                        }
                        className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1"
                        title="Quick View"
                      >
                        <Eye size={14} />
                        View
                      </button>
                      <button
                        onClick={() => onAction?.("edit", lead)}
                        className="text-slate-600 hover:text-slate-900 text-sm font-medium flex items-center gap-1"
                        title="Edit Lead"
                      >
                        <Edit3 size={14} />
                        Edit
                      </button>
                    </div>
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
