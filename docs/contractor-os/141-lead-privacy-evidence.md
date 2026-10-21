# Lead URL privacy and attribution (#141)

Verified locally on 2026-10-21, on a separate branch based on main `8375623`.

## Changes

- Popup and embedded contact forms redirect to plain `/thank-you` after success. Customer details remain in the POST body; no replacement browser storage is introduced.
- The thank-you page renders a generic confirmation. Its server loader redirects old query-string links to the clean URL before rendering, using `Cache-Control: no-store` and `Referrer-Policy: no-referrer`. Appointment scheduling remains available, with customer details entered there rather than prefilled from the thank-you URL.
- Both forms now use the existing `getAttribution()` helper. All seven fields are preserved: landingPage, referrer, utmSource, utmMedium, utmCampaign, utmContent and utmTerm.
- Existing API sanitization and storage are unchanged. Attribution remains in notification metadata linked to the saved lead, inside the existing lead/notification transaction.

## Verification

- `npm run lint`: zero errors, 237 existing warnings.
- `npm run typecheck` and `npm run build`: passed.
- `npm test`: 246 passed, three skipped (60 passing files, one skipped file).
- Playwright: 42 passed, including 14 new desktop/mobile checks for email and phone submissions through both forms, attribution capture, clean success URLs, disabled pending submission, failure/retry, and legacy URL redirects before page analytics. Existing public/admin checks also passed.
- Unit coverage verifies the generic confirmation, redirect headers, all seven sanitized attribution fields, server field bounds/allowlisting, and serialized attribution metadata associated with the inserted lead ID.
- Desktop/mobile thank-you renders were visually inspected. Local Playwright used installed Google Chrome with video disabled through a temporary configuration; the committed CI browser configuration is unchanged.

Browser requests used synthetic data and intercepted contact responses. Initial unit tests exercised persistence with mocked database calls. Historical URLs already stored in external logs or browser history are not retroactively erased.

## Additional database verification

Six opt-in integration checks passed against a fresh, disposable local PostgreSQL 16 database. These invoke the real contact API, sanitizer, insertion helper and SQL adapter; outbound email, Telegram and Meta integrations are mocked. They verify all seven fields stored in notification metadata linked to email/phone leads, field allowlisting and truncation, missing attribution, input validation before writes, and rollback of the lead when its notification insert fails.

`test/contact-attribution-db.test.js` requires both `ARCAN_LEAD_DB_TEST=1` and `ARCAN_DISPOSABLE_DB=1`, a loopback PostgreSQL/MySQL URL, and the exact database name `arcan_lead_privacy_ci`. It refuses existing fixture tables and never drops or truncates them. Run it with `npx vitest run test/contact-attribution-db.test.js` against a freshly created database. Without opt-in its six cases are skipped in the ordinary unit suite. The dedicated `Lead attribution databases` workflow prepares isolated PostgreSQL 16 and MariaDB 11.4 services and runs this fixture against each.

The fixture uses minimal production-compatible lead and notification columns; it does not verify full application migrations or a deployed CRM. PostgreSQL was executed locally; MariaDB and hosted CI results remain unverified until publication. No production analytics or customer data was used. The local disposable database was stopped and removed after verification.

Follow-up checks: typecheck passed; the ordinary suite passed 246 tests with nine skipped (including six opt-in database checks). The fixture correctly refused an unapproved database name before writes. Workflow YAML parsed successfully. Application code is unchanged from the build and 42 browser checks recorded above.

## Release boundary

Prepared locally only. No merge or deployment. No schema or migration changes. Before release, run CI on the published branch and confirm a saved lead's attribution in an authorized non-production environment.
