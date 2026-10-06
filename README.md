# Arcan Painting

Marketing website and in-house CRM for Arcan Painting, a Toronto painting company, built as one full-stack React Router 7 + Hono app.

## What it does

The public side is a fast, SEO-focused site that turns visitors into leads: service pages, city-specific landing pages, a project gallery, and quote and contact forms. Every submission lands in the admin CRM, where the team runs the rest of the job: following up on leads, building estimates, sending contracts and invoices, recording payments, scheduling crews and tracking project progress. Both halves share one codebase, one server and one database.

## Key features

**Public site**
- Service pages for interior, exterior and commercial painting, wallpaper and specialty finishes
- Service + city landing pages (`/[service]/[city]`) with a generated `sitemap.xml` and `robots.txt`
- Quote and contact forms that write leads straight to the database, plus a Meta lead-ads webhook
- Portfolio gallery with an accessible lightbox

**Admin CRM (`/admin`)**
- Leads, clients, follow-ups and a "today" view for daily work
- Estimate builder, contract templates, invoices and payments
- Projects with progress tracking, calendar, appointments and team availability
- Team management with invites, roles and time tracking
- Messages, notifications and settings

**Security and reliability**
- Local auth only: argon2id password hashing, server-side sessions, CSRF tokens on state-changing requests
- Rate limiting and audit logging on API routes
- Idempotent schema migration that runs on boot
- `/api/health` returns 503 when the database is unreachable, so a broken deploy is never reported healthy

## Tech stack

- **Framework:** React Router 7 (file-based routes, SSR) served by Hono via `react-router-hono-server`
- **UI:** React 18, Tailwind CSS 3, Motion, Lucide icons, Recharts
- **Data:** TanStack Query and TanStack Table, Zustand, Yup validation
- **Database:** PostgreSQL via `pg` (a MariaDB adapter via `mysql2` is also supported, selected by the `DATABASE_URL` scheme)
- **Auth:** argon2 with Postgres-backed sessions
- **Monitoring:** Sentry (optional, off when no DSN is set)
- **Tooling:** Vite 6, TypeScript, ESLint, Vitest, Testing Library, Playwright
- **Delivery:** Docker (multi-stage, non-root image), Docker Compose for local dev, GitHub Actions CI

## Getting started

Requires Node 22.20+.

### Option 1: Docker Compose (Postgres included)

```bash
cp .env.example .env
# Edit .env: set a local-only POSTGRES_PASSWORD and use it in DATABASE_URL
docker compose up --build
```

The stack starts Postgres 16, waits for it to be healthy, runs migrations and serves the app at http://localhost:3000.

### Option 2: Native

With a local Postgres 16 database:

```bash
npm install
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/arcan_painting" npm run dev
```

The dev server runs at http://localhost:4000. Migrations run at startup.

### Create a local admin user

No admin account is seeded. After migrations have run, insert a local-only owner account (the password is hashed by the app on the next request):

```bash
read -s -p "Local admin password: " ARCAN_LOCAL_ADMIN_PASSWORD
docker compose exec db psql -U arcan -d arcan_painting \
  -v admin_password="$ARCAN_LOCAL_ADMIN_PASSWORD" -c "
INSERT INTO auth_users (username, password, role, password_is_hashed)
VALUES ('owner@arcan.local', :'admin_password', 'owner', false);"
unset ARCAN_LOCAL_ADMIN_PASSWORD
docker compose restart app
```

Then sign in at http://localhost:3000/admin/login.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR on port 4000 |
| `npm run build` | Production build to `build/` |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint over `src/` |
| `npm run typecheck` | React Router typegen + `tsc --noEmit` |
| `npm test` | Vitest unit and integration suite |
| `npm run test:e2e` | Build, then run Playwright smoke tests |

## Testing

```bash
npm test
npm run test:e2e
```

The Vitest suite in `test/` covers auth and session expiry, CSRF boundaries, admin route guards, lead and quote persistence, invoice totals, rate-limit proxy trust, SEO output and accessibility of key components. `e2e/public-smoke.spec.ts` runs Chromium smoke checks against the built site. CI runs lint, typecheck, tests, build and the smoke tests on every pull request.

## Project structure

```
.
├── __create/            Hono server entry; auto-mounts src/app/api/**/route.js
├── src/
│   ├── app/             File-based routes (public pages and /admin)
│   ├── app/api/         API route handlers
│   ├── components/      Public and admin React components
│   ├── hooks/           Data hooks (leads, estimates, etc.)
│   ├── lib/             Shared server and client helpers
│   └── migrations/      Idempotent database schema
├── test/                Vitest suites
├── e2e/                 Playwright smoke tests
├── public/              Static assets
├── Dockerfile
└── docker-compose.yml
```

## License

[MIT](LICENSE)
