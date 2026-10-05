"use client";
import { useId, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function CustomerNoteForm({ leadId }) {
  const fieldId = useId();
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const attempt = useRef(null);
  const client = useQueryClient();
  // Targeted invalidation after acknowledgement follows TanStack Query v5:
  // https://tanstack.com/query/v5/docs/framework/react/guides/invalidations-from-mutations
  const mutation = useMutation({
    retry: false,
    gcTime: 0,
    mutationFn: async (payload) => {
      const token = document.cookie.match(/(?:^|;\s*)arcan_csrf=([^;]+)/)?.[1];
      const response = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST", headers: { "Content-Type": "application/json", ...(token ? { "x-csrf-token": decodeURIComponent(token) } : {}) }, body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) throw new Error(body.error || "Could not confirm the note was saved. Retry the same note.");
      return body;
    },
    onSuccess: () => {
      setText(""); setSaved(true); attempt.current = null;
      client.invalidateQueries({ queryKey: ["customer-timeline", leadId] });
    },
  });
  const submit = (event) => {
    event.preventDefault();
    const content = text.trim();
    if (!content || content.length > 2000 || mutation.isPending) return;
    if (!attempt.current || attempt.current.text !== content) attempt.current = { text: content, requestId: crypto.randomUUID() };
    mutation.mutate(attempt.current);
  };
  return <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
    <label htmlFor={fieldId} className="block text-sm font-medium text-slate-800">Add an internal note</label>
    <textarea id={fieldId} value={text} maxLength={2000} rows={3} disabled={mutation.isPending} onChange={(event) => { setText(event.target.value); setSaved(false); }} className="block w-full rounded-lg border border-slate-300 p-3 text-sm" />
    <p className="text-xs text-slate-500">Visible to staff only. Saved notes keep their author and timestamp.</p>
    {mutation.error && <p role="alert" className="text-sm text-red-800">{mutation.error.message}</p>}
    {saved && <p role="status" className="text-sm text-green-800">Note saved.</p>}
    <button type="submit" disabled={!text.trim() || mutation.isPending} aria-busy={mutation.isPending} className="min-h-11 px-4 py-2 rounded-lg bg-amber-600 text-white font-medium disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-800">{mutation.isPending ? "Saving note…" : "Save note"}</button>
  </form>;
}
