import { useEffect, useState } from "react";
import { Camera, MapPin, Phone, CheckCircle2, LogOut } from "lucide-react";
import useUpload from "@/utils/useUpload";

const day = (v) =>
  v ? new Date(`${String(v).slice(0, 10)}T12:00:00`).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" }) : "Date not set";

// Crew view: this fortnight's assigned jobs, where they are, what's in scope,
// and a quick way to send progress photos. No prices, invoices or payments.
export default function CrewPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = () =>
    fetch("/api/crew/jobs")
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Could not load your jobs.");
        setData(body);
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    document.title = "My jobs · Arcan Painting";
    load();
  }, []);

  const signOut = async () => {
    await fetch("/api/local-auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    window.location.assign("/account/signin");
  };

  return (
    <div className="min-h-screen bg-stone-100 text-slate-900">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10" style={{ top: "env(safe-area-inset-top, 0px)" }}>
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Arcan Painting</p>
            <h1 className="font-bold text-lg">{data?.name ? `${data.name}'s jobs` : "My jobs"}</h1>
          </div>
          <button onClick={signOut} className="p-2 rounded-lg text-slate-500 hover:bg-stone-100" aria-label="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-4">
        {error && <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
        {!data && !error && <p className="text-slate-600">Loading…</p>}
        {data && data.jobs.length === 0 && (
          <p className="bg-white rounded-2xl border border-stone-200 p-6 text-slate-600">
            No jobs assigned to you for the next two weeks. Check with the office if that looks wrong.
          </p>
        )}
        {data?.jobs.map((job) => <JobCard key={job.id} job={job} onReported={load} />)}
      </main>
    </div>
  );
}

function JobCard({ job, onReported }) {
  const [upload, { loading: uploading }] = useUpload();
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const addPhotos = async (files) => {
    setMessage(null);
    for (const file of files) {
      const { url, error } = await upload({ file });
      if (error) {
        setMessage({ error: `${file.name}: ${error}` });
        return;
      }
      setPhotos((current) => [...current, url]);
    }
  };

  const send = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/crew/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: job.id, note, photos }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not send the update.");
      setNote("");
      setPhotos([]);
      setMessage({ ok: "Update sent to the office." });
      onReported();
    } catch (e) {
      setMessage({ error: e.message });
    } finally {
      setSaving(false);
    }
  };

  const mapUrl = job.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}` : null;

  return (
    <article className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-lg leading-tight">{job.project_name}</h2>
          <p className="text-sm text-slate-600">
            {day(job.start_date)}
            {job.end_date ? ` – ${day(job.end_date)}` : ""}
          </p>
        </div>
        <span className="text-xs font-medium rounded-full px-2.5 py-1 bg-stone-100 capitalize">{String(job.status).replace("_", " ")}</span>
      </div>

      <div className="text-sm space-y-1">
        {job.customer_name && <p className="font-medium">{job.customer_name}</p>}
        {job.address && (
          <a href={mapUrl} target="_blank" rel="noreferrer" className="flex items-start gap-2 text-amber-800 underline-offset-2 hover:underline">
            <MapPin size={16} className="mt-0.5 shrink-0" /> {job.address}
          </a>
        )}
        {job.customer_phone && (
          <a href={`tel:${job.customer_phone}`} className="flex items-center gap-2 text-slate-700">
            <Phone size={16} /> {job.customer_phone}
          </a>
        )}
      </div>

      {(job.scope || job.areas.length > 0 || job.notes) && (
        <div className="text-sm bg-stone-50 rounded-xl p-3 space-y-2">
          {job.areas.length > 0 && <p><span className="text-slate-500">Areas: </span>{job.areas.join(", ")}</p>}
          {job.scope && <p className="whitespace-pre-wrap">{job.scope}</p>}
          {job.notes && <p className="whitespace-pre-wrap text-slate-600">{job.notes}</p>}
        </div>
      )}

      <div className="border-t border-stone-100 pt-3 space-y-2">
        <p className="text-xs text-slate-500">{Number(job.report_count)} update{Number(job.report_count) === 1 ? "" : "s"} sent so far</p>
        {photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {photos.map((url) => <img key={url} src={url} alt="Progress" className="h-16 w-16 object-cover rounded-lg" />)}
          </div>
        )}
        <textarea
          id={`crew-note-${job.id}`}
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What got done today? Any issues?"
          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
        />
        <div className="flex gap-2">
          <label className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-stone-300 font-medium cursor-pointer">
            <Camera size={18} /> {uploading ? "Uploading…" : "Add photos"}
            <input
              id={`crew-photos-${job.id}`}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="sr-only"
              onChange={(e) => addPhotos([...e.target.files])}
            />
          </label>
          <button
            onClick={send}
            disabled={saving || uploading || (!note.trim() && photos.length === 0)}
            className="flex-1 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold disabled:opacity-50"
          >
            {saving ? "Sending…" : "Send update"}
          </button>
        </div>
        {message?.error && <p role="alert" className="text-sm text-red-700">{message.error}</p>}
        {message?.ok && <p className="text-sm text-green-700 flex items-center gap-1"><CheckCircle2 size={16} /> {message.ok}</p>}
      </div>
    </article>
  );
}
