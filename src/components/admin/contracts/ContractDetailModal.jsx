import { ContractStatusBadge } from "./ContractStatusBadge";
import { useState } from "react";

export function ContractDetailModal({ contract, isOpen, onClose, onUpdated }) {
  // hooks must be called unconditionally
  const [sending, setSending] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signedUrl, setSignedUrl] = useState("");
  const [error, setError] = useState(null);

  if (!isOpen || !contract) return null;

  const handleSend = async () => {
    try {
      setSending(true);
      setError(null);
      const res = await fetch(`/api/contracts/${contract.id}/send`, {
        method: "POST",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to send contract");
      onUpdated?.();
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const handleMarkSigned = async () => {
    try {
      setSigning(true);
      setError(null);
      const body = {
        id: contract.id,
        status: "signed",
        client_signed_at: new Date().toISOString(),
      };
      if (signedUrl.trim()) body.signed_contract_pdf_url = signedUrl.trim();
      const res = await fetch(`/api/contracts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to mark signed");
      onUpdated?.();
      onClose();
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Contract Details
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm mb-4">
              {error}
            </div>
          )}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Contract Number
                </label>
                <p className="text-slate-900 font-semibold">
                  {contract.contract_number}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Status
                </label>
                <div className="mt-1">
                  <ContractStatusBadge status={contract.status} />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Project Title
              </label>
              <p className="text-slate-900">{contract.title}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Client
              </label>
              <p className="text-slate-900">{contract.client_name}</p>
              <p className="text-slate-600">{contract.client_email}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Total Amount
                </label>
                <p className="text-slate-900 font-semibold">
                  ${parseFloat(contract.total_amount || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Deposit ({contract.deposit_percentage}%)
                </label>
                <p className="text-slate-900 font-semibold">
                  ${parseFloat(contract.deposit_amount || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {contract.scope_of_work && (
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Scope of Work
                </label>
                <div className="bg-slate-50 rounded-lg p-4 mt-2">
                  <p className="text-slate-900 whitespace-pre-wrap">
                    {contract.scope_of_work}
                  </p>
                </div>
              </div>
            )}

            {contract.status !== "signed" && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-2">Finalize</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">
                      Signed PDF URL (optional)
                    </label>
                    <input
                      value={signedUrl}
                      onChange={(e) => setSignedUrl(e.target.value)}
                      placeholder="https://.../signed.pdf"
                      className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSend}
                      disabled={sending}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm"
                    >
                      {sending ? "Sending..." : "Send"}
                    </button>
                    <button
                      onClick={handleMarkSigned}
                      disabled={signing}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg text-sm"
                    >
                      {signing ? "Saving..." : "Mark Signed"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-200">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
            >
              Close
            </button>
            <a
              href={`/api/contracts/${contract.id}/pdf`}
              target="_blank"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium"
            >
              View PDF
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
