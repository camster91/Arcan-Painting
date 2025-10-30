"use client";

import useUser from "@/utils/useUser";
import { User, Mail, Phone, Shield } from "lucide-react";

export default function ProfilePage() {
  const { data: user, loading, refetch } = useUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 rounded-lg">
              <User className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
              <p className="text-sm text-slate-600 mt-1">
                Your account information
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
          {loading ? (
            <div className="text-slate-600">Loading…</div>
          ) : !user ? (
            <div className="text-slate-600">User is not authenticated</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="text-sm text-slate-500">Name</div>
                  <div className="text-slate-900 font-medium">
                    {user.name || "—"}
                  </div>
                </div>
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="text-sm text-slate-500">Email</div>
                  <div className="text-slate-900 font-medium">
                    {user.email || "—"}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                  href="/account/change-password"
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-slate-900 font-medium">
                    <Shield size={16} /> Change Password
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    Update your password securely
                  </div>
                </a>
                <button
                  onClick={() => refetch()}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 text-slate-900 font-medium">
                    <User size={16} /> Refresh Profile
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    Reload your profile information
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
