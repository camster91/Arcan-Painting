# Issue 144: navigation and dead-action pass

Base: main `8472d73dd4b371ff07d1f218c40e6b514e67708a`.
Date: 2026-10-05.

## Implemented

- One shared business navigation model drives desktop and mobile destinations.
- Team is a primary business area; stable clients/projects routes remain unchanged.
- Route selection follows React Router location and respects segment boundaries.
- Mobile More uses a native modal dialog for focus containment and Escape handling, returns focus on close, and closes when resizing to desktop.
- Mobile breadcrumb uses current router state and Home terminology without adding another h1.
- Account menu has an accessible name and expanded state.
- Home no-op Quick Actions becomes View leads; placeholder Export Data is removed.
- Team no-op details action becomes an explicit keyboard-accessible edit action; quick controls remain visible without hover.

## Further UX audit

- Shared mobile dialogs use native modal semantics, stable registration, explicit focus containment, nested Escape isolation, and focus restoration. Opening/rerendering a form no longer pushes browser history entries or unlocks the body while another modal remains open.
- Mutation controls use the installed React Query pending state on booking-slot, crew, capture, and template actions. Booking-slot inputs have labels; load failures offer retry, failed deletion displays an alert, and deletion asks for confirmation.
- User-facing Job/Customer terminology is consistent across the audited admin screens; database concepts and URLs retain their existing names.
- Job cards offer explicit keyboard-accessible details/actions. Nonfunctional deletion is removed; completed jobs are not marked urgent just because their end date has passed.
- Synthetic Home tasks display status instead of unsaved checkboxes. The duplicate floating action menu is removed.
- Settings explains per-field saving; the old Save All action that could resubmit a stale fetched snapshot is removed.
- Pending, failure, retained-input, delete-confirmation, nested modal and stable-registration regression tests added.

## Verification

- Full suite: 54 files passed, one skipped; 177 tests passed, three skipped.
- Navigation regression tests: three passed, including route changes, supporting destinations and focus return.
- Typecheck and production build passed.
- Lint passed with warnings; existing repository warnings remain.
- Chromium 153: 18 browser tests passed across desktop and Pixel 5 projects. Ten rendered component tests exercise nested dialogs, keyboard focus containment, Escape, focus return, navigation, and 320/390/768/1440px overflow; eight public smoke checks exercise conversion/account routes and the unconfigured-database health gate. Tests use production CSS. Admin component fixtures are isolated and do not establish authenticated workflow or API authorization correctness. Browser zoom and screen-reader checks remain unverified.
- Local browser override uses a temporary Chromium executable and disables video because FFmpeg is unavailable; it is not committed and does not change application security or CI configuration.

## Reconciliation and remaining work

The contractor branch `d32ff71f5fb98564554849a1b00e525abf97f0fb` is not current main. A snapshot comparison finds 363 changed files and substantial lifecycle, portal, expense, report, permissions and offline foundations there, while main has newer MySQL and security work. Do not replace main with that snapshot or rebuild the branch features.

Open PRs observed: #123, #125, #129, #132, #135, #136, #137. Public redesign #132 and stacked luxury #136 require deliberate reconciliation with #138; neither is merged by this change.

Main has no Reports page or reporting endpoints beyond the dashboard. No dead Reports link is added. A functioning, permission-safe Reports destination remains part of #144/#145/#146 and should reuse reconciled Contractor OS reporting foundations.

This pass is not completion of #144. Remaining acceptance includes completing the workflow/failure-state audit, reusable screen conventions, role-appropriate navigation, duplicate control reduction, authenticated representative owner/office/crew journeys and rendered accessibility/responsive evidence. #144 stays open. Later phases are not declared complete.

Roadmap issue claims about running production/staging revisions have not been verified against live infrastructure in this pass. #99 production approval remains required. main pushes trigger a production deployment workflow; do not merge this PR as routine housekeeping.

No production deployment, customer communications, provider activation, payments, ad publication or external account changes performed.
