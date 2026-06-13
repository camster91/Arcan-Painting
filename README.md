# Arcan Painting

Full-stack web application for a Toronto painting business: public marketing site (services, process, FAQ, blog, contact, quote) + admin CRM dashboard (leads, clients, estimates, contracts, invoices, payments, projects, scheduling, team, etc.).

Built on React Router 7 + Hono + Postgres.

---

## Local development

### One-command start (Docker)

Requires Docker + Docker Compose. The stack brings up Postgres 16 + the app, waits for the DB to be healthy, runs migrations on first request, and serves the app at <http://localhost:3000>.

```bash
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

Requires Node 20+ and a local Postgres 16.

```bash
npm install
DATABASE_URL="postgresql://arcan:arcan_dev_password@localhost:5432/arcan_painting" npm run dev
```

The dev server is on `http://localhost:4000`. Migrations auto-run on the first request to any `/api/*` route.

### First-time setup

After the stack is up and migrations have run, seed an admin user. The `migrate-passwords.js` boot script re-hashes plain-text passwords automatically, so the simplest seed is plain text (the script picks it up on next boot):

```bash
docker compose exec db psql -U arcan -d arcan_painting -c "
INSERT INTO auth_users (username, password, role, password_is_hashed)
VALUES (
  'owner@arcan.local',
  'change-me-now',
  'owner',
  false
);
"
```

Then trigger the re-hash by restarting the app, or wait for the lazy `ensureSchema()` call on the first `/api/*` request:

```bash
docker compose restart app
```

After that, log in at <http://localhost:3000/admin/login> with `owner@arcan.local` / `change-me-now`. **Change the password immediately** — the re-hash script just upgrades the column, it doesn't enforce first-login password change.

### Verifying the stack

```bash
# Public site renders
curl -sI http://localhost:3000/ | head -1
# Health endpoint
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

Two paths, both published to `ghcr.io/camster91/Arcan-Painting` automatically on every push to main via `.github/workflows/build-and-push.yml`:

### Path A: Coolify (auto-deploy)
The `deploy-coolify.yml` workflow runs on push to main. Coolify is configured to pull the image and restart the container. Required env vars in the Coolify service:

```
DATABASE_URL=postgresql://arcan:CHANGE_ME@arcan-postgres:5432/arcan_painting
APP_URL=https://arcanpainting.ca
NEXTAUTH_URL=https://arcanpainting.ca
NODE_ENV=production
PORT=3000
```

The Postgres instance can be a sibling Coolify service (recommended) or a managed one (Neon, Supabase). The container expects `DATABASE_URL` to be reachable at startup — the server is postgres-only (no SQLite fallback).

### Path B: Node host with Docker
On any VPS or container host (Hostinger, DigitalOcean, Render, fly.io), pull the image and run it:

```bash
docker run -d --name arcan-painting --restart unless-stopped \
  -p 127.0.0.1:3015:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://arcan:CHANGE_ME@db:5432/arcan_painting" \
  -e APP_URL="https://arcanpainting.ca" \
  -e NEXTAUTH_URL="https://arcanpainting.ca" \
  -e PORT=3000 \
  --health-cmd='wget -q -O - http://127.0.0.1:3000/api/health || exit 1' \
  --health-interval=30s --health-timeout=5s --health-retries=3 --health-start-period=10s \
  ghcr.io/camster91/Arcan-Painting:main
```

The 1700-line `ensureSchema()` migration runs on first boot and is idempotent. No data volumes to mount — leads, clients, and uploaded media all live in Postgres.

For the live deployment to arcanpainting.ca, Caddy (already running on the host) routes `arcanpainting.ca` to `127.0.0.1:3015` (the container's exposed port).

### GitHub Actions CI
On every PR, the `ci.yml` workflow runs `npm install --include=dev && npm run build && npm test`. Required to merge.

## Known caveats

- The first `/api/*` request after a fresh boot runs the 1700-line migration. Slow on cold start (3-5s); the container's `--health-start-period=10s` covers this.
- The dev server's SSR render fails on `useTheme must be used within a ThemeProvider` because `ThemeProvider` is mounted in `src/app/layout.jsx` (the inner layout), not `src/app/root.tsx`. The **production build is unaffected**; only the dev server SSR render. Tracked under issue #16 follow-ups. For dev work, hit the API directly with curl — the Hono routes are independent of the React tree.
- Sentry is wired but no DSN is set in local dev. Set `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` to enable.
- The v53 strip removed the OpenClaw AI assistant service and the `/api/agents/*` routes that consumed it. **If an old browser tab is still pointing at a route it can't find, the catch-all in `app/__create/not-found.tsx` renders a 404 page** — not a runtime crash.
- The `public/gallery/` folder is 108MB of webp images and is `.dockerignore`'d. The image runs without it. If the public site needs the gallery, mount `/app/public/gallery` from a volume or a separate tarball.
