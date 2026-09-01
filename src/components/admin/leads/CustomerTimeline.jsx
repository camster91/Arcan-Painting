"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, FileText, Mail, Paintbrush, ReceiptText, RefreshCw } from "lucide-react";

const icons = {
  lead: Paintbrush,
  appointment: CalendarDays,
  follow_up: Clock3,
  estimate: FileText,
  contract: FileText,
  project: Paintbrush,
  invoice: ReceiptText,
  payment: CircleDollarSign,
  email: Mail,
};

const money = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

export default function CustomerTimeline({ leadId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/leads/${leadId}/timeline`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load activity");
      setEvents(data.events || []);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [leadId]);

  return (
    <section aria-labelledby="customer-timeline-title" className="space-y-3">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div>
          <h3 id="customer-timeline-title" className="text-lg font-semibold text-slate-900">Customer activity</h3>
          <p className="text-xs text-slate-500">Sales, job, billing, and delivery history in one timeline.</p>
        </div>
        <button type="button" onClick={load} disabled={loading} aria-label="Refresh customer activity" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"><RefreshCw size={17} className={loading ? "animate-spin" : ""} /></button>
      </div>

      {error && <div role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</div>}
      {!loading && !error && events.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No activity has been recorded yet.</p>}
      <ol className="space-y-3">
        {events.map((event) => {
          const Icon = icons[event.event_type] || CheckCircle2;
          return (
            <li key={`${event.event_type}-${event.entity_id}-${event.occurred_at}`} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3">
              <span className="mt-0.5 rounded-full bg-amber-50 p-2 text-amber-700"><Icon size={16} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium text-slate-900">{event.title}</p>
                  <time className="text-xs text-slate-500" dateTime={event.occurred_at}>{new Date(event.occurred_at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</time>
                </div>
                {event.detail && <p className="mt-1 break-words text-sm text-slate-600">{event.detail}</p>}
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {event.status && <span className="rounded-full bg-slate-100 px-2 py-1 font-medium capitalize text-slate-700">{String(event.status).replaceAll("_", " ")}</span>}
                  {event.amount !== null && event.amount !== undefined && <span className="rounded-full bg-green-50 px-2 py-1 font-semibold text-green-800">{money.format(Number(event.amount))}</span>}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
