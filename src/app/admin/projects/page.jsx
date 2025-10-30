"use client";

import { useState } from "react";
import { Search, Plus, Grid, List, Filter } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import ProjectsStats from "@/components/admin/projects/ProjectsStats";
import ProjectCard from "@/components/admin/projects/ProjectCard";
import ProjectsTable from "@/components/admin/projects/ProjectsTable";
import CreateProjectModal from "@/components/admin/projects/CreateProjectModal";
import ProjectDetailModal from "@/components/admin/projects/ProjectDetailModal";
import ProjectProgressModal from "@/components/admin/projects/ProjectProgressModal";
import CompletionWorkflowsModal from "@/components/admin/projects/CompletionWorkflowsModal";
import NoProjectsFound from "@/components/admin/projects/NoProjectsFound";

export default function ProjectsPage() {
  const {
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
  } = useProjects();

  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showWorkflowsModal, setShowWorkflowsModal] = useState(false);
  const [viewMode, setViewMode] = useState("cards");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const handleViewProgress = (project) => {
    setSelectedProject(project);
    setShowProgressModal(true);
  };

  const handleViewWorkflows = (project) => {
    setSelectedProject(project);
    setShowWorkflowsModal(true);
  };

  const closeModals = () => {
    setSelectedProject(null);
    setShowProgressModal(false);
    setShowWorkflowsModal(false);
  };

  const statusOptions = [
    { label: "All Projects", value: "all", count: statusCounts.all },
    { label: "Scheduled", value: "scheduled", count: statusCounts.scheduled },
    {
      label: "In Progress",
      value: "in_progress",
      count: statusCounts.in_progress,
    },
    { label: "Paused", value: "paused", count: statusCounts.paused },
    { label: "Completed", value: "completed", count: statusCounts.completed },
    { label: "Cancelled", value: "cancelled", count: statusCounts.cancelled },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
              <p className="text-sm text-slate-600 mt-1">
                {stats.total} total • {stats.active} active projects
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle - Desktop Only */}
              <div className="hidden lg:flex bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("cards")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    viewMode === "cards"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Grid size={16} />
                  Cards
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    viewMode === "table"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <List size={16} />
                  Table
                </button>
              </div>

              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                New Project
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ProjectsStats stats={stats} />
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Filter size={16} />
              Filters
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search projects by name, client, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                />
              </div>
            </div>

            {/* Status Filter - Desktop */}
            <div
              className={`lg:flex gap-2 ${showMobileFilters ? "flex flex-wrap" : "hidden"}`}
            >
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => setStatusFilter(status.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    statusFilter === status.value
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent"
                  }`}
                >
                  {status.label}
                  {status.count > 0 && (
                    <span className="ml-1.5 text-xs opacity-75">
                      ({status.count})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error: {error}</p>
            <button
              onClick={fetchData}
              className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Projects Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredProjects.length === 0 ? (
          <NoProjectsFound
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            onCreateProject={() => setShowCreateForm(true)}
          />
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="lg:hidden space-y-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-lg border border-slate-200"
                >
                  <ProjectCard
                    project={project}
                    onSelectProject={setSelectedProject}
                    onStatusUpdate={handleStatusUpdate}
                    onViewProgress={handleViewProgress}
                    onViewWorkflows={handleViewWorkflows}
                  />
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden lg:block">
              {viewMode === "cards" ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-white rounded-lg border border-slate-200"
                    >
                      <ProjectCard
                        project={project}
                        onSelectProject={setSelectedProject}
                        onStatusUpdate={handleStatusUpdate}
                        onViewProgress={handleViewProgress}
                        onViewWorkflows={handleViewWorkflows}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-slate-200">
                  <ProjectsTable
                    projects={filteredProjects}
                    onSelectProject={setSelectedProject}
                    onViewProgress={handleViewProgress}
                    onViewWorkflows={handleViewWorkflows}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showCreateForm && (
        <CreateProjectModal
          estimates={estimates}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchData();
          }}
        />
      )}

      {selectedProject && !showProgressModal && !showWorkflowsModal && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onUpdate={fetchData}
        />
      )}

      {showProgressModal && selectedProject && (
        <ProjectProgressModal
          project={selectedProject}
          onClose={closeModals}
          onUpdate={fetchData}
        />
      )}

      {showWorkflowsModal && selectedProject && (
        <CompletionWorkflowsModal
          project={selectedProject}
          onClose={closeModals}
          onUpdate={fetchData}
        />
      )}
    </div>
  );
}
