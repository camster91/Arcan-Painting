"use client";

import { useEffect, useState } from "react";

const money = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

export default function PortfolioMarginReport() {
  const [days, setDays] = useState("90");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setReport(null);
    setError("");
    fetch(`/api/job-margin-report?days=${days}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.status === 403) {
          setReport({ forbidden: true });
          return;
        }
        if (!response.ok)
          throw new Error(data.error || "Could not load portfolio margin");
        setReport(data);
      })
      .catch((cause) => setError(cause.message));
  }, [days]);

  if (report?.forbidden) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Portfolio margin</h2>
          <p className="text-sm text-slate-600">
            Reconciled job value, actuals, commitments, billing, and cash.
          </p>
        </div>
        <select
          aria-label="Portfolio margin period"
          value={days}
          onChange={(event) => setDays(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="30">30 days</option>
          <option value="90">90 days</option>
          <option value="365">1 year</option>
          <option value="all">All projects</option>
        </select>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {!report && !error && (
        <p className="mt-4 text-sm text-slate-500">Loading margins…</p>
      )}
      {report && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
            {[
              ["Contract value", money.format(report.totals.contract_value)],
              ["Actual cost", money.format(report.totals.actual_cost)],
              ["Committed", money.format(report.totals.committed_cost)],
              [
                "Projected margin",
                report.totals.projected_margin_percent == null
                  ? "—"
                  : `${report.totals.projected_margin_percent}%`,
              ],
              ["Receivable", money.format(report.totals.receivable)],
              ["Collected", money.format(report.totals.collected)],
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
                  <th className="py-2">Job</th>
                  <th>Value</th>
                  <th>Actual + committed</th>
                  <th>Projected margin</th>
                  <th>Receivable</th>
                </tr>
              </thead>
              <tbody>
                {report.projects.slice(0, 10).map((project) => {
                  const atRisk =
                    project.projected_margin_percent != null &&
                    project.projected_margin_percent < 25;
                  return (
                    <tr key={project.id} className="border-b border-slate-100">
                      <td className="py-2">
                        <a
                          className="font-semibold text-slate-900 underline-offset-2 hover:underline"
                          href={`/admin/projects?project=${project.id}`}
                        >
                          {project.project_name}
                        </a>
                        <span className="block text-xs text-slate-500">
                          {project.status}
                        </span>
                      </td>
                      <td>{money.format(project.contract_value)}</td>
                      <td>{money.format(project.projected_cost)}</td>
                      <td
                        className={
                          atRisk
                            ? "font-semibold text-red-700"
                            : "text-slate-700"
                        }
                      >
                        {project.projected_margin_percent == null
                          ? "—"
                          : `${project.projected_margin_percent}%`}
                      </td>
                      <td>{money.format(project.receivable)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {report.projects.length === 0 && (
            <p className="mt-4 text-sm text-slate-500">
              No projects in this period.
            </p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Jobs below 25% projected gross margin are highlighted for review.
          </p>
        </>
      )}
    </section>
  );
}
