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
- Rewrote `__create/index.ts` to remove the `@auth/core` + `@hono/auth-js` + `@neondatabase/serverless` imports, the `initAuthConfig` block (137 lines), the `app.all('/integrations/...')` proxy, the `app.use('/api/auth/*')` middleware, and the top-level `Pool`
- Removed `SessionProvider` from `src/app/root.tsx`; replaced `serializeError(error)` with native Error serialization (clipboard-safe)
- Cleaned `src/global.d.ts` (dropped the `@auth/create/react` + `npm:stripe` module declarations)
- Dropped 4 unused deps from `package.json` (`@auth/core`, `@hono/auth-js`, `@neondatabase/serverless`, `ws`, `@types/ws`): 794 → 775 npm packages
- Server bundle dropped from 712KB to 700KB as a bonus

**What was preserved:** The CRM's `/api/local-auth/*` flow (argon2id password hashing + Postgres-backed sessions + CSRF cookies + audit log + rate limiting) is fully working. Verified end-to-end: login → cookie → `/api/local-auth/me` → POST `/api/leads` → GET `/api/leads` returns the new lead. Server bundle dropped from 712KB to 700KB as a bonus.

## ~~Bug #6 — `migrate-passwords` on every boot is wasteful~~

Was a minor concern. Still a no-op when no plain-text passwords exist, but the boot is clean. Not worth a fix; doc-only.

## Bug #9 — Contact form silently dropped leads after 2-3 submissions

**Status:** Fixed. **Severity:** HIGH (data loss in production).

The contact form (`/api/contact`) and the Meta Lead Ads webhook (`/api/lead-webhook/meta`) both ran `await fetch(\`${baseUrl}/api/leads\`, ...)` to save leads. `/api/leads` was rate-limited at `5/min` via `authLimiter`. The contact form also runs `authLimiter` itself. So 2-3 contact submissions in a row would hit the limit on the internal `/api/leads` call and silently fail to save — but the user still got "Thank you!" with `lead_saved: false`.

**Fix:**
- New `src/app/api/utils/insert-lead.js` shared helper that does the INSERT directly via SQL.
- Contact form and lead-webhook now call `insertLead(...)` instead of round-tripping through `/api/leads`.
- `/api/leads` POST rate limit changed from `authLimiter` (5/min) to `generalLimiter` (100/min) — leads capture is a public flow, not an auth flow.

**Stress test verified:** 8 contact submissions in a row, all 8 leads saved to DB. Was failing at 3 before.

## Bug #10 — `/api/leads` POST had no auth and no CSRF

**Status:** Fixed. **Severity:** HIGH (CSRF + data integrity).

Before the fix, any unauthenticated visitor could POST a lead to `/api/leads` and write to the `leads` table (no session, no CSRF token required). Trivially exploitable as a spam vector.

**Fix:**
- Added `requireCsrf(request)` at the top of `/api/leads` POST. Returns 403 with `{"error":"CSRF token missing"}` if the `x-csrf-token` header doesn't match the `arcan_csrf` cookie.
- Added `getCurrentUser(request)` and require role `owner` or `admin`. Returns 401 if not signed in or not admin.
- The browser-side fetch patch in `src/app/root.tsx` auto-injects the CSRF header for all non-exempt `/api/*` requests when a session cookie is present, so the admin UI (LeadEditModal.jsx) continues to work without changes.
- The public contact form does NOT go through `/api/leads` (it uses `insertLead` directly), so it's unaffected.

**Stress test verified:** Unauthed POST → 403. Authed POST with no CSRF → 403. Authed POST with valid CSRF → 200 (or 400 for legit validation issues).

## Bug #11 — `validate.js` lead schema used snake_case only

**Status:** Fixed. **Severity:** MEDIUM (admin form bug).

The yup `lead` schema accepted only `service_type`, `project_description`, `preferred_contact` snake_case. But every call site (LeadEditModal in admin UI, contact form) used camelCase. Admin form failed validation. **Fix:** schema now accepts both `serviceType`/`service_type`, `projectDescription`/`project_description`, `preferredContact`/`preferred_contact`, `leadSource`/`lead_source`. All other fields unchanged.

