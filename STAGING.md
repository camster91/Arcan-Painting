# Staging Verification

Verified: 2026-08-28
Verified code revision: PR branch through `79bc771`
Preview: `https://along-upgrades-cashiers-florist.trycloudflare.com`

This is a reversible Cloudflare Quick Tunnel to the local production build. It has no
uptime guarantee and remains available only while the local server and tunnel are
running. It does not change DNS, Coolify, or the production website.

## Isolation and indexing

- `PUBLIC_SITE_MODE=staging` is enabled.
- Every page emits `noindex, nofollow`.
- `/robots.txt` returns `User-agent: *` and `Disallow: /`.
- No production database, Gmail, Telegram, analytics ID, Sentry DSN, or AI key is
  connected. Submission persistence is therefore intentionally unavailable.

## Verified scope

- HTTPS and 200 responses for the homepage, five service pages, contact, privacy,
  sitemap, robots, and favicon.
- Homepage on 390x844 and 1440x900: one H1, modal opens and closes, no browser page
  errors, staging noindex present.
- All public page titles, descriptions, canonicals, H1 counts, and JSON-LD parsed in a
  browser crawl. The quote page H1 defect found by this crawl was corrected.
- Production dependency audit: zero known vulnerabilities.
- GitGuardian secret check: passed.
- Local release verification: typecheck, 50 test files / 149 tests, production build,
  desktop/mobile Playwright smoke suite.
- Mobile Lighthouse through the staging tunnel: performance 84, accessibility 100,
  best practices 100, FCP 2.1 s, LCP 3.8 s, TBT 0 ms, CLS 0, 634 KiB transferred.
  The SEO score is intentionally suppressed by staging `noindex`; production metadata
  scored 100 in the local production-mode audit.

## QA verdict

**Ready with conditions** for owner review and content approval. It is not yet ready for
production publication because the staging integrations below are unavailable and the
business-proof and production-infrastructure decisions in `REMEDIATION.md` remain open.

## Known limits and rollback

- A durable staging host remains needed; the historical Vercel preview integration did
  not respond to the branch push. An anonymous Vercel deployment was also tested on
  2026-08-28: its build completed, but all routes returned HTTP 500
  `FUNCTION_INVOCATION_FAILED` because Vercel's zero-config React Router runtime did not
  package the repository's custom Hono server. The temporary deployment was rejected as
  a staging candidate and no project token was retained in the repository.
- The supported deployment artifact is the repository's Node 22.20 container. The PR
  workflow is configured to publish `ghcr.io/camster91/arcan-painting:pr-109`, but
  GitHub Actions are currently disabled at the repository level. After an owner enables
  Actions, a durable preview should run that image in a separate Coolify staging service
  with `PUBLIC_SITE_MODE=staging`, isolated credentials, and a non-production hostname.
- End-to-end lead persistence, notifications, analytics vendor delivery, authenticated
  admin, and production headers require isolated staging credentials before they can be
  verified safely.
- Stop the `cloudflared` and local Node processes to remove this preview immediately.
