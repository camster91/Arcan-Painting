# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this codebase.

## Project Overview

Arcan Painting is a full-stack web application for a painting business. It includes:
- **Public marketing website** — Landing page with services, process, FAQ, portfolio, pricing, reviews, and contact sections. Includes SEO-optimized service pages (interior, exterior, commercial, specialty finishes, wallpaper) with city-level geo-targeting.
- **Admin CRM dashboard** — Business management system for leads, clients, estimates, contracts, invoices, payments, projects, scheduling, team management, marketing automation, email workflows, AI chat, and time tracking.
- **Blog** — Markdown-based content (in `src/content/blog/`) served via dynamic routes.
- **AI Agents** — Server-side AI agent integrations (customer support, lead qualifier, proposal generator, schedule estimator) via an external OpenClaw service.

## Tech Stack

- **Framework**: React Router 7 (file-based routing, SSR enabled) with Hono server (`react-router-hono-server`)
- **Language**: JavaScript (JSX) for pages/components, TypeScript for configs and utilities
- **Styling**: Tailwind CSS 3 + Chakra UI 2.8 + styled-jsx
- **Animation**: Motion (Framer Motion v12+)
- **State Management**: Zustand 5
- **Data Fetching**: TanStack Query + TanStack Table
- **Forms**: React Hook Form + Yup validation
- **Database**: Neon (serverless PostgreSQL via `@neondatabase/serverless`)
- **Authentication**: Custom session-based auth with Argon2 password hashing (see `src/app/api/local-auth/`)
- **Payments**: Stripe (checkout, webhooks, credit system)
- **Email**: SMTP-based email with templates and workflow automation
- **Error Tracking**: Sentry (`@sentry/node` + `@sentry/react`)
- **Maps**: Google Maps (`@vis.gl/react-google-maps`)
- **Charts**: Recharts
- **Icons**: Lucide React (pinned to 0.358.0)
- **Build Tool**: Vite 6 with custom plugins
- **Testing**: Vitest with Testing Library (jsdom)
- **Package Manager**: Bun
- **Deployment**: Docker (multi-stage Bun Alpine image), Coolify/Railway compatible

## Development Commands

```bash
bun install          # Install dependencies
bun run dev          # Start development server (port 4000)
bun run build        # Production build (react-router build)
bun run start        # Start production server (react-router serve)
bun run typecheck    # TypeScript type checking (react-router typegen && tsc --noEmit)
bun test             # Run tests with Vitest
bun test:watch       # Run tests in watch mode
```

## Project Structure

```
├── __create/                  # Framework server adapter (Hono entry point, route builder, auth)
├── plugins/                   # Custom Vite plugins
│   ├── aliases.ts             # Path alias resolution
│   ├── layouts.ts             # Layout wrapper auto-injection
│   ├── loadFontsFromTailwindSource.ts  # Font preloading from Tailwind config
│   ├── nextPublicProcessEnv.ts # NEXT_PUBLIC_ env var compatibility shim
│   └── sentrySourceMaps.ts    # Sentry source map upload
├── scripts/                   # Utility scripts (e.g., gallery image tagging)
├── shims/                     # Package shims (@auth/create compatibility layer)
├── public/                    # Static assets (logo, og-image, service worker, llms.txt)
├── test/                      # Test setup and test files
│   ├── setupTests.ts          # Vitest/Testing Library setup
│   ├── *.test.js              # Unit tests for utilities
├── src/
│   ├── app/                   # Application routes (file-based routing)
│   │   ├── page.jsx           # Homepage (public marketing site)
│   │   ├── layout.jsx         # Root layout
│   │   ├── routes.ts          # Route configuration
│   │   ├── admin/             # Admin dashboard pages (see below)
│   │   ├── account/           # Auth pages (signin, forgot-password, reset, accept-invite)
│   │   ├── api/               # API routes (Hono handlers, see below)
│   │   ├── blog/              # Blog listing and [slug] detail pages
│   │   ├── [service]/[city]/  # Dynamic SEO service+city pages
│   │   ├── interior-painting/ # Static service pages
│   │   ├── exterior-painting/
│   │   ├── commercial-painting/
│   │   ├── specialty-finishes/
│   │   ├── wallpaper-services/
│   │   ├── thank-you/         # Thank you page
│   │   ├── robots.txt/        # Dynamic robots.txt
│   │   └── sitemap.xml/       # Dynamic sitemap
│   ├── components/            # Reusable React components
│   │   ├── *.jsx              # Public site components
│   │   └── admin/             # Admin-specific components (organized by feature)
│   ├── hooks/                 # Custom React hooks (useEstimates, useContracts, usePayments, etc.)
│   ├── contexts/              # React context providers (AdminAuthContext, ModalContext)
│   ├── utils/                 # Utility functions (calculations, API helpers, auth hooks)
│   ├── lib/                   # Library integrations (blog, google)
│   ├── data/                  # Static data files (gallery tags JSON)
│   ├── content/blog/          # Blog post markdown files
│   ├── client-integrations/   # Lazy-loaded heavy dependencies (Chakra, Recharts, PDF.js, Google Maps)
│   ├── migrations/            # Database migrations (idempotent, run at startup)
│   └── __create/              # Framework internal utilities (@auth shim)
```

### Admin Dashboard Pages (`src/app/admin/`)

