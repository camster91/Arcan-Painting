"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";

export default function AcceptInvitePage() {
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const t = url.searchParams.get("token") || "";
      setToken(t);
    }
  }, []);

  const acceptMutation = useMutation({
    mutationFn: async ({ token, name, password }) => {
      setError(null);
      const res = await fetch("/api/team-invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed with status ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => setSuccess(true),
    onError: (e) => setError(e.message || "Could not accept invite"),
  });

  const canSubmit = token && name && password;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f4ef] px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-slate-900 text-center mb-1">
          Create Your Account
        </h1>
        <p className="text-center text-slate-600 mb-6">
          Set your name and password to join the team.
        </p>

        {success ? (
          <div>
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
              Your account is ready. You can now sign in.
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
                acceptMutation.mutate({ token, name, password });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={!canSubmit || acceptMutation.isLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-2 transition-colors"
              >
                {acceptMutation.isLoading ? "Creating..." : "Create Account"}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-slate-600 hover:text-slate-900">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
