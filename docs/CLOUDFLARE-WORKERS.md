# Arcan Cloudflare hosting and enquiries

## Historical approved contact-only release — 24 October 2026

Cameron subsequently deferred email verification/notifications and explicitly authorized launching with telephone and email contact links. This supersedes the original notification-delivery gate for this release only. Workers exports default to `WORKERS_ENQUIRIES_ENABLED=false`: all five service pages, `/contact` and `/quote` render direct contact links and no enquiry form. The API remains `ENQUIRIES_ENABLED=false`; no scheduled notification delivery is enabled. Cameron later requested callback/text-back forms; that feature is implemented but remains gated pending verified delivery. The retained Node app defaults to its existing form behavior. The privacy notice follows the rendered contact mode. Notification acceptance and inbox delivery remain unverified and deferred; no success/storage claim is made for this contact-only journey.

## Current live state — 26 October 2026

The public redesign is live at https://arcanpainting.ca on Cloudflare Worker Routes. The original Hostinger origin remains available for CRM, authentication, uploads and rollback; it is no longer the public marketing host. The staging site remains https://arcan-public-site-staging.ashbi-design-preview.workers.dev and is noindex with general enquiries disabled.

The public website feature release verified at the start of this handoff was [PR #196](https://github.com/camster91/Arcan-Painting/pull/196): tested source `9be6507ad25d12183e9558bbe2c5303cda800b41`, merged as `6944a251fca7b8845a9bdf7a5ac87c619389e5e9` with an identical tree. At that check, production Worker version `a89cbd80-c49b-4ae4-90b1-d3bf37610822` was deployed at 100%. Artifact SHA-256: `c17efe4ba743ab172a3c7935cfd8cd85882c59f67dc9ed6161274883356b8e12`. [Release evidence](https://github.com/camster91/Arcan-Painting/pull/196#issuecomment-6411015236) records CI, staging and production checks. The latest merged release PR and its deployment comment identify any subsequent runtime. Source-only or documentation changes alone do not establish a new runtime deployment.

Production settings remain `SITE_MODE=production`, `ENQUIRIES_ENABLED=false`, `LEGACY_ORIGIN=enabled`, with ASSETS and same-account private LEADS_API bindings. Production public `workers.dev` and preview URLs are disabled. Both private intake Workers remain private. Production now has the restricted email binding and a temporary five-minute acceptance cron; Ashbi staging has neither. The isolated preflight is active behind its expiring operator gate while delivery acceptance is pending. Recipient verification completed at `2026-10-26T11:43:18.318173Z`. See the dated notification acceptance record below for the current test state; verification alone does not establish notification delivery.

The pre-cutover snapshot is `docs/release/arcan-before-contact-launch-2026-10-24.json`, including the original DNS, empty Worker routes and prior public-URL settings. Existing root Google mail records and unrelated subdomains remain unchanged. For a website routing rollback, restore only the website route/proxy changes described below. Do not replay the full old DNS snapshot over current mail records or unrelated updates.

The source is React Router/React with a Node/Hono backend. Workers serves a static public export; it does not migrate the Node CRM, authentication, database or uploads. The production Worker uses **Worker Routes over the existing DNS origin**, preserving private routes and missing older `/assets/*` bundles on Hostinger. Do not replace the origin with a Workers Custom Domain: that would invalidate the origin fallback.

The original preparation document remains recoverable at Git tag `backup/arcan-before-cloudflare-release-2026-10-24` (commit `56d307f`). Earlier provisioning assumed that the zone belonged to Ashbi; live inspection corrected that assumption.

## Accounts and resources

| Environment | Account | Public Worker | Private intake | D1 |
| --- | --- | --- | --- | --- |
| Staging | `1f5acce966c81fbe36ae06521414d0b8` | `arcan-public-site-staging` | `arcan-enquiry-intake` | `arcan-enquiries`, `a894afcd-504a-4d3a-a498-905296f0bdc8` |
| Production | `1b2e351cbb39ab6b80efe36ca3577fe5` | `arcan-public-site` | `arcan-enquiry-intake` | `arcan-enquiries-production`, `d85b0cf8-2574-48b0-86f5-2ee5f8c891d0` |

The domain's actual zone is `ff60934cbc192f2442be7f2dd6515b36`, in the **production account**. Service bindings and zone routes must stay within the appropriate account. The existing Ashbi resources are retained as isolated staging; they cannot be bound across accounts. Production resources were created only after confirming that no Arcan resources existed in the zone-owning account. No existing database or Worker was deleted.

Both intake Workers have `workers_dev: false`, `preview_urls: false` and no public routes. Ashbi staging has no mail binding or cron; production has the restricted binding and temporary acceptance cron described below. Both use `LEADS_DB`, and `ENQUIRY_LIMITER` at 5 requests per 60 seconds with namespace `18420261024` (account scoped). This is a per-Cloudflare-location limit, not a global bot guarantee. Read-only deployment inspection on 26 October confirmed production intake version `290940dd-7485-4891-89cb-676b26e21e57` and staging version `41b961b2-1c85-4a04-83b8-a01af4c0255f`, both with only D1/rate-limit bindings and empty schedules.

All four migrations (`0001_enquiries.sql` through `0004_response_method.sql`) are applied in both environments. On 26 October 2026, read-only API checks verified both migration ledgers and zero rows in both `enquiries` and `enquiry_outbox`. These counts are a dated observation, not permission to delete later data. Migration 0003 adds the unique submission ID/payload hash; migration 0004 adds the nullable response method for call-back/text-back preferences. Inspect `d1_migrations` and `PRAGMA table_info(...)` before any further migration; never rerun an existing ALTER blindly.

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

`npm run build:workers` starts a credential-free isolated Node renderer and exports 15 routes, hydration data, assets, robots.txt and sitemap.xml. The default mode is staging with contact links only. A production build requires `WORKERS_SITE_MODE=production`; production indexing is permitted only on canonical production hosts with `SITE_MODE=production`. A future form release requires explicit `WORKERS_ENQUIRIES_ENABLED=true` at build time as well as verified delivery and backend enablement; record `enquiriesEnabled` in the internal manifest. `/design-system`, `/thank-you`, errors and all previews stay noindex. The design reference is excluded from navigation and sitemap. `/release.json` is blocked; internal provenance is saved outside public assets as `build/workers-release.json`.

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

The production intake example in `workers/leads/wrangler.jsonc` contains the restricted EMAIL binding, now deployed after destination verification. It is not an instruction to run an unconditional intake deployment without checking acceptance state. Inspect the actual settings, destination and migration ledger first. A public-site-only release does not redeploy the intake.

No automatic production deployment is enabled. The legacy Hostinger/Coolify/container publication workflows remain disabled. The connected Cloudflare API can deploy the same bundled code and static assets if Wrangler is not signed in; use the documented direct-asset-upload API and keep its short-lived credentials out of logs, committed files and URLs. Do not interpret a dry run as deployment proof.

## Durable enquiry contract

The form sends JSON to same-origin `/api/contact`. It supplies a UUID retained through retries, contact preference, scope, requested estimate timing and optional budget. Timing is a request; appointments are confirmed directly. Telephone and email fallbacks remain visible. The intake validates bounded fields, a streamed 16 KiB maximum body, origin and the required rate limiter. Only the Cloudflare edge's IP is forwarded; the public proxy builds an allowlisted header set and discards browser-supplied internal IP, cookies, authorization and CSRF credentials.

A D1 transactional batch saves the enquiry and pending notification together. Success requires database acknowledgements for both records. A retry with the same UUID and normalized payload returns the existing durable record. UUID reuse with different details returns 409; the UI asks the visitor to review before submitting changed details with a new ID. Legacy callers without a UUID remain supported but do not receive the same retry protection. A lost acknowledgement produces an honest uncertainty message, not a fabricated success. The redirect is plain `/thank-you`, including when old thank-you links contain queries.

Attribution strips arbitrary queries and fragments, private route IDs, referrer paths and suspicious campaign values. Public analytics sends allowlisted public paths, not arbitrary URL searches or private customer URLs. Neither request bodies, contact details nor provider/database exception content are logged. Worker invocation logs are disabled and query-string redaction is enabled.

### Controlled staging storage test

General preview intake is disabled. An operator can temporarily set staging `ENQUIRIES_ENABLED=test`, a secret `STAGING_TEST_KEY`, and a `STAGING_TEST_UNTIL` timestamp no more than one hour ahead. Only a matching `x-arcan-staging-test` header can use that path. Do not commit the key, put it in a URL, forward it to another host, or enable traces containing it. The test compares the supplied secret through Web Crypto. It is not a public retry or email endpoint.

The opt-in `e2e-workers/enquiry-storage.spec.ts` submits fabricated data, checks the saved response and plain success URL, then replays the same payload. Verify both D1 records and exactly one row for the submission UUID. Delete only the identified synthetic enquiry and its outbox row, then remove the temporary secret and reset intake to false. Never activate delivery with leftover synthetic or unreviewed outbox rows.

On 24 October the actual staging form reached the private deployed Worker and D1. Submission `3b2df5c9-9454-4b79-97b4-357f8d5b0d5b` returned 200, redirected to plain `/thank-you`, and its retry returned 200 with exactly one enquiry/outbox pair. The two identified test enquiries (including an earlier browser-test assertion failure after a successful save) were removed; both staging tables were verified empty. **This proves storage and retry behavior, not email delivery.**

## Notifications: verified forwarding destination

The existing Node contact handler, appointment notification configuration and client correspondence identify `info@arcanpainting.ca` as the intended Arcan destination. It is not replaced with Cameron's personal email. Cameron selected email forwarding. The production account now has destination ID `33526f79c0af47579f5dc82db4467d68`; its state was confirmed **verified** on 26 October 2026, with verified timestamp `2026-10-26T11:43:18.318173Z`. An acknowledgement in chat is not proof of verification: read the destination API's `verified`/`status` before activation. Do not repeatedly create the destination or resend verification.

Cloudflare's [Email Service overview](https://developers.cloudflare.com/email-service/) and [pricing](https://developers.cloudflare.com/email-service/platform/pricing/) explicitly support free Worker sends to verified account destination addresses, including when only Email Routing is configured. This avoids arbitrary-recipient Email Sending onboarding, whose connector endpoints reject authentication with HTTP 401/code 2036. Do not retry those unchanged endpoints, request pasted credentials, create a token, purchase a plan, or replace Arcan's existing root mail service.

The routing subdomain is ready, with three MX records and SPF on `enquiries.arcanpainting.ca` and an additive routing DKIM selector `cf2024-1._domainkey.arcanpainting.ca`. Zone-level routing is enabled, but its root-domain status is `misconfigured` because Google retains the root MX/SPF. This is expected for this scoped setup: do not “repair” it by adding Cloudflare root MX/SPF or replacing Google's records. All 11 original DNS records were compared by ID, type, name, value, priority, TTL and proxy state and remained unchanged. The scoped rollback snapshot is `docs/release/arcan-dns-before-forwarding-2026-10-24.json`; new record IDs are in `docs/release/forwarding-2026-10-24.md`.

The sequence below defines the acceptance gates. Steps 1, 2 and preflight provisioning are now complete; actual delivery acceptance remains pending as recorded below.

1. Wait for the inbox owner to verify Cloudflare's destination email; confirm verification through the API. No password or verification code belongs in chat.
2. The production intake configuration prepares `NOTIFY_FROM=notifications@enquiries.arcanpainting.ca`, `NOTIFY_TO=info@arcanpainting.ca`, and an `EMAIL` binding restricted to that sender and destination. Deploy only after destination verification. Keep recipient selection entirely out of form input. Keep the cron absent until the restricted binding is verified, then enable it temporarily under step 5. General public intake remains disabled.
3. The optional literal forwarding rule `notifications@enquiries.arcanpainting.ca` → `info@arcanpainting.ca` handles inbound replies/mail to that address. Add it only after destination verification; do not add a catch-all. It is not required for outbound delivery or an acceptance gate. Incoming forwarding alone does not turn an HTTP form into email: the existing transactional outbox still originates each form notification through the restricted Worker binding.
4. Validate in the **production account**, since destination verification and service bindings are account scoped. **Do not change the live public Worker's SITE_MODE, enquiry gate, routes, workers.dev or preview settings to conduct staging tests. The production domain is already routed to it.** First inventory same-account Workers and reuse a suitable isolated preflight Worker if present. Otherwise, after destination verification, prepare one clearly named public preflight Worker (for example `arcan-public-site-preflight`) with no custom-domain/zone routes. Use a staging/noindex export with the form enabled, `SITE_MODE=staging`, and the existing expiring operator-only `ENQUIRIES_ENABLED=test` gate. Bind LEADS_API to the actual private production intake in the same account. Never expose the private intake's workers.dev/preview URLs. Keep Ashbi staging intake disabled.
5. Inspect current production D1/outbox counts and retain any real records. Once the destination and restricted sender binding are verified, temporarily enable only the production intake's five-minute cron for the acceptance test. General public intake stays disabled; the isolated preflight accepts only the expiring secret header. Submit clearly identified fabricated data, verify one durable enquiry/outbox pair despite retry, provider acknowledgement and actual inbox receipt. Distinguish those three results. If acknowledgement or receipt fails, disable the temporary cron and preflight gate, retain the identified test row for diagnosis, and investigate that exact failure without changing root mail or reporting a successful launch of notifications.
6. After storage, provider acceptance, inbox receipt and retry checks pass, remove only the identified test records and operator secret. Disable preflight submissions and its public URL when no longer needed. Keep a verified production notification cron, build the tested public revision with `WORKERS_ENQUIRIES_ENABLED=true`, then enable the live public Worker's enquiry gate as the last release step. Preserve its production SITE_MODE and existing apex/www routes; **no second DNS cutover is needed**. Verify the actual production form → private Worker → D1 → notification → plain `/thank-you` journey. If interrupted or a release check fails, leave/restore live public enquiries false, disable new delivery/preflight triggers, preserve pending real enquiries and keep the current contact links operational. Regenerate production binding types and read back actual settings.

The original pre-cutover validation sequence is retained in Git history and the dated release records. It must not be applied to the current routed public Worker. The later notification acceptance pass provisioned the isolated production-account preflight only after verifying inventory and destination status; see its dated record below.

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

## Returning browsers and legacy service-worker retirement

Historical CRM releases registered `/sw.js` at the root scope. The migration serves a network-only neutralizer at that path with `Cache-Control: no-store`, and the shared app proactively asks only the matching same-origin root registration to update. The neutralizer claims existing clients, removes only `arcan-crm-v1`, `arcan-static-v1` and `arcan-dynamic-v1`, then unregisters itself. It does not clear unrelated caches, IndexedDB, cookies, files, backend records or unsaved form fields. No forced navigation is performed. An isolated browser lifecycle test installs an old worker, seeds the three named caches plus an unrelated cache, then verifies retirement and preservation of the unrelated cache. Offline returning browsers require a network connection to receive the update.

## Routing rollback and future form release

The checked-in DNS snapshot `docs/release/arcan-dns-before-2026-10-24.json` records the original apex A `82.180.129.200` (unproxied), `www` CNAME to apex (unproxied), mail records, and empty Worker routes. Existing SSL mode is full; account security and mail settings were not changed. Before cutover, recheck for intervening changes and preserve any unrelated update.

The contact-only cutover is already complete. For a future form-enabled release, isolated same-account delivery acceptance must pass; keep the existing production routing in place. The approved contact-only release instead requires verified phone/email link destinations, no rendered submission forms on any public route, an intentionally disabled `/api/contact`, and no notification cron. The original cutover preserved the following invariants; a future form release must keep them:

- Deploy the tested production build and bind `LEADS_API` to the **same-account** private production intake.
- Preserve the existing apex A/origin, www CNAME, proxy state, and the two existing `arcanpainting.ca/*` / `www.arcanpainting.ca/*` Worker Routes targeting `arcan-public-site`. Inspect first; do not add duplicate routes.
- Keep the old hosting, database, uploads and credentials. Confirm origin health, sign-in and admin redirects before and after cutover. `/api/health` and `/account/signin` returned 200 before cutover; `/admin` redirected to sign-in as expected.
- Legacy service-area URLs redirect to the corresponding verified service root, avoiding publication of unsupported local claims. Public service URLs remain unchanged. The www public site redirects to apex; thank-you queries are stripped before canonicalization. Production GET/HEAD requests use HTTPS.
- Verify all routes, assets, sitemap, robots, canonical hosts, SSL, browser console/network, and a synthetic enquiry through the actual production hostname. Confirm storage, provider acceptance and inbox delivery separately. Clean only the identified test records.

Rollback owner: Cameron. For an application-only rollback, redeploy the previous verified public Worker version at 100%; the prior stable version before PR #196 is `8a8c3ffa-a661-4bd7-9843-1b163049b2dd`. Retain the matching asset artifact and feature-gate state. A docs/source-only update does not require a runtime rollback.

For a routing rollback to the retained Hostinger public site, remove the two Arcan Worker Routes first to restore direct origin handling through Cloudflare. If needed, restore the two DNS proxy flags and TTL values from the snapshot; preserve all MX/TXT and unrelated records. Because the original IP/CNAME and Hostinger deployment remain available, no site restoration or database reversal is required. Disable new enquiry intake/cron before rolling back a broken intake deployment; retain pending enquiries for recovery. Private intake rollback versions must come from the same account as that intake. Inspect the version, bindings and schedules before selecting it; an Ashbi/staging version is not a production-account rollback target. Do not roll back data or delete existing hosting as part of recovery.

## Notification acceptance — 26 October 2026

Recipient verification is complete. The production private intake was deployed as `ab5cd765-ddcf-4377-ab04-14435baea5a3` from current main `6f15cd9a8a6cb2504a4eac8079c07b228f3622e2`, with the prepared sender/destination restricted binding. Its workers.dev and preview URLs remain disabled. Production migrations `0001`–`0004` were verified; both tables were empty before testing. A temporary five-minute cron was configured for acceptance.

The separate `arcan-public-site-preflight` Worker has no custom-domain routes, uses a staging/noindex export with forms, and binds only the actual production intake. An operator secret header and expiry under one hour guard submissions. The live public Worker remains unchanged with enquiries disabled. Test credentials are not retained in documentation or URLs.

The deployed preflight browser test submitted fabricated data (`ARCAN SYNTHETIC STORAGE TEST`, do not contact), returned HTTP 200 with both durable-save flags, and redirected to plain `/thank-you`. Its duplicate retry also returned 200. Submission `27c2456c-ffa1-4001-ac5a-d5bd86b14336` produced enquiry/outbox pair `f59d0a39-95f8-41e3-9c2b-f3b4de6edc62`. Cloudflare accepted the notification on its first attempt at `2026-10-26T22:35:23.709Z`, returning provider message ID `<5hHTFGdX2Pv0hu4gceGEmTC6g2H3OQa5civ7@enquiries.arcanpainting.ca>`. D1 records status `sent`, attempts `1`, and the acceptance timestamp. This is provider acceptance; actual receipt in the approved inbox remains pending. A request for that confirmation is with Cameron/the inbox owner.

Chrome's Email Sending dashboard offers a paid-plan upgrade for unrestricted sending; no upgrade was made. Cloudflare's current [limits](https://developers.cloudflare.com/email-service/platform/limits/) and [pricing](https://developers.cloudflare.com/email-service/platform/pricing/) explicitly permit free sends from routing domains to verified destination addresses on all plans. The recommended structured Worker binding returns a provider message ID; switching to raw MIME does not bypass recipient or plan policy.

The activation branch prepares production `ENQUIRIES_ENABLED=true` and a production-only five-minute cron in Wrangler. These are candidate release settings, not proof of activation. Do not merge/deploy that activation before actual inbox receipt passes. Default Ashbi staging submissions remain disabled.
