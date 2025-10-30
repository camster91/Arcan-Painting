"use client";
import { useState, useEffect, useMemo, useCallback } from "react";

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const projectsParams = new URLSearchParams();
      if (statusFilter !== "all") {
        projectsParams.append("status", statusFilter);
      }

      const [projectsResponse, estimatesResponse] = await Promise.all([
        fetch(`/api/projects?${projectsParams}`),
        fetch("/api/estimates?status=approved"),
      ]);

      if (!projectsResponse.ok || !estimatesResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const projectsData = await projectsResponse.json();
      const estimatesData = await estimatesResponse.json();

      setProjects(projectsData.projects || []);
      setEstimates(estimatesData.estimates || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusUpdate = async (projectId, newStatus) => {
    try {
      const response = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: projectId,
          status: newStatus,
          completion_percentage:
            newStatus === "completed"
              ? 100
              : newStatus === "in_progress"
                ? 50
                : newStatus === "scheduled"
                  ? 0
                  : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update project status");
      }
      fetchData(); // Refresh data
    } catch (err) {
      console.error("Error updating project status:", err);
      setError("Failed to update project status");
    }
  };

  const filteredProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          project.project_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          project.crew_assigned
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          project.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [projects, searchTerm],
  );

  const stats = useMemo(() => {
    const totalValue = projects.reduce(
      (sum, p) => sum + (parseFloat(p.final_cost) || 0),
      0,
    );
    const completedValue = projects
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + (parseFloat(p.final_cost) || 0), 0);
    const avgCompletion =
      projects.length > 0
        ? Math.round(
            projects.reduce(
              (sum, p) => sum + (p.completion_percentage || 0),
              0,
            ) / projects.length,
          )
        : 0;
    return {
      total: projects.length,
      scheduled: projects.filter((p) => p.status === "scheduled").length,
      inProgress: projects.filter((p) => p.status === "in_progress").length,
      completed: projects.filter((p) => p.status === "completed").length,
      totalValue,
      completedValue,
      avgCompletion,
    };
  }, [projects]);

  const statusCounts = useMemo(
    () => ({
      all: projects.length,
      scheduled: projects.filter((p) => p.status === "scheduled").length,
      in_progress: projects.filter((p) => p.status === "in_progress").length,
      paused: projects.filter((p) => p.status === "paused").length,
      completed: projects.filter((p) => p.status === "completed").length,
      cancelled: projects.filter((p) => p.status === "cancelled").length,
    }),
    [projects],
  );

  return {
    projects,
    estimates,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    fetchData,
    handleStatusUpdate,
    filteredProjects,
    stats,
    statusCounts,
  };
}
