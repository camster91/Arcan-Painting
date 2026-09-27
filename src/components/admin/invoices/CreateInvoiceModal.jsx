import { useEffect, useState } from "react";
import MobileModal from "@/components/MobileModal";

const inputClass =
  "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500";

/**
 * Create a deposit or final invoice for a job. Amounts come from the job's
 * estimate on the server (/api/invoices/from-project); HST is added there.
 */
export default function CreateInvoiceModal({ onClose, onCreated, initialProjectId = null }) {
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectId, setProjectId] = useState(initialProjectId ? String(initialProjectId) : "");
  const [kind, setKind] = useState("deposit");
  const [depositPercent, setDepositPercent] = useState(25);
  const [dueDays, setDueDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (active) setProjects((data.projects || []).filter((p) => p.status !== "cancelled"));
      })
      .catch(() => active && setError("Could not load jobs. Refresh and try again."))
      .finally(() => active && setProjectsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const chooseKind = (next) => {
    setKind(next);
    setDueDays(next === "deposit" ? 7 : 14);
  };

  const selected = projects.find((p) => String(p.id) === projectId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/invoices/from-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: Number(projectId),
          kind,
          deposit_percent: kind === "deposit" ? Number(depositPercent) : undefined,
          due_days: Number(dueDays),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not create the invoice");
      const inv = data.invoice;
      onCreated?.(`${inv.invoice_number} created for $${Number(inv.total_amount).toFixed(2)} (incl. HST)`);
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <div className="flex justify-between gap-4">
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 font-medium"
      >
        Cancel
      </button>
      <button
        type="submit"
        onClick={handleSubmit}
        disabled={submitting || !projectId}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg disabled:opacity-50"
      >
        {submitting ? "Creating..." : "Create invoice"}
      </button>
    </div>
  );

  return (
    <MobileModal isOpen={true} onClose={onClose} title="New invoice" footer={footer}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="invoice-project" className="block text-sm font-medium text-slate-700 mb-1">
            Job
          </label>
          <select
            id="invoice-project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className={inputClass}
            disabled={projectsLoading}
            required
          >
            <option value="">{projectsLoading ? "Loading jobs..." : "Choose a job"}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_name}
                {p.lead_name ? ` · ${p.lead_name}` : ""}
                {p.estimate_number ? ` · ${p.estimate_number}` : " · no estimate"}
              </option>
            ))}
          </select>
          {selected && !selected.estimate_id && (
            <p className="text-xs text-red-700 mt-1">This job has no estimate, so there is no amount to invoice.</p>
          )}
          {!projectsLoading && projects.length === 0 && (
            <p className="text-xs text-slate-500 mt-1">No jobs yet. Approve an estimate to create one.</p>
          )}
        </div>

        <fieldset>
          <legend className="block text-sm font-medium text-slate-700 mb-1">Invoice for</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["deposit", "Deposit", "A share of the estimate, up front"],
              ["final", "Final", "Everything not yet invoiced"],
            ].map(([value, label, hint]) => (
              <label
                key={value}
                className={`flex flex-col gap-0.5 border rounded-lg p-3 cursor-pointer ${
                  kind === value ? "border-amber-500 bg-amber-50" : "border-slate-300"
                }`}
              >
                <span className="flex items-center gap-2 font-medium text-slate-900">
                  <input
                    type="radio"
                    name="invoice-kind"
                    value={value}
                    checked={kind === value}
                    onChange={() => chooseKind(value)}
                  />
                  {label}
                </span>
                <span className="text-xs text-slate-500">{hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          {kind === "deposit" && (
            <div>
              <label htmlFor="invoice-deposit" className="block text-sm font-medium text-slate-700 mb-1">
                Deposit %
              </label>
              <input
                id="invoice-deposit"
                type="number"
                min="1"
                max="100"
                step="1"
                value={depositPercent}
                onChange={(e) => setDepositPercent(e.target.value)}
                className={inputClass}
              />
            </div>
          )}
          <div>
            <label htmlFor="invoice-due" className="block text-sm font-medium text-slate-700 mb-1">
              Due in (days)
            </label>
            <input
              id="invoice-due"
              type="number"
              min="0"
              step="1"
              value={dueDays}
              onChange={(e) => setDueDays(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Amounts come from the job's estimate, before tax. 13% HST is added to the invoice.
        </p>
      </form>
    </MobileModal>
  );
}
