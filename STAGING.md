# Staging Verification

Verified: 2026-08-31

Verified application revision: `bc3335e`

Branch: `codex/seo-geo-aeo-cro-staging`

Preview: `https://booth-supports-engines-dad.trycloudflare.com`

This preview runs the repository's production Node container on the Ashbi VPS. It is
isolated from the production Arcan containers, database, port, and Docker network. A
Cloudflare Quick Tunnel provides HTTPS without changing production DNS or routing.
The tunnel has no uptime guarantee and its generated hostname can change after a
restart, so this is a review environment rather than a permanent public hostname.

## Isolation, rollback, and indexing

- App container: `arcan-staging-app`, image `arcan-painting-staging:bc3335e`, bound to
  VPS loopback port `3215` only.
- Database: `arcan-staging-db`, PostgreSQL 16 on the isolated
  `arcan-staging-net` Docker network with staging-only credentials.
- Production `arcan-app`, `arcan-db`, port `3000`, DNS, and Caddy routing were not
  changed.
- The previous app container and image remain stopped as
  `arcan-staging-app-86aa737` for immediate rollback.
- `PUBLIC_SITE_MODE=staging` is enabled. Every rendered page emits
  `noindex, nofollow`; `/robots.txt` disallows `/`.
- No GA4 measurement ID, Gmail sender, Telegram transport, Sentry DSN, or AI key is
  connected. The source currently implements Gmail and Telegram delivery as explicit
  no-ops; new inquiries remain visible through the persisted CRM lead and in-app
  notification.

## Verified scope

- HTTPS and HTTP 200 for all nine sitemap pages, `/robots.txt`, `/sitemap.xml`, the
  configured favicon, and `/api/health`; a deliberately invalid page returns 404.
- Browser crawl of every sitemap page: one H1, non-empty title and description,
  canonical, staging noindex, parseable JSON-LD, no page errors, and no broken links
  among ten discovered internal URLs.
- Homepage at 1440x900 and 390x844: zero horizontal overflow; the project dialog opens,
  traps interaction, closes with Escape, and produces no browser page errors.
- Real isolated contact and quote submissions return success, persist CRM leads, and
  create `new_lead` in-app notifications. Invalid contact data returns HTTP 400 and
  campaign attribution persists in the notification payload.
- The live quote response at `bc3335e` was rechecked after deployment and contains no
  unapproved response-time promise.
- Authenticated admin verification used a temporary staging-only operator: secure
  sign-in succeeded, the Dashboard rendered, and the protected leads endpoint returned
  200. The operator and its sessions were removed immediately afterward.
- Dependency audit: zero known production-package vulnerabilities. GitGuardian passed
  against the PR revision.
- Local release verification: typecheck, 50 test files / 149 tests, production build,
  lint with no errors, and desktop/mobile Playwright smoke tests.
- Mobile Lighthouse 12.8.2 through this staging tunnel: performance 86,
  accessibility 100, best practices 100, FCP 2.2 s, LCP 3.7 s, TBT 0 ms, CLS 0,
  and 634 KiB transferred. The staging SEO score is 69 because `noindex` is
  intentionally enabled; production-mode metadata tests and the earlier local audit
  pass the indexability checks.

## Release-gate result

**Ready with conditions** for owner review, business-proof approval, and a deliberate
production publication decision. It is not approval to merge or deploy production.

Remaining external conditions:

- Supply and approve the business proof listed in `REMEDIATION.md`, including genuine
  service areas and any response-time commitment. Until then, the site makes no SLA
  promise and location pages stay out of the sitemap.
- Configure an approved GA4 measurement ID and verify vendor-side receipt if analytics
  is wanted. The vendor-neutral event layer and attribution persistence work without it.
- Exercise the tested Caddy security-header configuration at the production ingress
  during the production release check. This Quick Tunnel terminates directly at the
  staging app and therefore does not validate production Caddy behavior.
- Decide whether an external notification transport is required. Gmail and Telegram
  are not pending credentials in the current implementation; they were removed and are
  no-op integrations. CRM persistence plus in-app notification is the verified path.
- Obtain explicit owner approval before merge, production deployment, or DNS changes.

## Operations

- Health: `curl -fsS http://127.0.0.1:3215/api/health` from the VPS.
- Rollback: stop and remove only `arcan-staging-app`, rename
  `arcan-staging-app-86aa737` back to `arcan-staging-app`, and start it. The isolated
  staging database can remain in place.
- Teardown: stop and remove only the `arcan-staging-*` app/database/tunnel resources and
  `arcan-staging-net`. Do not target production `arcan-app` or `arcan-db`.
