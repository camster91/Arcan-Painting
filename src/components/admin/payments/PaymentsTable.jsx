import { DollarSign } from "lucide-react";
import {
  getStatusIcon,
  getMethodIcon,
  formatCurrency,
  formatDate,
} from "@/utils/paymentUtils";

export function PaymentsTable({ payments, onPaymentClick }) {
  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="text-center py-12">
          <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">
            No payments found
          </h3>
          <p className="text-slate-500">
            No payments match your current filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                Payment
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                Amount
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                Method
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                Status
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                Date
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                Reference
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => onPaymentClick(payment)}
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      Payment #{payment.id}
                    </p>
                    {payment.processed_by && (
                      <p className="text-sm text-slate-500">
                        by {payment.processed_by}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(payment.amount)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getMethodIcon(payment.payment_method)}
                    <span className="capitalize">
                      {payment.payment_method.replace("_", " ")}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(payment.status)}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        payment.status === "cleared"
                          ? "bg-green-100 text-green-700"
                          : payment.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : payment.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : payment.status === "refunded"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {formatDate(payment.payment_date)}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {payment.payment_reference || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
