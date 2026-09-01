"use client";

import { useEffect, useState } from "react";
import { Image, RefreshCw, Save, ShieldCheck } from "lucide-react";

const statuses = ["draft", "review", "approved"];

export default function PortfolioAdminPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/gallery", { credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load portfolio items");
      setItems(data.items || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateLocal = (id, field, value) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const save = async (item) => {
    setSavingId(item.id);
    setMessage("");
    try {
      const payload = {
        id: item.id,
        title: item.title,
        alt_text: item.alt_text,
        category: item.category,
        case_study_summary: item.case_study_summary || "",
        publication_status: item.publication_status,
        customer_consent_confirmed: Boolean(item.customer_consent_confirmed),
        business_proof_confirmed: Boolean(item.business_proof_confirmed),
        visible: Boolean(item.visible),
        sort_order: Number(item.sort_order) || 0,
      };
      const response = await fetch("/api/admin/gallery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save portfolio item");
      setItems((current) => current.map((entry) => entry.id === item.id ? data.item : entry));
      setMessage(`Saved ${data.item.title}.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-3 bg-amber-50 rounded-lg"><Image className="w-6 h-6 text-amber-700" /></span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Portfolio approval</h1>
              <p className="text-sm text-slate-600">Prepare credible project proof before it appears on the public site.</p>
            </div>
          </div>
        </div>
        <button type="button" onClick={load} disabled={loading} className="min-h-11 px-4 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 flex items-center justify-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3 text-sm text-blue-950">
        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
        <p>Publication is blocked until customer consent and business proof are both confirmed. Approval records who approved the item; publishing is a separate, explicit control.</p>
      </div>

      {message && <div role="status" className="mb-5 p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700">{message}</div>}
      {loading ? <p className="text-slate-600">Loading portfolio items…</p> : items.length === 0 ? (
        <div className="p-8 bg-white border border-slate-200 rounded-xl text-center">
          <p className="font-medium text-slate-900">No managed portfolio items yet</p>
          <p className="text-sm text-slate-600 mt-1">Import or create gallery metadata through the approved media intake before publication.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {items.map((item) => (
            <section key={item.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-5">
                <img src={`/gallery/thumbnails/${item.filename.replace(".webp", "_thumb.webp")}`} alt="" className="w-full h-40 object-cover rounded-lg bg-slate-100" />
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="text-sm font-medium text-slate-700">Title<input value={item.title || ""} onChange={(e) => updateLocal(item.id, "title", e.target.value)} className="mt-1 w-full min-h-11 px-3 border border-slate-300 rounded-lg" /></label>
                    <label className="text-sm font-medium text-slate-700">Status<select value={item.publication_status || "draft"} onChange={(e) => updateLocal(item.id, "publication_status", e.target.value)} className="mt-1 w-full min-h-11 px-3 border border-slate-300 rounded-lg">{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
                  </div>
                  <label className="block text-sm font-medium text-slate-700">Accessible image description<input value={item.alt_text || ""} onChange={(e) => updateLocal(item.id, "alt_text", e.target.value)} className="mt-1 w-full min-h-11 px-3 border border-slate-300 rounded-lg" /></label>
                  <label className="block text-sm font-medium text-slate-700">Case-study summary<textarea rows={3} value={item.case_study_summary || ""} onChange={(e) => updateLocal(item.id, "case_study_summary", e.target.value)} className="mt-1 w-full p-3 border border-slate-300 rounded-lg" /></label>
                  <div className="grid sm:grid-cols-3 gap-3 text-sm">
                    <label className="flex gap-2 items-start"><input type="checkbox" checked={Boolean(item.customer_consent_confirmed)} onChange={(e) => updateLocal(item.id, "customer_consent_confirmed", e.target.checked)} className="mt-1" /> Customer consent confirmed</label>
                    <label className="flex gap-2 items-start"><input type="checkbox" checked={Boolean(item.business_proof_confirmed)} onChange={(e) => updateLocal(item.id, "business_proof_confirmed", e.target.checked)} className="mt-1" /> Claims and project proof confirmed</label>
                    <label className="flex gap-2 items-start"><input type="checkbox" checked={Boolean(item.visible)} onChange={(e) => updateLocal(item.id, "visible", e.target.checked)} className="mt-1" /> Publish on public site</label>
                  </div>
                  <div className="flex justify-end"><button type="button" onClick={() => save(item)} disabled={savingId === item.id} className="min-h-11 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-60 flex items-center gap-2"><Save className="w-4 h-4" />{savingId === item.id ? "Saving…" : "Save review"}</button></div>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
