"use client";

import { useEffect, useState } from "react";

const options = [
  ["estimate_follow_up", "Estimate follow-up"],
  ["dormant_lead", "Dormant lead reactivation"],
  ["review_request", "Review request"],
  ["referral_request", "Referral request"],
];

export default function MarketingAutomationQueue() {
  const [event, setEvent] = useState(options[0][0]);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState(null);
  const load = async () => {
    setError("");
    const response = await fetch(`/api/marketing-automation?event=${event}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(data.error || "Could not preview candidates");
    setPreview(data);
    setResult(null);
  };
  useEffect(() => {
    load().catch((cause) => setError(cause.message));
  }, [event]);
  const queue = async () => {
    if (
      !window.confirm(
        `Queue ${preview.candidate_count} consent-eligible messages for the active workflow?`,
      )
    )
      return;
    setWorking(true);
    setError("");
    try {
      const response = await fetch("/api/marketing-automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, confirm_queue: true }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || "Could not queue automation");
      setResult(data);
      await load();
      setResult(data);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setWorking(false);
    }
  };
  return (
    <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">
            Consent-aware lifecycle queue
          </h2>
          <p className="text-sm text-slate-600">
            Preview eligible customers before staging any follow-up, review, or
            referral message.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Lifecycle automation"
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {options.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => load().catch((cause) => setError(cause.message))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
          >
            Refresh preview
          </button>
          <button
            type="button"
            disabled={
              !preview?.execution_enabled ||
              !preview?.candidate_count ||
              working
            }
            onClick={queue}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Queue eligible
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {preview && (
        <p className="mt-3 text-sm text-slate-700">
          <strong>{preview.candidate_count}</strong> opted-in candidate
          {preview.candidate_count === 1 ? "" : "s"}.{" "}
          {!preview.execution_enabled &&
            "Queueing and delivery remain disabled by environment configuration."}
        </p>
      )}
      {result && (
        <p role="status" className="mt-2 text-sm text-green-700">
          Queued {result.queued} message{result.queued === 1 ? "" : "s"}.
        </p>
      )}
    </section>
  );
}
