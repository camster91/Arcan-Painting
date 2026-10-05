"use client";

import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

const money = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });
const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", dateStyle: "medium", timeStyle: "short" });
const groups = { sales: ["lead", "appointment", "follow_up", "estimate", "contract"], jobs: ["project"], billing: ["invoice", "payment"], communications: ["email"] };

export default function CustomerTimeline({ leadId }) {
  const headingId = useId();
  const filterId = useId();
  const [filter, setFilter] = useState("all");
  // Separate keys prevent a late response showing another customer's history;
  // consuming signal also cancels inactive fetches. TanStack Query v5 docs:
  // https://tanstack.com/query/v5/docs/framework/react/guides/query-cancellation
  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: ["customer-timeline", leadId],
    enabled: Boolean(leadId),
    retry: false,
    gcTime: 0,
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/leads/${leadId}/timeline`, { signal, cache: "no-store" });
      if (!response.ok) throw new Error("Could not load customer activity. Please try again.");
      return response.json();
    },
  });
  const events = (error ? [] : data?.events || []).filter((event) => filter === "all" || groups[filter].includes(event.event_type));
  return (
    <section aria-labelledby={headingId} aria-busy={isFetching} className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={headingId} className="text-lg font-semibold text-slate-900">Customer activity</h3>
          <p className="text-sm text-slate-600">Internal staff history · times in Toronto</p>
        </div>
        <button type="button" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh customer activity" className="shrink-0 min-h-11 min-w-11 rounded-lg border border-slate-300 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-amber-600 disabled:opacity-50">
          <RefreshCw size={18} aria-hidden="true" />
        </button>
      </div>
      <p className="text-xs text-slate-500">Recorded milestones only. This is not a complete change log; older unlinked emails and manual notes are not included.</p>
      <div>
        <label htmlFor={filterId} className="block text-sm font-medium text-slate-700 mb-1">Activity type</label>
        <select id={filterId} value={filter} onChange={(event) => setFilter(event.target.value)} className="w-full min-h-11 rounded-lg border border-slate-300 px-3 text-sm">
          <option value="all">All activity</option><option value="sales">Sales</option><option value="jobs">Jobs</option><option value="billing">Billing</option><option value="communications">Communications</option>
        </select>
      </div>
      {isPending && <p role="status" className="text-sm text-slate-600">Loading customer activity…</p>}
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error.message}</div>}
      {!isPending && !error && events.length === 0 && <p className="text-sm text-slate-600">No recorded activity for this selection.</p>}
      {data?.truncated && <p role="status" className="text-sm text-amber-800">Showing the latest 200 recorded events. Filters apply to these events.</p>}
      <ol className="space-y-3">
        {events.map((event) => {
          const timestamp = new Date(event.occurred_at);
          const validDate = Number.isFinite(timestamp.getTime());
          return <li key={event.id} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
            <p className="font-medium text-slate-900 break-words">{event.title}</p>
            {validDate && <time dateTime={timestamp.toISOString()} className="block text-xs text-slate-500">{date.format(timestamp)}</time>}
            {event.detail && <p className="text-sm text-slate-600 break-words">{event.detail}</p>}
            <p className="text-xs text-slate-500">{event.actor ? `Recorded by staff #${event.actor.user_id}` : "Actor not recorded"} · Internal only</p>
            {event.delivery_status && <p className={`text-sm font-medium ${event.delivery_status === "failed" ? "text-red-800" : "text-slate-700"}`}>Delivery status: {event.delivery_status}</p>}
            {event.amount != null && Number.isFinite(Number(event.amount)) && <p className="text-sm font-medium text-slate-800">Current record amount: {money.format(Number(event.amount))}</p>}
          </li>;
        })}
      </ol>
    </section>
  );
}
