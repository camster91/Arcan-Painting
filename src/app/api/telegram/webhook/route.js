import { sendTelegramMessage } from '../../utils/telegram.js';
import { chatWithGemini } from '../../utils/gemini.js';

export async function POST(request) {
  try {
    const update = await request.json();

    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const from = update.message.from;

      if (text.startsWith('/')) {
        return handleCommand(chatId, text, from);
      }

      const aiDraft = await chatWithGemini([], text);

      await sendTelegramMessage(chatId, `💬 <b>Customer asked:</b>\n${text}\n\n🤖 <b>AI Draft Response:</b>\n${aiDraft}\n\n<i>Reply /approve to send this, or type your own response.</i>`);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error.message);
    return Response.json({ ok: true });
  }
}

async function handleCommand(chatId, text, from) {
  const cmd = text.split(' ')[0].toLowerCase();

  switch (cmd) {
    case '/start':
      await sendTelegramMessage(chatId, `👋 Welcome to Arcan Painting Bot!\n\nI help you manage leads and respond to customer inquiries.\n\nCommands:\n/leads - View recent leads\n/status - Check system status\n/help - Show this message`);
      break;

    case '/status':
      await sendTelegramMessage(chatId, `✅ Arcan Painting Bot is running\n🌐 Website: arcanpainting.ca\n📊 CRM: arcanpainting.ca/admin`);
      break;

    case '/help':
      await sendTelegramMessage(chatId, `🎨 <b>Arcan Painting Bot</b>\n\n/leads - Recent leads\n/status - System status\n/help - This message\n\nI'll notify you of new leads and quote requests automatically.`);
      break;

    default:
      await sendTelegramMessage(chatId, `Unknown command. Try /help`);
  }

  return Response.json({ ok: true });
}
