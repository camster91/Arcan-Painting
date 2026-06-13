// Telegram integration was stripped in 2026-06-13 per the v53 + the
// "Remove maton and telegram we stripped those out" follow-up.
// The original code (Mat-on API client + bot token + chat_id) is gone.
// All callers used to notify the owner on new leads/quotes/chats. Now
// they get a no-op. Leads still save to Postgres, the admin sees them
// in the CRM dashboard on next login.
//
// If Telegram notifications ever come back: drop the original code back
// here, the export signatures match (sendTelegramMessage / notifyGerardo /
// formatLeadNotification / formatQuoteNotification) so callers don't need
// to change.

export async function sendTelegramMessage(_chatId, _text, _options = {}) {
  return null;
}

export async function notifyGerardo(_text) {
  return null;
}

export function formatLeadNotification(_lead) {
  return '';
}

export function formatQuoteNotification(_quote) {
  return '';
}
