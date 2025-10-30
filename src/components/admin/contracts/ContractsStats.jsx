import {
  FileText,
  FileSignature,
  CheckCircle2,
  DollarSign,
} from "lucide-react";

export function ContractsStats({ stats }) {
  const { totalContracts, awaitingSignature, signed, totalValue } = stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">
              Total Contracts
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {totalContracts}
            </p>
          </div>
          <div className="bg-blue-100 rounded-lg p-3">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">
              Awaiting Signature
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {awaitingSignature}
            </p>
          </div>
          <div className="bg-amber-100 rounded-lg p-3">
            <FileSignature className="w-6 h-6 text-amber-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Signed</p>
            <p className="text-2xl font-bold text-slate-900">{signed}</p>
          </div>
          <div className="bg-green-100 rounded-lg p-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Total Value</p>
            <p className="text-2xl font-bold text-slate-900">
              ${totalValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-emerald-100 rounded-lg p-3">
            <DollarSign className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
