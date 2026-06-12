"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Eye, Loader2 } from "lucide-react";
import { Link } from "react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function fetchPost(id) {
  const res = await fetch(`/api/admin/blog/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load post");
  return res.json();
}

async function savePost(id, data) {
  const method = id ? "PUT" : "POST";
  const url = id ? `/api/admin/blog/${id}` : "/api/admin/blog";
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to save");
  }
  return res.json();
}

function PostForm({ post, onSave }) {
  const isEdit = !!post;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    slug: post?.slug || "",
    title: post?.title || "",
    excerpt: post?.excerpt || "",
    body: post?.body || "",
    cover_image_url: post?.cover_image_url || "",
    status: post?.status || "draft",
    meta_description: post?.meta_description || "",
    tags: post?.tags?.join(", ") || "",
  });

  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (data) => savePost(post?.id, data),
    onSuccess: (saved) => {
      onSave(saved);
      navigate(`/admin/blog/${saved.id}`);
    },
  });

  function validate() {
    const e = {};
    if (!form.slug) e.slug = "Slug is required";
    else if (!/^[a-z0-9-]+$/.test(form.slug)) e.slug = "Slug can only contain lowercase letters, numbers, and hyphens";
    if (!form.title) e.title = "Title is required";
    if (form.status === "published" && !form.published_at && !post?.published_at) {
      // Auto-set published_at when publishing
    }
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    const tags = form.tags
      ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    saveMutation.mutate({
      slug: form.slug,
      title: form.title,
      excerpt: form.excerpt,
      body: form.body,
      cover_image_url: form.cover_image_url,
      status: form.status,
      meta_description: form.meta_description,
      tags,
    });
  }

  function handleSlugFromTitle() {
    if (!isEdit && !form.slug) {
      setForm((f) => ({ ...f, slug: slugify(f.title) }));
    }
  }

  const inputClass = (field) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
      errors[field] ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"
    }`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/blog"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isEdit ? "Edit Post" : "New Post"}
            </h1>
            {post && (
              <p className="text-xs text-gray-500 mt-0.5">
                Last updated: {new Date(post.updated_at).toLocaleString("en-CA")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post?.status === "published" && post?.slug && (
            <Link
              to={`/blog/${post.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-amber-600 border border-gray-200 rounded-lg hover:border-amber-300 transition-colors"
            >
              <Eye size={14} />
              View
            </Link>
          )}
          <button
            onClick={() => setShowPreview((p) => !p)}
            className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showPreview ? "Edit" : "Preview Markdown"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
          >
            {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saveMutation.isPending ? "Saving…" : "Save Post"}
          </button>
        </div>
      </div>

      {saveMutation.isError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {saveMutation.error.message}
        </div>
      )}

      {showPreview ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{form.title || "Untitled"}</h2>
          <div className="prose prose-sm max-w-none text-gray-700">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.body || "_No content yet_"}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              onBlur={handleSlugFromTitle}
              placeholder="e.g. How to Choose the Right Paint Finish for Your Toronto Home"
              className={inputClass("title")}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
              placeholder="e.g. choosing-right-paint-finish-toronto-home"
              className={inputClass("slug")}
            />
            {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug}</p>}
            <p className="text-xs text-gray-400 mt-1">Lowercase letters, numbers, and hyphens only. URL: /blog/{form.slug || "your-slug"}</p>
          </div>

          {/* Cover Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
            <input
              type="url"
              value={form.cover_image_url}
              onChange={(e) => setForm((f) => ({ ...f, cover_image_url: e.target.value }))}
              placeholder="https://images.unsplash.com/photo-..."
              className={inputClass("cover_image_url")}
            />
            {form.cover_image_url && (
              <img
                src={form.cover_image_url}
                alt="Cover preview"
                className="mt-2 h-32 object-cover rounded-lg border border-gray-200"
                onError={(e) => (e.target.style.display = "none")}
              />
            )}
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              placeholder="A 1-2 sentence summary shown on post cards and in meta descriptions."
              rows={2}
              className={inputClass("excerpt")}
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body (Markdown)</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Write your post content in Markdown. ## for headings, **bold**, - for lists..."
              rows={18}
              className={`${inputClass("body")} font-mono text-sm leading-relaxed`}
            />
            <p className="text-xs text-gray-400 mt-1">
              Supports Markdown: ## Heading, **bold**, *italic*, - bullet lists, 1. numbered lists, [link](url), `code`
            </p>
          </div>

          {/* Status + Meta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="interior-painting, toronto, guide"
                className={inputClass("tags")}
              />
              <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
            </div>
          </div>

          {/* Meta Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
            <textarea
              value={form.meta_description}
              onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
              placeholder="SEO description (120-160 characters). Shown in search results."
              rows={2}
              className={inputClass("meta_description")}
              maxLength={200}
            />
            <p className="text-xs text-gray-400 mt-1">{form.meta_description.length}/200</p>
          </div>
        </form>
      )}
    </div>
  );
}

export default function AdminBlogFormPage({ postId }) {
  const queryClient = useQueryClient();

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ["admin-post", postId],
    queryFn: () => fetchPost(postId),
    enabled: !!postId,
  });

  function handleSave(saved) {
    queryClient.setQueryData(["admin-post", postId], saved);
    queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-red-600">Failed to load post.</p>
      </div>
    );
  }

  return <PostForm post={post} onSave={handleSave} />;
}
