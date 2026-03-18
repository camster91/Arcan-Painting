import { sendTelegramMessage } from '../../utils/telegram.js';
import { requireAuth } from '../../utils/auth.js';

export async function POST(request) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, message } = await request.json();
    if (!chatId || !message) {
      return Response.json({ error: 'chatId and message are required' }, { status: 400 });
    }

    const result = await sendTelegramMessage(chatId, message);
    return Response.json({ success: true, result });
  } catch (error) {
    console.error('Telegram send error:', error.message);
    return Response.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
