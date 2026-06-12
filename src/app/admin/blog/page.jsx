"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { Eye, Edit, Trash2, Plus, FileText } from "lucide-react";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        status === "published"
          ? "bg-green-100 text-green-800"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

async function fetchPosts(status) {
  const url = status ? `/api/admin/blog?status=${status}` : "/api/admin/blog";
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load posts");
  return res.json();
}

async function deletePost(id) {
  const res = await fetch(`/api/admin/blog/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete");
  return id;
}

export default function AdminBlogPage() {
  const [filterStatus, setFilterStatus] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: posts = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-posts", filterStatus],
    queryFn: () => fetchPosts(filterStatus || undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
    },
  });

  const handleDelete = (post) => {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    deleteMutation.mutate(post.id);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage painting tips & guides for arcanpainting.ca
          </p>
        </div>
        <Link
          to="/admin/blog/new"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Plus size={16} />
          New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {["", "draft", "published"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === s
                ? "bg-[#1a2744] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16 text-red-600 bg-red-50 rounded-xl border border-red-200">
          <p className="font-medium">Failed to load posts</p>
          <p className="text-sm text-red-500 mt-1">{error.message}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-gray-200">
          <FileText className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-500 font-medium">No posts yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            Create your first blog post to get started.
          </p>
          <Link
            to="/admin/blog/new"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Plus size={14} />
            Create First Post
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Slug</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Published</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Author</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900 line-clamp-1">{post.title}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{post.slug}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={post.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(post.published_at)}</td>
                  <td className="px-4 py-3 text-gray-500">{post.author_username || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {post.status === "published" && (
                        <Link
                          to={`/blog/${post.slug}`}
                          target="_blank"
                          className="p-2 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
                          title="View post"
                        >
                          <Eye size={15} />
                        </Link>
                      )}
                      <Link
                        to={`/admin/blog/${post.id}`}
                        className="p-2 text-gray-400 hover:text-[#1a2744] rounded-lg hover:bg-gray-100 transition-colors"
                        title="Edit post"
                      >
                        <Edit size={15} />
                      </Link>
                      <button
                        onClick={() => handleDelete(post)}
                        disabled={deleteMutation.isPending}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                        title="Delete post"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
