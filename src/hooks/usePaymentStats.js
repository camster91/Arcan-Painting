import { useState, useEffect } from "react";

export function usePaymentStats(filteredPayments) {
  const [stats, setStats] = useState({
    totalAmount: 0,
    pendingAmount: 0,
    clearedAmount: 0,
    totalCount: 0,
  });

  useEffect(() => {
    calculateStats();
  }, [filteredPayments]);

  const calculateStats = () => {
    const stats = filteredPayments.reduce(
      (acc, payment) => {
        const amount = parseFloat(payment.amount);
        acc.totalAmount += amount;
        acc.totalCount += 1;

        if (payment.status === "pending") {
          acc.pendingAmount += amount;
        } else if (payment.status === "cleared") {
          acc.clearedAmount += amount;
        }

        return acc;
      },
      {
        totalAmount: 0,
        pendingAmount: 0,
        clearedAmount: 0,
        totalCount: 0,
      },
    );

    setStats(stats);
  };

  return stats;
}
