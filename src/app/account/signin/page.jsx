"use client";

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import AccountShell, { AccountAlert, buttonClassName, inputClassName } from "@/components/account/AccountShell";

export default function SignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/local-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to sign in");
      const requestedPath = searchParams.get("callbackUrl");
      // Painters and other crew roles can't open the admin; they get the crew view.
      const home = ["owner", "admin"].includes(data.user?.role) ? "/admin" : "/crew";
      const target = requestedPath?.startsWith("/") && (home === "/admin" || requestedPath.startsWith("/crew")) ? requestedPath : home;
      navigate(target, { replace: true });
    } catch (cause) {
      setError(cause.message || "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AccountShell title="Sign in" description="Use your Arcan Painting admin account to continue.">
      <AccountAlert error={error} />
      <form onSubmit={submit} className="space-y-5">
        <label className="block text-sm font-medium text-slate-700">Email
          <input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className={inputClassName} />
        </label>
        <label className="block text-sm font-medium text-slate-700">Password
          <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className={inputClassName} />
        </label>
        <button type="submit" disabled={submitting} className={buttonClassName}>{submitting ? "Signing in…" : "Sign in"}</button>
      </form>
      <p className="mt-5 text-center text-sm"><a className="font-medium text-amber-700 hover:text-amber-800" href="/account/forgot-password">Forgot your password?</a></p>
    </AccountShell>
  );
}
