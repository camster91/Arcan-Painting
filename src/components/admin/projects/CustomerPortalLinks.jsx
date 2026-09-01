"use client";

import { useEffect, useState } from "react";
import { Copy, Link2, ShieldX } from "lucide-react";

export default function CustomerPortalLinks({ leadId }) {
  const [links, setLinks] = useState([]); const [url, setUrl] = useState("");
  const [error, setError] = useState(""); const [working, setWorking] = useState(false);
  const load = async () => {
    const response = await fetch(`/api/admin/customer-portal-links?lead_id=${leadId}`); const data = await response.json().catch(() => ({}));
    if (response.ok) setLinks(data.links || []);
  };
  useEffect(() => { if (leadId) load(); }, [leadId]);
  const create = async () => {
    setWorking(true); setError(""); setUrl("");
    try { const response = await fetch("/api/admin/customer-portal-links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead_id: leadId, expires_days: 30 }) }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "Could not create link"); setUrl(data.portal_url); await load(); }
    catch (cause) { setError(cause.message); } finally { setWorking(false); }
  };
  const revoke = async (id) => {
    if (!window.confirm("Revoke this customer portal link?")) return;
    const response = await fetch("/api/admin/customer-portal-links", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (response.ok) load(); else setError("Could not revoke link");
  };
  const active = links.filter((link) => !link.revoked_at && new Date(link.expires_at) > new Date());
  return <section className="rounded-lg border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">Customer portal</h3><p className="text-sm text-slate-600">Securely share estimates, contracts, change orders, and invoices.</p></div><button type="button" disabled={working} onClick={create} className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"><Link2 size={16} />{working ? "Creating…" : "Create 30-day link"}</button></div>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}{url && <div className="mt-3 rounded-lg bg-green-50 p-3"><p className="text-sm font-semibold text-green-800">Copy this link now. It will not be shown again.</p><div className="mt-2 flex gap-2"><input readOnly value={url} className="min-w-0 flex-1 rounded border border-green-200 bg-white px-2 py-1 text-xs" /><button type="button" onClick={() => navigator.clipboard.writeText(url)} className="rounded bg-green-700 px-3 text-white" aria-label="Copy portal link"><Copy size={16} /></button></div></div>}<div className="mt-3 space-y-2">{active.length ? active.map((link) => <div key={link.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"><span>Expires {new Date(link.expires_at).toLocaleDateString("en-CA")}{link.last_used_at ? ` · last used ${new Date(link.last_used_at).toLocaleDateString("en-CA")}` : " · unused"}</span><button type="button" onClick={() => revoke(link.id)} className="flex items-center gap-1 font-semibold text-red-700"><ShieldX size={15} />Revoke</button></div>) : <p className="text-sm text-slate-500">No active portal links.</p>}</div></section>;
}
