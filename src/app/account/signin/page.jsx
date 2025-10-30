"use client";

import { useState, useMemo, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";

export default function SignInPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "/admin";
    const url = new URL(window.location.href);
    return url.searchParams.get("callbackUrl") || "/admin";
  }, []);

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }) => {
      setError(null);
      const res = await fetch("/api/local-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Show generic error to avoid hinting which field was wrong
        throw new Error(data.error || `Sign in failed`);
      }
      return res.json();
    },
    onSuccess: () => {
      if (typeof window !== "undefined") {
        window.location.href = callbackUrl || "/admin";
      }
    },
    onError: (e) => {
      console.error(e);
      setError("Invalid email or password");
    },
  });

  // If already logged in, redirect from here
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/local-auth/me");
        if (res.ok) {
          window.location.href = callbackUrl || "/admin";
        }
      } catch {}
    };
    check();
  }, [callbackUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f4ef] px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center mb-4">
          <img
            src="https://ucarecdn.com/5631c374-f418-4e89-beff-af262560ff31/-/format/auto/"
            alt="Logo"
            className="w-[80px] h-[80px] object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 text-center mb-1">
          Admin Sign In
        </h1>
        <p className="text-center text-slate-600 mb-6">
          Use your admin email to access the dashboard.
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            loginMutation.mutate({ username, password });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Enter your email"
              autoComplete="email"
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
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loginMutation.isLoading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-2 transition-colors"
          >
            {loginMutation.isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <a
            href="/account/forgot-password"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Forgot your password?
          </a>
        </div>

        {/* Removed insecure tip that reveals default credentials */}
      </div>
    </div>
  );
}
