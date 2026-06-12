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

After the stack is up and migrations have run, seed an admin user via psql:

```bash
docker compose exec db psql -U arcan -d arcan_painting -c "
INSERT INTO auth_users (username, password, role, password_is_hashed)
VALUES (
  'owner@arcan.local',
  '\$argon2id\$v=19\$m=65536,t=3,p=4\$randomsalt22chars00000000\$randombase64hash00000000000000000000',
  'owner',
  true
);
"
```

Then log in at <http://localhost:3000/admin/login> with that username and the password you hashed. (The `migrate-passwords.js` boot script can also re-hash plain-text passwords, but for the seed you'll want to generate the hash with a one-liner like `node -e 'require("argon2").hash("yourpassword").then(console.log)'` first.)

### Verifying the stack

```bash
# Public site renders
curl -sI http://localhost:3000/ | head -1
# Health endpoint
curl -s http://localhost:3000/api/health
# Admin login page
curl -sI http://localhost:3000/admin | head -1
# Quote form page
curl -sI http://localhost:3000/quote | head -1
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
└── .env.example               documented env vars
```

See `CLAUDE.md` for the full architecture notes (auth, CSRF, route mounting, etc.).

---

## Production deploy

Not in scope for this README — see the GitHub Actions workflow (`.github/workflows/deploy.yml`) and the deploy host's docs.

## Known caveats

- The first `/api/*` request after a fresh boot runs the 1700-line migration. Slow on cold start (3-5s).
- The OpenClaw AI assistant service is referenced by `/api/agents/*` routes but is NOT in this stack. If those routes are hit, they return 502 with a clear error. Disable them at the admin/agent UI level or run `arcan-openclaw/` as a sibling service.
- Sentry is wired but no DSN is set in local dev. Set `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` to enable.
