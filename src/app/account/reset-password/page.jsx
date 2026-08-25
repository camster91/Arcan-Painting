"use client";

import { useState } from "react";
import { useSearchParams } from "react-router";
import AccountShell, { AccountAlert, buttonClassName, inputClassName } from "@/components/account/AccountShell";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!token) return setError("This reset link is incomplete or invalid.");
    if (password !== confirmation) return setError("Passwords do not match.");
    setSubmitting(true);
    try {
      const response = await fetch("/api/local-auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to reset password");
      setSuccess("Your password was reset. You can now sign in.");
    } catch (cause) {
      setError(cause.message || "Unable to reset password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AccountShell title="Choose a new password" description="Use at least 6 characters and keep it private.">
      <AccountAlert error={error} success={success} />
      {!success && <form onSubmit={submit} className="space-y-5">
        <label className="block text-sm font-medium text-slate-700">New password
          <input type="password" autoComplete="new-password" minLength="6" required value={password} onChange={(event) => setPassword(event.target.value)} className={inputClassName} />
        </label>
        <label className="block text-sm font-medium text-slate-700">Confirm new password
          <input type="password" autoComplete="new-password" minLength="6" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={inputClassName} />
        </label>
        <button type="submit" disabled={submitting} className={buttonClassName}>{submitting ? "Resetting…" : "Reset password"}</button>
      </form>}
      {success && <p className="text-center text-sm"><a className="font-medium text-amber-700 hover:text-amber-800" href="/account/signin">Go to sign in</a></p>}
    </AccountShell>
  );
}
