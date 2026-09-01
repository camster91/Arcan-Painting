"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { CheckCircle2, FileCheck2, Loader2, ShieldCheck } from "lucide-react";

const money = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });
const date = (value) => value ? new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(new Date(value)) : "Not set";

function Card({ title, meta, children }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-3"><h3 className="text-lg font-bold text-slate-900">{title}</h3>{meta && <p className="text-sm text-slate-500">{meta}</p>}</div>{children}</article>;
}

export default function CustomerPortalPage() {
  const { token } = useParams();
  const [portal, setPortal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [names, setNames] = useState({});
  const [consents, setConsents] = useState({});

  const load = async () => {
    try {
      setError("");
      const response = await fetch(`/api/customer-portal/${encodeURIComponent(token)}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "This portal could not be loaded");
      setPortal(data);
    } catch (cause) { setError(cause.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [token]);

  const act = async (key, body) => {
    setWorking(key); setError("");
    try {
      const response = await fetch(`/api/customer-portal/${encodeURIComponent(token)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Your decision could not be saved");
      setPortal(data.portal);
    } catch (cause) { setError(cause.message); }
    finally { setWorking(""); }
  };

  if (loading) return <main className="min-h-screen bg-slate-50 grid place-items-center"><div className="flex items-center gap-3 text-slate-700"><Loader2 className="animate-spin" /> Loading your project portal…</div></main>;
  if (!portal) return <main className="min-h-screen bg-slate-50 grid place-items-center p-6"><div className="max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center"><h1 className="text-2xl font-bold text-slate-900">Portal unavailable</h1><p className="mt-3 text-slate-600">{error || "Ask Arcan Painting for a new secure link."}</p></div></main>;

  return <main className="min-h-screen bg-slate-50">
    <header className="bg-slate-950 text-white"><div className="mx-auto max-w-5xl px-5 py-8"><div className="flex items-center gap-3 text-amber-400"><ShieldCheck /><span className="font-semibold">Arcan Painting secure customer portal</span></div><h1 className="mt-3 text-3xl font-bold">Welcome, {portal.customer.name}</h1><p className="mt-2 text-slate-300">Review project documents and record decisions in one place.</p></div></header>
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-8">
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}

      <section aria-labelledby="estimates"><h2 id="estimates" className="mb-3 text-xl font-bold text-slate-900">Estimates</h2><div className="grid gap-4">{portal.estimates.length ? portal.estimates.map((estimate) => <Card key={estimate.id} title={estimate.project_title} meta={estimate.estimate_number}><p className="text-slate-700">{estimate.project_description}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-2xl font-bold text-slate-900">{money.format(Number(estimate.total_cost || 0))}</p><p className="text-sm text-slate-500">Valid until {date(estimate.valid_until)}</p></div>{estimate.status === "sent" ? <button disabled={working} onClick={() => window.confirm("Approve this estimate and authorize Arcan Painting to create the project?") && act(`estimate-${estimate.id}`, { action: "approve_estimate", id: estimate.id })} className="rounded-lg bg-green-600 px-4 py-3 font-semibold text-white disabled:opacity-60">{working === `estimate-${estimate.id}` ? "Saving…" : "Approve estimate"}</button> : <span className="flex items-center gap-2 font-semibold text-green-700"><CheckCircle2 size={18} /> Approved</span>}</div></Card>) : <p className="rounded-xl bg-white p-5 text-slate-600">No estimates are awaiting review.</p>}</div></section>

      <section aria-labelledby="contracts"><h2 id="contracts" className="mb-3 text-xl font-bold text-slate-900">Contracts</h2><div className="grid gap-4">{portal.contracts.length ? portal.contracts.map((contract) => <Card key={contract.id} title={contract.title} meta={contract.contract_number}><p className="whitespace-pre-wrap text-slate-700">{contract.scope_of_work || contract.description}</p><dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Contract value</dt><dd className="font-semibold">{money.format(Number(contract.total_amount || 0))}</dd></div><div><dt className="text-slate-500">Deposit</dt><dd className="font-semibold">{money.format(Number(contract.deposit_amount || 0))}</dd></div></dl><div className="mt-4 grid gap-3 text-sm"><details className="rounded-lg border border-slate-200 p-3"><summary className="cursor-pointer font-semibold">Terms and conditions</summary><p className="mt-2 whitespace-pre-wrap text-slate-700">{contract.terms_and_conditions || "No additional terms provided."}</p></details><details className="rounded-lg border border-slate-200 p-3"><summary className="cursor-pointer font-semibold">Payment terms</summary><p className="mt-2 whitespace-pre-wrap text-slate-700">{contract.payment_terms || "No additional payment terms provided."}</p></details><details className="rounded-lg border border-slate-200 p-3"><summary className="cursor-pointer font-semibold">Warranty</summary><p className="mt-2 whitespace-pre-wrap text-slate-700">{contract.warranty_terms || "No additional warranty terms provided."}</p></details></div>{["sent", "viewed"].includes(contract.status) ? <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4"><label className="block text-sm font-medium">Full legal name<input value={names[`contract-${contract.id}`] || ""} onChange={(e) => setNames({ ...names, [`contract-${contract.id}`]: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" /></label><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={Boolean(consents[contract.id])} onChange={(e) => setConsents({ ...consents, [contract.id]: e.target.checked })} className="mt-1" /><span>I have reviewed this contract and agree that typing my name constitutes my electronic signature.</span></label><button disabled={working || !consents[contract.id]} onClick={() => act(`contract-${contract.id}`, { action: "sign_contract", id: contract.id, signed_by_name: names[`contract-${contract.id}`], consent: consents[contract.id] })} className="rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50">Sign contract</button></div> : <p className="mt-4 flex items-center gap-2 font-semibold text-green-700"><FileCheck2 size={18} /> Signed by {contract.signed_by_name}</p>}</Card>) : <p className="rounded-xl bg-white p-5 text-slate-600">No contracts are available.</p>}</div></section>

      <section aria-labelledby="changes"><h2 id="changes" className="mb-3 text-xl font-bold text-slate-900">Change orders</h2><div className="grid gap-4">{portal.change_orders.length ? portal.change_orders.map((order) => <Card key={order.id} title={order.title} meta={order.change_order_number}><p className="text-slate-700">{order.description}</p><p className="mt-3 font-bold">{money.format(Number(order.total_amount || 0))} · {order.schedule_impact_days || 0} schedule days</p>{order.status === "sent" ? <div className="mt-4 space-y-3"><input aria-label="Full name for change order decision" placeholder="Your full name" value={names[`change-${order.id}`] || ""} onChange={(e) => setNames({ ...names, [`change-${order.id}`]: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" /><div className="flex gap-2"><button disabled={working} onClick={() => act(`change-${order.id}`, { action: "decide_change_order", id: order.id, decision: "approved", signed_by_name: names[`change-${order.id}`] })} className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white">Approve</button><button disabled={working} onClick={() => act(`change-${order.id}`, { action: "decide_change_order", id: order.id, decision: "rejected", signed_by_name: names[`change-${order.id}`] })} className="rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-700">Decline</button></div></div> : <p className="mt-3 font-semibold capitalize text-slate-700">{order.status}</p>}</Card>) : <p className="rounded-xl bg-white p-5 text-slate-600">No change orders are available.</p>}</div></section>

      <section aria-labelledby="updates"><h2 id="updates" className="mb-3 text-xl font-bold text-slate-900">Project updates</h2><div className="grid gap-4">{portal.project_updates.length ? portal.project_updates.map((update) => <Card key={update.id} title={update.is_milestone ? (update.milestone_description || "Project milestone") : update.project_name} meta={date(update.report_date)}><p className="whitespace-pre-wrap text-slate-700">{update.work_description}</p>{update.progress_percentage != null && <div className="mt-4"><div className="mb-1 flex justify-between text-sm"><span>Reported progress</span><strong>{update.progress_percentage}%</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-amber-500" style={{ width: `${Math.max(0, Math.min(100, Number(update.progress_percentage)))}%` }} /></div></div>}{Array.isArray(update.photos) && update.photos.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{update.photos.map((photo, index) => <a key={`${update.id}-${index}`} href={photo} target="_blank" rel="noreferrer"><img src={photo} alt={`Project update ${index + 1}`} className="aspect-video w-full rounded-lg object-cover" loading="lazy" /></a>)}</div>}</Card>) : <p className="rounded-xl bg-white p-5 text-slate-600">No project updates have been shared yet.</p>}</div></section>

      <section aria-labelledby="invoices"><h2 id="invoices" className="mb-3 text-xl font-bold text-slate-900">Invoices</h2><div className="grid gap-4 sm:grid-cols-2">{portal.invoices.length ? portal.invoices.map((invoice) => <Card key={invoice.id} title={invoice.title || invoice.invoice_number} meta={invoice.invoice_number}><p className="text-2xl font-bold">{money.format(Number(invoice.total_amount || 0))}</p><p className="mt-1 text-sm text-slate-600">Due {date(invoice.due_date)} · <span className="capitalize">{invoice.payment_status}</span></p>{Number(invoice.amount_due || 0) > 0 && <p className="mt-2 font-semibold text-amber-700">Balance {money.format(Number(invoice.amount_due))}</p>}</Card>) : <p className="rounded-xl bg-white p-5 text-slate-600">No invoices are available.</p>}</div></section>

      <section aria-labelledby="receipts"><h2 id="receipts" className="mb-3 text-xl font-bold text-slate-900">Payment receipts</h2><div className="grid gap-4 sm:grid-cols-2">{portal.payments.length ? portal.payments.map((payment) => <Card key={payment.id} title={money.format(Number(payment.amount || 0))} meta={payment.payment_number}><p className="text-sm text-slate-600">Received {date(payment.payment_date || payment.created_at)}</p><p className="mt-1 text-sm capitalize text-slate-600">{String(payment.payment_method || "Payment").replaceAll("_", " ")} · cleared</p></Card>) : <p className="rounded-xl bg-white p-5 text-slate-600">No cleared payments are available.</p>}</div></section>
    </div>
  </main>;
}
