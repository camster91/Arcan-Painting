# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this codebase.

## Project Overview

Arcan Painting is a full-stack web application for a Toronto painting business. It includes:
- **Public marketing website** - Landing page with services, process, FAQ, about, and contact sections
- **Admin CRM dashboard** - Business management system for leads, clients, estimates, contracts, invoices, projects, scheduling, availability, notifications, time tracking, and team management

## Tech Stack (post v53, June 2026)

- **Framework**: React Router 7 (file-system routes) with Hono server
- **Language**: JavaScript (JSX) for pages/components, TypeScript for the server entry only
- **Styling**: Tailwind CSS 3 (PostCSS pipeline). The previous Chakra UI dependency is still in `package.json` but the public site uses Tailwind exclusively; the admin pages don't import Chakra directly either. **TODO**: remove `@chakra-ui/react` from `dependencies` once Tailwind parity is confirmed.
- **State Management**: Zustand (used by very few components; mostly React local state)
- **Data Fetching**: TanStack Query + TanStack Table
- **Database**: PostgreSQL via `pg.Pool`. Migrations in `src/migrations/001-initial-schema.js`. Called on boot from `__create/index.ts` AND lazily on first API request via `ensureSchema()`. 54 tables, idempotent.
- **Authentication**: Local auth only — argon2id-hashed passwords, server-side sessions in Postgres, CSRF cookies, bearer tokens. **No third-party OAuth** (was removed in v53; the `__create/adapter.ts` and `src/auth.js` shims are gone).
- **Build Tool**: Vite 6
- **Package Manager**: npm (single `package-lock.json`; no `bun.lock`)

### v53 dependencies (after the strip)

`package.json` was pruned from 41 runtime + 27 devDeps to **32 runtime + 10 devDeps** in the v53 strip. Notable removals:
- Runtime: `@babel/generator`, `@emotion/react`, `@emotion/styled`, `isbot`, `lodash-es` (re-added — used by `src/__create/stripe.ts`), `react-day-picker`, `styled-jsx`, `tailwind-merge`
- Dev: `@babel/core`, all 5 `@babel/preset-*` and `@babel/traverse`/`@babel/types`, `@types/babel__core`, `@tailwindcss/vite`, `babel-plugin-react-require`, `fast-glob` (kept — used by Vite optimizeDeps), `micromatch`, `vite-plugin-babel`
- Kept but barely used: `@chakra-ui/react` (no direct imports in src/), `react-markdown`/`remark-gfm` (admin blog), `recharts` (admin reports), `motion` (animations), `sql.js` (deprecated, replaced by pg in 2025), `stripe` (unused after Stripe-flow deprecation)
- **Linting: removed entirely.** The previous ESLint config + babel pipeline was dropped when `vite-plugin-babel` was removed from `vite.config.ts`. `npm run build` + `npm test` are the two gates. If ESLint comes back, it'll be a one-step `eslint.config.js` + a flat-config preset, no babel intermediate.

## Development Commands

```bash
npm install --include=dev   # 473 packages
npm run dev               # vite dev server on :4000
npm run build             # production build → build/{client,server}
npm start                 # serve the build (PORT env, default 3000)
npm test                  # vitest (50 cases across 4 files, ~650ms; verified 2026-06-12 post-v53)
npm run typecheck         # react-router typegen && tsc --noEmit
```

## Local dev (no Docker — recommended on macOS)

Requires Node 20+ and a local Postgres 16 (Homebrew: `brew install postgresql@16 && brew services start postgresql@16`).

```bash
# One-time DB setup
createdb arcan_painting

# Seed an admin user
psql -d arcan_painting -c "
  INSERT INTO auth_users (username, password, role, password_is_hashed)
  VALUES ('owner@arcan.local',
          '\$argon2id\$v=19\$m=65536,t=3,p=4\$GYJiMCM8uGg2dHPz9c9GPg\$qiQkwDFF+xTaMrz8DvGsKdtSerUAAQVvXhkXtLTQ64w',
          'owner', true);
"

# Start the dev server
DATABASE_URL="postgresql://$(whoami)@localhost:5432/arcan_painting" \
  APP_URL="http://localhost:4000" NEXTAUTH_URL=*** \
  npm run dev
```

Open `http://localhost:4000/` for the public site, `http://localhost:4000/admin` for the CRM.

## Local dev (Docker — alternative)

