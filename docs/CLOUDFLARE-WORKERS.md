# Arcan Cloudflare hosting and enquiries

## Current release state — 24 October 2026

The redesign is deployed to **staging**, at https://arcan-public-site-staging.ashbi-design-preview.workers.dev. This is not the production launch. General staging enquiry submissions are disabled. Production remains on Hostinger, at https://arcanpainting.ca, pending verified notification delivery. No DNS cutover, mail-record changes, hosting deletion, paid upgrade or client communication has been performed.

The source is React Router/React with a Node/Hono backend. Workers serves a static public export; it does not migrate the Node CRM, authentication, database or uploads. The production Worker uses **Worker Routes over the existing DNS origin**, preserving private routes and missing older `/assets/*` bundles on Hostinger. Do not replace the origin with a Workers Custom Domain: that would invalidate the origin fallback.

The original preparation document remains recoverable at Git tag `backup/arcan-before-cloudflare-release-2026-10-24` (commit `56d307f`). Earlier provisioning assumed that the zone belonged to Ashbi; live inspection corrected that assumption.

## Accounts and resources

| Environment | Account | Public Worker | Private intake | D1 |
| --- | --- | --- | --- | --- |
| Staging | `1f5acce966c81fbe36ae06521414d0b8` | `arcan-public-site-staging` | `arcan-enquiry-intake` | `arcan-enquiries`, `a894afcd-504a-4d3a-a498-905296f0bdc8` |
| Production candidate | `1b2e351cbb39ab6b80efe36ca3577fe5` | `arcan-public-site` | `arcan-enquiry-intake` | `arcan-enquiries-production`, `d85b0cf8-2574-48b0-86f5-2ee5f8c891d0` |

The domain's actual zone is `ff60934cbc192f2442be7f2dd6515b36`, in the **production account**. Service bindings and zone routes must stay within the appropriate account. The existing Ashbi resources are retained as isolated staging; they cannot be bound across accounts. Production resources were created only after confirming that no Arcan resources existed in the zone-owning account. No existing database or Worker was deleted.

Both intake Workers have `workers_dev: false`, `preview_urls: false`, no public routes, no active mail binding and no notification cron. Both use `LEADS_DB`, and `ENQUIRY_LIMITER` at 5 requests per 60 seconds with namespace `18420261024` (account scoped). This is a per-Cloudflare-location limit, not a global bot guarantee.

All three migrations are applied in both environments. On staging, the first two had previously been applied through the API without a migration ledger. The table definitions and columns were inspected before recording those names in the standard `d1_migrations` table; their ALTER statements were not rerun. Migration 0003 adds a unique submission ID and payload hash. Production began empty and received migrations 0001–0003 once. Inspect `d1_migrations` and `PRAGMA table_info(...)` before further migration operations.

