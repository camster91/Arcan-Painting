"use client";

import { useState, useEffect } from "react";
import { MapPin, ArrowLeft, Plus, RefreshCw, Loader2, CheckCircle, AlertCircle, Globe, Info } from "lucide-react";

export default function CitationsPage() {
  const [citations, setCitations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/marketing/citations");
        if (res.ok) {
          const data = await res.json();
          setCitations(data.citations || []);
        }
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/admin/marketing" className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="w-5 h-5" />
              </a>
              <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Local Citations</h1>
                <p className="text-sm text-gray-500">Business directory listings & NAP consistency</p>
              </div>
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600"
            >
              <Plus className="w-4 h-4" />
              Add Citation
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Total Listings", value: String(citations.length), icon: Globe, color: "text-red-600 bg-red-50" },
            { label: "Verified", value: String(citations.filter(c => c.status === "verified").length), icon: CheckCircle, color: "text-green-600 bg-green-50" },
            { label: "Needs Attention", value: String(citations.filter(c => c.status !== "verified").length), icon: AlertCircle, color: "text-orange-600 bg-orange-50" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <span className="text-xs text-gray-500">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Local SEO Citations</h3>
              <p className="text-sm text-red-700 mt-1">
                Track and manage your business listings across Google Business Profile, Yelp, HomeStars,
                and other directories. Consistent NAP (Name, Address, Phone) across all listings improves
                your local search ranking.
              </p>
            </div>
          </div>
        </div>

        {/* Listings */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              Directory Listings {citations.length > 0 && <span className="text-gray-400 font-normal">({citations.length})</span>}
            </h2>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto" />
            </div>
          ) : citations.length === 0 ? (
            <div className="py-16 text-center">
              <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No citations tracked yet</p>
              <p className="text-gray-400 text-xs mt-1">Add your business directory listings to monitor NAP consistency</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {citations.map((c) => (
                <div key={c.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.directory_name || c.platform}</p>
                    {c.listing_url && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-md">{c.listing_url}</p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.status === "verified"
                        ? "bg-green-50 text-green-700"
                        : "bg-orange-50 text-orange-700"
                    }`}
                  >
                    {c.status === "verified" ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {c.status || "pending"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
