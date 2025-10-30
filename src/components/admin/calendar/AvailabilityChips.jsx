import { useState, useCallback } from "react";
import { Plus, Save, X, Trash2, Pencil } from "lucide-react";
import { AVAIL_COLORS, AVAIL_OPTIONS, formatTime } from "@/utils/calendarUtils";

export function AvailabilityChips({
  date,
  availabilityByDate,
  availLoading,
  availError,
  teamMembersData,
  teamMembersLoading,
  teamMembersError,
  startDateISO,
  endDateISO,
  createAvailability,
  updateAvailability,
  deleteAvailability,
}) {
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({});

  const items = availabilityByDate.get(date) || [];
  const teamMembers = Array.isArray(teamMembersData) ? teamMembersData : [];

  const toTimeHHMM = useCallback((val) => {
    if (!val) return "";
    const s = String(val);
    return s.length >= 5 ? s.slice(0, 5) : s;
  }, []);

  const onStartAdd = () => {
    const firstMemberId = teamMembers[0]?.id || "";
    setAdding(true);
    setDraft({
      team_member_id: firstMemberId,
      date,
      start_time: "09:00",
      end_time: "17:00",
      availability_type: "available",
      notes: "",
    });
  };

  const onCancel = () => {
    setAdding(false);
    setEditingId(null);
    setDraft({});
  };

  const saveNew = async () => {
    try {
      await createAvailability.mutateAsync(draft);
      onCancel();
    } catch (e) {
      console.error(e);
      alert("Could not add availability");
    }
  };

  const saveEdit = async () => {
    try {
      await updateAvailability.mutateAsync({ id: editingId, ...draft });
      onCancel();
    } catch (e) {
      console.error(e);
      alert("Could not update availability");
    }
  };

  const onDelete = async (id) => {
    const confirmed = confirm("Delete this availability?");
    if (!confirmed) return;
    try {
      await deleteAvailability.mutateAsync({ id });
      if (editingId === id) onCancel();
    } catch (e) {
      console.error(e);
      alert("Could not delete availability");
    }
  };

  const onChipClick = (it) => {
    setEditingId(it.id);
    setAdding(false);
    setDraft({
      date: it.date,
      start_time: toTimeHHMM(it.start_time),
      end_time: toTimeHHMM(it.end_time),
      availability_type: it.availability_type,
      notes: it.notes || "",
    });
  };

  if (availLoading) {
    return (
      <div className="px-6 py-2 text-xs text-slate-500">
        Loading team availability…
      </div>
    );
  }

  if (availError) {
    return (
      <div className="px-6 py-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded mx-6">
        Failed to load team availability
      </div>
    );
  }

  const hasItems = items.length > 0;
  const noMembers = teamMembers.length === 0;

  const addBtn = (
    <button
      onClick={onStartAdd}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border ${noMembers ? "border-slate-200 text-slate-400 cursor-not-allowed" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}
      title={noMembers ? "Add a team member first" : "Add availability"}
      disabled={teamMembersLoading || !!teamMembersError || noMembers}
    >
      <Plus size={14} />{" "}
      {noMembers ? "Add availability (no members)" : "Add availability"}
    </button>
  );

  const headerBar = (
    <div className="px-6 pt-2 flex items-center justify-between">
      <div className="text-xs text-slate-500">
        {hasItems
          ? `${items.length} entr${items.length === 1 ? "y" : "ies"}`
          : noMembers
            ? "No team members yet — add a member to set availability"
            : "No team availability added"}
      </div>
      {addBtn}
    </div>
  );

  const editorRow = (
    <div className="px-6 pb-2">
      <div className="mt-2 grid grid-cols-1 md:grid-cols-5 gap-2">
        {adding ? (
          <label className="text-xs text-slate-600 flex flex-col">
            <span className="mb-1">Member</span>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={draft.team_member_id || ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  team_member_id: Number(e.target.value),
                }))
              }
            >
              <option value="" disabled>
                {teamMembersLoading ? "Loading…" : "Select member"}
              </option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="text-xs text-slate-600 flex flex-col">
          <span className="mb-1">Type</span>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={draft.availability_type || "available"}
            onChange={(e) =>
              setDraft((d) => ({ ...d, availability_type: e.target.value }))
            }
          >
            {AVAIL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-slate-600 flex flex-col">
          <span className="mb-1">Start</span>
          <input
            type="time"
            className="border rounded px-2 py-1 text-sm"
            value={draft.start_time || ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, start_time: e.target.value }))
            }
          />
        </label>

        <label className="text-xs text-slate-600 flex flex-col">
          <span className="mb-1">End</span>
          <input
            type="time"
            className="border rounded px-2 py-1 text-sm"
            value={draft.end_time || ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, end_time: e.target.value }))
            }
          />
        </label>

        <div className="flex items-end gap-2">
          {adding ? (
            <button
              onClick={saveNew}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 text-white text-sm"
              disabled={createAvailability.isLoading}
            >
              <Save size={14} /> Save
            </button>
          ) : (
            <button
              onClick={saveEdit}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 text-white text-sm"
              disabled={updateAvailability.isLoading}
            >
              <Save size={14} /> Save
            </button>
          )}
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-slate-300 text-slate-700 text-sm"
          >
            <X size={14} /> Cancel
          </button>
          {!adding && editingId ? (
            <button
              onClick={() => onDelete(editingId)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-rose-200 text-rose-700 text-sm hover:bg-rose-50"
              disabled={deleteAvailability.isLoading}
            >
              <Trash2 size={14} /> Delete
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  const chipsRow = (
    <div className="px-6 py-2 flex flex-wrap gap-2">
      {items.map((it) => {
        const color =
          AVAIL_COLORS[it.availability_type] || AVAIL_COLORS.available;
        const time = `${formatTime(String(it.start_time).slice(0, 5))}–${formatTime(String(it.end_time).slice(0, 5))}`;
        const isEditing = editingId === it.id;
        const chipInner = (
          <span className="inline-flex items-center gap-1.5">
            <span className="font-medium">{it.team_member_name}</span>
            <span className="opacity-80">{time}</span>
          </span>
        );

        if (isEditing) {
          return (
            <div key={it.id} className="w-full">
              {editorRow}
            </div>
          );
        }

        return (
          <button
            key={it.id}
            onClick={() => onChipClick(it)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${color} hover:opacity-90`}
            title={`${it.team_member_name} • ${it.availability_type}`}
          >
            {chipInner}
            <Pencil size={12} className="opacity-70" />
          </button>
        );
      })}
    </div>
  );

  return (
    <div>
      {headerBar}
      {adding || editingId ? editorRow : null}
      {hasItems ? chipsRow : null}
      {!hasItems && !adding ? (
        <div className="px-6 pb-2 text-xs text-slate-500">
          Add availability to show it here.
        </div>
      ) : null}
    </div>
  );
}
