# Arcan Painting

**A high-conversion landing page for painting contractors built with React Router 7, featuring emotional messaging strategies to drive lead generation.**

This project serves as a cornerstone template in the Nexus AI web development portfolio, demonstrating how emotional copywriting and modern web technologies can significantly improve conversion rates for home service businesses.

## Tech Stack

- **Framework**: React Router 7 (Full-stack SSR with Hono)
- **Frontend**: React 18, Tailwind CSS, Radix Primitives, Chakra UI
- **Backend**: Hono.js server framework
- **Database**: PostgreSQL with Neon serverless adapter
- **Authentication**: Auth.js with Argon2 password hashing
- **Payments**: Stripe integration
- **Notifications**: Telegram webhooks for instant lead alerts
- **Build Tool**: Vite
- **Monitoring**: Sentry for error tracking and performance

## Key Features

- **Emotional Messaging Architecture**: Copy focuses on emotional transformation rather than just features
- **Server-Side Rendering**: Full SSR for optimal SEO and performance
- **Lead Generation Funnel**: Streamlined booking flow with localized CTAs
- **Real-time Notifications**: Telegram webhooks for instant lead alerts
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Type Safety**: Full TypeScript implementation
- **Analytics Ready**: Sentry integration for performance and error tracking
- **Payment Processing**: Stripe integration for deposits and services
- **Interactive UI**: Rich components including drag-and-drop, date pickers, charts, and markdown rendering

## Project Structure

```
app/
├── (app)/           # Main application routes
├── (auth)/          # Authentication routes
├── api/             # API endpoints
├── fonts/           # Custom fonts
└── globals.css      # Global styles
```

## Installation

```bash
# Clone the repository
git clone https://github.com/camster91/Arcan-Painting.git
cd Arcan-Painting

# Install dependencies (Bun recommended for speed)
bun install
# or
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations (if applicable)
bun run migrate

# Start development server
bun run dev
```

## Environment Variables

Create a `.env` file with the following:

```env
DATABASE_URL=your_postgresql_connection_string
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
SENTRY_DSN=your_sentry_dsn
SESSION_SECRET=your_session_secret
```

## Usage

### Development

```bash
bun run dev
```

Visit `http://localhost:5173`

### Production Build

```bash
bun run build
bun run start
```

### Testing

```bash
bun run test
bun run test:watch
```

## Architecture Notes

The emotional messaging strategy shifts the narrative from features ("We paint houses") to transformation ("Transform the space you wake up in every day"). This approach:

- Reduces bounce rates via immediate visual and emotional connection
- Streamlines the booking funnel with localized, high-trust CTAs
- Serves as a performant, SEO-optimized template for scaling across client builds

## Future Roadmap

- Modular component extraction for the Pi Website Builder
- A/B testing framework for messaging variants
- Integration with CRM systems for lead tracking
- Automated scheduling with calendar integration

## License

Proprietary - All rights reserved.

---

*Built by Cameron Ashley / Nexus AI for Arcan Painting*
