import { useState, useEffect } from "react";

export function useFollowUps(statusFilter, typeFilter) {
  const [followUps, setFollowUps] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (typeFilter !== "all") {
        params.append("type", typeFilter);
      }

      const [followUpsResponse, leadsResponse] = await Promise.all([
        fetch(`/api/follow-ups?${params}`),
        fetch("/api/leads"),
      ]);

      if (!followUpsResponse.ok || !leadsResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const followUpsData = await followUpsResponse.json();
      const leadsData = await leadsResponse.json();

      setFollowUps(followUpsData.followUps || []);
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
  }, [statusFilter, typeFilter]);

  return { followUps, leads, loading, error, refetch: fetchData };
}
