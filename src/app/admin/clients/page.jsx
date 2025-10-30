"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Search, Mail, Phone, MapPin } from "lucide-react";

export default function ClientsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["clients", { search }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("status", "won");
      if (search.trim()) qs.set("search", search.trim());
      const res = await fetch(`/api/leads?${qs.toString()}`);
      if (!res.ok) {
        throw new Error(
          `When fetching /api/leads (clients), the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const clients = data?.leads || [];

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const s = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name?.toLowerCase().includes(s) ||
        c.email?.toLowerCase().includes(s) ||
        c.phone?.toLowerCase().includes(s) ||
        c.address?.toLowerCase().includes(s),
    );
  }, [clients, search]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Users size={22} /> Clients
              </h1>
              <p className="text-slate-600">All customers marked as Won</p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm"
            >
              Refresh
            </button>
          </div>

          <div className="mt-4 relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-slate-600">Loading…</div>
        ) : error ? (
          <div className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            {(error && error.message) || "Failed to load clients"}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-600">
            No clients found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-slate-200 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-slate-900 truncate">
                    {c.name}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
                    Won
                  </span>
                </div>
                {c.address && (
                  <div className="text-sm text-slate-600 flex items-center gap-2 mb-2">
                    <MapPin size={14} />
                    <span className="truncate">{c.address}</span>
                  </div>
                )}
                <div className="text-sm text-slate-700 space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail size={14} /> {c.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} /> {c.phone}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <a
                    href={`mailto:${c.email}`}
                    className="px-3 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
                  >
                    Email
                  </a>
                  <a
                    href={`tel:${c.phone}`}
                    className="px-3 py-2 text-sm bg-slate-700 hover:bg-slate-800 text-white rounded-lg"
                  >
                    Call
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
