"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  AlertCircle,
  DollarSign,
  Calendar as CalendarIcon,
  X,
  Receipt,
  RefreshCw,
  Clock,
  CheckCircle2,
  CreditCard,
} from "lucide-react";
import RecordPaymentModal from "@/components/admin/invoices/RecordPaymentModal";
import PaymentsListModal from "@/components/admin/invoices/PaymentsListModal";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [payInvoice, setPayInvoice] = useState(null);
  const [viewPaymentsInvoice, setViewPaymentsInvoice] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, [statusFilter, paymentStatusFilter, overdueOnly]);

  const loadInvoices = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (paymentStatusFilter !== "all")
        params.set("payment_status", paymentStatusFilter);
      if (overdueOnly) params.set("overdue", "true");

      const res = await fetch(`/api/invoices?${params.toString()}`);
      if (!res.ok) {
        throw new Error(
          `When fetching /api/invoices, the response was [${res.status}] ${res.statusText}`,
        );
      }
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (e) {
      console.error(e);
      setError(e.message || "Could not load invoices");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSendInvoice = async (inv) => {
    try {
      setSendingId(inv.id);
      const res = await fetch(`/api/invoices/${inv.id}/send`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to send invoice");
      }
      setNotification(`Invoice ${inv.invoice_number} sent to client!`);
      setTimeout(() => setNotification(null), 5000);
      await loadInvoices(true);
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setSendingId(null);
    }
  };

  const filteredInvoices = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return invoices;
    return invoices.filter((inv) => {
      return (
        inv.invoice_number?.toLowerCase().includes(term) ||
        inv.title?.toLowerCase().includes(term) ||
        inv.client_name?.toLowerCase().includes(term) ||
        inv.client_email?.toLowerCase().includes(term)
      );
    });
  }, [searchTerm, invoices]);

  const stats = useMemo(() => {
    const totalOutstanding = invoices.reduce(
      (sum, i) => sum + Number(i.amount_due || 0),
      0,
    );
    const overdueCount = invoices.filter(
      (i) => i.payment_status !== "paid" && new Date(i.due_date) < new Date(),
    ).length;
    const paidCount = invoices.filter(
      (i) => i.payment_status === "paid",
    ).length;

    return {
      total: invoices.length,
      totalOutstanding,
      overdue: overdueCount,
      paid: paidCount,
    };
  }, [invoices]);

  const statusOptions = [
    { label: "All Status", value: "all" },
    { label: "Draft", value: "draft" },
    { label: "Sent", value: "sent" },
    { label: "Viewed", value: "viewed" },
    { label: "Paid", value: "paid" },
    { label: "Overdue", value: "overdue" },
    { label: "Cancelled", value: "cancelled" },
  ];

  const paymentOptions = [
    { label: "All Payments", value: "all" },
    { label: "Unpaid", value: "unpaid" },
    { label: "Partial", value: "partial" },
    { label: "Paid", value: "paid" },
    { label: "Refunded", value: "refunded" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Success Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">{notification}</p>
            <button
              onClick={() => setNotification(null)}
              className="text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
              <p className="text-sm text-slate-600 mt-1">
                {filteredInvoices.length} of {invoices.length} client invoices
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Refresh Button */}
              <button
                onClick={() => loadInvoices(true)}
                disabled={refreshing}
                className="px-3 py-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                New Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Total Invoices
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Outstanding
                </p>
                <p className="text-2xl font-bold text-amber-600">
                  ${stats.totalOutstanding.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.overdue}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.paid}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Filter size={16} />
              Filters
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search invoices by number, title, or client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                />
              </div>
            </div>

            {/* Filters */}
            <div
              className={`lg:flex gap-2 ${showMobileFilters ? "flex flex-wrap" : "hidden"}`}
            >
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
              >
                {paymentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <label className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={overdueOnly}
                  onChange={(e) => setOverdueOnly(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700">Overdue only</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">Error: {error}</p>
            </div>
            <button
              onClick={() => loadInvoices(true)}
              className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Invoices Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No invoices found
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm ||
              statusFilter !== "all" ||
              paymentStatusFilter !== "all" ||
              overdueOnly
                ? "Try adjusting your search or filter criteria."
                : "Invoices will appear here when you bill clients for work."}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Create First Invoice
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                      Invoice
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                      Client
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                      Dates
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                      Amount
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">
                          {inv.invoice_number}
                        </div>
                        <div className="text-sm text-slate-600 truncate max-w-xs">
                          {inv.title}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-900">
                          {inv.client_name || "Direct Client"}
                        </div>
                        <div className="text-sm text-slate-600">
                          {inv.client_email}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        <div className="flex items-center gap-1 mb-1">
                          <CalendarIcon size={14} />
                          Issued:{" "}
                          {new Date(inv.issue_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          Due: {new Date(inv.due_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-slate-900 font-semibold">
                          ${Number(inv.total_amount).toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-600">
                          Due: ${Number(inv.amount_due).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              inv.payment_status === "paid"
                                ? "bg-green-100 text-green-800"
                                : inv.payment_status === "partial"
                                  ? "bg-amber-100 text-amber-800"
                                  : inv.payment_status === "refunded"
                                    ? "bg-slate-100 text-slate-800"
                                    : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {inv.payment_status === "paid" && "Paid"}
                            {inv.payment_status === "partial" && "Partial"}
                            {inv.payment_status === "unpaid" && "Unpaid"}
                            {inv.payment_status === "refunded" && "Refunded"}
                          </span>
                          {inv.payment_status !== "paid" &&
                            new Date(inv.due_date) < new Date() && (
                              <div>
                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Overdue
                                </span>
                              </div>
                            )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/api/invoices/${inv.id}/pdf`}
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download size={16} />
                          </a>
                          <button
                            className={`p-2 rounded-lg transition-colors ${
                              sendingId === inv.id
                                ? "text-amber-600 bg-amber-50"
                                : "text-slate-600 hover:text-amber-600 hover:bg-amber-50"
                            }`}
                            title="Send Invoice"
                            onClick={() => handleSendInvoice(inv)}
                            disabled={sendingId === inv.id}
                          >
                            <Send
                              size={16}
                              className={
                                sendingId === inv.id ? "animate-pulse" : ""
                              }
                            />
                          </button>
                          <a
                            href={`/admin/invoices/${inv.id}`}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </a>
                          <button
                            className="p-2 text-slate-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                            title="Record Payment"
                            onClick={() => setPayInvoice(inv)}
                          >
                            <CreditCard size={16} />
                          </button>
                          <button
                            className="p-2 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                            title="View Payments"
                            onClick={() => setViewPaymentsInvoice(inv)}
                          >
                            <Receipt size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateInvoiceModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadInvoices(true);
          }}
        />
      )}

      {payInvoice && (
        <RecordPaymentModal
          invoice={payInvoice}
          onClose={() => setPayInvoice(null)}
          onRecorded={async (msg) => {
            setPayInvoice(null);
            setNotification(
              msg || `Payment recorded for ${payInvoice.invoice_number}`,
            );
            setTimeout(() => setNotification(null), 5000);
            await loadInvoices(true);
          }}
        />
      )}

      {viewPaymentsInvoice && (
        <PaymentsListModal
          invoice={viewPaymentsInvoice}
          onClose={() => setViewPaymentsInvoice(null)}
          onChanged={() => loadInvoices(true)}
          onNotify={(msg) => {
            setNotification(msg);
            setTimeout(() => setNotification(null), 5000);
          }}
        />
      )}
    </div>
  );
}

// Simplified CreateInvoiceModal placeholder - should be moved to separate component file
function CreateInvoiceModal({ onClose, onCreated }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Create Invoice</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">Invoice creation form coming soon!</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