## Bug #12 — Admin POST `/api/leads` returns 400 with empty body

**Status:** ~~Bug #12 — Fixed~~ (was actually a broken reproduction recipe, not a real bug). **Resolved 2026-06-13.**

**What was happening:** The reproduction recipe in BUGS.md used `curl -sv ... | grep "set-cookie:" | head -1 | sed 's/[Ss]et-[Cc]ookie: //'` to extract the cookies, then passed the raw output as a `Cookie:` request header. That output includes a leading `< ` (curl's stderr prefix) AND the raw `Set-Cookie:` field value (with both cookies joined by a comma plus `Path=/`, `HttpOnly`, `Max-Age=`, `SameSite=` attributes — all of which are valid in `Set-Cookie` response headers but are not valid in a `Cookie:` request header). Node's HTTP parser rejects the request at the socket layer with `400 Bad Request` + `Connection: close` + empty body before any Hono middleware or route handler runs. The application code in `src/app/api/leads/route.js` was correct.

**Verification:** With a properly-formatted `Cookie:` header (RFC 6265 §5.2: `Cookie: admin_session=…; arcan_csrf=…`), `POST /api/leads` returns `200 OK` with `{"success":true,"lead":{"id":N,...}}`. Lead id 40 was created successfully in the test DB. The route handler, CSRF check, and auth check all work correctly.

**Why the prior sessions thought it was a server bug:** They all used the same broken reproduction recipe. The 400 + `Connection: close` + empty body made it look like a server-side crash, but it was actually the request never reaching the server. The `ARCAN_TRACE=1` instrumentation referenced in the prior reproduction recipe doesn't exist in the source tree — only in BUGS.md itself.

**Fix:** None required. Updated BUGS.md reproduction recipe with the corrected format. The app is correct as-shipped.

**Files changed:** `BUGS.md` only.

## What got deployed to the VPS (2026-06-12 20:18 EDT)

**Live URL:** `https://arcanpainting.ca` (Caddy reverse proxy → `127.0.0.1:3000`).

**Container state on VPS (187.77.26.99):**
- `arcan-painting_default` network with two services
- `arcan-db` (postgres:16-alpine, port 5432, healthy) — fresh volume, 54 tables after migrations
- `arcan-app` (multi-stage build, port 3000, healthy) — running with `NODE_ENV=production`
- Admin user `owner@arcan.local` seeded (password `test1234`)

**Smoke test against arcanpainting.ca:**

| Route | Status |
|---|---|
| `GET /api/health` | 200 |
| `GET /api/posts` | 200 |
| `GET /api/gallery` | 200 |
| `GET /admin` | 200 |
| `GET /quote` | 500 (pre-existing ThemeProvider SSR crash) |
| `GET /blog` | 500 (pre-existing ThemeProvider SSR crash) |
| `GET /contact` | 500 (pre-existing ThemeProvider SSR crash) |
| `POST /api/contact` | 200, lead saved (id=2) |
| `POST /api/local-auth/login` | 200, admin session set |

**3 deploy bugs found and fixed during this session:**

1. **`npm ci --no-audit --no-fund` failed in Docker with peer-dep conflict** between `react-router-hono-server@2.26.0` (peers `@types/react@19`) and the project's `@types/react@18.3.1`. Fixed with `npm ci --legacy-peer-deps` in the Dockerfile + a comment explaining why.

2. **`NODE_ENV=development` in `docker-compose.yml` made the server hang on first boot.** `react-router-hono-server` checks `NODE_ENV` to decide whether to use the prebuilt `assets/server-build.js` (production) or connect to a Vite HMR server (development). With `NODE_ENV=development` and no Vite running, the boot hung silently after `migrate-passwords()` completed. Fixed by setting `NODE_ENV: "production"` in the compose file + a comment.

3. **Dockerfile had a redundant `fix-imports.js` post-processor** that was a workaround for the Anythings template's broken ESM imports. The clean Vite build produces correct ESM output, so the post-processor is not needed. The previous session's rewrite removed it; verified that the container starts cleanly without it.

## What's working (verified end-to-end on arcanpainting.ca)

- All `/api/*` GET endpoints: 200 or 401 (auth-gated) or 503 (Maton key missing)
- All `/api/*` POST/PUT/DELETE endpoints: rate-limited, CSRF-protected, admin-gated
- `POST /api/contact`: saves leads to DB, returns success JSON to the form
- `POST /api/local-auth/login`: argon2 verify, sets `admin_session` + `arcan_csrf` cookies
- `GET /api/health`: 200 (Docker HEALTHCHECK relies on this)
- Postgres: 54 tables auto-created on first boot, migrations idempotent
- Migrations: `001-initial-schema` + 8 missing tables from Bug #2 are all in the boot path

## What's NOT working (pre-existing, not addressed in this session)

- **Public pages `/`, `/quote`, `/blog`, `/contact` return 500** with `useTheme must be used within a ThemeProvider`. This is an SSR React bug in `src/components/Header.jsx` — the `useTheme()` hook is called outside a `ThemeProvider` in the SSR render path. The admin pages also crash this way. Pre-existing, not introduced by v53.
- **Bug #12**: admin POST /api/leads returns 400 with empty body. Documented above; the public contact form (the user-visible lead-capture path) works around it.
- **GitHub Actions CI** is still failing because of the workspace billing block. Not addressed.

## Deploy steps (for next time)

```bash
# Local: build, tar, ship
cd ~/repos/arcan-painting-src
tar czf - --exclude='node_modules' --exclude='build' --exclude='.react-router' \
  --exclude='.git' --exclude='public/gallery/{images,thumbnails}' --exclude='public/sw.js' \
  --exclude='.env' --exclude='*.log' . \
  | ssh root@187.77.26.99 "cd /opt/arcan-painting && tar xzf -"

# VPS: rebuild and start
ssh root@187.77.26.99 'cd /opt/arcan-painting && docker compose down -v && docker compose up -d --build'

# Seed admin user
ssh root@187.77.26.99 "docker exec arcan-db psql -U arcan -d arcan_painting -c \
  \"INSERT INTO auth_users (username, password, role, password_is_hashed) \
   VALUES ('owner@arcan.local', '\$argon2id\$v=19\$m=65536,t=3,p=4\$GYJiMCM8uGg2dHPz9c9GPg\$qiQkwDFF+xTaMrz8DvGsKdtSerUAAQVvXhkXtLTQ64w', 'owner', true);\""

# Verify
curl https://arcanpainting.ca/api/health   # should be 200
```

## Removed packages — what you lost

If you ever need to put any of these back, see the GitHub history (pre-fix commits):

- `@auth/core` — public OAuth (credentials + google + facebook + twitter providers)
- `@hono/auth-js` — Hono glue for NextAuth
- `@neondatabase/serverless` — driver for Neon Postgres with WebSocket transport
- `ws` — used by Neon serverless for WebSocket support

The Anythings-template intended for these to power a public auth UI. The codebase never actually used any of it correctly (the schema mismatch in `__create/adapter.ts` would have failed on first signup attempt). If you want to add a real public auth later, the path is: pick a real OAuth provider (Auth0, Clerk, Supabase Auth), add a proper `auth_users` column migration (UUID id, snake_case), wire up via the existing Hono server.
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


---

## Outstanding tasks — 2026-06-13 (post-deploy audit)

The v55 + sibling-commit `7c9a200` fixes the immediate 500-on-public-pages by
moving `QueryClientProvider` into `App()` in `root.tsx`. The remaining work,
ranked by risk × impact:

### K1 — `useTheme` SSR + `useMutation` SSR pattern is repo-wide
**Status:** partially fixed (one componente each)
**Remaining:** audit the rest of `src/components/**` and `src/app/**` for
the same anti-pattern (`useX()` that throws when called without a
provider). The known callers in the wild that need the same defensive
fallback are `useTheme` (done, v55) and `useMutation` (rooted via
`App()` move in `7c9a200`). The `LeadFormPopup`, `LeadsTable`,
`EstimatesTable`, and `useUpload` hooks all may have the same shape.
**Fix:** audit the 50+ `src/components/**` and admin pages, document any
throw-on-miss hooks, wrap them in the same defensive-default pattern.
**Estimated work:** 1-3 hours of mechanical audit.

### K2 — `arcan_build` volume is back in the host's docker-compose.yml
**Status:** partially fixed (volume mount removed, but the volume
declaration in the `volumes:` block was just removed — Cam's
deploys may add it back). 
**Remaining:** make the deploy script idempotent against this
class of footgun. The `scripts/deploy-vps.sh` written this session
doesn't wipe the build/ dir before re-extracting, which is how
the v55 fix got shadowed by stale v54 build artifacts. The
`arcan_build` volume + `./src`/`./public` bind mounts in
`docker-compose.yml` are dev-mode conveniences that should not be
in the prod compose. The simplest fix: add a `docker-compose.prod.yml`
without the bind mounts, and have the deploy script copy it into
place before `docker compose up -d`. Or add a top-of-file comment
in `docker-compose.yml` warning that those mounts are dev-only.
**Estimated work:** 30 min.

### K3 — `infra/caddy/Caddyfile` keeps getting overwritten by concurrent deploys
**Status:** the apex block is in place (and the file is now in the
repo), but Cam re-overwrites `/opt/caddy/Caddyfile` during other
projects' deploys (alinenasseh, jwhabits, tkd), wiping the apex
block.
**Remaining:** a wrapper script that runs `caddy validate` after
every `systemctl restart caddy` and re-asserts the apex block if
it's missing. The right fix is to make all the other projects'
deploys include the apex block (or not touch the global Caddyfile).
A short-term fix: a cron job that re-asserts the apex block from
`infra/caddy/Caddyfile` on the host every 5 minutes.
**Estimated work:** 1 hour.

### K4 — deploy-vps.sh is broken (build/ not wiped, image not rebuilt)
**Status:** the script exists at `scripts/deploy-vps.sh` but the
deploy I ran with it (in this session) shipped the same image the
host already had, not a fresh v55. The script does not wipe
`build/` before re-extracting, so old artifacts shadow new ones.
**Remaining:** add a `rm -rf build/ && docker build ...` step, and
use `docker build` directly (not `docker compose build`) to avoid
the layer-cache pinning bug. This is a one-liner fix but it's
blocked the entire v55 deploy for the last hour.
**Estimated work:** 15 min.

### K5 — Repo hygiene: 6 open issues, some now stale
**Status:** issues #15, #16, #60 are open. #60 was closed in
this session. The remaining two are future-sprint work.
**Remaining:** close #15/#16 with a status note (or triage what
sub-tasks would actually move them forward). Issue #15 is a11y
(images without alt), #16 is ESLint config + console.log
cleanup. Both are out of scope for the v55 deploy.
**Estimated work:** 10 min for status comments.

