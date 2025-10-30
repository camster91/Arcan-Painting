import { useState } from "react";
import MobileModal from "@/components/MobileModal";

export function CreatePaymentModal({ invoices, contracts, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    invoice_id: "",
    contract_id: "",
    payment_method: "cash",
    payment_reference: "",
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
    processed_by: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        invoice_id: formData.invoice_id || null,
        contract_id: formData.contract_id || null,
      };

      await onSubmit(submitData);
      onClose();
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="p-0 flex gap-4 justify-between">
      <button
        type="button"
        onClick={onClose}
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all duration-200 font-medium"
      >
        Cancel
      </button>
      <button
        type="submit"
        onClick={handleSubmit}
        disabled={
          loading ||
          !formData.amount ||
          !formData.payment_method ||
          !formData.payment_date
        }
        className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold px-8 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Recording...
          </>
        ) : (
          "Record Payment"
        )}
      </button>
    </div>
  );

  return (
    <MobileModal
      isOpen={true}
      onClose={onClose}
      title="Record New Payment"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Invoice/Contract Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Invoice (optional)
            </label>
            <select
              value={formData.invoice_id}
              onChange={(e) =>
                setFormData({ ...formData, invoice_id: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Select invoice...</option>
              {invoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoice_number} - {invoice.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contract (optional)
            </label>
            <select
              value={formData.contract_id}
              onChange={(e) =>
                setFormData({ ...formData, contract_id: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Select contract...</option>
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.contract_number} - {contract.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount and Method */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Amount *
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
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Payment Method *
            </label>
            <select
              required
              value={formData.payment_method}
              onChange={(e) =>
                setFormData({ ...formData, payment_method: e.target.value })
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
        </div>

        {/* Reference and Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
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
              placeholder="Check #, transaction ID, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Payment Date *
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
        </div>

        {/* Processed By */}
        <div>
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
            placeholder="Your name or staff member"
          />
        </div>

        {/* Notes */}
        <div>
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
            placeholder="Additional payment details..."
          />
        </div>
      </form>
    </MobileModal>
  );
}
