import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { CheckCircle2 } from "lucide-react";
import { CustomerDocument, Card, TotalsTable, LoadState, money, longDate } from "@/components/customer/CustomerDocument";

// Customer view of an estimate, reached from the emailed or copied link.
export default function CustomerEstimatePage() {
  const { token } = useParams();
  const [estimate, setEstimate] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/public/estimate?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "This estimate could not be loaded.");
        setEstimate(data.estimate);
        document.title = `Estimate ${data.estimate.estimate_number} · ${data.estimate.company.name}`;
      })
      .catch((e) => setLoadError(e.message));
  }, [token]);

  const accept = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/public/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not accept the estimate.");
      setEstimate(data.estimate);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!estimate) return <LoadState error={loadError} />;
  const e = estimate;

  return (
    <CustomerDocument company={e.company}>
      <Card>
        <p className="text-sm font-medium text-amber-700 tracking-wide uppercase">Estimate {e.estimate_number}</p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1 text-balance">{e.project_title}</h1>
        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div><dt className="text-slate-500">Prepared for</dt><dd className="font-medium">{e.customer_name || "—"}</dd></div>
          <div><dt className="text-slate-500">Issued</dt><dd className="font-medium">{longDate(e.issued)}</dd></div>
          {e.valid_until && <div><dt className="text-slate-500">Valid until</dt><dd className="font-medium">{longDate(e.valid_until)}</dd></div>}
        </dl>
        {e.customer_address && <p className="mt-3 text-sm text-slate-600">{e.customer_address}</p>}
      </Card>

      {(e.project_description || e.areas.length > 0 || e.notes) && (
        <Card>
          <h2 className="font-semibold mb-2">Scope of work</h2>
          {e.project_description && <p className="text-slate-700 whitespace-pre-wrap">{e.project_description}</p>}
          {e.areas.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {e.areas.map((a) => <li key={a} className="text-sm bg-stone-100 rounded-full px-3 py-1">{a}</li>)}
            </ul>
          )}
          {e.notes && <p className="mt-3 text-sm text-slate-600 whitespace-pre-wrap">{e.notes}</p>}
        </Card>
      )}

      <Card>
        <h2 className="font-semibold mb-2">Price</h2>
        <TotalsTable rows={[
          ["Painting work", money(e.subtotal)],
          ["HST (13%)", money(e.tax_amount)],
          ["Total", money(e.total_amount), true],
        ]} />
        {e.deposit_pct > 0 && (
          <p className="mt-3 text-sm text-slate-600">
            A {e.deposit_pct}% deposit ({money(e.deposit_amount)} incl. HST) confirms your start date. The balance is due when the work is done.
          </p>
        )}
        {e.company.estimate_terms && (
          <p className="mt-4 text-xs text-slate-500 whitespace-pre-wrap">{e.company.estimate_terms}</p>
        )}
      </Card>

      {e.status === "accepted" ? (
        <Card className="border-green-300 bg-green-50">
          <p className="flex items-center gap-2 font-semibold text-green-800"><CheckCircle2 size={20} /> Estimate accepted</p>
          <p className="mt-1 text-sm text-green-900">
            {e.accepted_name ? `Accepted by ${e.accepted_name}` : "Accepted"}
            {e.accepted_at ? ` on ${longDate(e.accepted_at)}` : ""}. We'll be in touch to book your start date.
          </p>
        </Card>
      ) : e.status === "open" ? (
        <Card>
          <h2 className="font-semibold">Accept this estimate</h2>
          <form onSubmit={accept} className="mt-3 space-y-3">
            {error && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
            <label className="block">
              <span className="block text-sm text-slate-700 mb-1">Your full name</span>
              <input
                id="accept-name"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                autoComplete="name"
                className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                required
              />
            </label>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input id="accept-agree" type="checkbox" checked={agreed} onChange={(ev) => setAgreed(ev.target.checked)} className="mt-1" />
              <span>I accept this estimate of {money(e.total_amount)} and its terms.</span>
            </label>
            <button
              type="submit"
              disabled={submitting || !agreed || name.trim().length < 2}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold disabled:opacity-50"
            >
              {submitting ? "Accepting…" : "Accept estimate"}
            </button>
          </form>
        </Card>
      ) : (
        <Card>
          <p className="text-slate-700">
            This estimate is {e.status}. Please contact us{e.company.phone ? ` at ${e.company.phone}` : ""} for an updated quote.
          </p>
        </Card>
      )}
    </CustomerDocument>
  );
}
