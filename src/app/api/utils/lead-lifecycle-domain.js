export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "follow_up",
  "won",
  "lost",
];

const transitions = {
  new: new Set(["contacted", "lost"]),
  contacted: new Set(["qualified", "follow_up", "lost"]),
  qualified: new Set(["proposal_sent", "follow_up", "lost"]),
  proposal_sent: new Set(["follow_up", "won", "lost"]),
  follow_up: new Set(["contacted", "qualified", "proposal_sent", "won", "lost"]),
  won: new Set(),
  lost: new Set(["contacted"]),
};

export function canTransitionLead(from, to) {
  return from === to || Boolean(transitions[from]?.has(to));
}

export function assertLeadTransition(from, to) {
  if (!LEAD_STATUSES.includes(to)) throw new Error(`Unknown lead status: ${to}`);
  if (!canTransitionLead(from, to)) throw new Error(`Lead cannot move from ${from} to ${to}`);
}
