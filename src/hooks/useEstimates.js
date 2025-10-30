import { useState, useEffect } from "react";

export function useEstimates(statusFilter) {
  const [estimates, setEstimates] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch estimates
      const estimatesParams = new URLSearchParams();
      if (statusFilter !== "all") {
        estimatesParams.append("status", statusFilter);
      }

      const [estimatesResponse, leadsResponse] = await Promise.all([
        fetch(`/api/estimates?${estimatesParams}`),
        fetch("/api/leads"),
      ]);

      if (!estimatesResponse.ok || !leadsResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const estimatesData = await estimatesResponse.json();
      const leadsData = await leadsResponse.json();

      setEstimates(estimatesData.estimates || []);
      setLeads(leadsData.leads || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  return { estimates, leads, loading, error, fetchData };
}