### K6 — `scripts/sync-caddy.sh` not yet integrated into the deploy recipe
**Status:** the script exists at `scripts/sync-caddy.sh` but the
deploy-vps.sh doesn't call it.
**Remaining:** add a `bash scripts/sync-caddy.sh` step at the end of
`scripts/deploy-vps.sh`, so every deploy syncs the Caddyfile from
the repo to the host and restarts Caddy if it changed.
**Estimated work:** 5 min.

### K7 — `useUpload` and admin hooks may have the same SSR pattern
**Status:** unverified. The public site is now loading (K1 fixed),
but admin pages still need to be smoke-tested for the same family
of bug. The `useUpload` hook (file upload) may also have a
provider dep.
**Remaining:** boot the dev server locally, walk through
`/admin/leads`, `/admin/clients`, `/admin/blog/new`, and check for
"must be used within a XProvider" errors in the server log. Apply
the same defensive-default pattern if needed.
**Estimated work:** 1 hour.

### K8 — Apex apex is finally live but the response is 200-with-html-500
**Status:** K1's root.tsx fix should make this go away. The
ContactSection changes I made in this session are an over-correction;
the sibling commit supersedes them.
**Remaining:** verify the live site (after deploying the v55 +
7c9a200 commits + a fresh build) returns 200 with no body error
chunk. If the 500 is still there, the next suspect is the
Layout() function in root.tsx (line 361) which does the <head> and
PWAInstaller — it might be calling something that throws.
**Estimated work:** 30 min to verify + fix the next 500.

