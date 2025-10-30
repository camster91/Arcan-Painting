import { useState, useEffect } from "react";

export function useContracts(statusFilter) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadContracts();
  }, [statusFilter]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/contracts?${params}`);
      if (!response.ok) {
        throw new Error("Failed to load contracts");
      }

      const data = await response.json();
      setContracts(data.contracts || []);
    } catch (err) {
      console.error("Error loading contracts:", err);
      setError("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    loadContracts();
  };

  const refreshContracts = () => {
    loadContracts();
  };

  return { contracts, loading, error, refetch, refreshContracts };
}
