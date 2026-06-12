# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this codebase.

## Project Overview

Arcan Painting is a full-stack web application for a Toronto painting business. It includes:
- **Public marketing website** - Landing page with services, process, FAQ, about, and contact sections
- **Admin CRM dashboard** - Business management system for leads, clients, estimates, contracts, invoices, projects, scheduling, availability, notifications, time tracking, and team management

## Tech Stack (post 2026-06-12 cleanup)

- **Framework**: React Router 7 with Hono server
- **Language**: JavaScript (JSX) for pages/components, TypeScript for the server entry
- **Styling**: Tailwind CSS 3 + Chakra UI 2.8 (still in package.json; the public site uses Tailwind, no remaining direct Chakra imports in src/)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Database**: PostgreSQL via `pg.Pool`. Migrations live in `src/migrations/001-initial-schema.js` (auto-runs on first request via lazy `ensureSchema()`, now also called on boot via `__create/index.ts`).
- **Authentication**: Local auth only — argon2id-hashed passwords, server-side sessions in Postgres, CSRF cookies, bearer tokens. No third-party OAuth.
- **Build Tool**: Vite 6
- **Package Manager**: npm (single `package-lock.json`; no `bun.lock`)

## Development Commands

```bash
npm install         # install (775 packages)
npm run dev         # start dev server on :4000
npm run build       # production build → build/{client,server}
npm start           # serve the build (PORT env, default 3000)
npm test            # vitest
npm run typecheck   # react-router typegen && tsc --noEmit
```

## Local dev (Docker — preferred)

```bash
docker compose up --build
# Wait for "Server started" in docker compose logs -f app
# Then: open http://localhost:3000

# Seed an admin user (run once after first boot):
docker compose exec db psql -U arcan -d arcan_painting -c "
  INSERT INTO auth_users (username, password, role, password_is_hashed)
  VALUES ('owner@arcan.local',
          '\$argon2id\$v=19\$m=65536,t=3,p=4\$GYJiMCM8uGg2dHPz9c9GPg\$qiQkwDFF+xTaMrz8DvGsKdtSerUAAQVvXhkXtLTQ64w',
          'owner', true);
"
```

Login at <http://localhost:3000/admin> with that username + password.

## Local dev (no Docker)

Requires Node 20+ and a local Postgres 16. The app listens on port 3000 by default.

```bash
npm install
DATABASE_URL="postgresql://user:***@localhost:5432/arcan_painting" \
  NEXTAUTH_URL="http...00" \
  npm run build && npm start
```

## Project Structure

```
.
├── __create/                       Hono server entry (auto-mounts src/app/api/**/route.js)
│   ├── index.ts                    Main server bootstrap, runs migrations, starts on $PORT
│   ├── route-builder.ts            Hono instance + import.meta.glob for all /api routes
│   └── get-html-for-error-page.ts
├── plugins/loadFontsFromTailwindSource.ts   Tiny stub (renders null) for virtual:load-fonts.jsx
├── public/                         Static assets. public/gallery/{images,thumbnails} is .dockerignore'd
│                                    (107MB of webp photos — deploy pattern: ship as a separate
│                                    tarball or mount a volume in compose, not in the image)
├── src/
│   ├── app/                        File-based routes
│   │   ├── page.jsx                Public homepage
│   │   ├── root.tsx                Root layout, SEO meta, error boundary
│   │   ├── admin/                  Admin CRM pages (no dead-code marketing/AI subtrees)
│   │   │   ├── page.jsx, leads/  clients/  estimates/  contracts/  invoices/  payments/
│   │   │   ├── projects/  scheduling/  calendar/  tasks/  messages/  follow-ups/
│   │   │   ├── availability/  team/  settings/  email/  email-logs/  blog/  notifications/
│   │   │   ├── onboarding/  system/  today/
│   │   ├── api/                    Server route handlers
│   │   │   ├── contact/  quote/  booking/  health/
│   │   │   ├── local-auth/          Local auth (login, logout, me, magic-link, password-reset, etc.)
│   │   │   ├── leads/  clients/  estimates/  contracts/  invoices/  payments/
│   │   │   ├── projects/  scheduling/  calendar/  tasks/  messages/  follow-ups/
│   │   │   ├── availability/  team/  settings/  blog/  posts/  notifications/
│   │   │   ├── lead-webhook/meta/  onboarding/  completion-workflows/  project-progress/
│   │   │   ├── admin/  estimate-builder/  contract-templates/  email/  email-templates/  email-logs/
│   │   │   ├── gallery/  team-invites/  team-members/  team-availability/  time-tracking/
│   │   │   ├── agent/tools/  stripe-webhook/  credits/
│   │   │   └── utils/              Shared: auth, sql, csrf, audit, rate-limit, telegram, send-email, etc.
│   │   ├── blog/  contact/  quote/  thank-you/  sitemap.xml/
│   │   ├── [service]/[city]/  interior-painting/  exterior-painting/  commercial-painting/  wallpaper-services/  specialty-finishes/
│   │   └── __create/not-found.tsx
│   ├── components/                 Public + admin React components
│   ├── hooks/                      useLeads, useEstimates, etc.
│   ├── lib/                        blog-db.js (Postgres), blog.js (file-based), google.js (Maton gateway)
│   ├── content/blog/               Markdown blog posts (file-based, separate from DB blog)
│   ├── data/                       Static JSON: gallery-tags.json
│   ├── utils/                      Small helpers
│   ├── migrations/001-initial-schema.js    Postgres schema (54 tables, idempotent on boot)
│   └── global.d.ts                 Ambient types
├── Dockerfile                      Multi-stage, node:20-alpine, non-root
├── docker-compose.yml              app + postgres, healthcheck-gated
└── .env.example                    Documented env vars
```

