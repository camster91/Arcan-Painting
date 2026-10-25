# Arcan release verification — 24 October 2026

Production launch is blocked on notification authentication/setup and inbox delivery verification. The public production domain remains on the original Hostinger site. This record distinguishes completed source work, deployed staging evidence and unverified release gates.

Later direction: Cameron selected email forwarding. A dedicated `enquiries.arcanpainting.ca` routing subdomain is now enabled and ready; the 11 original DNS records remain unchanged. The intended destination was added once and Cloudflare sent its verification email. Recipient verification and actual notification delivery remain pending. This removes arbitrary-recipient Email Sending onboarding from the intended path; see [forwarding preparation](forwarding-2026-10-24.md) for current state, exact changes and remaining gates. The earlier authentication evidence below is retained as history.

## Source and independent review

Repository: https://github.com/camster91/Arcan-Painting. Relevant redesign PR: https://github.com/camster91/Arcan-Painting/pull/184. Branch: `design/premium-minimal-homepage`.

Independent code, design/accessibility and deployment reviews were completed. Material findings addressed: lost-response duplicate enquiries; bounded retained notification failures; actual-clock lease claims; recipient delimiter validation; same-origin and canonical production-host gates; missing phone/email fallbacks; arbitrary query/private-ID analytics leakage; mobile menu test stability; unsupported service-area and complimentary-estimate claims; unverified plaster/limewash positioning; unavailable Facebook and unverified LinkedIn destinations; old privacy-page shell; low-contrast link hover; service metadata names; www thank-you query redirection; legacy service-area URL redirects; private legacy .data/manifest/asset forwarding; public provenance exposure; account mismatch between staging resources and the actual DNS zone.

Unrelated financial, expense, repository-cleanup and obsolete design PRs were not merged into this branch. The privacy-related draft PR #173 remains separate; the redesign's success path and public Worker independently protect the new form and old thank-you links. Legacy deployment workflows remain manually disabled in GitHub and disabled in their source policy.

Dependencies were reconciled within compatible version ranges; Vite was updated to its supported v7 peer range and Vitest to the fixed 4.1.12 line. Production `npm audit --omit=dev` reports zero vulnerabilities. Two moderate development-tool dependency warnings remain; no high or critical advisory remains in the resolved tree. The release does not automatically update the retained Hostinger backend.

## Verification performed

- Full unit/integration suite, including real SQLite transactions, idempotency, rollback, leases, retry/backoff, provider-acceptance/D1-acknowledgement failure and privacy boundaries.
- Typecheck and ESLint (zero errors; existing repository warnings remain).
- Production Node build and desktop/mobile browser suite: 28 passed, including responsive public navigation, privacy, invalid URLs, account indexing and CRM interface tests.
- Workers export: 15 routes, static assets and project hydration data; actual Cloudflare staging deployment, not just packaging.
- Workers browser suite against deployed staging: seven checks passed, covering all 15 pages at 320, 390, 768, 1024 and 1440 pixels, loaded images, zero horizontal overflow, zero browser console/page errors, loader hydration, keyboard menu behavior and expected 404/noindex behavior. The mock success-response check proves front-end redirect handling separately from durable storage.
- Independent design screenshots additionally covered 1920px; reduced motion, focus, labels, error announcements and text-first service pages were checked.
- Public and private Worker dry-run bundles, including the production intake environment.
- Existing Hostinger `/api/health` and `/account/signin` returned 200; `/admin` redirected to sign-in. Existing city service URLs returned 200 and now have explicit replacement redirects in the public Worker.

The managed preview browser can inject a comments/overlay element into the document and produce React document hydration warnings. Automated Chromium against the actual deployed staging pages recorded no hydration errors. No hydration-warning suppression was added; the old body suppression was removed.

## Actual staging enquiry storage

A short-lived secret header enabled only an operator-controlled synthetic test; general staging submissions remained unavailable. The real deployed public form submitted fabricated data to the private service binding, saved both D1 records, returned `{success:true, lead_saved:true}` and navigated to plain `/thank-you`.

- Staging: https://arcan-public-site-staging.ashbi-design-preview.workers.dev
- Synthetic submission UUID: `3b2df5c9-9454-4b79-97b4-357f8d5b0d5b`
- Enquiry UUID: `b5a1ec71-390a-4782-8271-72648a468bd0`
- Initial form response: 200; retry of the same submission: 200.
- D1 verification: exactly one enquiry and one pending outbox record for that submission, with zero send attempts.
- Success URL: `/thank-you`, with no query.
- Only the two identified synthetic enquiries/outbox records were removed (an earlier test's browser-response assertion failed after successful storage). Staging enquiries and outbox were then both verified empty.

No email was sent. A pending outbox record is not notification acceptance, inbox receipt or CRM synchronization. Provider acknowledgement and retry behavior have local tests; actual provider/inbox delivery remains unverified.

## Resources, current limits and rollback

The actual domain zone belongs to account `1b2e351cbb39ab6b80efe36ca3577fe5`. Existing Ashbi resources are retained as staging. A separate empty production database and private intake are prepared in the zone-owning account; both environments have migrations 0001–0003 and private intake URLs disabled. Full IDs, commands and monitoring queries are in [the Cloudflare runbook](../CLOUDFLARE-WORKERS.md).

The intended enquiry destination `info@arcanpainting.ca` is supported by existing Node configuration and client correspondence. Email Sending rejects the connector with HTTP 401/code 2036 in both accounts, while Workers, D1 and Email Routing calls succeed. Dashboard access requires Cameron's sign-in. This evidence isolates a product-specific authentication failure; it does not prove a paid-plan requirement or failed DNS onboarding. The Arcan destination is not a verified Cloudflare recipient. No replacement personal recipient was assumed.

Cameron must finish secure Cloudflare sign-in so sender availability, onboarding and recipient verification can be inspected. A paid upgrade, security change or client communication still requires separate authorization. After verified provider acceptance and actual inbox receipt, enable the cron and public intake, rebuild/deploy the tested production revision, perform the reversible domain cutover, and verify the actual production journey.

No production route or DNS proxy change has been made. Original apex IP, www CNAME, mail records and hosting remain preserved. The DNS snapshot and rollback sequence are in the runbook. Remove only newly added Arcan Worker Routes to return traffic to the retained origin; restore proxy flags from the snapshot if needed. Never delete pending real enquiries during recovery.

Destination review confirmed the Instagram profile title and Arcan domain, and the Google Maps place title, domain and phone. Facebook rendered unavailable content despite HTTP 200; LinkedIn could not be verified. Only Instagram and Google reviews are published in the premium shell; no social ratings or claims were copied.

A final migration review identified the historical root CRM service worker. A follow-up neutralizer and proactive registration update retire only that worker and its three named cache copies; unrelated browser storage and backend data are preserved. The browser lifecycle check verifies a real installed worker is retired and an unrelated cache survives.
