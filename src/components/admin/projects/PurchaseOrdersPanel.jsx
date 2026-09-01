"use client";

import { useCallback, useEffect, useState } from "react";
import { PackageCheck, Plus, Loader2 } from "lucide-react";
import useUpload from "@/utils/useUpload";

const empty = () => ({
  category: "material",
  vendor: "",
  description: "",
  amount: "",
  tax_amount: "",
  expected_on: "",
});
const money = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});
const nextAction = {
  draft: ["approved", "Approve"],
  approved: ["ordered", "Mark ordered"],
  ordered: ["received", "Receive"],
};

export default function PurchaseOrdersPanel({ projectId, canManage }) {
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(empty);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [working, setWorking] = useState(null);
  const [upload, { loading: uploading }] = useUpload();
  const load = useCallback(async () => {
    if (!canManage) return;
    const response = await fetch(
      `/api/purchase-orders?project_id=${projectId}`,
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(data.error || "Could not load purchase orders");
    setOrders(data.purchase_orders || []);
  }, [canManage, projectId]);
  useEffect(() => {
    load().catch((cause) => setError(cause.message));
  }, [load]);
  if (!canManage) return null;

  const create = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, ...form }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || "Could not create purchase order");
      setForm(empty());
      setShow(false);
      await load();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setSaving(false);
    }
  };
  const transition = async (order, status) => {
    setWorking(order.id);
    setError("");
    try {
      const payload = { id: order.id, status };
      if (status === "ordered")
        payload.order_reference =
          window.prompt("Vendor order or confirmation reference (optional)") ||
          null;
      if (status === "received") {
        const file = await new Promise((resolve) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*,application/pdf";
          input.onchange = () => resolve(input.files?.[0] || null);
          input.click();
        });
        if (file) {
          const result = await upload({ file });
          if (result.error) throw new Error(result.error);
          payload.receipt_url = result.url;
        }
      }
      const response = await fetch("/api/purchase-orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || "Could not update purchase order");
      await load();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setWorking(null);
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <PackageCheck size={18} className="text-violet-600" />
            Purchase commitments
          </h3>
          <p className="text-sm text-slate-600">
            Approve vendor costs, track orders, and convert received goods into
            actual job expenses.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShow((value) => !value)}
          className="flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white"
        >
          <Plus size={15} />
          New purchase
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {show && (
        <form
          onSubmit={create}
          className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-2"
        >
          <select
            value={form.category}
            onChange={(event) =>
              setForm({ ...form, category: event.target.value })
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2"
          >
            <option value="material">Materials</option>
            <option value="subcontractor">Subcontractor</option>
            <option value="equipment">Equipment</option>
            <option value="travel">Travel</option>
            <option value="disposal">Disposal</option>
            <option value="permit">Permit</option>
            <option value="other">Other</option>
          </select>
          <input
            required
            value={form.vendor}
            onChange={(event) =>
              setForm({ ...form, vendor: event.target.value })
            }
            placeholder="Vendor"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            required
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            placeholder="What is being purchased?"
            className="rounded-lg border border-slate-300 px-3 py-2 sm:col-span-2"
          />
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(event) =>
              setForm({ ...form, amount: event.target.value })
            }
            placeholder="Amount before tax"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.tax_amount}
            onChange={(event) =>
              setForm({ ...form, tax_amount: event.target.value })
            }
            placeholder="Tax"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            type="date"
            value={form.expected_on}
            onChange={(event) =>
              setForm({ ...form, expected_on: event.target.value })
            }
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <div>
            <button
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}Save
              draft
            </button>
          </div>
        </form>
      )}
      <div className="mt-4 space-y-2">
        {orders.length ? (
          orders.map((order) => {
            const action = nextAction[order.status];
            return (
              <article
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm"
              >
                <div>
                  <strong>
                    {order.vendor} · {order.description}
                  </strong>
                  <p className="text-xs text-slate-500">
                    {order.purchase_order_number} ·{" "}
                    <span className="capitalize">{order.status}</span>
                    {order.order_reference ? ` · ${order.order_reference}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <strong>{money.format(Number(order.total_amount))}</strong>
                  {action && (
                    <button
                      disabled={working === order.id || uploading}
                      onClick={() => transition(order, action[0])}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {action[1]}
                    </button>
                  )}
                  {!["received", "cancelled"].includes(order.status) && (
                    <button
                      disabled={working === order.id}
                      onClick={() => transition(order, "cancelled")}
                      className="px-2 py-1.5 text-xs text-red-700"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            No purchase commitments yet.
          </p>
        )}
      </div>
    </section>
  );
}
