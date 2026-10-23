# Telegram Setup Guide for Arcan Painting

## Why Telegram?
Since WhatsApp Business requires a dedicated business phone line, we're using Telegram for chatbot notifications and customer communication. Telegram allows:
- Free messaging
- No phone number requirements for bots
- Webhook integration with your website
- Notifications for new leads and chat messages

## Step 1: Download Telegram (Gerardo)

1. **On your phone:**
   - Go to App Store (iPhone) or Google Play Store (Android)
   - Search for "Telegram"
   - Download and install the app
   - Open the app and create an account with your phone number

2. **On your computer (optional but recommended):**
   - Go to https://telegram.org/apps
   - Download Telegram Desktop
   - Install and log in with your phone number

## Step 2: Get Your Chat ID

Once you have Telegram installed:

1. Open Telegram and search for "@userinfobot"
2. Start a chat with the bot
3. It will automatically send you your Chat ID (a number like `123456789`)
4. **Save this Chat ID** - we'll need it for setup

## Step 3: Create a Telegram Bot

1. Open Telegram and search for "@BotFather"
2. Start a chat with BotFather
3. Send `/newbot` to create a new bot
4. Follow the prompts:
   - Choose a name for your bot (e.g., "Arcan Painting Bot")
   - Choose a username (must end in "bot", e.g., "ArcanPaintingBot")
5. BotFather will give you a **Bot Token** (looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)
6. **Save this Bot Token** - keep it secure

## Step 4: Configure the Website

**Cameron will handle this part**, but here's what needs to be done:

1. Add these environment variables to your website:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_CHAT_ID=your_chat_id_here
   ```

2. The bot will automatically:
   - Send you notifications when someone submits a contact form
   - Send you notifications when someone uses the chat widget
   - Allow you to view recent leads via `/leads` command
   - Check system status via `/status` command

## Step 5: Test the Setup

Once Cameron configures the website:

1. Go to https://arcanpainting.ca
2. Use the chat widget in the bottom right corner
3. Send a test message like "Hello, do you do wallpaper?"
4. You should receive a Telegram notification with the message and AI response

## Bot Commands

Once set up, you can use these commands in Telegram:

- `/start` - Welcome message
- `/leads` - View recent leads (last 10)
- `/status` - Check website and bot status
- `/help` - Show all commands

## Troubleshooting

**No notifications?**
1. Check if the bot is running: send `/status` to your bot
2. Make sure you started a chat with the bot (search for your bot's username)
3. Check with Cameron that environment variables are set correctly

**Bot not responding?**
1. Make sure you're messaging the correct bot (check the username)
2. Try restarting the bot: `/start` command
3. Contact Cameron for technical support

## Benefits

With Telegram set up, you'll:
- Get instant notifications for new leads
- See chat conversations in real-time
- Can respond to customers directly (future feature)
- Have a backup communication channel
- No need for WhatsApp Business account

## Next Steps

1. **Gerardo:** Download Telegram and get your Chat ID
2. **Gerardo:** Create a bot with BotFather and get the Bot Token
3. **Cameron:** Configure the website with your tokens
4. **Both:** Test the system works

Once set up, you'll have a professional chatbot system that keeps you informed about customer inquiries 24/7!