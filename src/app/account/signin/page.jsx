"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";

export default function SignInPage() {
  const [step, setStep] = useState("email"); // "email" | "code"
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const codeInputRef = useRef(null);

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "/admin";
    const url = new URL(window.location.href);
    return url.searchParams.get("callbackUrl") || "/admin";
  }, []);

  // Step 1: Request a code
  const requestCodeMutation = useMutation({
    mutationFn: async (emailVal) => {
      setError(null);
      const res = await fetch("/api/local-auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send code");
      }
      return res.json();
    },
    onSuccess: () => {
      setStep("code");
      // Auto-focus code input
      setTimeout(() => codeInputRef.current?.focus(), 50);
    },
    onError: (e) => {
      setError(e.message || "Failed to send code. Please try again.");
    },
  });

  // Step 2: Verify the code
  const verifyCodeMutation = useMutation({
    mutationFn: async ({ emailVal, codeVal }) => {
      setError(null);
      const res = await fetch("/api/local-auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal, code: codeVal }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Invalid code");
      }
      return res.json();
    },
    onSuccess: () => {
      if (typeof window !== "undefined") {
        window.location.href = callbackUrl || "/admin";
      }
    },
    onError: (e) => {
      setError(e.message || "Invalid or expired code. Please try again.");
    },
  });

  // If already logged in, redirect
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

  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const isLoading = requestCodeMutation.isPending || verifyCodeMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f4ef] px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center mb-4">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-[80px] h-[80px] object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 text-center mb-1">
          Admin Sign In
        </h1>
        <p className="text-center text-slate-600 mb-6">
          {step === "email"
            ? "Enter your admin email to receive a login code."
            : `Check your email for a sign-in link. You can also enter the 6-digit code below.`}
        </p>

        {error && (
          <div role="alert" aria-live="assertive" className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {step === "email" ? (
          /* ── Step 1: Enter email ─────────────────────────────────── */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              requestCodeMutation.mutate(email);
            }}
            className="space-y-4"
            aria-label="Sign in with email"
          >
            <div>
              <label htmlFor="signin-email" className="block text-sm font-medium text-slate-700 mb-1">
                Email <span className="sr-only">(required)</span>
              </label>
              <input
                id="signin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Enter your admin email"
                autoComplete="email"
                aria-required="true"
                autoFocus
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !email}
              aria-busy={requestCodeMutation.isPending}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-2 transition-colors"
            >
              {requestCodeMutation.isPending ? "Sending code…" : "Send Code"}
            </button>
          </form>
        ) : (
          /* ── Step 2: Enter 6-digit code ──────────────────────────── */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyCodeMutation.mutate({ emailVal: email, codeVal: code });
            }}
            className="space-y-4"
            aria-label="Enter verification code"
          >
            <div>
              <label htmlFor="signin-code" className="block text-sm font-medium text-slate-700 mb-1">
                6-digit code <span className="sr-only">(required)</span>
              </label>
              <div className="relative">
                <input
                  id="signin-code"
                  ref={codeInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500 text-center text-xl tracking-widest font-mono"
                  placeholder="000000"
                  autoComplete="one-time-code"
                  aria-required="true"
                  aria-describedby="signin-code-hint"
                  required
                />
                {code && (
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    aria-label={copied ? "Code copied" : "Copy verification code"}
                    title={copied ? "Code copied" : "Copy code"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {copied ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
              <p id="signin-code-hint" className="mt-1 text-xs text-slate-400">Code expires in 15 minutes</p>
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              aria-busy={verifyCodeMutation.isPending}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-2 transition-colors"
            >
              {verifyCodeMutation.isPending ? "Verifying…" : "Verify & Sign In"}
            </button>

            <div className="flex items-center justify-between text-sm text-slate-500">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError(null);
                }}
                className="hover:text-slate-800 underline"
              >
                ← Change email
              </button>
              <button
                type="button"
                onClick={() => requestCodeMutation.mutate(email)}
                disabled={requestCodeMutation.isPending}
                className="hover:text-slate-800 underline disabled:opacity-50"
              >
                Resend code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
