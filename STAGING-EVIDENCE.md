# Contractor OS staging evidence

Recorded: 2026-09-01

Candidate branch: `codex/arcan-contractor-os`

Candidate revision: `cd0a963`
Production release: not performed

## Artifact and isolation

- Ashbi image: `arcan-painting-staging:cd0a963`
- Image ID: `sha256:cd973d974ed14dc096acb2d53100d7bb50c22fb683fff8facc5449c69ae56756`
- OCI revision label: `cd0a963`
- Container: `arcan-staging-app` (`healthy`)
- Database: isolated `arcan-staging-db` on `arcan-staging-net`
- Origin binding: `127.0.0.1:3215`; the temporary public URL is a Cloudflare tunnel to this staging-only origin.
- Staging mode sets `PUBLIC_SITE_MODE=staging`; `/robots.txt` returns `Disallow: /`.
- Production remained healthy on `arcan-painting:175d567` throughout staging work.

## Exact-candidate gates

- `npm test -- --run`: 89 files, 266 tests passed.
- `npm run typecheck`: passed.
- `npm run build`: client and SSR production bundles passed.
- `npm audit --omit=dev`: 0 vulnerabilities.
- Docker build on Ashbi: passed, including the production dependency audit.
- Non-fatal known build warnings: source-map location reporting, two mixed static/dynamic imports,
  and three unused imports. These did not fail the build or test gate.

## Public and unauthenticated staging checks

The following were checked against the isolated origin through a private SSH tunnel:

| Route | Result |
| --- | --- |
| `/`, `/privacy`, `/contact` | `200 text/html` |
| `/interior-painting`, `/exterior-painting`, `/commercial-painting` | `200 text/html` |
| `/wallpaper-services`, `/specialty-finishes` | `200 text/html` |
| `/robots.txt`, `/sitemap.xml` | `200` |
| `/api/health` | `200 application/json` |
| unknown API route | `404 application/json` |
| `/admin` | `302` to sign-in |
| `/api/admin/privacy` | `401 application/json` |
| `/sw.js` | `200 text/javascript` |
| `/manifest.json` | `200 application/json` |
| `/icons/icon-192x192.png`, `/icons/icon-512x512.png` | `200 image/png` |

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

Production deployment requires explicit action-time approval naming revision `cd0a963` (or a
later replacement candidate) after the remaining feasible staging checks are recorded.