## File Conventions

- **Routes**: File-based routing using `page.jsx` files
  - `src/app/page.jsx` → `/`
  - `src/app/admin/page.jsx` → `/admin`
  - `src/app/admin/leads/page.jsx` → `/admin/leads`
  - Dynamic routes use `[param]` folders (e.g., `[id]/page.jsx`)
  - Catch-all routes use `[...param]` folders

- **API Routes**: Located in `src/app/api/`. Auto-mounted by `__create/route-builder.ts` via `import.meta.glob('../src/app/api/**/route.{js,ts}')`. Each handler exports `GET`/`POST`/`PUT`/`DELETE`/`PATCH` taking `(request, ctx)`.

- **Components**: PascalCase `.jsx` for public + admin

## Architecture Patterns

- **Path alias**: `@/...` → `src/...` (resolved by `vite-tsconfig-paths` plugin, defined in `tsconfig.json`)
- **DB access**: `import sql from "@/app/api/utils/sql"` — a `pg.Pool`-backed tagged-template helper. Supports transactions via `sql.transaction(async (txSql) => { ... })`.
- **Auth**: `getCurrentUser(request)` from `@/app/api/utils/auth` returns the session user or null. Use `requireAdmin(request)` / `requireOwner(request)` for guarded routes. Cookie: `admin_session`. CSRF: `arcan_csrf` cookie → `x-csrf-token` header.
- **CSRF patch**: applied in `src/app/root.tsx` at module load — auto-injects the header on state-changing `/api/*` requests from the browser, exempting `/api/local-auth/login`, `/api/local-auth/logout`, `/api/contact`, `/api/quote`, `/api/lead-webhook/`, `/api/health`.
- **Rate limit**: `generalLimiter(request)` / `authLimiter(request)` from `@/app/api/utils/rate-limit`. Returns a 429 response or null.
- **Audit log**: `auditLog({ request, action, resource, resourceId, changes })` from `@/app/api/utils/audit`.
- **Migrations**: `ensureSchema()` from `@/migrations/001-initial-schema`. Called on boot in `__create/index.ts` AND lazily on first API request. 54 tables, idempotent (CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

## Key Components

Public site sections (in `src/components/`):
- `Header.jsx` - Navigation bar
- `HeroSection.jsx` - Main landing banner
- `ServicesSection.jsx` - Services offered
- `ProcessSection.jsx` - Work process steps
- `FAQSection.jsx` - Frequently asked questions
- `ContactSection.jsx` - Contact form
- `Footer.jsx` - Site footer

Admin components (in `src/components/admin/`):
- Lead management cards and forms
- Estimate builders
- Project tracking UI
- Scheduling/calendar components

## Testing

Tests are configured with Vitest and jsdom environment. Setup file: `test/setupTests.ts`

```bash
npm test             # Run all tests
npm test -- --watch  # Watch mode
```

## Known issues

See `BUGS.md` for the bug history (all five are fixed as of 2026-06-12).

Remaining minor items:

- **TypeScript `moduleResolution`** is `bundler` but the tsconfig has the older `node` setting, which surfaces lint warnings on every file (TS2307, TS1259, TS1378, TS2339). Pre-existing. Runtime is fine; the build uses Vite, not `tsc`. Out of scope for cleanup.
- **`/api/calendar` requires `MATON_API_KEY`** — fails soft (503) when missing. Set the env var in dev to test; live site uses Maton for the Google Calendar integration.
- **GitHub Actions CI is paused** due to workspace billing issues. Build + tests pass locally; CI is unverified until billing is resolved.
- **Chakra UI is in `package.json`** but no `src/` file imports it directly anymore. Could be removed in a follow-up to save ~1MB of node_modules. Low priority.

## Docker

- `Dockerfile` — multi-stage, node:20-alpine, non-root, healthcheck on `/api/health`
- `docker-compose.yml` — app + Postgres 16, healthcheck-gated
- `.dockerignore` — excludes `public/gallery/{images,thumbnails}` (107MB) and `public/sw.js`. Mount those as a volume or rsync them onto the host.

## Deploy

Not in scope for this file. See `.github/workflows/` for CI/deploy pipelines.
