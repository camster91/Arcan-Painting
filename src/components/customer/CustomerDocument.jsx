/** Shared frame for the customer estimate (/e/…) and invoice (/i/…) pages. */

export const money = (v) =>
  `$${Number(v || 0).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const longDate = (v) =>
  v ? new Date(`${String(v).slice(0, 10)}T12:00:00`).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }) : "";

export function CustomerDocument({ company, children }) {
  return (
    <div className="min-h-screen bg-stone-100 text-slate-900">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <img src={company?.logo_url || "/logo.png"} alt={company?.name || "Arcan Painting"} className="h-10 w-auto" />
          <div className="text-right text-sm text-slate-600 leading-tight">
            {company?.phone && <div>{company.phone}</div>}
            {company?.email && <div>{company.email}</div>}
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">{children}</main>
      <footer className="max-w-3xl mx-auto px-4 pb-10 text-xs text-slate-500">
        {[company?.name, company?.address].filter(Boolean).join(" · ")}
      </footer>
    </div>
  );
}

export function Card({ children, className = "" }) {
  return <section className={`bg-white rounded-2xl border border-stone-200 p-5 sm:p-7 ${className}`}>{children}</section>;
}

export function TotalsTable({ rows }) {
  return (
    <table className="w-full text-sm tabular-nums">
      <tbody>
        {rows.filter(Boolean).map(([label, value, strong]) => (
          <tr key={label} className={strong ? "border-t border-stone-200" : ""}>
            <td className={`py-1.5 ${strong ? "font-semibold pt-3" : "text-slate-600"}`}>{label}</td>
            <td className={`py-1.5 text-right ${strong ? "font-bold text-lg pt-3" : ""}`}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function LoadState({ error }) {
  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
      <p className={error ? "text-red-700" : "text-slate-600"}>{error || "Loading…"}</p>
    </div>
  );
}
