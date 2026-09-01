"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, FilePlus2, Loader2, XCircle } from "lucide-react";

const money = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });
const emptyForm = { title: "", description: "", reason: "", amount: "", tax_rate: "13", schedule_impact_days: "0", notes: "" };

export default function ChangeOrdersPanel({ project, onChanged, canManage = true }) {
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true); setError("");
      const response = await fetch(`/api/change-orders?project_id=${project.id}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load change orders");
      setOrders(data.change_orders || []);
    } catch (caught) { setError(caught.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [project.id]);

  const totalApproved = useMemo(() => orders.filter((order) => order.status === "approved").reduce((sum, order) => sum + Number(order.total_amount || 0), 0), [orders]);
  const preview = useMemo(() => {
    const amount = Number(form.amount) || 0; const tax = amount * ((Number(form.tax_rate) || 0) / 100);
    return { tax, total: amount + tax };
  }, [form.amount, form.tax_rate]);

  const create = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch("/api/change-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, project_id: project.id }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not create change order");
      setForm(emptyForm); setShowForm(false); await load(); onChanged?.();
    } catch (caught) { setError(caught.message); }
    finally { setSaving(false); }
  };

  const transition = async (order, status) => {
    const verb = status === "approved" ? "record this change order as approved and add it to project value" : `${status} this change order`;
    if (!window.confirm(`Are you sure you want to ${verb}?`)) return;
    try {
      setError("");
      const response = await fetch("/api/change-orders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: order.id, status }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not update change order");
      await load(); onChanged?.();
    } catch (caught) { setError(caught.message); }
  };

  return (
    <section className="rounded-lg border border-slate-200 p-4" aria-labelledby="change-orders-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 id="change-orders-title" className="font-semibold text-slate-900">Change orders</h3><p className="text-sm text-slate-600">Control additional scope, price, tax, and schedule impact.</p></div>
        <div className="flex items-center gap-3"><span className="text-sm font-semibold text-green-700">Approved: {money.format(totalApproved)}</span>{canManage && <button type="button" onClick={() => setShowForm((value) => !value)} className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600"><FilePlus2 size={16} /> New change</button>}</div>
      </div>
      {error && <div role="alert" className="mt-3 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle size={17} />{error}</div>}

      {canManage && showForm && (
        <form onSubmit={create} className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700 md:col-span-2">Title *<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">Additional scope *<textarea required rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">Reason<input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" placeholder="Customer request, concealed damage…" /></label>
          <label className="text-sm font-medium text-slate-700">Schedule impact (days)<input type="number" min="0" max="365" value={form.schedule_impact_days} onChange={(e) => setForm({ ...form, schedule_impact_days: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">Amount before HST *<input required type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">HST rate (%)<input type="number" min="0" max="100" step="0.01" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" /></label>
          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-700">HST {money.format(preview.tax)} · <strong>Total {money.format(preview.total)}</strong></p><div className="flex gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Cancel</button><button disabled={saving} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving && <Loader2 size={16} className="animate-spin" />}Save draft</button></div></div>
        </form>
      )}

      {loading ? <p className="mt-4 text-sm text-slate-500">Loading change orders…</p> : orders.length === 0 ? <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No change orders recorded.</p> : (
        <div className="mt-4 space-y-3">{orders.map((order) => <article key={order.id} className="rounded-lg border border-slate-200 p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold text-slate-900">{order.title}</h4><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-700">{order.status}</span></div><p className="text-xs text-slate-500">{order.change_order_number}</p></div><div className="text-right"><p className="font-bold text-slate-900">{money.format(Number(order.total_amount))}</p><p className="text-xs text-slate-500">+{order.schedule_impact_days || 0} schedule days</p></div></div><p className="mt-2 text-sm text-slate-700">{order.description}</p>{canManage && <div className="mt-3 flex flex-wrap gap-2">{order.status === "draft" && <button type="button" onClick={() => transition(order, "sent")} className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-700">Record as sent</button>}{["draft", "sent"].includes(order.status) && <button type="button" onClick={() => transition(order, "approved")} className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white"><CheckCircle2 size={14} />Record approval</button>}{order.status === "sent" && <button type="button" onClick={() => transition(order, "rejected")} className="flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700"><XCircle size={14} />Rejected</button>}{order.status !== "void" && <button type="button" onClick={() => transition(order, "void")} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600">Void</button>}</div>}</article>)}</div>
      )}
    </section>
  );
}
