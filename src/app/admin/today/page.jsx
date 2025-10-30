"use client";

import { useEffect, useState, useMemo } from "react";
import {
  RefreshCw,
  CheckCircle2,
  Briefcase,
  Users,
  Clock,
  Search,
  Play,
  Square,
  PlusCircle,
} from "lucide-react";
import ProjectDetailModal from "@/components/admin/projects/ProjectDetailModal";
import CompletionWorkflowsModal from "@/components/admin/projects/CompletionWorkflowsModal";
import ProjectProgressModal from "@/components/admin/projects/ProjectProgressModal";

export default function TodayOperationsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // Time tracking state
  const [activeEntry, setActiveEntry] = useState(null);
  const [ttLoading, setTtLoading] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());

  // Modals
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      // Focus on projects in progress for "Today"
      const res = await fetch("/api/projects?status=in_progress");
      if (!res.ok) {
        throw new Error(
          `When fetching /api/projects, the response was [${res.status}] ${res.statusText}`,
        );
      }
      const data = await res.json();
      setProjects(Array.isArray(data.projects) ? data.projects : data);
    } catch (e) {
      console.error(e);
      setError(e.message || "Could not load projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveEntry = async () => {
    try {
      const res = await fetch("/api/time-tracking?status=active&limit=1");
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          j?.error || `Failed to load time entry [${res.status}]`,
        );
      }
      setActiveEntry(j?.timeEntries?.[0] || null);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchActiveEntry();
  }, []);

  // simple ticker to update elapsed time label
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProjects(), fetchActiveEntry()]);
    setRefreshing(false);
  };

  const filtered = projects.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.project_name || "").toLowerCase().includes(q) ||
      (p.lead_name || "").toLowerCase().includes(q) ||
      (p.address || "").toLowerCase().includes(q)
    );
  });

  const isRunningForProject = (projectId) => {
    return activeEntry && Number(activeEntry.project_id) === Number(projectId);
  };

  const formatElapsed = (startIso) => {
    if (!startIso) return "";
    const start = new Date(startIso).getTime();
    const diffMs = nowTick - start;
    const mins = Math.max(0, Math.floor(diffMs / 60000));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const handleStart = async (project) => {
    try {
      setTtLoading(true);
      // Prevent double start if already running
      if (activeEntry) {
        alert("You already have a running timer. Stop it first.");
        return;
      }
      const payload = {
        team_member_id: "me",
        project_id: project.id,
        clock_in_time: new Date().toISOString(),
      };
      const res = await fetch("/api/time-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j?.error || `Failed to start time [${res.status}]`);
      }
      setActiveEntry(j.timeEntry);
    } catch (e) {
      console.error(e);
      alert(e.message || "Could not start time");
    } finally {
      setTtLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      if (!activeEntry?.id) return;
      setTtLoading(true);
      const res = await fetch("/api/time-tracking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeEntry.id,
          clock_out_time: new Date().toISOString(),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j?.error || `Failed to stop time [${res.status}]`);
      }
      setActiveEntry(null);
      await fetchProjects();
    } catch (e) {
      console.error(e);
      alert(e.message || "Could not stop time");
    } finally {
      setTtLoading(false);
    }
  };

  const handleQuickLog = async (project) => {
    try {
      const hoursStr = window.prompt("Enter hours (e.g. 2 or 2.5)", "1.0");
      if (!hoursStr) return;
      const hours = parseFloat(hoursStr);
      if (isNaN(hours) || hours <= 0) {
        alert("Please enter a valid number of hours.");
        return;
      }
      const notes = window.prompt("Notes (optional)", "");
      const end = new Date();
      const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
      const payload = {
        team_member_id: "me",
        project_id: project.id,
        clock_in_time: start.toISOString(),
        clock_out_time: end.toISOString(),
        notes: notes || null,
      };
      setTtLoading(true);
      const res = await fetch("/api/time-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j?.error || `Failed to log hours [${res.status}]`);
      }
      await Promise.all([fetchProjects(), fetchActiveEntry()]);
    } catch (e) {
      console.error(e);
      alert(e.message || "Could not log hours");
    } finally {
      setTtLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Today</h1>
                <p className="text-sm text-slate-600 mt-1">
                  Operations overview for active jobs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeEntry ? (
                <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  Active • {formatElapsed(activeEntry.clock_in_time)}
                </div>
              ) : null}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search projects, customers, address..."
                  className="pl-9 pr-3 py-2 w-[260px] border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <button
                onClick={onRefresh}
                disabled={refreshing}
                className="px-3 py-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-600">Loading active projects…</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-10 text-center">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">
              No active projects found for today.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-lg border border-slate-200 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {p.project_name}
                    </h3>
                    <div className="mt-1 text-sm text-slate-600 truncate">
                      {p.lead_name || "—"}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <Users size={14} />
                      <span>{p.crew_assigned || "Unassigned"}</span>
                      <span className="mx-1">•</span>
                      <Clock size={14} />
                      <span>{p.status}</span>
                    </div>
                    {p.address && (
                      <div className="mt-1 text-xs text-slate-500 truncate">
                        {p.address}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-500">Progress</div>
                    <div className="mt-1 flex items-center gap-2 min-w-[120px]">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-amber-500"
                          style={{
                            width: `${Math.min(p.completion_percentage || 0, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="text-sm font-medium text-slate-700">
                        {p.completion_percentage || 0}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedProject(p);
                      setShowDetails(true);
                    }}
                    className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProject(p);
                      setShowChecklist(true);
                    }}
                    className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium"
                  >
                    Checklist
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProject(p);
                      setShowProgress(true);
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    Add Progress
                  </button>

                  {/* Time tracking actions */}
                  {isRunningForProject(p.id) ? (
                    <button
                      onClick={handleStop}
                      disabled={ttLoading}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg text-sm font-medium inline-flex items-center gap-2"
                    >
                      <Square size={14} /> Stop (
                      {formatElapsed(activeEntry?.clock_in_time)})
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStart(p)}
                      disabled={ttLoading || !!activeEntry}
                      className="px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg text-sm font-medium inline-flex items-center gap-2"
                    >
                      <Play size={14} /> Start
                    </button>
                  )}

                  <button
                    onClick={() => handleQuickLog(p)}
                    disabled={ttLoading}
                    className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-lg text-sm font-medium inline-flex items-center gap-2"
                  >
                    <PlusCircle size={14} /> Quick Log
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showDetails && selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => {
            setShowDetails(false);
            setSelectedProject(null);
          }}
          onUpdate={async () => {
            await fetchProjects();
          }}
        />
      )}

      {showChecklist && selectedProject && (
        <CompletionWorkflowsModal
          project={selectedProject}
          onClose={() => {
            setShowChecklist(false);
            setSelectedProject(null);
          }}
          onUpdate={async () => {
            await fetchProjects();
          }}
        />
      )}

      {showProgress && selectedProject && (
        <ProjectProgressModal
          project={selectedProject}
          onClose={() => {
            setShowProgress(false);
            setSelectedProject(null);
          }}
          onUpdate={async () => {
            await fetchProjects();
          }}
        />
      )}
    </div>
  );
}
