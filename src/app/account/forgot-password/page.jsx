"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const requestMutation = useMutation({
    mutationFn: async ({ emailOrUsername }) => {
      setError(null);
      const res = await fetch("/api/local-auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed with status ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => setSuccess(true),
    onError: (e) => setError(e.message || "Could not request reset"),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f4ef] px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-slate-900 text-center mb-1">
          Forgot Password
        </h1>
        <p className="text-center text-slate-600 mb-6">
          Enter your admin email and we'll send you a reset link.
        </p>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
            If an account exists, a reset link has been sent.
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
                requestMutation.mutate({ emailOrUsername: identifier });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Enter your admin email"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={requestMutation.isLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-2 transition-colors"
              >
                {requestMutation.isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <a
            href="/account/signin"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Back to Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
