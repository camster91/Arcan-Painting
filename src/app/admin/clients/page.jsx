"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Search, Mail, Phone, MapPin, ChevronRight, X } from "lucide-react";

const money = (v) =>
  `$${Number(v || 0).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (v) => (v ? new Date(v).toLocaleDateString("en-CA") : "—");

async function getJson(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["customers", search.trim()],
    queryFn: () => getJson(`/api/customers?search=${encodeURIComponent(search.trim())}`),
  });
  const customers = data?.customers || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Users size={22} /> Customers
              </h1>
              <p className="text-slate-600">
                Created when you approve an estimate or mark a lead as Won.
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm"
            >
              Refresh
            </button>
          </div>

          <div className="mt-4 relative max-w-md">
            <Search size={18} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="customer-search"
              aria-label="Search customers"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or phone"
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-slate-600">Loading…</div>
        ) : error ? (
          <div className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error.message}</div>
        ) : customers.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-600">
            {search.trim() ? "No customers match that search." : "No customers yet."}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left">
                <tr>
                  <th className="py-3 px-4 font-medium">Customer</th>
                  <th className="py-3 px-4 font-medium">Contact</th>
                  <th className="py-3 px-4 font-medium text-right">Jobs</th>
                  <th className="py-3 px-4 font-medium text-right">Invoiced</th>
                  <th className="py-3 px-4 font-medium text-right">Owing</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-amber-50/40 cursor-pointer" onClick={() => setOpenId(c.id)}>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{c.name}</div>
                      {c.address && <div className="text-slate-500 truncate max-w-xs">{c.address}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>{c.email || "—"}</div>
                      <div className="text-slate-500">{c.phone || ""}</div>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">{Number(c.job_count)}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{money(c.invoiced_total)}</td>
                    <td className={`py-3 px-4 text-right tabular-nums ${Number(c.balance_due) > 0 ? "text-red-700 font-medium" : "text-slate-500"}`}>
                      {money(c.balance_due)}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      <button aria-label={`Open ${c.name}`} onClick={() => setOpenId(c.id)}>
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {openId && <CustomerPanel id={openId} onClose={() => setOpenId(null)} onSaved={() => refetch()} />}
    </div>
  );
}

function CustomerPanel({ id, onClose, onSaved }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => getJson(`/api/customers?id=${id}`),
  });
  const [editing, setEditing] = useState(false);
  const c = data?.customer;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <aside
        className="h-full w-full max-w-xl bg-white shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        aria-label="Customer details"
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{c?.name || "Customer"}</h2>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <p className="p-5 text-slate-600">Loading…</p>
        ) : error ? (
          <p className="p-5 text-red-700">{error.message}</p>
        ) : !c ? (
          <p className="p-5 text-slate-600">This customer no longer exists.</p>
        ) : (
          <div className="p-5 space-y-6 text-sm">
            {editing ? (
              <CustomerForm
                customer={c}
                onCancel={() => setEditing(false)}
                onSaved={() => {
                  setEditing(false);
                  refetch();
                  onSaved?.();
                }}
              />
            ) : (
              <section className="space-y-1 text-slate-700">
                {c.email && <div className="flex items-center gap-2"><Mail size={14} /> {c.email}</div>}
                {c.phone && <div className="flex items-center gap-2"><Phone size={14} /> {c.phone}</div>}
                {c.address && <div className="flex items-center gap-2"><MapPin size={14} /> {c.address}</div>}
                {c.notes && <p className="text-slate-600 whitespace-pre-wrap pt-2">{c.notes}</p>}
                <button onClick={() => setEditing(true)} className="mt-2 text-amber-700 font-medium hover:underline">
                  Edit details
                </button>
              </section>
            )}

            <History title="Invoices" empty="No invoices yet." rows={data.invoices} render={(i) => (
              <>
                <a href="/admin/invoices" className="font-medium text-slate-900 hover:underline">{i.invoice_number}</a>
                <span className="text-slate-500"> · {i.invoice_type} · {i.status}</span>
                <span className="float-right tabular-nums">
                  {money(i.total_amount)}
                  {Number(i.amount_due) > 0 && i.status !== "cancelled" && (
                    <span className="text-red-700"> ({money(i.amount_due)} owing)</span>
                  )}
                </span>
              </>
            )} />
            <History title="Payments" empty="No payments yet." rows={data.payments} render={(p) => (
              <>
                {day(p.payment_date)} <span className="text-slate-500">· {p.payment_method} · {p.status}</span>
                <span className="float-right tabular-nums">{money(p.amount)}</span>
              </>
            )} />
            <History title="Jobs" empty="No jobs yet." rows={data.projects} render={(p) => (
              <>
                <a href="/admin/projects" className="font-medium text-slate-900 hover:underline">{p.project_name}</a>
                <span className="text-slate-500"> · {p.status}</span>
                <span className="float-right text-slate-500">{day(p.start_date)}</span>
              </>
            )} />
            <History title="Estimates" empty="No estimates yet." rows={data.estimates} render={(e) => (
              <>
                <a href="/admin/estimates" className="font-medium text-slate-900 hover:underline">{e.estimate_number}</a>
                <span className="text-slate-500"> · {e.project_title} · {e.status}</span>
                <span className="float-right tabular-nums">{money(e.total_cost)}</span>
              </>
            )} />
            <History title="Enquiries" empty="No enquiries." rows={data.leads} render={(l) => (
              <>
                {day(l.created_at)} <span className="text-slate-500">· {l.service_type || "general"} · {l.status}</span>
              </>
            )} />
          </div>
        )}
      </aside>
    </div>
  );
}

function History({ title, rows, render, empty }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{title}</h3>
      {rows?.length ? (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
          {rows.map((row) => (
            <li key={row.id} className="px-3 py-2">{render(row)}</li>
          ))}
        </ul>
      ) : (
        <p className="text-slate-500">{empty}</p>
      )}
    </section>
  );
}

function CustomerForm({ customer, onCancel, onSaved }) {
  const [form, setForm] = useState({
    name: customer.name || "",
    email: customer.email || "",
    phone: customer.phone || "",
    address: customer.address || "",
    notes: customer.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: customer.id, ...form }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save");
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const field = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500";
  return (
    <form onSubmit={save} className="space-y-3">
      {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-2">{error}</div>}
      {[
        ["name", "Name"],
        ["email", "Email"],
        ["phone", "Phone"],
        ["address", "Address"],
      ].map(([key, label]) => (
        <label key={key} className="block">
          <span className="block text-slate-700 mb-1">{label}</span>
          <input id={`customer-${key}`} value={form[key]} onChange={set(key)} className={field} required={key === "name"} />
        </label>
      ))}
      <label className="block">
        <span className="block text-slate-700 mb-1">Notes</span>
        <textarea id="customer-notes" rows={3} value={form.notes} onChange={set("notes")} className={field} />
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-300 rounded-lg">Cancel</button>
      </div>
    </form>
  );
}
