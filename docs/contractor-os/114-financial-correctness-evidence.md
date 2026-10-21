# Financial correctness fixes: 2026-10-21

Application/test/workflow revision: `2559fa4d472571f2ee7ebfdd762dfa729734e5cb`. Base main: `837562368525ba358837288a9202958b02e7a3bd`. Branch: `codex/financial-correctness-2026-10-21`. Payment concurrency was committed first as `02ad989`; remaining invoice/time corrections followed in `2559fa4`.

## Changes

- Payment create, edit/refund, delete and Stripe recording lock the invoice before payment mutation and retain the lock through recalculation and commit. Existing payments are read again under a child lock after waiting. Edits and balances now roll back together; competing deletions return one success and one missing-record response.
- Invoice listing aggregates line counts and cleared payments independently, including legitimate equal-valued payments, empty invoices and filtered pagination.
- Time edits lock/re-read the entry and recalculate after clock-out, break or rate changes. Explicit zero values survive; missing rates and active/reopened timers retain incomplete totals. Invalid intervals, breaks and rates are rejected. Calculations read timezone-less stored timestamps as UTC text, so a Toronto host does not shorten a clock-out interval relative to MariaDB/UTC hosts. Existing role, ownership, cost redaction and CSRF boundaries remain in place.

## Verification

Local runtime: Node 26.5.0, America/Toronto. Real database runtimes: PostgreSQL 16.14 and MariaDB 11.4.13. The downloaded MariaDB bottle was checksum-verified and used only from an isolated scratch directory; no shared Homebrew installation/service was changed.

- Production build: pass.
- Full default suite: 256 passed, 20 skipped. Seventeen skipped tests are the opt-in disposable-database fixture, executed separately below; three are the existing gated MariaDB suite.
- Real PostgreSQL financial fixture: 17 passed.
- Real MariaDB financial fixture: 17 passed.
- Lint: zero errors, 238 existing warnings.
- Typecheck: pass. Workflow YAML parses; git diff whitespace checks pass.
- Negative regression control: original payment sources failed five of the initial eleven database cases. Original invoice/time sources failed all three selected invoice-total/cost-edit regressions. Fixed sources pass the final suites.

The database fixtures run actual route handlers, validation, production SQL adapters, transactions, foreign keys and Stripe recording with synthetic data in an empty loopback-only `arcan_payments_ci` database. Authentication identity, rate-limit and audit edges are mocked. They do not establish full schema migration, browser, authenticated staging, live provider or production behaviour. New CI services are defined but have not run remotely from this local branch.

## Boundaries and next action

No remote push, merge, workflow dispatch, deployment, live financial write or historical-data repair. The change prevents future incorrect calculations when released; it does not rewrite existing financial records automatically. The cleanup PR and other branches are separate.

This fixes the three reproduced defects; it does not close broader #114 lifecycle/staging acceptance, #161 overlapping-timer prevention or #162 immutable correction audit/rate-provenance work. Review this committed branch before any separately authorized push/release action.
