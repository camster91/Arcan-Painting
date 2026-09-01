"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Plus, Trash2, X } from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const emptyLine = () => ({ description: "", quantity: "1", unit_price: "", category: "labor" });

export default function CreateInvoiceModal({ onClose, onCreated }) {
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    lead_id: "",
    project_id: "",
    contract_id: "",
    title: "",
    description: "",
    invoice_type: "progress",
    issue_date: today(),
    due_date: inDays(14),
    tax_rate: "13",
    notes: "",
    line_items: [emptyLine()],
  });

  useEffect(() => {
    let active = true;
    Promise.all([fetch("/api/leads?limit=250"), fetch("/api/projects?limit=250"), fetch("/api/contracts?limit=250")])
      .then(async (responses) => {
        const failed = responses.find((response) => !response.ok);
        if (failed) throw new Error("Could not load customers, projects, and contracts");
        return Promise.all(responses.map((response) => response.json()));
      })
      .then(([leadData, projectData, contractData]) => {
        if (!active) return;
        setLeads(leadData.leads || []);
        setProjects(projectData.projects || []);
        setContracts(contractData.contracts || []);
      })
      .catch((caught) => active && setError(caught.message))
      .finally(() => active && setLoadingOptions(false));
    return () => { active = false; };
  }, []);

  const totals = useMemo(() => {
    const subtotal = form.line_items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
      0,
    );
    const tax = subtotal * ((Number(form.tax_rate) || 0) / 100);
    return { subtotal, tax, total: subtotal + tax };
  }, [form.line_items, form.tax_rate]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const setLine = (index, field, value) => setForm((current) => ({
    ...current,
    line_items: current.line_items.map((line, lineIndex) =>
      lineIndex === index ? { ...line, [field]: value } : line,
    ),
  }));

  const handleProject = (projectId) => {
    const project = projects.find((item) => String(item.id) === projectId);
    setForm((current) => ({
      ...current,
      project_id: projectId,
      lead_id: project?.lead_id ? String(project.lead_id) : current.lead_id,
      title: current.title || project?.project_name || "",
    }));
  };

  const handleContract = (contractId) => {
    const contract = contracts.find((item) => String(item.id) === contractId);
    setForm((current) => ({
      ...current,
      contract_id: contractId,
      project_id: contract?.project_id ? String(contract.project_id) : current.project_id,
      lead_id: contract?.lead_id ? String(contract.lead_id) : current.lead_id,
      title: current.title || contract?.title || "",
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.lead_id && !form.project_id && !form.contract_id) {
      setError("Choose a customer, project, or contract.");
      return;
    }
    if (form.line_items.some((item) => !item.description.trim() || Number(item.quantity) <= 0 || Number(item.unit_price) < 0)) {
      setError("Each line item needs a description, positive quantity, and non-negative price.");
      return;
    }
    if (form.due_date < form.issue_date) {
      setError("Due date cannot be before the issue date.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          lead_id: form.lead_id || null,
          project_id: form.project_id || null,
          contract_id: form.contract_id || null,
          tax_rate: Number(form.tax_rate),
          line_items: form.line_items.map((item) => ({
            ...item,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
          })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not create invoice");
      onCreated(data);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="create-invoice-title">
      <form onSubmit={submit} className="my-3 w-full max-w-4xl rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-xl border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 id="create-invoice-title" className="text-xl font-bold text-slate-900">Create invoice</h2>
            <p className="text-sm text-slate-600">Link the bill to its customer and source job.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close create invoice" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><X size={20} /></button>
        </div>

        <div className="space-y-6 p-5">
          {error && <div role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle size={18} className="mt-0.5 shrink-0" />{error}</div>}

          <fieldset disabled={loadingOptions || submitting} className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">Customer
              <select value={form.lead_id} onChange={(e) => setField("lead_id", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5">
                <option value="">Select customer</option>
                {leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.name}{lead.email ? ` — ${lead.email}` : ""}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">Project
              <select value={form.project_id} onChange={(e) => handleProject(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5">
                <option value="">No project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.project_name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">Contract
              <select value={form.contract_id} onChange={(e) => handleContract(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5">
                <option value="">No contract</option>
                {contracts.map((contract) => <option key={contract.id} value={contract.id}>{contract.contract_number} — {contract.title}</option>)}
              </select>
            </label>
          </fieldset>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700 md:col-span-2">Invoice title *<input required value={form.title} onChange={(e) => setField("title", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
            <label className="text-sm font-medium text-slate-700">Type<select value={form.invoice_type} onChange={(e) => setField("invoice_type", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5"><option value="deposit">Deposit</option><option value="progress">Progress</option><option value="final">Final</option></select></label>
            <label className="text-sm font-medium text-slate-700">HST rate (%)<input type="number" min="0" max="100" step="0.01" value={form.tax_rate} onChange={(e) => setField("tax_rate", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
            <label className="text-sm font-medium text-slate-700">Issue date *<input required type="date" value={form.issue_date} onChange={(e) => setField("issue_date", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
            <label className="text-sm font-medium text-slate-700">Due date *<input required type="date" min={form.issue_date} value={form.due_date} onChange={(e) => setField("due_date", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
          </div>

          <section aria-labelledby="invoice-lines-title">
            <div className="mb-3 flex items-center justify-between"><h3 id="invoice-lines-title" className="font-semibold text-slate-900">Line items</h3><button type="button" onClick={() => setForm((current) => ({ ...current, line_items: [...current.line_items, emptyLine()] }))} className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Plus size={16} /> Add item</button></div>
            <div className="space-y-3">
              {form.line_items.map((item, index) => (
                <div key={index} className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[minmax(0,1fr)_90px_130px_42px]">
                  <label className="text-xs font-medium text-slate-600">Description<input required value={item.description} onChange={(e) => setLine(index, "description", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" /></label>
                  <label className="text-xs font-medium text-slate-600">Quantity<input required type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => setLine(index, "quantity", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" /></label>
                  <label className="text-xs font-medium text-slate-600">Unit price<input required type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => setLine(index, "unit_price", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" /></label>
                  <button type="button" disabled={form.line_items.length === 1} onClick={() => setForm((current) => ({ ...current, line_items: current.line_items.filter((_, lineIndex) => lineIndex !== index) }))} aria-label={`Remove line item ${index + 1}`} className="self-end rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-30"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-[1fr_280px]">
            <label className="text-sm font-medium text-slate-700">Internal notes<textarea rows="4" value={form.notes} onChange={(e) => setField("notes", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
            <dl className="rounded-lg bg-slate-900 p-4 text-sm text-white"><div className="flex justify-between py-1"><dt>Subtotal</dt><dd>${totals.subtotal.toFixed(2)}</dd></div><div className="flex justify-between py-1 text-slate-300"><dt>HST</dt><dd>${totals.tax.toFixed(2)}</dd></div><div className="mt-2 flex justify-between border-t border-slate-700 pt-3 text-lg font-bold"><dt>Total</dt><dd>${totals.total.toFixed(2)}</dd></div></dl>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 rounded-b-xl border-t border-slate-200 bg-white px-5 py-4"><button type="button" onClick={onClose} disabled={submitting} className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={loadingOptions || submitting} className="flex min-w-36 items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 font-semibold text-white hover:bg-amber-600 disabled:opacity-60">{submitting ? <><Loader2 size={18} className="animate-spin" /> Creating…</> : "Create invoice"}</button></div>
      </form>
    </div>
  );
}
