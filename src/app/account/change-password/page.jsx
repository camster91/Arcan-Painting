"use client";

import { useState } from "react";
import AccountShell, { AccountAlert, buttonClassName, inputClassName } from "@/components/account/AccountShell";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (newPassword !== confirmation) return setError("Passwords do not match.");
    setSubmitting(true);
    try {
      const response = await fetch("/api/local-auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to change password");
      setSuccess("Your password has been changed.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
    } catch (cause) {
      setError(cause.message || "Unable to change password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AccountShell title="Change password" description="Choose a password you do not reuse elsewhere.">
      <AccountAlert error={error} success={success} />
      <form onSubmit={submit} className="space-y-5">
        <label className="block text-sm font-medium text-slate-700">Current password
          <input type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={inputClassName} />
        </label>
        <label className="block text-sm font-medium text-slate-700">New password
          <input type="password" autoComplete="new-password" minLength="6" required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={inputClassName} />
        </label>
        <label className="block text-sm font-medium text-slate-700">Confirm new password
          <input type="password" autoComplete="new-password" minLength="6" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={inputClassName} />
        </label>
        <button type="submit" disabled={submitting} className={buttonClassName}>{submitting ? "Saving…" : "Change password"}</button>
      </form>
    </AccountShell>
  );
}
