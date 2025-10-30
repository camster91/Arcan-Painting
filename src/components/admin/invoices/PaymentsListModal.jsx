import { useEffect, useState } from "react";
import { RefreshCw, Mail, RotateCcw, Trash2 } from "lucide-react";
import MobileModal from "@/components/MobileModal";

export default function PaymentsListModal({
  invoice,
  onClose,
  onChanged,
  onNotify,
}) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workingId, setWorkingId] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/payments?invoice_id=${invoice.id}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load payments");
      }
      setPayments(data);
    } catch (e) {
      console.error(e);
      setError(e.message || "Could not load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice?.id]);

  const refundPayment = async (p) => {
    const ok = window.confirm(
      `Mark payment $${Number(p.amount).toFixed(2)} on ${invoice.invoice_number} as refunded?`,
    );
    if (!ok) return;
    try {
      setWorkingId(p.id);
      const res = await fetch(`/api/payments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, status: "refunded" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to refund payment");
      }
      onNotify?.("Payment marked as refunded");
      await load();
      await onChanged?.();
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setWorkingId(null);
    }
  };

  const sendReceipt = async (p) => {
    try {
      setWorkingId(p.id);
      const res = await fetch(`/api/payments/${p.id}/receipt`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to send receipt");
      }
      onNotify?.("Receipt sent to client");
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setWorkingId(null);
    }
  };

  const deletePayment = async (p) => {
    const ok = window.confirm(`Delete this payment? This cannot be undone.`);
    if (!ok) return;
    try {
      setWorkingId(p.id);
      const res = await fetch(`/api/payments?id=${p.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete payment");
      }
      onNotify?.("Payment deleted");
      await load();
      await onChanged?.();
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setWorkingId(null);
    }
  };

  const footer = (
    <div className="flex justify-end">
      <button
        onClick={onClose}
        className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
      >
        Close
      </button>
    </div>
  );

  return (
    <MobileModal
      isOpen={true}
      onClose={onClose}
      title="Payments"
      footer={footer}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-600">
          {invoice.invoice_number} — {invoice.title}
        </p>
        <button
          onClick={load}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-auto">
        {loading ? (
          <div className="text-center text-slate-600 py-8">
            Loading payments...
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center text-slate-600 py-8">
            No payments recorded yet.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-2 px-3 text-sm text-slate-700">
                  Date
                </th>
                <th className="text-left py-2 px-3 text-sm text-slate-700">
                  Method
                </th>
                <th className="text-left py-2 px-3 text-sm text-slate-700">
                  Reference
                </th>
                <th className="text-left py-2 px-3 text-sm text-slate-700">
                  Amount
                </th>
                <th className="text-left py-2 px-3 text-sm text-slate-700">
                  Status
                </th>
                <th className="text-left py-2 px-3 text-sm text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 text-sm text-slate-900">
                    {new Date(p.payment_date).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-3 text-sm text-slate-900">
                    {p.payment_method}
                  </td>
                  <td className="py-2 px-3 text-sm text-slate-600">
                    {p.payment_reference || "-"}
                  </td>
                  <td className="py-2 px-3 text-sm text-slate-900">
                    ${Number(p.amount).toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === "cleared"
                          ? "bg-green-100 text-green-800"
                          : p.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : p.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        disabled={workingId === p.id}
                        onClick={() => sendReceipt(p)}
                        title="Send Receipt"
                        className={`p-1.5 rounded-lg ${workingId === p.id ? "text-amber-600 bg-amber-50" : "text-slate-600 hover:text-amber-700 hover:bg-amber-50"}`}
                      >
                        <Mail size={16} />
                      </button>
                      {p.status !== "refunded" && (
                        <button
                          disabled={workingId === p.id}
                          onClick={() => refundPayment(p)}
                          title="Mark Refunded"
                          className={`p-1.5 rounded-lg ${workingId === p.id ? "text-slate-700 bg-slate-100" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
                        >
                          <RotateCcw size={16} />
                        </button>
                      )}
                      <button
                        disabled={workingId === p.id}
                        onClick={() => deletePayment(p)}
                        title="Delete"
                        className={`p-1.5 rounded-lg ${workingId === p.id ? "text-red-600 bg-red-50" : "text-slate-600 hover:text-red-700 hover:bg-red-50"}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </MobileModal>
  );
}
