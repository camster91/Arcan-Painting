"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/local-auth/me");
        if (!res.ok) {
          const url = new URL(window.location.href);
          const redirect = encodeURIComponent(url.pathname);
          window.location.href = `/account/signin?callbackUrl=${redirect}`;
        }
      } catch {
        window.location.href = `/account/signin`;
      }
    };
    check();
  }, []);

  const changeMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => {
      setError(null);
      setSuccess(null);
      const res = await fetch("/api/local-auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed with status ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      setSuccess("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
    },
    onError: (e) => setError(e.message || "Could not update password"),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f4ef] px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-slate-900 text-center mb-1">
          Change Password
        </h1>
        <p className="text-center text-slate-600 mb-6">
          Update your admin password.
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
            {success}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            changeMutation.mutate({ currentPassword, newPassword });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Enter your current password"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Enter your new password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={changeMutation.isLoading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-2 transition-colors"
          >
            {changeMutation.isLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
