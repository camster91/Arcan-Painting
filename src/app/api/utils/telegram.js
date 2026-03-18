const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'PLACEHOLDER_BOT_TOKEN';
const GERARDO_CHAT_ID = process.env.TELEGRAM_CHAT_ID || 'PLACEHOLDER_CHAT_ID';

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendTelegramMessage(chatId, text, options = {}) {
  const response = await fetch(`${API_BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId || GERARDO_CHAT_ID,
      text,
      parse_mode: 'HTML',
      ...options,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Telegram send error:', err);
    return null;
  }

  return response.json();
}

export async function notifyGerardo(text) {
  if (BOT_TOKEN === 'PLACEHOLDER_BOT_TOKEN') {
    console.warn('TELEGRAM_BOT_TOKEN not set — skipping notification');
    return null;
  }
  return sendTelegramMessage(GERARDO_CHAT_ID, text);
}

export function formatLeadNotification(lead) {
  return `🎨 <b>New Lead!</b>

<b>Name:</b> ${escapeHtml(lead.name)}
<b>Service:</b> ${escapeHtml(lead.serviceType || 'Not specified')}
<b>Email:</b> ${escapeHtml(lead.email || 'N/A')}
<b>Phone:</b> ${escapeHtml(lead.phone || 'N/A')}
<b>Preferred:</b> ${escapeHtml(lead.preferredContact || 'email')}
${lead.projectDescription ? `<b>Details:</b> ${escapeHtml(lead.projectDescription)}` : ''}
${lead.address ? `<b>Address:</b> ${escapeHtml(lead.address)}` : ''}

View in CRM: https://arcanpainting.ca/admin/leads`;
}

export function formatQuoteNotification(quote) {
  return `📋 <b>Quote Request!</b>

<b>Name:</b> ${escapeHtml(quote.name)}
<b>Email:</b> ${escapeHtml(quote.email)}
<b>Phone:</b> ${escapeHtml(quote.phone || 'N/A')}
<b>Service:</b> ${escapeHtml(quote.serviceType)}
<b>Rooms/Area:</b> ${escapeHtml(quote.scope || 'Not specified')}
<b>Timeline:</b> ${escapeHtml(quote.timeline || 'Flexible')}
<b>Budget:</b> ${escapeHtml(quote.budget || 'Not specified')}
${quote.details ? `<b>Details:</b> ${escapeHtml(quote.details)}` : ''}
${quote.address ? `<b>Address:</b> ${escapeHtml(quote.address)}` : ''}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
