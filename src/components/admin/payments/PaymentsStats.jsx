import { DollarSign, Clock, Check, Receipt } from "lucide-react";
import { formatCurrency } from "@/utils/paymentUtils";

export function PaymentsStats({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Total Payments</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(stats.totalAmount)}
            </p>
          </div>
          <div className="bg-green-100 rounded-lg p-3">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {formatCurrency(stats.pendingAmount)}
            </p>
          </div>
          <div className="bg-yellow-100 rounded-lg p-3">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Cleared</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.clearedAmount)}
            </p>
          </div>
          <div className="bg-green-100 rounded-lg p-3">
            <Check className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Total Count</p>
            <p className="text-2xl font-bold text-slate-900">
              {stats.totalCount}
            </p>
          </div>
          <div className="bg-blue-100 rounded-lg p-3">
            <Receipt className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
