# Arcan Painting

Full-stack web application for a Toronto painting business: public marketing site (services, process, FAQ, blog, contact, quote) + admin CRM dashboard (leads, clients, estimates, contracts, invoices, payments, projects, scheduling, team, etc.).

Built on React Router 7 + Hono + Postgres.

---

## Local development

### One-command start (Docker)

Requires Docker + Docker Compose. The stack brings up Postgres 16 + the app, waits for the DB to be healthy, runs the idempotent migrations during app startup, and serves the app at <http://localhost:3000>.

Copy `.env.example` to `.env`, set a unique local-only `POSTGRES_PASSWORD`, and update `DATABASE_URL` to use that same password before starting. The database port is bound to localhost only.

```bash
cp .env.example .env
# Edit .env and set POSTGRES_PASSWORD, then:
docker compose up --build
```

Other useful commands:

```bash
docker compose down -v                # stop + wipe DB volumes
docker compose logs -f app            # tail app logs
docker compose exec db psql -U arcan -d arcan_painting   # psql into the DB
docker compose exec app sh            # shell into the app container
```

### Native (no Docker)

Requires Node 22.20+ and a local Postgres 16.

```bash
npm install
DATABASE_URL="postgresql://arcan:YOUR_LOCAL_PASSWORD@localhost:5432/arcan_painting" npm run dev
```

The dev server is on `http://localhost:4000`. With `DATABASE_URL` configured, migrations run at startup and are also safely retried by database-backed API routes.

### First-time setup

After the stack is up and migrations have run, create a **unique local-only** admin password. Never use a shared password, commit it, or seed production from this command:

```bash
read -s -p "Local admin password: " ARCAN_LOCAL_ADMIN_PASSWORD
docker compose exec db psql -U arcan -d arcan_painting -c "
INSERT INTO auth_users (username, password, role, password_is_hashed)
VALUES (
  'owner@arcan.local',
  :'admin_password',
  'owner',
  false
);
" -v admin_password="$ARCAN_LOCAL_ADMIN_PASSWORD"
unset ARCAN_LOCAL_ADMIN_PASSWORD
```

Then trigger the re-hash by restarting the app, or wait for the lazy `ensureSchema()` call on the first `/api/*` request:

```bash
docker compose restart app
```

After that, log in at <http://localhost:3000/admin/login> with the local-only password you chose. The bootstrap password is re-hashed on the next app request; change it immediately if the local environment is shared.

### Verifying the stack

```bash
# Public site renders
curl -sI http://localhost:3000/ | head -1
# Health endpoint (200 only when Postgres is reachable)
curl -s http://localhost:3000/api/health
# Admin login page (server-rendered)
curl -sI http://localhost:3000/admin | head -1
# Quote form page
curl -sI http://localhost:3000/quote | head -1
# Contact form end-to-end
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"t@x.com","serviceType":"interior","message":"smoke"}' \
  http://localhost:3000/api/contact
```

---

## Project layout

```
.
├── __create/                  Hono server entry (auto-mounts src/app/api/**/route.js)
├── public/                    static assets (gallery is .dockerignore'd — volume-mount in prod)
├── src/
│   ├── app/                   file-based routes (public + /admin)
│   ├── app/api/               server route handlers
│   ├── components/            public + admin React components
│   ├── hooks/                 useLeads, useEstimates, etc.
│   ├── lib/                   blog-db.js (Postgres), blog.js (file-based), google.js
│   ├── migrations/001-initial-schema.js    1700-line Postgres schema (idempotent)
│   └── utils/                 small helpers
├── Dockerfile                 multi-stage, node:20-alpine, non-root
├── docker-compose.yml         app + postgres, healthcheck-gated
├── .github/workflows/         build-and-push.yml, deploy.yml, deploy-coolify.yml
└── .env.example               documented env vars
```

See `CLAUDE.md` for the full architecture notes (auth, CSRF, route mounting, etc.).

---

## Production deploy

