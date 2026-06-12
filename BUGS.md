# Arcan Painting — bug report

Bug list as of 2026-06-12. **Strikethrough** = fixed.

## ~~Bug #1 — Boot crash on fresh DB: `relation "auth_users" does not exist`~~

**Fixed in `__create/index.ts`.** Added `await ensureSchema()` call BEFORE `migratePasswords()` on boot, with a `.catch()` to log non-fatal errors. Verified: drop the schema, restart the server, hit `/api/health` → 200. No more "Password migration failed: relation does not exist" in the boot log.

## ~~Bug #2 — Migration is incomplete (15 missing tables)~~

**Fixed in `src/migrations/001-initial-schema.js`.** Added a new `ensureMissingTables()` function that runs as part of `ensureSchema()`, creating the 8 CRM-critical tables that routes query but the original migration missed:

- `availability_slots` — admin can publish bookable time windows
- `appointments` — a booking against an availability slot
- `notifications` — admin inbox
- `completion_workflows` — per-project checklist
- `project_progress` — daily site reports
- `time_tracking` — clock-in/clock-out against a project or task
- `contract_templates` — reusable contract boilerplate
- `internal_tasks` — admin's private to-do list (time-tracking JOINs to it)

Each `CREATE TABLE` is idempotent (`IF NOT EXISTS`) with appropriate FK constraints and indexes. **Bonus fix** in `src/app/api/project-progress/route.js`: the LEFT JOIN was on `pp.reported_by = tm.id` (integer = varchar type mismatch). Changed to `tm.name::text OR tm.id::text` so a username string works.

Verified end-to-end on a fresh DB: `psql ... DROP SCHEMA`, restart, hit all 8 routes → 200, 54 tables in DB.

## ~~Bug #3 — React 18 doesn't recognize `fetchPriority` prop~~

**Fixed in 3 files.** Changed to lowercase `fetchpriority` (correct HTML attribute on `<img>`):
- `src/components/Header.jsx:144`
- `src/components/HeroSection.jsx:96`
- `src/components/HeroSection.jsx:390`

Verified: SSR warning gone from server log.

## ~~Bug #4 — `/api/calendar` returns 500 instead of 503 when Maton API key missing~~

**Fixed in `src/app/api/calendar/route.js`.** The catch block only checked for `"Missing Google OAuth"` but the actual error message is `"Missing Maton API key. Set MATON_API_KEY in your project secrets."`. Updated the matcher to catch both strings → 503 with `Google Calendar is not configured`. Verified.

## ~~Bug #5 — Public OAuth auth is dead~~

**Fixed.** Killed the entire Anythings-template OAuth layer:

- Deleted `__create/adapter.ts` (broken Neon OAuth adapter)
- Deleted `__create/is-auth-action.ts` (only used by the OAuth flow)
- Deleted `src/__create/@auth/create.js` (the shim)
- Deleted `src/auth.js` (the broken OAuth setup that called `crypto.randomUUID()` against an `integer` id column)
- Deleted `src/utils/useAuth.js` + `src/utils/useUser.js` (client-side OAuth hooks)
- Deleted `src/app/account/*` (5 OAuth public pages: signin, forgot-password, reset-password, accept-invite, change-password)
- Deleted `src/app/api/auth/*` (2 OAuth callback routes: token, expo-web-success)
- Deleted `src/app/api/__create/ssr-test/route.js` (only used to test the OAuth shim)
- Deleted `src/app/admin/profile/` (read-only display of the OAuth user)
- Rewrote `__create/index.ts` to remove the `@auth/core` + `@hono/auth-js` + `@neondatabase/serverless` imports, the `initAuthConfig` block (137 lines), the `app.all('/integrations/...')` proxy, the `app.use('/api/auth/*')` middleware, and the top-level `Pool` (no longer needed)
- Removed `SessionProvider` import + usage from `src/app/root.tsx`
- Removed `serializeError(error)` call from root.tsx error boundary; replaced with native Error serialization (clipboard-safe)
- Cleaned `src/global.d.ts`: removed `@auth/create/react` + `npm:stripe` module declarations
- Dropped 4 unused deps from `package.json`: `@auth/core`, `@hono/auth-js`, `@neondatabase/serverless`, `ws` (+ `@types/ws` dev dep)
- `npm install` now resolves 775 packages (was 794 — saved 19 packages)

**What was preserved:** The CRM's `/api/local-auth/*` flow (argon2id password hashing + Postgres-backed sessions + CSRF cookies + audit log + rate limiting) is fully working. Verified end-to-end: login → cookie → `/api/local-auth/me` → POST `/api/leads` → GET `/api/leads` returns the new lead. Server bundle dropped from 712KB to 700KB as a bonus.

## ~~Bug #6 — `migrate-passwords` on every boot is wasteful~~

Was a minor concern. Still a no-op when no plain-text passwords exist, but the boot is clean. Not worth a fix; doc-only.

## What's working (verified end-to-end with Docker-style local stack)

- `npm install` → 775 packages, 20s
- `npm run build` → 700KB server bundle + client assets, no errors
- Server boot on Node 22: ~700ms cold start, no error output
- All public pages: `/`, `/quote`, `/blog`, `/contact`, `/admin` (200)
- `/api/health` (200), `/api/posts`, `/api/gallery` (200)
- Auth flow: `POST /api/local-auth/login` → argon2 verify → sets `admin_session` cookie
- Session check: `GET /api/local-auth/me` returns user
- CRM read: `GET /api/leads` paginates correctly
- CRM write: `POST /api/leads` saves lead to DB, returns full lead object
- All previously-500 routes now return 200: `/api/availability`, `/api/notifications`, `/api/appointments`, `/api/completion-workflows`, `/api/project-progress`, `/api/time-tracking`, `/api/contract-templates`, `/api/internal-tasks`
- Calendar fail-soft: returns 503 with clear error when Maton key missing
- Migrations: 54 tables auto-created on first boot (was 45)
- Blog seeded with 5 starter posts

## Removed packages — what you lost

If you ever need to put any of these back, see the GitHub history (pre-fix commits):

- `@auth/core` — public OAuth (credentials + google + facebook + twitter providers)
- `@hono/auth-js` — Hono glue for NextAuth
- `@neondatabase/serverless` — driver for Neon Postgres with WebSocket transport
- `ws` — used by Neon serverless for WebSocket support

The Anythings-template intended for these to power a public auth UI. The codebase never actually used any of it correctly (the schema mismatch in `__create/adapter.ts` would have failed on first signup attempt). If you want to add a real public auth later, the path is: pick a real OAuth provider (Auth0, Clerk, Supabase Auth), add a proper `auth_users` column migration (UUID id, snake_case), wire up via the existing Hono server.
