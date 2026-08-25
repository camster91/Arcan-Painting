import { chatWithGemini } from '../utils/gemini.js';
import { createRateLimiter } from '../utils/rate-limit.js';
import { notifyGerardo } from '../utils/telegram.js';

const chatLimiter = createRateLimiter({ windowMs: 60_000, max: 10, prefix: 'chat' });
const MAX_HISTORY_MESSAGES = 12;
const MAX_HISTORY_MESSAGE_LENGTH = 2_000;

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history.slice(-MAX_HISTORY_MESSAGES).flatMap((entry) => {
    if (!entry || (entry.role !== "user" && entry.role !== "assistant")) {
      return [];
    }
    if (typeof entry.content !== "string") return [];
    return [{
      role: entry.role,
      content: entry.content.slice(0, MAX_HISTORY_MESSAGE_LENGTH),
    }];
  });
}

// Fire-and-forget: triage new chat messages via AI customer support agent
async function triggerCustomerSupportAgent(message, baseUrl) {
  try {
    const internalToken = process.env.INTERNAL_API_TOKEN;
    if (!internalToken) {
      console.error('Customer support triage skipped: INTERNAL_API_TOKEN is not configured');
      return;
    }

    const response = await fetch(`${baseUrl}/api/agents/customer-support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-token': internalToken,
      },
      body: JSON.stringify({
        messageText: message,
        source: 'website_chat',
      }),
    });

    if (!response.ok) {
      console.error(`Customer support triage failed: ${response.status}`);
    }
  } catch (err) {
    console.error('Customer support agent trigger failed (non-fatal):', err.message);
  }
}

export async function POST(request) {
  const limited = chatLimiter(request);
  if (limited) return limited;

  try {
    const { message, history } = await request.json();

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 2000) {
      return Response.json({ error: 'Message too long (max 2000 chars)' }, { status: 400 });
    }

    // TODO: When credits system is active for public chat, deduct here
    // const userId = 'gerardo';
    // deductCredits(userId, CREDITS_PER_CHAT, 'chat_message');

    const reply = await chatWithGemini(normalizeHistory(history), message);

    // Fire-and-forget: triage this message for customer support categorization
    // Only triage substantive messages (not one-word greetings)
    if (message.length > 10) {
      const baseUrl = process.env.APP_URL || request.url.split('/api/')[0];
      triggerCustomerSupportAgent(message, baseUrl);
      
      // Also notify Gerardo via Telegram about the chat message
      try {
        await notifyGerardo(`💬 <b>New Chat Message</b>\n\n<b>Customer asked:</b> ${message.substring(0, 200)}${message.length > 200 ? '...' : ''}\n\n<b>AI replied:</b> ${reply.substring(0, 200)}${reply.length > 200 ? '...' : ''}\n\n<i>From website chat widget</i>`);
      } catch (err) {
        console.error('Telegram notification failed:', err.message);
      }
    }

    return Response.json({ reply });
  } catch (error) {
    console.error('Chat error:', error.message);

    if (error.message.includes('Insufficient credits')) {
      return Response.json({ error: 'Out of credits. Please top up.' }, { status: 402 });
    }

    return Response.json({
      reply: "I'm sorry, I'm having trouble right now. Please contact us directly at info@arcanpainting.ca or use the contact form on our website.",
    });
  }
}