Merge only a reviewed, CI-green pull request. A push to `main` builds the GHCR image and triggers the guarded Coolify deployment in `.github/workflows/deploy.yml`. The separate `deploy-coolify.yml` workflow is a manual recovery path and must only be dispatched with explicit production approval.

Before the first release, configure these environment variables in the Coolify service:

```
DATABASE_URL=postgresql://arcan:CHANGE_ME@arcan-postgres:5432/arcan_painting
APP_URL=https://arcanpainting.ca
PUBLIC_APP_URL=https://arcanpainting.ca
INTERNAL_API_TOKEN=long-random-server-only-value
MATON_API_KEY=mail-gateway-key
GOOGLE_EMAIL=info@arcanpainting.ca
NODE_ENV=production
PORT=3000
```

`DATABASE_URL`, `APP_URL`, and `PUBLIC_APP_URL` are release-critical. A missing database now causes `/api/health` to return `503`, so the container will not be treated as a healthy CRM while lead storage and admin data are unavailable. `MATON_API_KEY` is required for account-recovery and invitation emails.

The Postgres instance can be a sibling Coolify service (recommended) or a managed one (Neon, Supabase). The container expects `DATABASE_URL` to be reachable at startup — the server is postgres-only (no SQLite fallback).

### Path B: Node host with Docker
On any VPS or container host (Hostinger, DigitalOcean, Render, fly.io), pull the image and run it:

```bash
docker run -d --name arcan-painting --restart unless-stopped \
  -p 127.0.0.1:3015:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://arcan:CHANGE_ME@db:5432/arcan_painting" \
  -e APP_URL="https://arcanpainting.ca" \
  -e PUBLIC_APP_URL="https://arcanpainting.ca" \
  -e INTERNAL_API_TOKEN="long-random-server-only-value" \
  -e MATON_API_KEY="mail-gateway-key" \
  -e PORT=3000 \
  --health-cmd='wget -q -O - http://127.0.0.1:3000/api/health || exit 1' \
  --health-interval=30s --health-timeout=5s --health-retries=3 --health-start-period=20s \
  ghcr.io/camster91/Arcan-Painting:main
```

The 1700-line `ensureSchema()` migration runs on first boot and is idempotent. No data volumes to mount — leads, clients, and uploaded media all live in Postgres.

For the live deployment to arcanpainting.ca, Caddy (already running on the host) routes `arcanpainting.ca` to `127.0.0.1:3015` (the container's exposed port).

### GitHub Actions CI
When repository Actions are enabled, every PR runs `ci.yml` to typecheck, execute the
unit suite, build the production bundle, and run Chromium smoke checks against that
bundle. Keep these checks required before merge. If Actions are disabled in repository
settings, the checked-in CI, GHCR image publishing, and Coolify deploy workflows cannot
run even though external checks may still appear on the pull request.

## Known caveats

- The idempotent schema migration runs during startup when `DATABASE_URL` is configured. The container healthcheck has a 20-second start period; do not release without confirming `/api/health` is `200` and the database-backed admin flow is usable.
- The dev server's SSR render fails on `useTheme must be used within a ThemeProvider` because `ThemeProvider` is mounted in `src/app/layout.jsx` (the inner layout), not `src/app/root.tsx`. The **production build is unaffected**; only the dev server SSR render. Tracked under issue #16 follow-ups. For dev work, hit the API directly with curl — the Hono routes are independent of the React tree.
- Sentry is wired but no DSN is set in local dev. Set `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` to enable.
- The v53 strip removed the OpenClaw AI assistant service and the `/api/agents/*` routes that consumed it. **If an old browser tab is still pointing at a route it can't find, the catch-all in `app/__create/not-found.tsx` renders a 404 page** — not a runtime crash.
- The `public/gallery/` folder is 108MB of webp images and is `.dockerignore`'d. The image runs without it. If the public site needs the gallery, mount `/app/public/gallery` from a volume or a separate tarball.
