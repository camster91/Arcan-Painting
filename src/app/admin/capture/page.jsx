"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import useUpload from "@/utils/useUpload";
import { Camera, Upload, Image as ImgIcon } from "lucide-react";

export default function CapturePage() {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [upload, { loading: uploading }] = useUpload();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["projects", { status: "in_progress" }],
    queryFn: async () => {
      const res = await fetch("/api/projects?status=in_progress");
      if (!res.ok) {
        throw new Error(
          `When fetching /api/projects, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const projects = data?.projects || [];

  const submitMutation = useMutation({
    mutationFn: async ({ project_id, work_description, urls }) => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const report_date = `${yyyy}-${mm}-${dd}`;
      const res = await fetch("/api/project-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id,
          report_date,
          work_description,
          photos: urls,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j?.error || "Failed to save progress");
      }
      return j;
    },
    onSuccess: () => {
      setSuccess(true);
      setCaption("");
      setFiles([]);
      setPreviews([]);
      setSelectedProjectId("");
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (e) => setError(e.message || "Failed to submit"),
  });

  const handleFiles = useCallback((newFiles) => {
    const arr = Array.from(newFiles || []);
    const imgs = arr.filter((f) => f.type?.startsWith("image/"));
    setFiles((prev) => [...prev, ...imgs]);
    const nextPreviews = imgs.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      takenAt: f.lastModified
        ? new Date(f.lastModified).toLocaleString()
        : null,
    }));
    setPreviews((p) => [...p, ...nextPreviews]);
  }, []);

  const onInputChange = (e) => handleFiles(e.target.files);

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const removePreview = (idx) => {
    setPreviews((p) => p.filter((_, i) => i !== idx));
    setFiles((p) => p.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setError("");
    if (!selectedProjectId) {
      setError("Select a project first");
      return;
    }
    if (files.length === 0) {
      setError("Add at least one photo");
      return;
    }
    try {
      const urls = [];
      for (const file of files) {
        const { url, error: upErr } = await upload({ file });
        if (upErr) throw new Error(upErr);
        if (url) urls.push(url);
      }
      await submitMutation.mutateAsync({
        project_id: parseInt(selectedProjectId, 10),
        work_description: caption || "Site photos",
        urls,
      });
    } catch (e) {
      setError(e.message || "Upload failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 rounded-lg">
              <Camera className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Capture</h1>
              <p className="text-sm text-slate-600 mt-1">
                Upload site photos and attach to a project
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">Select active project…</option>
              {isLoading ? (
                <option>Loading…</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Photos
            </label>
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                dragOver ? "border-amber-500 bg-amber-50" : "border-slate-300"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onInputChange}
              />
              <div className="text-sm text-slate-600 mt-2">
                or drag and drop here
              </div>
            </div>
            {previews.length > 0 && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                {previews.map((p, i) => (
                  <div
                    key={i}
                    className="relative group border border-slate-200 rounded-lg overflow-hidden"
                  >
                    <img
                      src={p.url}
                      alt={p.name}
                      className="w-full h-28 object-cover"
                    />
                    {p.takenAt && (
                      <div className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-[10px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100">
                        Taken ~ {p.takenAt}
                      </div>
                    )}
                    <button
                      onClick={() => removePreview(i)}
                      className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100"
                    >
                      Remove
                    </button>
                    <div className="px-2 py-1 text-[11px] text-slate-600 truncate">
                      {p.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Caption (optional)
            </label>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What was done on site?"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
              Uploaded successfully
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={
                uploading || submitMutation.isLoading || !selectedProjectId
              }
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2"
            >
              <Upload size={16} />
              {uploading || submitMutation.isLoading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
