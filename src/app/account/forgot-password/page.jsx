"use client";

import { useState } from "react";
import AccountShell, { AccountAlert, buttonClassName, inputClassName } from "@/components/account/AccountShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/local-auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername: email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to request a reset link");
      setSuccess("If an account exists for that email, a reset link is on its way.");
    } catch (cause) {
      setError(cause.message || "Unable to request a reset link");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AccountShell title="Reset your password" description="Enter the email address you use for Arcan Painting admin.">
      <AccountAlert error={error} success={success} />
      <form onSubmit={submit} className="space-y-5">
        <label className="block text-sm font-medium text-slate-700">Email
          <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={inputClassName} />
        </label>
        <button type="submit" disabled={submitting} className={buttonClassName}>{submitting ? "Sending…" : "Email reset link"}</button>
      </form>
      <p className="mt-5 text-center text-sm"><a className="font-medium text-amber-700 hover:text-amber-800" href="/account/signin">Back to sign in</a></p>
    </AccountShell>
  );
}
