import React, { useState, useEffect } from "react";
import MobileModal from "@/components/MobileModal";
import {
  Calendar,
  Camera,
  Clock,
  User,
  Plus,
  Filter,
  Search,
  TrendingUp,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import useUpload from "@/utils/useUpload";

function ProjectProgressModal({ project, onClose, onUpdate }) {
  const [progressReports, setProgressReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    search: "",
  });

  // Form state
  const [formData, setFormData] = useState({
    work_description: "",
    progress_percentage: project.completion_percentage || 0,
    hours_worked: "",
    team_members_present: "",
    materials_used: "",
    challenges_faced: "",
    next_steps: "",
    weather_conditions: "",
    client_interaction: "",
    quality_notes: "",
    is_milestone: false,
    milestone_description: "",
  });
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [upload, { loading: uploading }] = useUpload();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxList, setLightboxList] = useState([]);

  useEffect(() => {
    loadProgressReports();
  }, [project.id, filters]);

  const loadProgressReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ project_id: project.id });
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);

      const response = await fetch(`/api/project-progress?${params}`);
      if (!response.ok) {
        throw new Error("Failed to load progress reports");
      }

      const data = await response.json();
      let reports = data.progressReports || [];

      // Apply search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        reports = reports.filter(
          (report) =>
            report.work_description?.toLowerCase().includes(searchLower) ||
            report.team_members_present?.toLowerCase().includes(searchLower) ||
            report.materials_used?.toLowerCase().includes(searchLower),
        );
      }

      setProgressReports(reports);
    } catch (err) {
      console.error("Error loading progress reports:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.work_description.trim()) {
      setError("Work description is required");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Upload photos
      const photoUrls = [];
      for (const photo of photos) {
        const { url, error: uploadError } = await upload({ file: photo });
        if (uploadError) throw new Error(uploadError);
        if (url) photoUrls.push(url);
      }

      const today = new Date().toISOString().split("T")[0];

      const response = await fetch("/api/project-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          project_id: project.id,
          report_date: today,
          photos: photoUrls,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create progress report");
      }

      // Reset form
      setFormData({
        work_description: "",
        progress_percentage: project.completion_percentage || 0,
        hours_worked: "",
        team_members_present: "",
        materials_used: "",
        challenges_faced: "",
        next_steps: "",
        weather_conditions: "",
        client_interaction: "",
        quality_notes: "",
        is_milestone: false,
        milestone_description: "",
      });
      setPhotos([]);
      setShowForm(false);

      // Reload reports and notify parent
      loadProgressReports();
      onUpdate?.();
    } catch (err) {
      console.error("Error creating progress report:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getProgressStats = () => {
    if (progressReports.length === 0)
      return { totalHours: 0, avgProgress: 0, milestones: 0 };

    const totalHours = progressReports.reduce(
      (sum, report) => sum + (parseFloat(report.hours_worked) || 0),
      0,
    );
    const avgProgress =
      progressReports.reduce(
        (sum, report) => sum + (report.progress_percentage || 0),
        0,
      ) / progressReports.length;
    const milestones = progressReports.filter(
      (report) => report.is_milestone,
    ).length;

    return {
      totalHours: totalHours.toFixed(1),
      avgProgress: Math.round(avgProgress),
      milestones,
    };
  };

  const stats = getProgressStats();

  const openLightbox = (list, index) => {
    setLightboxList(list);
    setLightboxIndex(index);
    setLightboxSrc(list[index]);
    setLightboxOpen(true);
  };
  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxSrc(null);
    setLightboxList([]);
    setLightboxIndex(0);
  };
  const prevLight = () => {
    if (!lightboxList.length) return;
    const next =
      (lightboxIndex - 1 + lightboxList.length) % lightboxList.length;
    setLightboxIndex(next);
    setLightboxSrc(lightboxList[next]);
  };
  const nextLight = () => {
    if (!lightboxList.length) return;
    const next = (lightboxIndex + 1) % lightboxList.length;
    setLightboxIndex(next);
    setLightboxSrc(lightboxList[next]);
  };

  // safe photos parser
  const getPhotos = (p) => {
    try {
      const arr =
        typeof p.photos === "string" ? JSON.parse(p.photos) : p.photos;
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const formatDateTime = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const footer = (
    <div className="flex items-center justify-end">
      <button
        onClick={onClose}
        className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
      >
        Close
      </button>
    </div>
  );

  return (
    <MobileModal
      isOpen={true}
      onClose={onClose}
      title="Project Progress Reports"
      footer={footer}
      className="lg:max-w-6xl"
    >
      {/* Stats Overview */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Clock className="text-blue-600" size={18} />
            <span className="text-sm font-medium text-blue-700">
              Total Hours
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-1">
            {stats.totalHours}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-green-600" size={18} />
            <span className="text-sm font-medium text-green-700">
              Avg Progress
            </span>
          </div>
          <div className="text-2xl font-bold text-green-900 mt-1">
            {stats.avgProgress}%
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <MapPin className="text-amber-600" size={18} />
            <span className="text-sm font-medium text-amber-700">
              Milestones
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-1">
            {stats.milestones}
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-purple-600" size={18} />
            <span className="text-sm font-medium text-purple-700">Reports</span>
          </div>
          <div className="text-2xl font-bold text-purple-900 mt-1">
            {progressReports.length}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border border-slate-100 rounded-lg bg-slate-50">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="px-3 py-1 border border-slate-300 rounded-lg text-sm"
              />
              <span className="text-sm text-slate-500">to</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="px-3 py-1 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div className="relative">
              <Search
                className="absolute left-3 top-2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search reports..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="pl-9 pr-3 py-1 border border-slate-300 rounded-lg text-sm w-48"
              />
            </div>
          </div>

          {/* Add Button */}
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Report
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-4">
        {showForm && (
          <div className="p-6 border-b border-slate-200 bg-amber-50">
            <h3 className="font-semibold text-slate-900 mb-4">
              New Progress Report
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Work Description *
                  </label>
                  <textarea
                    value={formData.work_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        work_description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Describe the work completed today..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Progress Percentage
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress_percentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        progress_percentage: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Hours Worked
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.hours_worked}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hours_worked: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="8.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Team Members Present
                  </label>
                  <input
                    type="text"
                    value={formData.team_members_present}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        team_members_present: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="John, Mike, Sarah"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Weather Conditions
                  </label>
                  <input
                    type="text"
                    value={formData.weather_conditions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weather_conditions: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Sunny, 75°F"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Materials Used
                </label>
                <textarea
                  value={formData.materials_used}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      materials_used: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Paint types, quantities, tools..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Progress Photos
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setPhotos(Array.from(e.target.files || []))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                {photos.length > 0 && (
                  <p className="text-sm text-slate-600 mt-1">
                    {photos.length} photo(s) selected
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_milestone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_milestone: e.target.checked,
                      })
                    }
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-sm text-slate-700">
                    Mark as milestone
                  </span>
                </label>
              </div>

              {formData.is_milestone && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Milestone Description
                  </label>
                  <input
                    type="text"
                    value={formData.milestone_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        milestone_description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="e.g., Primer application completed"
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {submitting || uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {uploading ? "Uploading..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Save Report
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Progress Reports */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
              <span className="ml-3 text-slate-600">
                Loading progress reports...
              </span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          ) : progressReports.length > 0 ? (
            <div className="space-y-4">
              {progressReports.map((report) => {
                const photosArr = getPhotos(report);
                return (
                  <div
                    key={report.id}
                    className={`border rounded-lg p-4 ${
                      report.is_milestone
                        ? "bg-amber-50 border-amber-200"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-slate-600">
                            {formatDate(report.report_date)}
                          </span>
                          {report.is_milestone && (
                            <span className="px-2 py-1 bg-amber-200 text-amber-800 text-xs font-medium rounded-full">
                              Milestone
                            </span>
                          )}
                          {report.progress_percentage !== null && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                              {report.progress_percentage}% Complete
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-slate-900 mb-2">
                          {report.is_milestone
                            ? report.milestone_description
                            : report.work_description}
                        </h4>
                        {!report.is_milestone && (
                          <p className="text-slate-700 mb-3">
                            {report.work_description}
                          </p>
                        )}

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          {report.hours_worked && (
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-slate-400" />
                              <span className="text-slate-600">
                                {report.hours_worked} hours
                              </span>
                            </div>
                          )}
                          {report.team_members_present && (
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-slate-400" />
                              <span className="text-slate-600">
                                {report.team_members_present}
                              </span>
                            </div>
                          )}
                          {report.weather_conditions && (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400">🌤</span>
                              <span className="text-slate-600">
                                {report.weather_conditions}
                              </span>
                            </div>
                          )}
                        </div>

                        {report.materials_used && (
                          <div className="mt-3">
                            <strong className="text-sm text-slate-700">
                              Materials:{" "}
                            </strong>
                            <span className="text-sm text-slate-600">
                              {report.materials_used}
                            </span>
                          </div>
                        )}

                        {/* Photos Gallery */}
                        {photosArr.length > 0 && (
                          <div className="mt-4">
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                              {photosArr.map((photo, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={photo}
                                    alt={`Progress photo ${index + 1}`}
                                    className="w-full h-20 object-cover rounded-md border border-slate-200 cursor-pointer"
                                    onClick={() =>
                                      openLightbox(photosArr, index)
                                    }
                                  />
                                  <div className="absolute bottom-1 left-1 right-1 bg-black/50 text-white text-[10px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100">
                                    {formatDateTime(
                                      report.created_at || report.report_date,
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Camera size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">No progress reports yet</p>
              <p className="text-sm">
                Add your first progress report to track project developments.
              </p>
            </div>
          )}
        </div>

        {/* Lightbox */}
        {lightboxOpen && (
          <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white/80 hover:text-white"
              aria-label="Close"
            >
              <X size={24} />
            </button>
            <button
              onClick={prevLight}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
              aria-label="Previous"
            >
              <ChevronLeft size={28} />
            </button>
            <img
              src={lightboxSrc}
              alt="Preview"
              className="max-h-[85vh] max-w-[90vw] object-contain rounded"
            />
            <button
              onClick={nextLight}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
              aria-label="Next"
            >
              <ChevronRight size={28} />
            </button>
          </div>
        )}
      </div>
    </MobileModal>
  );
}

export default ProjectProgressModal;