```bash
docker compose up --build
# Wait for "🚧 Dev server started" in docker compose logs -f app
# Then: open http://localhost:3000
```

The `docker-compose.yml` runs app + postgres:16-alpine with the same env.

## Project Structure

```
.
├── __create/                       Hono server entry
│   ├── index.ts                    Main bootstrap, runs migrations, mounts /api
│   ├── route-builder.ts            Hono instance + import.meta.glob for /api routes
│   └── get-html-for-error-page.ts  HTML error page for the SSR 500 fallback
├── public/                         Static assets. public/gallery/ is .dockerignore'd
│                                    (108MB of webp photos — ship as a separate
│                                    tarball or mount a volume, not in the image)
├── src/
│   ├── app/                        File-based routes
│   │   ├── page.jsx                Public homepage
│   │   ├── root.tsx                Root layout, SEO meta, error boundary, CSRF patch
│   │   ├── admin/                  Admin CRM pages (no AI modals, no agent routes)
│   │   │   ├── page.jsx, leads/  clients/  estimates/  contracts/  invoices/  payments/
│   │   │   ├── projects/  scheduling/  calendar/  tasks/  messages/  follow-ups/
│   │   │   ├── availability/  team/  settings/  blog/  notifications/
│   │   │   ├── onboarding/  system/  today/
│   │   ├── api/                    Server route handlers (auto-mounted at /api)
│   │   │   ├── contact/  quote/  booking/  health/
│   │   │   ├── local-auth/          argon2id + pg-backed auth (login, logout, me, magic-link, password-reset)
│   │   │   ├── leads/  clients/  estimates/  contracts/  invoices/  payments/
│   │   │   ├── projects/  scheduling/  calendar/  tasks/  messages/  follow-ups/
│   │   │   ├── availability/  team/  settings/  blog/  posts/  notifications/
│   │   │   ├── lead-webhook/meta/  onboarding/  completion-workflows/  project-progress/
│   │   │   ├── admin/  estimate-builder/  contract-templates/
│   │   │   ├── gallery/  team-invites/  team-members/  team-availability/  time-tracking/
│   │   │   ├── agent/tools/  stripe-webhook/  credits/  ← most are dead-code subtrees
│   │   │   └── utils/              Shared: auth, sql, csrf, audit, rate-limit, insert-lead, send-email (now a no-op stub)
│   │   ├── blog/  contact/  quote/  thank-you/  sitemap.xml/
│   │   ├── [service]/[city]/  interior-painting/  exterior-painting/  commercial-painting/  wallpaper-services/  specialty-finishes/
│   │   └── __create/not-found.tsx
│   ├── components/                 Public + admin React components
│   ├── hooks/                      useLeads, useEstimates, etc.
│   ├── lib/                        blog-db.js (Postgres), blog.js (file-based), google.js (Maton gateway)
│   ├── content/blog/               Markdown blog posts (file-based, separate from DB blog)
│   ├── data/                       Static JSON: gallery-tags.json
│   ├── utils/                      Small helpers (useTheme, useUpload, etc.)
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
  - Dynamic routes use `[param]` folders
  - Catch-all routes use `[...param]` folders

- **API Routes**: Located in `src/app/api/`. Auto-mounted by `__create/route-builder.ts` via `import.meta.glob('../src/app/api/**/route.{js,ts,jsx,tsx}', { eager: true })`. Each handler exports `GET`/`POST`/`PUT`/`DELETE`/`PATCH` taking `(request, ctx)`.

- **Components**: PascalCase `.jsx` for public + admin

## Architecture Patterns

- **Path alias**: `@/...` → `src/...` (resolved by `vite-tsconfig-paths` plugin, defined in `tsconfig.json`)
- **DB access**: `import sql from "@/app/api/utils/sql"` — a `pg.Pool`-backed tagged-template helper. Supports transactions via `sql.transaction(async (txSql) => { ... })`.
- **Auth**: `getCurrentUser(request)` from `@/app/api/utils/auth` returns the session user or null. Use `requireAdmin(request)` / `requireOwner(request)` for guarded routes. Cookie: `admin_session`. CSRF: `arcan_csrf` cookie → `x-csrf-token` header.
- **CSRF patch**: applied in `src/app/root.tsx` at module load — auto-injects the header on state-changing `/api/*` requests from the browser, exempting `/api/local-auth/login`, `/api/local-auth/logout`, `/api/contact`, `/api/quote`, `/api/lead-webhook/`, `/api/health`.
- **Rate limit**: `generalLimiter(request)` / `authLimiter(request)` from `@/app/api/utils/rate-limit`. Returns a 429 response or null.
- **Audit log**: `auditLog({ request, action, resource, resourceId, changes })` from `@/app/api/utils/audit`.
- **Migrations**: `ensureSchema()` from `@/migrations/001-initial-schema`. Called on boot in `__create/index.ts` AND lazily on first API request. 54 tables, idempotent (CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

## Key Components (public site)

- `Header.jsx` - Navigation bar (theme-aware)
- `HeroSection.jsx` - Main landing banner
- `ServicesSection.jsx` - Services offered
- `ProcessSection.jsx` - Work process steps
- `FAQSection.jsx` - Frequently asked questions
- `ContactSection.jsx` - Public contact form (posts to `/api/contact`)
- `PortfolioSection.jsx` - Gallery thumbnails
- `Footer.jsx` - Site footer

## Key Components (admin CRM)

- `DashboardOverview.jsx` - Lead pipeline summary
- `LeadsTable.jsx` - Sortable, filterable leads
- `CalendarHeader.jsx`, `ProjectsList.jsx`, `AppointmentsList.jsx` - Calendar/scheduling
- `EstimatesTable.jsx`, `EstimateBuilder.jsx`, `EstimateDetailModal.jsx` - Estimate workflow
- `BlogPostForm.jsx` - Blog editor (file-based, uses `gray-matter`)

## Common Tasks

### Add a new API endpoint
1. Create `src/app/api/<area>/<name>/route.js`
2. Export `GET`/`POST`/etc. taking `(request, ctx)`
3. Use `sql` for DB, `getCurrentUser`/`requireAdmin` for auth, `generalLimiter` for rate limit
4. The route-builder picks it up on save (HMR), no manual registration

### Add a new admin page
1. Create `src/app/admin/<name>/page.jsx`
2. Use `LeadsTable`/`EstimatesTable` patterns for list views, `<X>Modal` for detail views
3. Wrap state in a single `useState` per concern; no need for Redux
4. Avoid Chakra imports — use Tailwind classes only

### Add a new build
1. Drop a folder into `src/app/<route>/page.jsx`
2. The Vite dev server picks it up immediately
3. Run `npm run build` to verify the prod bundle compiles

## Verification

Before committing:
```bash
npm run build && npm test
```

Both gates pass on v55 (post-deploy, 2026-06-12). `npm test` runs the vitest suite (50 cases, ~1s); `npm run build` produces `build/{client,server}`. If either fails the commit is blocked. The apex TLS layer is covered by the infra caddy unit (see `infra/caddy/Caddyfile` — `arcanpainting.ca` block).

## Known Caveats

The two SSR provider bugs that were tracked during the v53→v55 cycle are **both fixed** as of 2026-06-12:

- **ThemeProvider / useTheme crash on SSR — fixed in v55 (commit `5569352`).** The `useTheme` hook now has a defensive SSR fallback that returns a sane default when `ThemeProvider` is absent in the render tree, so the page no longer throws `useTheme must be used within a ThemeProvider` during server rendering. The live site at `https://arcanpainting.ca` was crashing in production SSR before this fix; the v55 deploy proved the production build was *not* unaffected (the earlier CLAUDE.md note that "the production build is correct" was wrong).
- **QueryClientProvider missing at the React Router 7 root — fixed in v55 sibling commit `7c9a200`.** `QueryClientProvider` was previously mounted inside `src/app/layout.jsx`, but `layout.jsx` is never rendered in RR7 file-based routing (the root is `src/app/root.tsx`). `QueryClientProvider` is now correctly mounted inside `App()` in `src/app/root.tsx`, alongside `ThemeProvider`, so all routes — including the admin CRM pages that depend on TanStack Query — get a working QueryClient.

Remaining **non-blocking** known issues, tracked as future-sprint work:
- **#15 Accessibility: missing `alt` attributes on ~13 `<img>` tags** across public marketing pages and admin panels. A11y is a known-good backlog item; will be addressed in a dedicated accessibility sprint with `jest-axe` regression coverage.
- **#16 No linting config + ~50 `console.log`/`TODO`/`FIXME` in `src/`.** Lint was intentionally removed in the v53 strip (along with the babel pipeline). If/when it comes back, the plan is a one-step `eslint.config.js` flat-config preset with no babel intermediate (per the v53 dep notes above).
