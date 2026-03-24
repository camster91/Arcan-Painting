"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { Link } from "react-router";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}

function extractHeadings(markdown) {
  const lines = markdown.split("\n");
  const headings = [];
  for (const line of lines) {
    const m2 = line.match(/^## (.+)/);
    const m3 = line.match(/^### (.+)/);
    if (m2) {
      const text = m2[1].trim();
      headings.push({ level: 2, text, id: text.toLowerCase().replace(/[^a-z0-9]+/g, "-") });
    } else if (m3) {
      const text = m3[1].trim();
      headings.push({ level: 3, text, id: text.toLowerCase().replace(/[^a-z0-9]+/g, "-") });
    }
  }
  return headings;
}

function TableOfContents({ headings }) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "0px 0px -60% 0px" }
    );
    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="sticky top-24 bg-gray-50 rounded-2xl p-5 border border-gray-100 max-h-[70vh] overflow-y-auto">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">On this page</p>
      <ul className="space-y-1">
        {headings.map(({ id, text, level }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={`block text-sm py-0.5 transition-colors hover:text-amber-600 ${
                level === 3 ? "pl-3 text-gray-500" : "text-gray-700"
              } ${activeId === id ? "text-amber-600 font-medium" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Custom components to add IDs to headings
function H2({ children }) {
  const text = typeof children === "string" ? children : String(children);
  const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return <h2 id={id} className="text-2xl font-bold text-gray-900 mt-10 mb-4 leading-tight">{children}</h2>;
}
function H3({ children }) {
  const text = typeof children === "string" ? children : String(children);
  const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return <h3 id={id} className="text-xl font-semibold text-gray-800 mt-7 mb-3">{children}</h3>;
}

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      fetch(`/api/posts/${slug}`).then((r) => r.ok ? r.json() : null),
      fetch("/api/posts").then((r) => r.json()),
    ]).then(([postData, allData]) => {
      if (!postData) {
        setNotFound(true);
      } else {
        setPost(postData);
        setAllPosts(allData);
        const rel = allData
          .filter((p) => p.category === postData.category && p.slug !== slug)
          .slice(0, 3);
        setRelated(rel);
      }
      setLoading(false);
    }).catch(() => {
      setNotFound(true);
      setLoading(false);
    });
  }, [slug]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-20 animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-3/4" />
          <div className="h-4 bg-gray-100 rounded mb-2 w-full" />
          <div className="h-4 bg-gray-100 rounded mb-2 w-5/6" />
          <div className="h-4 bg-gray-100 rounded w-4/6" />
        </div>
        <Footer />
      </>
    );
  }

  if (notFound || !post) {
    return (
      <>
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Post not found</h1>
          <Link to="/blog" className="text-amber-600 hover:underline">← Back to blog</Link>
        </div>
        <Footer />
      </>
    );
  }

  const headings = extractHeadings(post.content || "");

  // Find prev/next
  const sortedPosts = [...allPosts];
  const currentIndex = sortedPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <div className="relative w-full h-64 md:h-96 overflow-hidden bg-gray-900">
          {post.featuredImage && (
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-4xl mx-auto px-4 pb-8 w-full">
              <span className="inline-block text-xs font-semibold text-amber-400 bg-amber-900/50 px-3 py-1 rounded-full mb-3">
                {post.category}
              </span>
              <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight max-w-3xl">
                {post.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Meta bar */}
        <div className="border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{formatDate(post.date)}</span>
              <span>·</span>
              <span>{post.readTime}</span>
              <span>·</span>
              <span>By Arcan Painting Team</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-600 transition-colors border border-gray-200 rounded-lg px-3 py-1.5"
            >
              {copied ? "✓ Copied!" : "🔗 Copy link"}
            </button>
          </div>
        </div>

        {/* Content + Sidebar */}
        <div className="max-w-5xl mx-auto px-4 py-10 flex gap-10">
          {/* Main content */}
          <article className="flex-1 min-w-0">
            <div className="prose prose-lg max-w-none"
              style={{
                lineHeight: "1.8",
                fontSize: "1.05rem",
              }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: H2,
                  h3: H3,
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4">{children}</h1>
                  ),
                  p: ({ children }) => (
                    <p className="text-gray-700 mb-5 leading-[1.85]">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-6 mb-5 space-y-1 text-gray-700">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-6 mb-5 space-y-1 text-gray-700">{children}</ol>
                  ),
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  strong: ({ children }) => (
                    <strong className="font-semibold text-gray-900">{children}</strong>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-amber-400 pl-4 italic text-gray-600 my-6">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-6">
                      <table className="w-full border-collapse text-sm">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-gray-50">{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold text-gray-700">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-gray-200 px-4 py-2 text-gray-600">{children}</td>
                  ),
                  tr: ({ children }) => <tr className="hover:bg-gray-50">{children}</tr>,
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="text-amber-600 hover:text-amber-700 underline"
                      target={href?.startsWith("http") ? "_blank" : undefined}
                      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      {children}
                    </a>
                  ),
                  hr: () => <hr className="my-8 border-gray-200" />,
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Author box */}
            <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4 items-start">
              <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center text-2xl flex-shrink-0">
                🖌️
              </div>
              <div>
                <p className="font-semibold text-gray-900">Arcan Painting Team</p>
                <p className="text-sm text-gray-600 mt-1">
                  Professional painting contractors serving Toronto and the GTA since 1995.
                  Family-owned across three generations. We write from real job-site experience —
                  not from reading other blogs.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 p-6 bg-[#1a2744] text-white rounded-2xl">
              <h3 className="text-xl font-bold mb-2">Ready to start your project?</h3>
              <p className="text-blue-100 mb-4 text-sm">
                Get a free, no-pressure estimate from our team. We'll walk through your space
                and give you a written quote — usually within 24 hours.
              </p>
              <a
                href="/#quote"
                className="inline-block bg-amber-500 hover:bg-amber-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Get a free quote →
              </a>
            </div>

            {/* Prev / Next */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prevPost && (
                <Link
                  to={`/blog/${prevPost.slug}`}
                  className="p-4 border border-gray-200 rounded-xl hover:border-amber-300 transition-colors group"
                >
                  <p className="text-xs text-gray-400 mb-1">← Previous</p>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-amber-600 transition-colors line-clamp-2">
                    {prevPost.title}
                  </p>
                </Link>
              )}
              {nextPost && (
                <Link
                  to={`/blog/${nextPost.slug}`}
                  className="p-4 border border-gray-200 rounded-xl hover:border-amber-300 transition-colors group text-right sm:col-start-2"
                >
                  <p className="text-xs text-gray-400 mb-1">Next →</p>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-amber-600 transition-colors line-clamp-2">
                    {nextPost.title}
                  </p>
                </Link>
              )}
            </div>
          </article>

          {/* Sidebar TOC (desktop only) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <TableOfContents headings={headings} />
          </aside>
        </div>

        {/* Related Posts */}
        {related.length > 0 && (
          <section className="bg-gray-50 py-12">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map((rp) => (
                  <Link
                    key={rp.slug}
                    to={`/blog/${rp.slug}`}
                    className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all"
                  >
                    {rp.featuredImage && (
                      <img
                        src={rp.featuredImage}
                        alt={rp.title}
                        className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    )}
                    <div className="p-4">
                      <span className="text-xs font-semibold text-amber-600">{rp.category}</span>
                      <p className="text-sm font-semibold text-gray-800 mt-1 group-hover:text-amber-600 transition-colors line-clamp-2">
                        {rp.title}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
