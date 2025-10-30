import { useState, useEffect } from "react";

export function usePayments() {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [paymentsRes, invoicesRes, contractsRes] = await Promise.all([
        fetch("/api/payments"),
        fetch("/api/invoices"),
        fetch("/api/contracts"),
      ]);

      if (!paymentsRes.ok) throw new Error("Failed to fetch payments");
      if (!invoicesRes.ok) throw new Error("Failed to fetch invoices");
      if (!contractsRes.ok) throw new Error("Failed to fetch contracts");

      const [paymentsData, invoicesData, contractsData] = await Promise.all([
        paymentsRes.json(),
        invoicesRes.json(),
        contractsRes.json(),
      ]);

      setPayments(paymentsData);
      setInvoices(invoicesData);
      setContracts(contractsData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (paymentData) => {
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) throw new Error("Failed to create payment");

      await fetchData();
    } catch (err) {
      console.error("Error creating payment:", err);
      setError(err.message);
      throw err;
    }
  };

  const handleUpdatePayment = async (id, updates) => {
    try {
      const response = await fetch("/api/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) throw new Error("Failed to update payment");

      await fetchData();
    } catch (err) {
      console.error("Error updating payment:", err);
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    payments,
    filteredPayments,
    setFilteredPayments,
    invoices,
    contracts,
    loading,
    error,
    setError,
    fetchData,
    handleCreatePayment,
    handleUpdatePayment,
  };
}