| Route | Description |
|-------|-------------|
| `/admin` | Dashboard home with metrics |
| `/admin/leads` | Lead management |
| `/admin/clients` | Client management |
| `/admin/estimates` | Estimates (list, new, calculator) |
| `/admin/contracts` | Contracts + templates |
| `/admin/invoices` | Invoice management |
| `/admin/payments` | Payment tracking |
| `/admin/projects` | Project tracking |
| `/admin/scheduling` | Scheduling |
| `/admin/calendar` | Calendar view |
| `/admin/availability` | Team availability |
| `/admin/team` | Team member management |
| `/admin/tasks` | Task management |
| `/admin/today` | Daily overview |
| `/admin/follow-ups` | Follow-up tracking |
| `/admin/email` | Email compose |
| `/admin/email-templates` | Email templates |
| `/admin/email-workflows` | Automated email workflows |
| `/admin/email-logs` | Email send logs |
| `/admin/marketing` | Marketing hub (social, ads, cold email, research, AI) |
| `/admin/messages` | Messaging |
| `/admin/ai-chat` | AI chat assistant |
| `/admin/capture` | Lead capture |
| `/admin/settings` | Settings |
| `/admin/profile` | User profile |
| `/admin/onboarding` | Onboarding wizard |

### API Routes (`src/app/api/`)

API routes are Hono handlers. Key groups:
- **Auth**: `local-auth/` (login, logout, session, magic link, password reset, verification codes)
- **CRM**: `leads/`, `estimates/`, `contracts/`, `invoices/`, `payments/`, `projects/`
- **Documents**: `estimates/[id]/pdf`, `contracts/[id]/pdf`, `invoices/[id]/pdf`, `contracts/[id]/send`, `estimates/[id]/send`
- **Team**: `team-members/`, `team-invites/`, `team-availability/`, `time-tracking/`
- **Marketing**: `marketing/` (Facebook, Google, LinkedIn integrations, cold email, AI, research, workflows)
- **Email**: `email/`, `email-templates/`, `email-workflows/`, `email-logs/`
- **AI Agents**: `agents/` (customer-support, lead-qualifier, proposal-generator, schedule-estimator)
- **Payments**: `payments/`, `credits/`, `stripe-webhook/`
- **Other**: `contact/`, `booking/`, `calendar/`, `gallery/`, `notifications/`, `telegram/`, `health/`

## File Conventions

- **Routes**: File-based routing using `page.jsx` files
  - `src/app/page.jsx` → `/`
  - `src/app/admin/page.jsx` → `/admin`
  - Dynamic routes use `[param]` folders (e.g., `[id]/page.jsx`)
  - Catch-all routes use `[...param]` folders
- **Layouts**: `layout.jsx` files wrap child routes (root layout + admin layout)
- **API Routes**: Located in `src/app/api/` — each directory contains a `route.js` or `route.ts` file
- **Components**: PascalCase naming (e.g., `HeroSection.jsx`, `LeadCard.jsx`)
- **Hooks**: `use` prefix, camelCase (e.g., `useEstimates.js`, `usePayments.js`)
- **Utils**: camelCase (e.g., `estimateCalculations.js`, `contractsUtils.js`)

## Architecture Patterns

- **Path aliases**: Use `@/` to import from `src/` (e.g., `import { something } from '@/utils/helper'`)
- **SSR**: Server-side rendering is enabled (`ssr: true` in react-router.config.ts)
- **State**: Zustand stores for global client state, TanStack Query for server state
- **Styling**: Prefer Tailwind utility classes; Chakra UI for complex interactive components; styled-jsx for scoped styles
- **Client integrations**: Heavy libraries (Chakra, Recharts, PDF.js, Google Maps) are lazy-loaded via `src/client-integrations/` wrappers to reduce bundle size
- **Database**: Raw SQL queries via `@/app/api/utils/sql.js` helper (Neon serverless driver). No ORM.
- **Migrations**: Idempotent SQL migrations in `src/migrations/`, auto-run at startup. Use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`.
- **Auth flow**: Custom session-based auth (not NextAuth despite env var naming). Sessions stored in `auth_sessions` table. Passwords hashed with Argon2.
- **Env vars**: Uses `NEXT_PUBLIC_` prefix convention for client-exposed env vars (compatibility shim in Vite config). See `.env.example` for all required/optional vars.

## Environment Variables

Copy `.env.example` to `.env` for local development. Key variables:
- `DATABASE_URL` — Neon PostgreSQL connection string (required)
- `SESSION_SECRET` / `NEXTAUTH_SECRET` — Auth session secrets (required)
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — Stripe payments (optional)
- `SMTP_*` — Email configuration (optional)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — Google Maps (optional)
- `OPENCLAW_URL` / `OPENCLAW_TOKEN` — AI agent service (optional)
- `SENTRY_DSN` / `SENTRY_AUTH_TOKEN` — Error tracking (optional)

## Testing

Tests are in `test/` directory. Vitest with jsdom environment, globals enabled.

```bash
bun test             # Run all tests
bun test:watch       # Watch mode
```

Existing test files cover utility functions: `contractsUtils.test.js`, `estimateCalculations.test.js`, `estimatesUtils.test.js`.

## Docker / Deployment

Multi-stage Dockerfile using `oven/bun:1.2-alpine`:
1. **Builder stage**: `bun install` → `bun run build`
2. **Runner stage**: Copies build output + node_modules + src (for runtime route scanning). Runs on port 3000 in production.

Production is deployed via Docker on Coolify/Railway. The app runs via a `start.mjs` wrapper to avoid Bun's auto-serve double-bind issue.

## Key Implementation Notes

- **Lucide React** is pinned to `0.358.0` — do not upgrade without checking for breaking icon name changes
- **Dev server** runs on port **4000** (not 3000); production uses port **3000**
- The `__create/` directory at root contains the Hono server entry point and route builder — treat as framework internals
- `resolve.alias` in vite.config.ts maps `lodash` → `lodash-es`, `stripe` to a local shim, and `@auth/create` packages to local/hono equivalents
- Build externalizes server-only packages (`pg`, `argon2`, `ws`, `sql.js`) and Sentry from the client bundle
