"use client";

import { useState } from "react";
import { useSearchParams } from "react-router";
import AccountShell, { AccountAlert, buttonClassName, inputClassName } from "@/components/account/AccountShell";

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!token) return setError("This invitation link is incomplete or invalid.");
    if (password !== confirmation) return setError("Passwords do not match.");
    setSubmitting(true);
    try {
      const response = await fetch("/api/team-invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to accept invitation");
      setSuccess("Your account is ready. You can now sign in.");
    } catch (cause) {
      setError(cause.message || "Unable to accept invitation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AccountShell title="Join the team" description="Create the password you will use for Arcan Painting admin.">
      <AccountAlert error={error} success={success} />
      {!success && <form onSubmit={submit} className="space-y-5">
        <label className="block text-sm font-medium text-slate-700">Full name
          <input autoComplete="name" maxLength="255" required value={name} onChange={(event) => setName(event.target.value)} className={inputClassName} />
        </label>
        <label className="block text-sm font-medium text-slate-700">Password
          <input type="password" autoComplete="new-password" minLength="6" required value={password} onChange={(event) => setPassword(event.target.value)} className={inputClassName} />
        </label>
        <label className="block text-sm font-medium text-slate-700">Confirm password
          <input type="password" autoComplete="new-password" minLength="6" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={inputClassName} />
        </label>
        <button type="submit" disabled={submitting} className={buttonClassName}>{submitting ? "Creating account…" : "Create account"}</button>
      </form>}
      {success && <p className="text-center text-sm"><a className="font-medium text-amber-700 hover:text-amber-800" href="/account/signin">Go to sign in</a></p>}
    </AccountShell>
  );
}