## Build, test and deployment

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run types:workers
npx wrangler types workers/leads/worker-configuration.d.ts --config workers/leads/wrangler.jsonc --include-runtime=false
SOURCE_COMMIT=$(git rev-parse HEAD) npm run build:workers
npm run check:workers
npx wrangler deploy --dry-run --config workers/leads/wrangler.jsonc
```

`npm run build:workers` starts a credential-free isolated Node renderer and exports 15 routes, hydration data, assets, robots.txt and sitemap.xml. The default mode is staging. A production build requires `WORKERS_SITE_MODE=production`; production indexing is permitted only on canonical production hosts with `SITE_MODE=production`. `/design-system`, `/thank-you`, errors and all previews stay noindex. The design reference is excluded from navigation and sitemap. `/release.json` is blocked; internal provenance is saved outside public assets as `build/workers-release.json`.

`WORKERS_BASE_URL=<actual-staging-url> npm run test:workers:e2e` exercises all exported pages at 320, 390, 768, 1024 and 1440 pixels, project loader hydration, real image loading, console/page errors, mobile keyboard navigation, missing-route status and noindex. The ordinary Node browser suite also exercises account routes and CRM layout behavior.

Deploy commands, when CLI authentication is available:

```sh
npx wrangler deploy --config workers/leads/wrangler.jsonc
npx wrangler deploy
# Intended production account is selected by the production environment:
npx wrangler deploy --config workers/leads/wrangler.jsonc --env production
WORKERS_SITE_MODE=production SOURCE_COMMIT=$(git rev-parse HEAD) npm run build:workers
npx wrangler deploy --env production
```

No automatic production deployment is enabled. The legacy Hostinger/Coolify/container publication workflows remain disabled. The connected Cloudflare API can deploy the same bundled code and static assets if Wrangler is not signed in; use the documented direct-asset-upload API and keep its short-lived credentials out of logs, committed files and URLs. Do not interpret a dry run as deployment proof.

## Durable enquiry contract

The form sends JSON to same-origin `/api/contact`. It supplies a UUID retained through retries, contact preference, scope, requested estimate timing and optional budget. Timing is a request; appointments are confirmed directly. Telephone and email fallbacks remain visible. The intake validates bounded fields, a streamed 16 KiB maximum body, origin and the required rate limiter. Only the Cloudflare edge's IP is forwarded; the public proxy builds an allowlisted header set and discards browser-supplied internal IP, cookies, authorization and CSRF credentials.

A D1 transactional batch saves the enquiry and pending notification together. Success requires database acknowledgements for both records. A retry with the same UUID and normalized payload returns the existing durable record. UUID reuse with different details returns 409; the UI asks the visitor to review before submitting changed details with a new ID. Legacy callers without a UUID remain supported but do not receive the same retry protection. A lost acknowledgement produces an honest uncertainty message, not a fabricated success. The redirect is plain `/thank-you`, including when old thank-you links contain queries.

Attribution strips arbitrary queries and fragments, private route IDs, referrer paths and suspicious campaign values. Public analytics sends allowlisted public paths, not arbitrary URL searches or private customer URLs. Neither request bodies, contact details nor provider/database exception content are logged. Worker invocation logs are disabled and query-string redaction is enabled.

### Controlled staging storage test

General preview intake is disabled. An operator can temporarily set staging `ENQUIRIES_ENABLED=test`, a secret `STAGING_TEST_KEY`, and a `STAGING_TEST_UNTIL` timestamp no more than one hour ahead. Only a matching `x-arcan-staging-test` header can use that path. Do not commit the key, put it in a URL, forward it to another host, or enable traces containing it. The test compares the supplied secret through Web Crypto. It is not a public retry or email endpoint.

The opt-in `e2e-workers/enquiry-storage.spec.ts` submits fabricated data, checks the saved response and plain success URL, then replays the same payload. Verify both D1 records and exactly one row for the submission UUID. Delete only the identified synthetic enquiry and its outbox row, then remove the temporary secret and reset intake to false. Never activate delivery with leftover synthetic or unreviewed outbox rows.

On 24 October the actual staging form reached the private deployed Worker and D1. Submission `3b2df5c9-9454-4b79-97b4-357f8d5b0d5b` returned 200, redirected to plain `/thank-you`, and its retry returned 200 with exactly one enquiry/outbox pair. The two identified test enquiries (including an earlier browser-test assertion failure after a successful save) were removed; both staging tables were verified empty. **This proves storage and retry behavior, not email delivery.**

## Notifications: remaining activation gate

The existing Node contact handler, appointment notification configuration and client correspondence identify `info@arcanpainting.ca` as the intended Arcan destination. It is not replaced with Cameron's personal email. That destination is not currently verified in Cloudflare Email Routing.

Email Sending read endpoints return HTTP 401/code 2036 with the connector in both accounts, while Workers, D1 and Email Routing calls succeed. The connection is authenticated generally but rejected by Email Sending; the failure does not establish that a paid upgrade or sender-DNS change is needed. The dashboard is signed out. Cameron must sign in through the secure browser handoff so product entitlement and sender onboarding can be inspected. Do not repeatedly retry the unchanged connector call, request pasted credentials, create a new token, purchase a plan, or change security settings to bypass this.

After authenticated inspection:

1. Confirm Email Sending is already available within the existing plan. If a paid upgrade is required, stop for the specific cost authorization.
2. Onboard an Arcan sender, preferably a dedicated notification subdomain, preserving root Google Workspace MX/SPF/DKIM and existing Mailgun records. Preview and review DNS changes first.
3. Verify the intended recipient through the supported Cloudflare workflow. If the verification requires Cameron or the client, use secure handoff; do not send an unsolicited client message.
4. Configure `NOTIFY_FROM`, `NOTIFY_TO`, and a restricted `send_email` binding `EMAIL` with exact allowed sender and destination addresses. Keep recipient selection entirely out of user input.
5. With an approved test recipient and fabricated data, test provider acknowledgement and actual inbox receipt separately. Inspect queued/bounced/provider states; a provider message ID is not inbox delivery.
6. Only then enable `triggers.crons: ["*/5 * * * *"]` in the intended intake environment, and `ENQUIRIES_ENABLED=true` on the public Worker. Regenerate binding types and verify settings.

The outbox processor processes at most ten due rows, atomically claims five-minute leases, uses the current clock for each claim, escapes HTML, and records provider IDs only after acknowledgement. Retries back off from one minute to one hour. After 12 attempts, a row remains pending and is retained for operator review rather than automatically resending forever. No failed enquiry is discarded.

Delivery is at least once. A crash or D1 failure after provider acceptance can produce a repeated email; a send lasting beyond the lease can also repeat. The stable enquiry ID in the subject helps the operator identify duplicates. Tests cover overlapping batches, expired leases, empty acknowledgements, retry timing, retained failures, and failure after provider acceptance.

### Monitoring and retained failures

Cameron owns deployment and operational follow-up until handoff. Review the scheduled Worker aggregate event `enquiry_notification_batch`: `configured=false`, nonzero `retrying`, nonzero `retained`, or invocation failures require investigation. No contact details belong in alerts or logs. During the first production day, inspect the outbox after the synthetic acceptance test and periodically during working hours; arrange an ongoing accountable operator before treating delivery as unattended.

Use account-specific D1 access to inspect counts:

```sql
SELECT status, COUNT(*) AS count FROM enquiry_outbox GROUP BY status;
SELECT COUNT(*) AS retained FROM enquiry_outbox WHERE status='pending' AND attempts>=12;
SELECT COUNT(*) AS overdue FROM enquiry_outbox
WHERE status='pending' AND next_attempt_at < (unixepoch()-900)*1000 AND lease_until < unixepoch()*1000;
```

Inspect individual records only through authenticated D1/operator access. Correct the sender/recipient/provider cause before resetting the attempts and next-attempt time for an identified retained row. Review provider acceptance first to avoid unnecessary repeats. Do not purge real enquiries or invent a retention period; agree retention and operator access with Arcan as part of handoff. Email and the D1 record remain separate from legacy CRM sync; this migration does not claim CRM lead synchronization.

## Production cutover and rollback

The checked-in DNS snapshot `docs/release/arcan-dns-before-2026-10-24.json` records the original apex A `82.180.129.200` (unproxied), `www` CNAME to apex (unproxied), mail records, and empty Worker routes. Existing SSL mode is full; account security and mail settings were not changed. Before cutover, recheck for intervening changes and preserve any unrelated update.

After staging delivery and all release checks pass:

- Deploy the tested production build and bind `LEADS_API` to the **same-account** private production intake.
- Preserve the existing apex A/origin and www CNAME values, enable their proxy, and add only `arcanpainting.ca/*` and `www.arcanpainting.ca/*` Worker Routes targeting `arcan-public-site` in the zone-owning account.
- Keep the old hosting, database, uploads and credentials. Confirm origin health, sign-in and admin redirects before and after cutover. `/api/health` and `/account/signin` returned 200 before cutover; `/admin` redirected to sign-in as expected.
- Legacy service-area URLs redirect to the corresponding verified service root, avoiding publication of unsupported local claims. Public service URLs remain unchanged. The www public site redirects to apex; thank-you queries are stripped before canonicalization. Production GET/HEAD requests use HTTPS.
- Verify all routes, assets, sitemap, robots, canonical hosts, SSL, browser console/network, and a synthetic enquiry through the actual production hostname. Confirm storage, provider acceptance and inbox delivery separately. Clean only the identified test records.

Rollback owner: Cameron. Remove the two newly added Arcan Worker Routes first to restore direct origin handling through Cloudflare. If needed, restore the two DNS proxy flags and TTL values from the snapshot; preserve all MX/TXT and unrelated records. Because the original IP/CNAME and Hostinger deployment remain available, no site restoration or database reversal is required. Disable new enquiry intake/cron before rolling back a broken intake deployment; retain pending enquiries for recovery. The earlier Ashbi intake version is `3a1959e9-66ed-4a68-9350-b9fee69733ea`; additive migration 0003 is compatible with that version. Do not roll back data or delete existing hosting as part of recovery.
