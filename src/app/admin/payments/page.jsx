"use client";

import { useState } from "react";
import { usePayments } from "@/hooks/usePayments";
import { usePaymentFilters } from "@/hooks/usePaymentFilters";
import { usePaymentStats } from "@/hooks/usePaymentStats";
import { PaymentsHeader } from "@/components/admin/payments/PaymentsHeader";
import { PaymentsStats } from "@/components/admin/payments/PaymentsStats";
import { PaymentsFilters } from "@/components/admin/payments/PaymentsFilters";
import { PaymentsTable } from "@/components/admin/payments/PaymentsTable";
import { CreatePaymentModal } from "@/components/admin/payments/CreatePaymentModal";
import { PaymentDetailModal } from "@/components/admin/payments/PaymentDetailModal";
import { LoadingSpinner } from "@/components/admin/payments/LoadingSpinner";
import { ErrorMessage } from "@/components/admin/payments/ErrorMessage";

export default function PaymentsPage() {
  const {
    payments,
    invoices,
    contracts,
    loading,
    error,
    fetchData,
    handleCreatePayment,
    handleUpdatePayment,
  } = usePayments();

  const {
    filteredPayments,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    methodFilter,
    setMethodFilter,
    dateFilter,
    setDateFilter,
  } = usePaymentFilters(payments);

  const stats = usePaymentStats(filteredPayments);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleCreatePaymentWrapper = async (paymentData) => {
    await handleCreatePayment(paymentData);
    setShowCreateModal(false);
  };

  const handleUpdatePaymentWrapper = async (id, updates) => {
    await handleUpdatePayment(id, updates);
    setShowDetailModal(false);
  };

  const handlePaymentClick = (payment) => {
    setSelectedPayment(payment);
    setShowDetailModal(true);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PaymentsHeader
        onRefresh={fetchData}
        onCreatePayment={() => setShowCreateModal(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ErrorMessage message={error} />

        <PaymentsStats stats={stats} />

        <PaymentsFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          methodFilter={methodFilter}
          setMethodFilter={setMethodFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
        />

        <PaymentsTable
          payments={filteredPayments}
          onPaymentClick={handlePaymentClick}
        />
      </div>

      {showCreateModal && (
        <CreatePaymentModal
          invoices={invoices}
          contracts={contracts}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePaymentWrapper}
        />
      )}

      {showDetailModal && selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          invoices={invoices}
          contracts={contracts}
          onClose={() => setShowDetailModal(false)}
          onUpdate={handleUpdatePaymentWrapper}
        />
      )}
    </div>
  );
}
