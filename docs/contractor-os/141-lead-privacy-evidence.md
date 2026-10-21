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

Browser requests used synthetic data and intercepted contact responses. Persistence tests exercise the real API sanitizer and insertion helper with mocked database calls; no live database, email, production analytics or customer data was used. This does not verify a deployed CRM write. Historical URLs already stored in external logs or browser history are not retroactively erased.

## Release boundary

Prepared locally only. No merge or deployment. No schema or migration changes. Before release, run CI on the published branch and confirm a saved lead's attribution in an authorized non-production environment.
