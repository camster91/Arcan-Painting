import { chatWithGemini } from '../utils/gemini.js';

export async function POST(request) {
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