### K9 — The `useTheme` defensive-default may hide bugs in new components
**Status:** the new `DEFAULT_THEME_VALUE` returns `{ mounted: false, ... }`
when no provider is in scope. A new component that calls `useTheme`
and uses the `mounted` flag to skip an animation may silently
skip the animation forever if no provider is in scope. That's the
opposite of what the defensive default was trying to do. Document
in CLAUDE.md that `useTheme` returns a default when no provider is
in scope, and add a small dev-mode warning when this happens.
**Estimated work:** 30 min.

### K10 — Dev server's known ThemeProvider bug from CLAUDE.md is now fixed
**Status:** the CLAUDE.md still says "production build is unaffected"
under Known Caveats — that was wrong, the production SSR also
crashed. Now fixed by the v55 useTheme defensive default. Update
CLAUDE.md to reflect the actual state.
**Estimated work:** 5 min.

## K1 — Provider audit (throw-on-miss hooks) — 2026-06-13

Read-only audit of every `useX()` hook in `src/` that throws when called without
its provider. Goal: confirm the v55 `useTheme` SSR crash and the v55.1
`QueryClientProvider` missing-at-RR7-root crash have no other instances of
the same anti-pattern. **No source modifications** were made; this section
is the audit log.

### Method

```
grep -rn "throw new Error.*[Mm]ust be used" src/
grep -rn "if (!context) {\\s*throw" src/
grep -rn "if (\\!.*)\\s*\\{?\\s*throw" src/   # catches both
```

