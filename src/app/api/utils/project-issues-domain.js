const transitions = {
  open: new Set(["in_progress", "resolved", "void"]),
  in_progress: new Set(["open", "resolved", "void"]),
  resolved: new Set(["open"]),
  void: new Set(),
};

export const PROJECT_ISSUE_TYPES = new Set(["damage", "access", "material", "schedule", "safety", "quality", "customer", "other"]);
export const PROJECT_ISSUE_SEVERITIES = new Set(["low", "medium", "high", "critical"]);

export function canTransitionProjectIssue(from, to, { owner = false } = {}) {
  if (from === to) return true;
  if (to === "void" && !owner) return false;
  return Boolean(transitions[from]?.has(to));
}

export function validateProjectIssueInput(input) {
  const type = input.issue_type || "other"; const severity = input.severity || "medium";
  if (!PROJECT_ISSUE_TYPES.has(type)) throw new Error("Issue type is invalid");
  if (!PROJECT_ISSUE_SEVERITIES.has(severity)) throw new Error("Severity is invalid");
  if (typeof input.title !== "string" || input.title.trim().length < 3 || input.title.trim().length > 255) throw new Error("Issue title must be between 3 and 255 characters");
  if (typeof input.description !== "string" || input.description.trim().length < 3 || input.description.trim().length > 5000) throw new Error("Issue description must be between 3 and 5000 characters");
  return { type, severity, title: input.title.trim(), description: input.description.trim() };
}
