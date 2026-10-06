# Persisted internal notes and lead status history

2026-10-05 (Toronto). Stacked on draft #151's verified tree `e808fbfcc18558356c9361962dc715916eaa4705`.

## Completed and verified

- Added `customer_activity_events`, an additive append-only application store with unique event keys, content hashes, lead association, internal visibility, author ID/name snapshots and database timestamps. No update/delete endpoint is supplied. The existing startup schema chain invokes the idempotent table/index definitions after foundational schema/customer backfill.
- Added owner/admin-only, CSRF-protected note saving. Text is trimmed and limited to 2,000 characters; identifiers and request keys are validated. Missing/deleted leads cannot receive new notes.
- Notes use author/lead-scoped save keys. The lead row is locked inside a transaction before checking the existing key and inserting. Identical retries acknowledge the same event; changed content using the same key returns 409. The database unique constraint is a second barrier against duplicates.
- Lead PUT now locks the row and commits the lead update, won-lead customer association and status event in one transaction. Failed event insertion rejects the transaction. Unchanged status saves do not append a duplicate event. Other lifecycle writers are not yet captured.
- The timeline includes persisted staff notes/status changes with author snapshots. Notes are plain React text with preserved line breaks; no HTML rendering or mailbox ingestion is added.
- The note form disables pending submission, retains text/key after an unconfirmed save, clears only on acknowledgement and refreshes the matching lead timeline. Forms are keyed by lead. Notes have a dedicated activity filter; the duplicate Notes tab is removed. Pre-existing lead notes remain labelled as legacy data without fabricated authors/timestamps.

Validation: 221 unit tests passed, 3 skipped (58 files pass/one skip); 18 new note/status/form tests included. Typecheck and build passed. Lint: 0 errors, 238 warnings. Chromium 153 passed 28 desktop/Pixel 5 checks, including note retry after an ambiguous save, one resulting event, author display, retained input, filters and responsive timeline/modal checks at 320/768/1440px. Every new schema statement passes main's MySQL compiler. Browser responses and transaction fixtures are synthetic.

## Awaiting verification and remaining scope

No configured database or PostgreSQL/MariaDB runtime is available. Neither the new migration nor any live note/status action was executed. Run migrations twice, simultaneous retries, changed-content conflicts, transaction rollback after failed history insertion, deleted-lead behaviour, and representative role/lifecycle fixtures on both supported engines before release. Mocked locking tests do not establish database concurrency guarantees.

The new event store is internal only. Crew/office/estimator/project-manager/finance-readonly grants are not broadened. Portal activity, job/estimate context reuse, automated status changes from other routes, crew updates, rescheduling and review/referral requests remain outstanding under #147. Original record milestones remain a projection with current mutable amounts; this addition does not turn historical records into an immutable ledger retroactively. Lead status saves have state-change deduplication, not an independent request-idempotency contract across interleaving writes.

## Deployment and rollback

Draft only. No production deployment, merge, provider activation or external messages. The additive schema is part of the normal startup migration chain, so review and verify it before approving a deployed artifact. Main pushes auto-deploy; #99 approval remains required.

For code rollback, revert this slice and dependent changes while retaining the new table and saved history. Do not automatically drop the table or delete notes. Existing legacy notes/status fields are preserved. Recovery/data-retention procedures require validation before release.

## Sources

- PostgreSQL row locking: https://www.postgresql.org/docs/current/explicit-locking.html
- MariaDB locking reads inside transactions: https://mariadb.com/docs/server/reference/sql-statements/data-manipulation/selecting-data/for-update
- TanStack Query mutation invalidation: https://tanstack.com/query/v5/docs/framework/react/guides/invalidations-from-mutations

Implementation also follows the repository's transaction adapter, CSRF policy and current owner/admin boundary; documentation does not establish live database or release readiness.
# Real database release verification (2026-10-06, Toronto)

`Customer activity databases` now runs the production SQL adapters and activity helper against disposable PostgreSQL 16 and MariaDB 11.4 services. The standalone fixture requires both a loopback host and the exact `arcan_activity_ci` database name plus an explicit opt-in; it cannot silently target a client database. It covers additive migration replay, twelve concurrent saves using one key, content conflict, actor/lead key isolation, author/visibility/time persistence, missing/deleted leads, foreign-key enforcement, rollback after both writes, a database insertion error after an update, successful commit, unchanged status and preservation of history on migration replay.

These fixtures use a minimal lead table with the production key and soft-delete fields. They do not claim to verify the complete foundational migration, customer backfill, authenticated route journeys, or production deployment. CI execution results must be recorded separately before merging. Local server installation is unavailable in this workspace; only syntax, YAML structure and refusal without disposable-database configuration can be checked locally.
