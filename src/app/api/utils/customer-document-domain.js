const SENDABLE_STATUSES = {
  estimate: new Set(["draft", "sent"]),
  contract: new Set(["draft", "sent"]),
  invoice: new Set(["draft", "sent"]),
};

export function customerDocumentSendError(kind, status) {
  const allowed = SENDABLE_STATUSES[kind];
  if (!allowed) return "Document type is invalid";
  if (!allowed.has(String(status || "").toLowerCase()))
    return `A ${status || "status-less"} ${kind} cannot be sent`;
  return null;
}