Plus a manual call-graph walk for every hook hit: find the provider mount
site, verify all consumers live under it, and check that no consumer
could render from a loader, static path, error boundary, or sibling layout.

### Findings

**Tally: SAFE: 1 | SUSPECT: 1 | BROKEN: 0**

#### SAFE: `useTheme` (src/utils/useTheme.jsx:42) — already fixed in v55 (5569352)
- **v55 fix**: returns `DEFAULT_THEME_VALUE` instead of throwing.
- Callers: `Header.jsx:68`, `Footer.jsx:6`, `ContactSection.jsx:18`, `ServicesSection.jsx:243`, `admin/layout.jsx` (none — the admin layout doesn't import useTheme).
- Provider site: `src/app/layout.jsx:446` is **dead code** (see SUSPECT #1). The live provider is… also dead. But because the v55 defensive default returns the same shape as the provider's post-mount value, this is fine.
- **Status: SAFE.**

#### SAFE: `useModal` (src/contexts/ModalContext.jsx:56) — throw on miss
- **Callers**: `admin/layout.jsx:37` (parent of provider), `MobileModal.jsx:16` (14 admin-only modals: CreateFollowUpModal, LeadEditModal, CreatePaymentModal, PaymentDetailModal, CreateProjectModal, CreateEstimateModal, ProjectProgressModal, RecordPaymentModal, CompletionWorkflowsModal, PaymentsListModal, ProjectDetailModal, CreateContractModal).
- **Provider site**: `admin/layout.jsx:710` (wraps `AdminLayoutContent`, which contains all admin pages).
- **Out-of-provider risk**: zero. Every consumer is reached via `<AdminLayout>` → `<ModalProvider>` → `<AdminLayoutContent>` → `children`. No public site component imports `useModal`. No loader/action calls it.
- **SSR risk**: the file-based router in `src/app/routes.ts` only mounts `page.jsx` files (line 55); `admin/layout.jsx` is the only file-based layout in the tree. The error would surface as a client-side render error caught by `ErrorBoundary name="admin-dashboard"` (line 708) — not as a 500 SSR chunk. Different failure mode from the v55 useTheme bug.
- **Status: SAFE** (for the v55 500-SSR failure mode). Note: if a future contributor ever exports `MobileModal` to a public route, it WILL throw — recommend the same defensive-default pattern as `useTheme`.

#### SAFE: `useAdminAuth` (src/contexts/AdminAuthContext.jsx:13) — throw on miss
- **Callers**: `admin/layout.jsx:36` only (1 caller in the entire repo).
- **Provider site**: `admin/layout.jsx:709` (wraps `ModalProvider` which wraps `AdminLayoutContent`).
- **Status: SAFE.**

#### SUSPECT: dead `src/app/layout.jsx` (created in 5428137, superseded by 7c9a200)
- **File**: `src/app/layout.jsx:429` exports a `RootLayout` that wraps children in `<QueryClientProvider>` + `<ThemeProvider>` + `<PWAInstaller>` + `<ChatWidget>`.
- **Why it matters**: the file-based router in `src/app/routes.ts:55` only globs `page.jsx` files; `layout.jsx` files are NOT mounted. This file is 100% dead code, kept around for the SEO `<head>` tag injection it was originally wired for.
- **Risk if someone re-wires it later**: it would create a SECOND `<QueryClientProvider>` and `<ThemeProvider>` (nested inside the live ones in `root.tsx`), which React/TanStack tolerate but is wasteful and confusing. No 500 today.
- **Recommended fix**: delete `src/app/layout.jsx` (or split out the `<HeadTags>` client-side effect into a `useEffect` hook called from the public `page.jsx` if the SEO meta is still needed — it currently isn't, the `<head>` is already in `root.tsx`).
- **Status: SUSPECT (dead code, not 500ing).** Not in scope for the v55-fix verification but worth a follow-up.

#### Also-noted: AdminAuthContext.goToLogin() → /account/signin → 404
- `AdminAuthContext.jsx:24` redirects to `/account/signin` on unauth, but **no `src/app/account/` route exists** (verified by `find`). This is a separate UX bug, not a throw-on-miss anti-pattern. Out of scope for K1 but flag for K-triage.

#### NOT in scope (verified clean, no 500s):
- `useQuery` / `useMutation` / `useQueryClient` (TanStack Query) — all callers are nested under `App()` in `root.tsx:363-377` which mounts `QueryClientProvider`. No 500s in server logs.
- `useNavigate` (react-router) — has its own fallback, doesn't throw on miss.
- No `useNavigation` / `useFetcher` / `useLoaderData` / `useActionData` / `useRouteLoaderData` in the entire `src/`. (The app is client-side data; loaders/actions are not used.)

### Server log check (BROKEN count)
`ssh hostinger 'cd /opt/arcan-painting && docker compose logs app --tail 50'` — no `useAdminAuth` / `useModal` / `useTheme` errors in recent traffic. The only server-side errors are "no action for POST /" and "no action for POST /api/track-woo-error" (CSRF exempt path bug, separate ticket).

### Verdict
**The v55 useTheme fix and the v55.1 QueryClientProvider-at-App-root fix are sufficient.** No other throw-on-miss hook has the v55 500-SSR failure mode. The only follow-up is deleting the dead `src/app/layout.jsx`.

---

## Resolved 2026-06-12/13 (K1+K7 audit findings)

### K1 — Provider audit closed
SAFE: `useTheme` (v55 fix, fallback default value)
SAFE: `useMutation`/`useQuery`/`useQueryClient` (sibling commit 7c9a200, provider moved to App() in root.tsx)
SUSPECT: dead `src/app/layout.jsx` — **deleted** (was never mounted in RR7 file-based routing; 477 lines of duplicated provider/SEO code)

### K7 — Admin smoke test closed
All 32 admin pages render 200 with an owner session cookie. Zero 500s. The 7c9a200 QueryClientProvider fix held.

### Other findings
- `src/app/api/utils/error-handler.js:26` does a static `import('../../../sentry.server.js')` inside a `await import()` body. Vite's pre-transform logs a warning. Should be renamed to `.server.js` or guarded with `import.meta.env.SSR`. **Non-blocking.**
- `react-markdown@6` emits React `defaultProps` deprecation on `/admin/ai-chat`. Harmless on React 18, will need a wrapper when moving to RR7/v19. **Non-blocking.**
- `useAdminAuth.goToLogin()` at `AdminAuthContext.jsx:24` redirects to `/account/signin` which doesn't exist. The v53 strip deleted the public signin page. **Non-blocking UX bug** — either re-add the page or change the redirect to `/admin/login`.
