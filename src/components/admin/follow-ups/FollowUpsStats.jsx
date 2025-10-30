import {
  Bell,
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle,
} from "lucide-react";

export function FollowUpsStats({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <Bell size={20} className="text-slate-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-sm text-slate-600">Total Follow-ups</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <Clock size={20} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </p>
            <p className="text-sm text-slate-600">Pending</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            <p className="text-sm text-slate-600">Overdue</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
            <p className="text-sm text-slate-600">Due Today</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Calendar size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">
              {stats.upcoming}
            </p>
            <p className="text-sm text-slate-600">This Week</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {stats.completed}
            </p>
            <p className="text-sm text-slate-600">Completed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
