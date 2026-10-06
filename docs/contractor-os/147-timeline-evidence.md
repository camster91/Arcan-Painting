# Staff timeline integration: first slice

Date: 2026-10-05 (Toronto). Main baseline: `8472d73dd4b371ff07d1f218c40e6b514e67708a`. Stacked on the verified admin UX tree `299135397e23ff76bfb5b408120a79651c734627` in draft PR #149.

## Implemented and verified

- Lead quick view's placeholder Timeline is replaced by canonical persisted milestones. It uses the shared native modal, labelled controls, visible loading/failure/retry, simple activity filters, CAD, and Toronto times.
- A read-only `/api/leads/:id/timeline` endpoint permits current main's owner/admin roles. Anonymous sessions return 401; other roles return 403 before reading lead records. Missing/deleted leads return 404. Responses are private/no-store and explicitly internal.
- Milestones include lead/appointment/follow-up/job creation, estimate creation/acceptance, contract creation/sent/viewed/customer-signature/contractor-signature, invoice creation/sent/paid timestamps, recorded payments, and explicitly linked email attempts where those timestamps exist.
- Email association uses related entity IDs. It does not match addresses or return mailbox content, subjects, recipient addresses, metadata, provider errors or private notes. Existing unlinked logs remain excluded.
- Estimate/contract/invoice sending code now passes related entity, template and user IDs into the existing email logger. No provider activation or sending was performed.
- Queries use fixed table/column definitions, bound lead IDs, deterministic timestamp/ID ordering, and bounded reads. Main's MySQL compiler accepts every query; PostgreSQL-specific UNION casts, LATERAL and aggregate FILTER are avoided. Explicit lead IDs take precedence over fallback invoice/contract/job relationships.
- Event IDs remain stable on repeated reads. Reads do not append events. Separate recorded email attempts are separate records. Current mutable financial amounts are labelled as current record amounts; historical values and actors are never fabricated. Unknown actors are explicitly identified.
- A maximum of 200 events is disclosed. Filters operate on this bounded result. Any failed source causes a visible failure rather than a silent partial timeline. Changing customers cancels the previous request and uses a separate query key; errors hide cached events and inactive data is not retained.

Validation: 203 unit tests passed, 3 skipped; 26 focused timeline/security/UI tests included. Typecheck and production build passed. Lint has 0 errors and 239 repository warnings. Chromium 153 passed 26 checks across desktop/Pixel 5 projects, including the actual lead quick-view component with synthetic API responses at 320/768/1440px, delivery failure, filtering and retry. Existing navigation/dialog/public smoke checks also pass. Temporary browser override is not committed.

## Verification and implementation still required

- No configured database, PostgreSQL/MariaDB executable, or container runtime is available here. Query compilation and mocked route tests are not live database integration proof. Run both supported engines with representative relationship fixtures and inspect query plans/latency before release.
- Existing schema timestamps are not an immutable event ledger: missing send/status timestamps are not reconstructed from current status or updated_at. A paid timestamp is not substituted with record creation time. Legacy invoice sent_date is date-only and is not turned into a precise event time.
- Manual notes with author/idempotency, status changes, rescheduling, crew progress/photos, punch items, review/referral requests and portal activity still need persisted event capture. No new schema is introduced in this slice.
- Customer/job/estimate context reuse and the broader office/estimator/project-manager/crew/finance-readonly grant model are not implemented here. Current main's role boundary is preserved. The internal feed is not a portal feed and no customer-visible projection is supplied.
- Authenticated owner/office/crew lifecycle journeys, zoom, screen-reader, database failure/recovery and load validation remain outstanding. #147, #144, #91 and the release gate remain open.

Rollback is code-only: revert this slice after removing any dependent changes; there are no data migrations to undo. Do not merge as a routine deployment: main pushes auto-deploy and production approval remains required.

## Sources used

Installed stack: React 18, TanStack Query 5, React Router 7, Node 24; exact versions from the repository lockfile.

- TanStack Query cancellation: https://tanstack.com/query/v5/docs/framework/react/guides/query-cancellation
- TanStack Query keys: https://github.com/TanStack/query/blob/main/docs/framework/react/guides/query-keys.md
- PostgreSQL bounded ordering: https://www.postgresql.org/docs/current/queries-limit.html
- MySQL SELECT/order/limit: https://dev.mysql.com/doc/refman/8.4/en/select.html

Repository schema, authentication, SQL adapter and existing email logger are the implementation source of truth. Framework documentation does not establish the business role policy or live database correctness.
