import { chatWithGemini } from '../utils/gemini.js';
import { createRateLimiter } from '../utils/rate-limit.js';

const chatLimiter = createRateLimiter({ windowMs: 60_000, max: 10, prefix: 'chat' });

// Fire-and-forget: triage new chat messages via AI customer support agent
async function triggerCustomerSupportAgent(message, baseUrl) {
  try {
    await fetch(`${baseUrl}/api/agents/customer-support`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageText: message,
        source: 'website_chat',
      }),
    });
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

    const reply = await chatWithGemini(history || [], message);

    // Fire-and-forget: triage this message for customer support categorization
    // Only triage substantive messages (not one-word greetings)
    if (message.length > 10) {
      const baseUrl = request.url.split('/api/')[0];
      triggerCustomerSupportAgent(message, baseUrl);
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
