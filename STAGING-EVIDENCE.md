# Contractor OS staging evidence

Recorded: 2026-09-01

Candidate branch: `codex/arcan-contractor-os`

Candidate revision: `d3a736b`
Production release: not performed

## Artifact and isolation

- Ashbi image: `arcan-painting-staging:d3a736b`
- Image ID: `sha256:41c4c088f7cca5ef0052301f016e3c605013c8f8274a87cd0b565a557821e016`
- Container: `arcan-staging-app` (`healthy`)
- Database: isolated `arcan-staging-db` on `arcan-staging-net`
- Origin binding: `127.0.0.1:3215`; the temporary public URL is a Cloudflare tunnel to this staging-only origin.
- Staging mode sets `PUBLIC_SITE_MODE=staging`; `/robots.txt` returns `Disallow: /`.
- Production remained healthy on `arcan-painting:175d567` throughout staging work.

## Exact-candidate gates

- `npm test -- --run`: 107 files, 341 tests passed.
- `npm run typecheck`: passed.
- `npm run build`: client and SSR production bundles passed.
- `npm audit --omit=dev`: 0 vulnerabilities.
- Docker build on Ashbi: passed, including the production dependency audit.
- Non-fatal known build warnings: source-map location reporting, two mixed static/dynamic imports,
  and three unused imports. These did not fail the build or test gate.

## Public and unauthenticated staging checks

The following were checked against the isolated origin through a private SSH tunnel:

| Route                                                              | Result                 |
| ------------------------------------------------------------------ | ---------------------- |
| `/`, `/privacy`, `/contact`                                        | `200 text/html`        |
| `/interior-painting`, `/exterior-painting`, `/commercial-painting` | `200 text/html`        |
| `/wallpaper-services`, `/specialty-finishes`                       | `200 text/html`        |
| `/robots.txt`, `/sitemap.xml`                                      | `200`                  |
| `/api/health`                                                      | `200 application/json` |
| unknown API route                                                  | `404 application/json` |
| `/admin`                                                           | `302` to sign-in       |
| `/api/admin/privacy`                                               | `401 application/json` |
| `/sw.js`                                                           | `200 text/javascript`  |
| `/manifest.json`                                                   | `200 application/json` |
| `/icons/icon-192x192.png`, `/icons/icon-512x512.png`               | `200 image/png`        |

The `65e69c3` startup migration added the five sold-scope fields to the isolated staging
database: area exclusions and production assumptions, plus surface coating product, color,
and sheen. The anonymous field API returns `401`, and `/admin/today` redirects to sign-in.

The `70e1bd5` portfolio-margin SQL executed successfully against the real isolated staging
schema for the 90-day period. The staging dataset currently has no projects in that period, so
rendered non-empty totals still require the authenticated disposable lifecycle fixture. The
anonymous margin endpoint correctly returns `401`.

The `017ac90` lifecycle gate additionally verified that anonymous POST requests to estimate,
contract, and invoice send endpoints return `401`, as do GET and POST requests to contract
templates. The exact container and origin health checks passed with zero restarts. Production
remained healthy on `arcan-painting:175d567`, also with zero restarts.

The `dce979f` replacement candidate repeated those public checks and additionally returned `401`
for an anonymous estimate deletion attempt. The new transaction and linked-record query was
prepared successfully against the real isolated staging schema. This candidate prevents project
deletion through the estimate endpoint and preserves every non-draft or linked estimate.

The `d8eac46` candidate adds transaction-safe estimate duplication. A real staging schema check
confirmed all five operational handoff columns: area exclusions and production assumptions plus
surface coating product, `color_name`, and sheen. The public duplicate endpoint rejects anonymous
access with `401`; health and PWA assets remain available with `200` responses.

The `0a49675` scheduling and sales-operations candidate passed its real-schema slot-retention
query and close/reopen update. Anonymous PUT and DELETE attempts are rejected at the CSRF boundary
with `403`. Follow-up permissions and create/update/delete audit coverage, availability mutation
audits, appointment-history retention, and the operator close/reopen controls are covered by the
expanded local gate. Staging and production both report zero restarts.

The `7e4dcf7` owner-control candidate restricts company onboarding and team availability mutations
to owner/admin users and audits each state change. Anonymous GET and POST checks against both
routes return `401`. Exact-container health, worker, and manifest checks return `200`; staging and
production remain restart-free.

The `424dbe8` operator-record candidate validates internal-task status and priority values and
audits task create/update/delete actions. Delayed-email queue inspection now requires
`communications.manage`, while owner and cron worker runs emit processed/sent/failed audit
summaries. Anonymous task and queue reads return `401`; an anonymous task write is rejected at the
CSRF boundary with `403`. Health, service worker, and manifest checks return `200`. Exact staging
and unchanged production containers are healthy with zero restarts.

The `d3a736b` control-evidence candidate records PII-minimized manual-notification and read-state
audit events and central success/failure summaries for owner/admin agent migrations. Database
migration logic now exists only in the dedicated authenticated endpoint. Anonymous notification
and agent reads and notification creation return `401`; an anonymous migration request is rejected
at the CSRF boundary with `403`. Public health and PWA assets return `200`, and both exact staging
and unchanged production are healthy with zero restarts.

Rendered desktop checks confirmed one H1, the production canonical URL, two JSON-LD blocks,
staging `noindex, nofollow`, no horizontal overflow at the observed desktop widths, and no
images missing alternative text.

The Codex in-app browser injects `#codex-browser-sidebar-comments-root` as an extra direct
child of `<html>`. That instrumentation produces a React hydration warning even on the local
development server; it is not application HTML and was not treated as an application defect.

## Backup and recovery drill

- Dump: `/opt/arcan-painting-staging/39f77ab/staging-restore-drill.dump`
- SHA-256: `92ede2f23ed06283505a427d069a75f8dd0f4fcda4445c8841030725e9207ec7`
- `pg_restore` catalogue validation: passed.
- Temporary restore database table comparison: 60 source tables, 60 restored tables.
- Temporary restore database: removed after verification.
- Release, backup, restore, and Caddy sync scripts now default to the actual Ashbi SSH alias,
  `coolify`.

## Evidence still required before production

- Authenticated rendered admin journey on staging, including persistence after reload and
  permission checks across representative roles.
- Rendered customer approval/signature/change-order/invoice/receipt journey on staging.
- Rendered mobile geometry and field-device journey. Component tests pass, but the available
  in-app viewport controller did not change the rendered viewport.
- Temporary tunnel traffic bypasses production Caddy, so live proxy security headers must be
  verified at the exact-artifact production gate and after release.
- Email/SMS, hosted payment, accounting, analytics, advertising, Search Console, business
  profile, reviews, and call tracking require explicit vendor selection, credentials, account
  identifiers, budgets, and commercial approval. Provider-neutral seams are present; these
  integrations are not represented as operational.
- Legal review is required for contract terms, retention policy, consent language, warranties,
  and public business claims.

Production deployment requires explicit action-time approval naming revision `d3a736b` (or a
later replacement candidate) after the remaining feasible staging checks are recorded.
