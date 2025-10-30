import { useState, useEffect } from "react";

export function usePaymentFilters(payments) {
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter, methodFilter, dateFilter]);

  const filterPayments = () => {
    let filtered = [...payments];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (payment) =>
          payment.payment_reference?.toLowerCase().includes(term) ||
          payment.notes?.toLowerCase().includes(term) ||
          payment.processed_by?.toLowerCase().includes(term) ||
          payment.amount.toString().includes(term),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    // Method filter
    if (methodFilter !== "all") {
      filtered = filtered.filter(
        (payment) => payment.payment_method === methodFilter,
      );
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((payment) => {
        const paymentDate = new Date(payment.payment_date);
        const daysDiff = Math.floor(
          (today - paymentDate) / (1000 * 60 * 60 * 24),
        );

        switch (dateFilter) {
          case "today":
            return daysDiff === 0;
          case "week":
            return daysDiff >= 0 && daysDiff <= 7;
          case "month":
            return daysDiff >= 0 && daysDiff <= 30;
          case "quarter":
            return daysDiff >= 0 && daysDiff <= 90;
          default:
            return true;
        }
      });
    }

    setFilteredPayments(filtered);
  };

  return {
    filteredPayments,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    methodFilter,
    setMethodFilter,
    dateFilter,
    setDateFilter,
  };
}
