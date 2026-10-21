# Production Release Record

Published: 2026-09-01

Primary URL: `https://arcanpainting.ca`

## Published revisions

- PR #109 merged as `a2b72fe2b6612b23f8eabba1689b1ed2da5fb007`.
- The production audit exposed an avoidable hero LCP reset, so PR #112 removed the
  five-second automatic slide replacement while preserving visitor-controlled slides.
- Final production image: `arcan-painting:175d567`, built from merge commit
  `175d5675563ea61eee8710ccc7362599b6943fa7` and labeled with that full revision.

## Deployment and rollback

- Production database backup:
  `/opt/arcan-painting-backups/20260901-a2b72fe-predeploy.sql.gz`.
- The backup passed gzip integrity validation before deployment.
- Current app container: `arcan-app` on loopback port 3000.
- Immediate application rollback: stopped container `arcan-app-a2b72fe`.
- Secondary pre-release rollback: stopped container `arcan-app-8746881`.
- Production database, gallery bind mount, Docker network, runtime environment, and
  existing customer data were preserved.

## Ingress corrections

- Removed the explicit self-signed `www.arcanpainting.ca` certificate reference while
  retaining its original files and configuration backup.
- Traefik issued a trusted Let's Encrypt certificate for `www.arcanpainting.ca`.
- `www` now returns a permanent 308 redirect to the canonical apex while preserving the
  path and query string.
- The Arcan routers emit HSTS, frame, content-type, referrer, and permissions headers.
- Gzip compression is enabled on all four Arcan production routers. The full routing
  configurations from before the certificate, redirect, and compression changes remain
  on the VPS as timestamped rollback files.

## Production verification

- `/api/health` returns HTTP 200 with `status: ok`.
- All nine sitemap pages return 200 and have one H1, indexable metadata, apex canonicals,
  parseable JSON-LD, no browser errors, and no broken discovered internal links.
- `/robots.txt` allows public search crawling, allows AI search agents, blocks model
  training through GPTBot, and excludes admin, account, API, and internal states.
- Desktop and 390x844 mobile QA passed with zero horizontal overflow; the project dialog
  opens and closes correctly.
- Empty quote submission is rejected client-side without a production POST. The public
  quote copy contains no unapproved response-time promise.
- Unauthenticated `/admin` requests redirect to the noindex sign-in route. Authenticated
  CRM and form persistence were verified in isolated staging against the same
  application release path.
- Local release suite: 51 test files / 150 tests, typecheck, production build, lint with
  zero errors, and 8/8 desktop/mobile Playwright tests.
- Three-run production Lighthouse 12.8.2 results after compression:
  - Performance: 82, 86, 92; median 86.
  - Accessibility: 100 in every run.
  - Best practices: 100 in every run.
  - SEO: 100 in every run.
  - Median FCP 2.3 s, LCP 3.8 s, TBT 0 ms, CLS 0, 660 KiB transferred.

## Post-launch operating items

- Add an approved GA4 measurement ID only if vendor-side analytics is wanted, then
  verify receipt. The vendor-neutral event layer and CRM attribution are operational.
- Decide whether CRM plus in-app notification is sufficient or whether a new external
  email/message transport should be implemented. Gmail and Telegram are currently
  intentional no-ops.
- Obtain evidence and approval before adding service-area, insurance, warranty, years
  operating, response-time, review, or case-study claims. Unverified location pages
  remain excluded from indexing.
