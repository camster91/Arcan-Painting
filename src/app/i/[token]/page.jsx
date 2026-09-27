import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { CheckCircle2, Copy, CreditCard } from "lucide-react";
import { CustomerDocument, Card, TotalsTable, LoadState, money, longDate } from "@/components/customer/CustomerDocument";

// Customer view of an invoice: what's owed, and how to pay it.
export default function CustomerInvoicePage() {
  const { token } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [justPaid, setJustPaid] = useState(false);

  useEffect(() => {
    setJustPaid(new URLSearchParams(window.location.search).has("paid"));
    fetch(`/api/public/invoice?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "This invoice could not be loaded.");
        setInvoice(data.invoice);
        document.title = `Invoice ${data.invoice.invoice_number} · ${data.invoice.company.name}`;
      })
      .catch((e) => setLoadError(e.message));
  }, [token]);

  const payByCard = async () => {
    setPaying(true);
    setError(null);
    try {
      const res = await fetch("/api/public/invoice/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Card payment could not be started.");
      window.location.assign(data.url);
    } catch (err) {
      setError(err.message);
      setPaying(false);
    }
  };

  const copyEmail = async (email) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the address stays visible to copy by hand.
    }
  };

  if (!invoice) return <LoadState error={loadError} />;
  const i = invoice;
  const due = i.status === "due";

  return (
    <CustomerDocument company={i.company}>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-amber-700 tracking-wide uppercase">Invoice {i.invoice_number}</p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1 text-balance">{i.title}</h1>
          </div>
          <StatusPill status={i.status} overdue={i.overdue} />
        </div>
        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div><dt className="text-slate-500">Billed to</dt><dd className="font-medium">{i.customer_name || "—"}</dd></div>
          <div><dt className="text-slate-500">Issued</dt><dd className="font-medium">{longDate(i.issue_date)}</dd></div>
          <div><dt className="text-slate-500">Due</dt><dd className={`font-medium ${i.overdue ? "text-red-700" : ""}`}>{longDate(i.due_date)}</dd></div>
        </dl>
      </Card>

      <Card>
        <ul className="divide-y divide-stone-100 text-sm mb-4">
          {i.items.map((item, n) => (
            <li key={n} className="py-2 flex justify-between gap-4">
              <span className="text-slate-700">{item.description}</span>
              <span className="tabular-nums">{money(item.line_total)}</span>
            </li>
          ))}
        </ul>
        <TotalsTable rows={[
          ["Subtotal", money(i.subtotal)],
          [`HST (${Number(i.tax_rate)}%)`, money(i.tax_amount)],
          ["Total", money(i.total_amount)],
          Number(i.amount_paid) > 0 && ["Paid", `− ${money(i.amount_paid)}`],
          ["Amount due", money(i.status === "void" ? 0 : i.amount_due), true],
        ]} />
      </Card>

      {justPaid && due && (
        <Card className="border-green-300 bg-green-50">
          <p className="text-green-900 text-sm">Thank you. Your card payment is being confirmed and this page will show it as paid shortly.</p>
        </Card>
      )}

      {i.status === "paid" && (
        <Card className="border-green-300 bg-green-50">
          <p className="flex items-center gap-2 font-semibold text-green-800"><CheckCircle2 size={20} /> Paid in full. Thank you!</p>
        </Card>
      )}

      {due && (
        <Card>
          <h2 className="font-semibold">How to pay {money(i.amount_due)}</h2>
          {error && <p role="alert" className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
          <div className={`mt-4 grid gap-4 ${i.card_payments ? "sm:grid-cols-2" : ""}`}>
            {i.company.etransfer_email && (
              <div className="rounded-xl border border-stone-200 p-4">
                <h3 className="font-medium">Interac e-Transfer</h3>
                <p className="mt-1 text-sm text-slate-600">Send {money(i.amount_due)} to:</p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="text-sm bg-stone-100 rounded px-2 py-1 select-all break-all">{i.company.etransfer_email}</code>
                  <button type="button" onClick={() => copyEmail(i.company.etransfer_email)} className="p-2 rounded-lg hover:bg-stone-100" aria-label="Copy e-transfer email">
                    <Copy size={16} />
                  </button>
                  {copied && <span className="text-xs text-green-700">Copied</span>}
                </div>
                <p className="mt-2 text-sm text-slate-600">Put <strong>{i.invoice_number}</strong> in the message.</p>
                {i.company.etransfer_instructions && (
                  <p className="mt-2 text-xs text-slate-500 whitespace-pre-wrap">{i.company.etransfer_instructions}</p>
                )}
              </div>
            )}
            {i.card_payments && (
              <div className="rounded-xl border border-stone-200 p-4 flex flex-col">
                <h3 className="font-medium">Credit or debit card</h3>
                <p className="mt-1 text-sm text-slate-600">Pay securely through Stripe.</p>
                <button
                  type="button"
                  onClick={payByCard}
                  disabled={paying}
                  className="mt-4 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold disabled:opacity-50"
                >
                  <CreditCard size={18} /> {paying ? "Opening checkout…" : `Pay ${money(i.amount_due)} by card`}
                </button>
              </div>
            )}
          </div>
          {!i.company.etransfer_email && !i.card_payments && (
            <p className="mt-3 text-sm text-slate-600">Please contact us{i.company.phone ? ` at ${i.company.phone}` : ""} to arrange payment.</p>
          )}
        </Card>
      )}

      {i.status === "void" && (
        <Card><p className="text-slate-700">This invoice has been cancelled. Nothing is owed on it.</p></Card>
      )}
    </CustomerDocument>
  );
}

function StatusPill({ status, overdue }) {
  const [label, cls] =
    status === "paid" ? ["Paid", "bg-green-100 text-green-800"]
    : status === "void" ? ["Cancelled", "bg-stone-200 text-stone-700"]
    : overdue ? ["Overdue", "bg-red-100 text-red-800"]
    : ["Due", "bg-amber-100 text-amber-800"];
  return <span className={`text-sm font-semibold rounded-full px-3 py-1 ${cls}`}>{label}</span>;
}
