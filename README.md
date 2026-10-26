# Arcan Painting

Public marketing website and retained in-house CRM for Arcan Painting, built in one React Router 7 / React 18 / Node-Hono codebase.

## Current deployment

The public website at https://arcanpainting.ca runs as a static export on Cloudflare Workers. Existing CRM, authentication, database and uploads remain on the retained Node origin, reached through the production Worker’s legacy-route passthrough. The public export does not migrate or redeploy that Node application.

The public release currently offers telephone/email contact links. Callback/text-back form code and a private D1-backed intake/outbox are implemented, but public submissions and notification scheduling remain disabled pending destination verification and delivery acceptance. D1 enquiries are not automatically synchronized into the legacy CRM.

Use [the Cloudflare runbook](docs/CLOUDFLARE-WORKERS.md) for current accounts, release gates, deployment evidence and rollback. Historical release records describe their stated dates; they do not establish the current live state. Automatic legacy deployments remain disabled.

## What it does

The public site presents painting, wallpaper and decorative-finish services, Arcan’s original photography, project pages and direct enquiry paths. The retained Node application contains the team’s lead, estimate, contract, invoice, scheduling and project workflows. Its runtime/database and the Workers D1 intake are separate deployment targets.

## Key features

**Public site**

- Premium Painting, High-end Wallpaper and Luxury Finishes, plus Commercial Painting and Exterior Painting pages
- Project collection with all 70 original gallery images, progressive loading, filtering and an accessible viewer
- Verified Google review excerpts and an on-request Maps popup
- Server-rendered public metadata, canonical sitemap and robots policy; unsupported service/city URLs redirect to the service root
- Contact-only production mode; enquiry forms require verified storage and notification delivery before activation

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
- **Tooling:** Vite 7, TypeScript, ESLint, Vitest, Testing Library, Playwright
- **Delivery:** Cloudflare Workers for public assets/private D1 intake; retained Node hosting; Docker Compose for local development and GitHub Actions CI

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
