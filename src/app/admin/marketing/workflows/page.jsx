"use client";

import { useState, useEffect } from "react";
import {
  Zap,
  Play,
  Pause,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Filter,
} from "lucide-react";

const CATEGORY_LABELS = {
  marketing: "Marketing",
  leads: "Leads",
  outreach: "Outreach",
  analytics: "Analytics",
};

const CATEGORY_COLORS = {
  marketing: "bg-purple-100 text-purple-800",
  leads: "bg-blue-100 text-blue-800",
  outreach: "bg-green-100 text-green-800",
  analytics: "bg-amber-100 text-amber-800",
};

export default function WorkflowSkillsPage() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [error, setError] = useState(null);

  const fetchSkills = async () => {
    try {
      const params = filterCategory ? `?category=${filterCategory}` : "";
      const res = await fetch(`/api/marketing/workflows${params}`);
      if (!res.ok) throw new Error("Failed to load workflows");
      const data = await res.json();
      setSkills(data.skills);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSkills();
  }, [filterCategory]);

  const toggleSkill = async (id, currentActive) => {
    try {
      const res = await fetch("/api/marketing/workflows", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle skill");
      setSkills((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: !currentActive } : s))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const triggerSkill = async (skillId) => {
    setTriggering(skillId);
    try {
      const res = await fetch("/api/marketing/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId, triggerData: { manual: true } }),
      });
      if (!res.ok) throw new Error("Failed to trigger workflow");
      await fetchSkills();
    } catch (err) {
      setError(err.message);
    } finally {
      setTriggering(null);
    }
  };

  const categories = [...new Set(skills.map((s) => s.category))].sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <a
            href="/admin/marketing"
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </a>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-500" />
              Workflow Skills
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Automated workflows that run on schedules or respond to events
            </p>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm text-gray-500">Total Skills</div>
          <div className="text-2xl font-bold text-gray-900">{skills.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm text-gray-500">Active</div>
          <div className="text-2xl font-bold text-green-600">
            {skills.filter((s) => s.is_active).length}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm text-gray-500">Total Runs</div>
          <div className="text-2xl font-bold text-blue-600">
            {skills.reduce((sum, s) => sum + (s.total_runs || 0), 0)}
          </div>
        </div>
      </div>

      {/* Skills grid */}
      <div className="grid gap-4">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className={`bg-white border rounded-xl p-5 transition ${
              skill.is_active
                ? "border-green-200 shadow-sm"
                : "border-gray-200 opacity-75"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{skill.name}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      CATEGORY_COLORS[skill.category] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {CATEGORY_LABELS[skill.category] || skill.category}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {skill.trigger_type}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-3">{skill.description}</p>

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {skill.total_runs || 0} runs
                  </span>
                  {skill.failed_runs > 0 && (
                    <span className="flex items-center gap-1 text-red-400">
                      <XCircle className="w-3 h-3" />
                      {skill.failed_runs} failed
                    </span>
                  )}
                  {skill.last_run_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last: {new Date(skill.last_run_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                {/* Toggle active */}
                <button
                  onClick={() => toggleSkill(skill.id, skill.is_active)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    skill.is_active
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {skill.is_active ? (
                    <>
                      <Pause className="w-3.5 h-3.5" /> Active
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Inactive
                    </>
                  )}
                </button>

                {/* Manual trigger */}
                <button
                  onClick={() => triggerSkill(skill.id)}
                  disabled={triggering === skill.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition disabled:opacity-50"
                >
                  {triggering === skill.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  Run Now
                </button>
              </div>
            </div>
          </div>
        ))}

        {skills.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 text-yellow-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              No workflows set up yet
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
              Workflows automate your marketing — things like posting on social media every week, following up on estimates, or sending review requests after a project wraps up.
            </p>
            <p className="text-xs text-gray-400">
              They'll appear here once your system is configured. Ask your developer if you expected to see them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
