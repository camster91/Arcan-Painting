import { FileText, Eye, Download, Send } from "lucide-react";
import { getStatusColor } from "@/utils/contractsUtils";
import { ContractStatusBadge } from "./ContractStatusBadge";

export function ContractsTable({ contracts, onViewContract, onActionDone }) {
  if (contracts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            No contracts found
          </h3>
          <p className="text-slate-600 mb-6">
            Try adjusting your search or filters
          </p>
        </div>
      </div>
    );
  }

  const handleDownload = (id) => {
    try {
      if (typeof window !== "undefined") {
        window.open(`/api/contracts/${id}/pdf`, "_blank");
      }
    } catch (e) {
      console.error("Failed to open contract PDF", e);
      alert("Could not open contract PDF");
    }
  };

  const handleSend = async (id) => {
    try {
      const res = await fetch(`/api/contracts/${id}/send`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to send contract (${res.status})`);
      }
      onActionDone?.();
      if (typeof window !== "undefined") {
        // Light feedback
        alert("Contract sent to client");
      }
    } catch (e) {
      console.error("Send contract failed", e);
      alert(e.message || "Failed to send contract");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                Contract
              </th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                Client
              </th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                Amount
              </th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                Status
              </th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                Created
              </th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {contracts.map((contract) => (
              <tr key={contract.id} className="hover:bg-slate-50">
                <td className="py-4 px-6">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {contract.contract_number}
                    </div>
                    <div className="text-sm text-slate-600">
                      {contract.title}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div>
                    <div className="font-medium text-slate-900">
                      {contract.client_name}
                    </div>
                    <div className="text-sm text-slate-600">
                      {contract.client_email}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="font-semibold text-slate-900">
                    ${parseFloat(contract.total_amount || 0).toLocaleString()}
                  </div>
                  {contract.deposit_amount > 0 && (
                    <div className="text-sm text-slate-600">
                      Deposit: $
                      {parseFloat(contract.deposit_amount).toLocaleString()}
                    </div>
                  )}
                </td>
                <td className="py-4 px-6">
                  <ContractStatusBadge status={contract.status} />
                </td>
                <td className="py-4 px-6 text-sm text-slate-600">
                  {new Date(contract.created_at).toLocaleDateString()}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewContract(contract)}
                      className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleDownload(contract.id)}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Download PDF"
                    >
                      <Download size={18} />
                    </button>
                    {contract.status === "draft" && (
                      <button
                        onClick={() => handleSend(contract.id)}
                        className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Send Contract"
                      >
                        <Send size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
