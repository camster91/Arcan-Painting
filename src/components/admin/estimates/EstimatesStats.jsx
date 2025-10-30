import { FileText, DollarSign, Edit, Send, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/utils/estimatesUtils";

export function EstimatesStats({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <FileText size={20} className="text-slate-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-sm text-slate-600">Total Estimates</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Edit size={20} className="text-gray-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
            <p className="text-sm text-slate-600">Draft</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Send size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{stats.sent}</p>
            <p className="text-sm text-slate-600">Sent</p>
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
              {stats.approved}
            </p>
            <p className="text-sm text-slate-600">Approved</p>
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
              {formatCurrency(stats.approvedValue)}
            </p>
            <p className="text-sm text-slate-600">Won Value</p>
          </div>
        </div>
      </div>
    </div>
  );
}
