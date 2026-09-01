"use client";

import { useEffect, useState } from "react";

const labels = {
  current: "Current",
  days_1_30: "1–30 days",
  days_31_60: "31–60 days",
  days_61_90: "61–90 days",
  days_90_plus: "90+ days",
};
const money = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

export default function ReceivableAging() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/financial-report")
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not load aging");
        setReport(data);
      })
      .catch((cause) => setError(cause.message));
  }, []);
  if (error)
    return (
      <p role="alert" className="mt-4 text-sm text-red-700">
        {error}
      </p>
    );
  if (!report)
    return (
      <p className="mt-4 text-sm text-slate-500">Loading receivable aging…</p>
    );
  return (
    <section className="mt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-slate-900">Receivable aging</h2>
          <p className="text-sm text-slate-600">
            Cleared-cash balance by invoice due date.
          </p>
        </div>
        <a
          href="/api/financial-report?format=csv"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
        >
          Download accounting CSV
        </a>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Object.entries(labels).map(([key, label]) => (
          <div
            key={key}
            className="rounded-lg border border-slate-200 bg-white p-3"
          >
            <p className="text-xs text-slate-500">{label}</p>
            <p className="font-bold text-slate-900">
              {money.format(Number(report.aging[key] || 0))}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
