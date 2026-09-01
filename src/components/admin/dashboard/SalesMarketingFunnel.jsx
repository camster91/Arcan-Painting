"use client";

import { useEffect, useState } from "react";

const money = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

export default function SalesMarketingFunnel() {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    setReport(null);
    fetch(`/api/sales-marketing-report?days=${days}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(data.error || "Could not load sales funnel");
        setReport(data);
      })
      .catch((cause) => setError(cause.message));
  }, [days]);
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">
            Sales and marketing funnel
          </h2>
          <p className="text-sm text-slate-600">
            Source-to-cleared-revenue performance with lost reasons.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            aria-label="Funnel period"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="365">1 year</option>
          </select>
          <a
            href={`/api/sales-marketing-report?days=${days}&format=csv`}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
          >
            Export CSV
          </a>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {!report && !error ? (
        <p className="mt-4 text-sm text-slate-500">Loading funnel…</p>
      ) : (
        report && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
              {[
                ["Leads", report.totals.leads],
                ["Qualified", report.totals.qualified],
                ["Estimates", report.totals.estimates],
                ["Won", report.totals.won],
                ["Close rate", `${report.totals.close_rate_percent ?? 0}%`],
                ["Cleared revenue", money.format(report.totals.revenue)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="font-bold text-slate-900">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="py-2">Source / campaign</th>
                    <th>Service</th>
                    <th>Leads</th>
                    <th>Won</th>
                    <th>Close</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {report.breakdown.slice(0, 8).map((row) => (
                    <tr
                      key={`${row.source}-${row.campaign}-${row.landing_page}-${row.service_type}`}
                      className="border-b border-slate-100"
                    >
                      <td className="py-2">
                        <strong>{row.source}</strong>
                        <span className="block text-xs text-slate-500">
                          {row.campaign}
                        </span>
                      </td>
                      <td>{row.service_type || "Unknown"}</td>
                      <td>{row.leads}</td>
                      <td>{row.won}</td>
                      <td>{row.close_rate_percent ?? 0}%</td>
                      <td>{money.format(Number(row.revenue))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {report.lost_reasons.length > 0 && (
              <p className="mt-3 text-xs text-slate-600">
                <strong>Lost reasons:</strong>{" "}
                {report.lost_reasons
                  .map((item) => `${item.reason} (${item.count})`)
                  .join(" · ")}
              </p>
            )}
          </>
        )
      )}
    </section>
  );
}
