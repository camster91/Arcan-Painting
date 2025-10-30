"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const t = url.searchParams.get("token") || "";
      setToken(t);
    }
  }, []);

  const resetMutation = useMutation({
    mutationFn: async ({ token, newPassword }) => {
      setError(null);
      const res = await fetch("/api/local-auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed with status ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => setSuccess(true),
    onError: (e) => setError(e.message || "Could not reset password"),
  });

  const canSubmit = token && newPassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f4ef] px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-slate-900 text-center mb-1">
          Reset Password
        </h1>
        <p className="text-center text-slate-600 mb-6">
          Enter your new password below.
        </p>

        {success ? (
          <div>
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
              Your password has been reset. You can now sign in.
            </div>
            <div className="text-center">
              <a
                href="/account/signin"
                className="text-sm text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-md inline-block"
              >
                Go to Sign In
              </a>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                {error}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                resetMutation.mutate({ token, newPassword });
              }}
              className="space-y-4"
            >
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
                disabled={!canSubmit || resetMutation.isLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-2 transition-colors"
              >
                {resetMutation.isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <a
            href="/account/forgot-password"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Back
          </a>
        </div>
      </div>
    </div>
  );
}
