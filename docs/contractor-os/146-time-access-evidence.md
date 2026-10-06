# Job-costing prerequisite: time-entry isolation

2026-10-05 (Toronto). Independent fix based on main `8472d73dd4b371ff07d1f218c40e6b514e67708a`; does not depend on draft UX/timeline PRs.

## Findings and implementation

Current main's GET skipped the caller's email restriction whenever a team-member filter was supplied. POST accepted another member's ID, and non-owner callers could supply rate/cost fields. These paths cannot safely underpin internal job-cost reporting.

- GET now retains the caller's identity predicate alongside explicit member/job filters. Positive safe integer identifiers are required.
- POST verifies a non-owner's explicit member ID against the authenticated identity before insertion. The existing `me` flow still resolves that identity.
- Non-owners cannot submit hourly_rate, total_cost or total_hours on creation/update. Responses omit hourly_rate/total_cost; owner-wide access and cost visibility remain unchanged. This fix covers the time-tracking endpoint, not every possible source of financial data.
- Cookie-authenticated POST/PUT/DELETE require CSRF intent; bearer/non-cookie requests retain their authentication path. Customer/unknown roles are rejected. Current non-owner member scoping remains in place for updates/deletion.
- Successful reads/entry responses are private/no-store. Existing Today start/stop payloads are covered by regression tests.

## Verification

Full test suite: 187 tests passed, 3 skipped. Eighteen focused access tests cover explicit-filter bypass, another-member creation, protected cost inputs, owner visibility, customer rejection, CSRF, IDs, `me` timer start and own clock-out. Typecheck/build pass. Lint has 0 errors and 247 repository warnings. No UI changes; no additional browser suite run for this API-only slice.

Tests use mocked authentication/database responses. Authenticated field journeys and PostgreSQL/MariaDB behaviour remain unverified because no configured database/runtime is available. No production action, migration, role/account modification, merge or deployment performed.

## Remaining job-costing integration

The OS expense/report foundations were reviewed rather than copied wholesale. Expense totals currently include tax, while #146 requires operational margin and tax/accounting treatment to remain separate. Main's time_tracking.hourly_rate does not encode whether it is an internal cost rate or customer billing rate. It must not be treated as verified internal labour cost without reconciliation.

Next slices: pre-tax expense capture with separately stored tax, receipt privacy/upload handling, explicit internal labour-rate provenance, timer overlap/validation, correction audit history, and portable report queries. The OS report uses LATERAL, FILTER and interval constructs incompatible with main's current MySQL compiler. #146/#116/#91 stay open; no profitability totals are claimed verified by this security fix.

Rollback is code-only. Revert this isolated change if necessary after reviewing dependent work; no schema/data changes were made. Main pushes auto-deploy, so merging still requires the production release approval gate.
