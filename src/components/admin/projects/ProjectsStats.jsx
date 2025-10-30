import {
  Briefcase,
  Calendar,
  PlayCircle,
  CheckCircle,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { formatCurrency } from "@/utils/projectsUtils";

export default function ProjectsStats({ stats }) {
  return (
    <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <Briefcase size={20} className="text-slate-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-sm text-slate-600">Total Projects</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {stats.scheduled}
            </p>
            <p className="text-sm text-slate-600">Scheduled</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <PlayCircle size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">
              {stats.inProgress}
            </p>
            <p className="text-sm text-slate-600">In Progress</p>
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

      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <DollarSign size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-amber-600">
              {formatCurrency(stats.totalValue)}
            </p>
            <p className="text-sm text-slate-600">Total Value</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <DollarSign size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(stats.completedValue)}
            </p>
            <p className="text-sm text-slate-600">Completed Value</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <BarChart3 size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {stats.avgCompletion}%
            </p>
            <p className="text-sm text-slate-600">Avg Completion</p>
          </div>
        </div>
      </div>
    </div>
  );
}
