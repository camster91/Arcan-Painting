"use client";

import { useEffect, useState } from "react";
import { DollarSign, Loader2, Plus } from "lucide-react";
import useUpload from "@/utils/useUpload";

const money = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});
const today = () => new Date().toISOString().slice(0, 10);
const empty = () => ({
  category: "material",
  description: "",
  vendor: "",
  amount: "",
  tax_amount: "",
  incurred_on: today(),
});

export default function ProjectCostsPanel({
  projectId,
  canManage = true,
  onChanged,
}) {
  const [form, setForm] = useState(empty);
  const [receipt, setReceipt] = useState(null);
  const [show, setShow] = useState(!canManage);
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [upload, { loading: uploading }] = useUpload();
  const load = async () => {
    if (!canManage) return;
    try {
      const [costResponse, expenseResponse] = await Promise.all([
        fetch(`/api/job-costing?project_id=${projectId}`),
        fetch(`/api/project-expenses?project_id=${projectId}`),
      ]);
      const costs = await costResponse.json().catch(() => ({}));
      const rows = await expenseResponse.json().catch(() => ({}));
      if (!costResponse.ok || !expenseResponse.ok)
        throw new Error(
          costs.error || rows.error || "Could not load job costs",
        );
      setSummary(costs.summary);
      setExpenses(rows.expenses || []);
    } catch (cause) {
      setError(cause.message);
    }
  };
  useEffect(() => {
    load();
  }, [projectId, canManage]);
  const create = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      let receipt_url = null;
      if (receipt) {
        const result = await upload({ file: receipt });
        if (result.error) throw new Error(result.error);
        receipt_url = result.url;
      }
      const response = await fetch("/api/project-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, project_id: projectId, receipt_url }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || "Could not record expense");
      setForm(empty());
      setReceipt(null);
      if (canManage) {
        setShow(false);
        await load();
      }
      onChanged?.();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setSaving(false);
    }
  };
  const voidExpense = async (id) => {
    if (
      !window.confirm("Void this expense? The audit record will be retained.")
    )
      return;
    const response = await fetch("/api/project-expenses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "void" }),
    });
    if (response.ok) load();
    else setError("Could not void expense");
  };
  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <DollarSign size={18} className="text-green-600" />
            {canManage ? "Job costing" : "Record job expense"}
          </h3>
          <p className="text-sm text-slate-600">
            {canManage
              ? "Estimated cost, field actuals, commitments, billing, cash, and margin."
              : "Capture materials and other approved job costs with receipt evidence."}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setShow((value) => !value)}
            className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          >
            <Plus size={15} />
            Add expense
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {canManage && summary && (
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Contract value", summary.contract_value],
            ["Labor actual", summary.labor_actual],
            ["Other actual", summary.expense_actual],
            ["Actual cost", summary.actual_cost],
            ["Committed", summary.committed_cost],
            ["Projected cost", summary.projected_cost],
            ["Gross profit", summary.gross_profit],
            ["Gross margin", summary.gross_margin_percent, "%"],
            ["Projected profit", summary.projected_profit],
            ["Projected margin", summary.projected_margin_percent, "%"],
            ["Invoiced", summary.invoiced],
            ["Collected", summary.collected],
            ["Receivable", summary.receivable],
            ...(Number(summary.customer_credit) > 0
              ? [["Customer credit", summary.customer_credit]]
              : []),
          ].map(([label, value, suffix]) => (
            <div key={label} className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="font-bold text-slate-900">
                {suffix
                  ? `${Number(value || 0).toFixed(1)}${suffix}`
                  : money.format(Number(value || 0))}
              </p>
            </div>
          ))}
        </div>
      )}
      {show && (
        <form
          onSubmit={create}
          className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-2"
        >
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2"
          >
            <option value="material">Materials</option>
            <option value="subcontractor">Subcontractor</option>
            <option value="equipment">Equipment</option>
            <option value="travel">Travel</option>
            <option value="disposal">Disposal</option>
            <option value="permit">Permit</option>
            <option value="other">Other</option>
          </select>
          <input
            type="date"
            required
            value={form.incurred_on}
            onChange={(e) => setForm({ ...form, incurred_on: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            required
            minLength="3"
            maxLength="500"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What was purchased?"
            className="rounded-lg border border-slate-300 px-3 py-2 sm:col-span-2"
          />
          <input
            value={form.vendor}
            onChange={(e) => setForm({ ...form, vendor: e.target.value })}
            placeholder="Vendor"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="Amount before tax"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.tax_amount}
            onChange={(e) => setForm({ ...form, tax_amount: e.target.value })}
            placeholder="Tax amount"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setReceipt(e.target.files?.[0] || null)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2"
          />
          <div className="flex gap-2 sm:col-span-2">
            <button
              disabled={saving || uploading}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {(saving || uploading) && (
                <Loader2 size={15} className="animate-spin" />
              )}
              Record expense
            </button>
            {canManage && (
              <button
                type="button"
                onClick={() => setShow(false)}
                className="rounded-lg border border-slate-300 px-4 py-2"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
      {canManage && expenses.length > 0 && (
        <div className="mt-4 space-y-2">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm ${expense.status === "void" ? "border-slate-200 bg-slate-50 opacity-60" : "border-slate-200"}`}
            >
              <div>
                <strong>{expense.description}</strong>
                <p className="text-xs capitalize text-slate-500">
                  {expense.category} · {expense.vendor || "No vendor"} ·{" "}
                  {expense.incurred_on}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <strong>{money.format(Number(expense.total_amount))}</strong>
                {expense.receipt_url && (
                  <a
                    href={expense.receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-blue-700"
                  >
                    Receipt
                  </a>
                )}
                {expense.status === "recorded" && (
                  <button
                    type="button"
                    onClick={() => voidExpense(expense.id)}
                    className="text-xs font-semibold text-red-700"
                  >
                    Void
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
