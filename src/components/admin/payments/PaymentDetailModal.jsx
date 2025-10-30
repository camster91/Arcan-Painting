import { useState } from "react";
import MobileModal from "@/components/MobileModal";
import { formatCurrency, formatDateLong } from "@/utils/paymentUtils";

export function PaymentDetailModal({
  payment,
  invoices,
  contracts,
  onClose,
  onUpdate,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    payment_method: payment.payment_method,
    payment_reference: payment.payment_reference || "",
    amount: payment.amount.toString(),
    payment_date: payment.payment_date,
    status: payment.status,
    notes: payment.notes || "",
    processed_by: payment.processed_by || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updates = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      await onUpdate(payment.id, updates);
      setIsEditing(false);
      onClose();
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const relatedInvoice = invoices.find((inv) => inv.id === payment.invoice_id);
  const relatedContract = contracts.find(
    (con) => con.id === payment.contract_id,
  );

  const footer = (
    <div className="flex items-center justify-between">
      {!isEditing ? (
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Edit
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={(e) => handleSubmit(e)}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-all duration-200"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
      <button
        onClick={onClose}
        className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Close
      </button>
    </div>
  );

  return (
    <MobileModal
      isOpen={true}
      onClose={onClose}
      title={`Payment #${payment.id}`}
      footer={footer}
    >
      <div className="">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Edit Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="pending">Pending</option>
                  <option value="cleared">Cleared</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_method: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.payment_date}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.payment_reference}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_reference: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Processed By
                </label>
                <input
                  type="text"
                  value={formData.processed_by}
                  onChange={(e) =>
                    setFormData({ ...formData, processed_by: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4" />
          </form>
        ) : (
          <div className="space-y-6">
            {/* Payment Details */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Payment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Amount</p>
                  <p className="text-xl font-bold text-slate-900">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Status</p>
                  <span
                    className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm font-medium capitalize ${
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
                <div>
                  <p className="text-sm text-slate-600">Method</p>
                  <p className="font-medium text-slate-900 capitalize">
                    {payment.payment_method.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Date</p>
                  <p className="font-medium text-slate-900">
                    {formatDateLong(payment.payment_date)}
                  </p>
                </div>
                {payment.payment_reference && (
                  <div>
                    <p className="text-sm text-slate-600">Reference</p>
                    <p className="font-medium text-slate-900">
                      {payment.payment_reference}
                    </p>
                  </div>
                )}
                {payment.processed_by && (
                  <div>
                    <p className="text-sm text-slate-600">Processed By</p>
                    <p className="font-medium text-slate-900">
                      {payment.processed_by}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Related Records */}
            {(relatedInvoice || relatedContract) && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Related Records
                </h3>
                <div className="space-y-3">
                  {relatedInvoice && (
                    <div>
                      <p className="text-sm text-slate-600">Invoice</p>
                      <p className="font-medium text-slate-900">
                        {relatedInvoice.invoice_number} - {relatedInvoice.title}
                      </p>
                    </div>
                  )}
                  {relatedContract && (
                    <div>
                      <p className="text-sm text-slate-600">Contract</p>
                      <p className="font-medium text-slate-900">
                        {relatedContract.contract_number} -{" "}
                        {relatedContract.title}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {payment.notes && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Notes
                </h3>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {payment.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="text-sm text-slate-500 space-y-1">
              <p>Created: {formatDateLong(payment.created_at)}</p>
              {payment.updated_at !== payment.created_at && (
                <p>Updated: {formatDateLong(payment.updated_at)}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </MobileModal>
  );
}
