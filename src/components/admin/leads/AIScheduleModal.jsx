"use client";

/**
 * AIScheduleModal
 * 
 * Shows when admin clicks "Schedule Estimate" on a lead.
 * Calls the AI estimator-scheduler agent and displays:
 * - Lead summary
 * - 3 suggested appointment slots (selectable)
 * - Pre-visit checklist
 * - Confirmation message drafts
 */

import { useState } from "react";
import { X, Calendar, Clock, MapPin, CheckSquare, MessageSquare, Bot, Loader2, AlertCircle } from "lucide-react";

export default function AIScheduleModal({ lead, onClose, onSlotSelected }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const runAgent = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/agents/schedule-estimator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Agent failed");
      }

      if (data.schedule) {
        setSchedule(data.schedule);
      } else {
        setError("Agent ran but returned no schedule. Check OpenClaw status.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSlot = () => {
    if (!selectedSlot || !onSlotSelected) return;
    onSlotSelected(selectedSlot, schedule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">AI Schedule Estimate</h2>
              <p className="text-sm text-slate-500">for {lead.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Lead Info */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4" />
              <span>{lead.address || "Address not on file"}</span>
            </div>
            <div className="text-slate-700 font-medium">{lead.service_type}</div>
            {lead.project_description && (
              <p className="text-slate-600 italic">"{lead.project_description}"</p>
            )}
          </div>

          {/* Initial state — run agent */}
          {!schedule && !loading && (
            <div className="text-center py-8">
              <p className="text-slate-600 mb-4">
                The AI will analyze this lead and suggest optimal appointment slots, prepare a pre-visit checklist, and draft confirmation messages.
              </p>
              <button
                onClick={runAgent}
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors"
              >
                <Bot className="w-4 h-4" />
                Run Scheduling Agent
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
              <p className="text-slate-600">AI is preparing schedule package...</p>
              <p className="text-slate-400 text-sm mt-1">This may take 30–60 seconds</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium">Agent Error</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <button onClick={runAgent} className="text-red-600 underline text-sm mt-2">Try again</button>
              </div>
            </div>
          )}

          {/* Schedule Results */}
          {schedule && (
            <div className="space-y-6">
              {/* Lead Summary */}
              {schedule.lead_summary && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">Lead Summary</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{schedule.lead_summary}</p>
                </div>
              )}

              {/* Suggested Slots */}
              {schedule.suggested_slots?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Suggested Slots</h3>
                  <div className="space-y-2">
                    {schedule.suggested_slots.map((slot, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedSlot(slot)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          selectedSlot === slot
                            ? "border-amber-500 bg-amber-50"
                            : "border-slate-200 hover:border-amber-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-amber-600" />
                          <span className="font-medium text-slate-900">{slot.date} at {slot.time}</span>
                          <span className="text-slate-500 text-sm ml-auto flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {slot.duration_minutes} min
                          </span>
                        </div>
                        {slot.reasoning && (
                          <p className="text-slate-500 text-sm mt-1 ml-6">{slot.reasoning}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Checklist */}
              {schedule.estimate_checklist?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">On-Site Checklist</h3>
                  <ul className="space-y-1.5">
                    {schedule.estimate_checklist.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckSquare className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Confirmation Message Preview */}
              {schedule.confirmation_message?.sms && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Draft Confirmation SMS
                  </h3>
                  <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 italic">
                    {schedule.confirmation_message.sms}
                  </div>
                  <p className="text-slate-400 text-xs mt-1">Edit and send once you've confirmed the slot</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {schedule && (
          <div className="p-6 border-t border-slate-200 flex items-center justify-between">
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-sm">
              Cancel
            </button>
            <button
              onClick={handleConfirmSlot}
              disabled={!selectedSlot}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              {selectedSlot ? `Book ${selectedSlot.date} at ${selectedSlot.time}` : "Select a Slot"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
