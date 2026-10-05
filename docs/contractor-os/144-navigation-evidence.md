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

## Verification

- Full suite: 52 files passed, one skipped; 172 tests passed, three skipped.
- Navigation regression tests: three passed, including route changes, supporting destinations and focus return.
- Typecheck and production build passed.
- Lint passed with warnings; existing repository warnings remain.
- Browser install failed: downloaded Chromium archives were empty/invalid. Real browser focus trap, Escape, 390px/tablet/desktop, zoom and screen-reader checks remain unverified. jsdom is not evidence for native browser focus containment.

## Reconciliation and remaining work

The contractor branch `d32ff71f5fb98564554849a1b00e525abf97f0fb` is not current main. A snapshot comparison finds 363 changed files and substantial lifecycle, portal, expense, report, permissions and offline foundations there, while main has newer MySQL and security work. Do not replace main with that snapshot or rebuild the branch features.

Open PRs observed: #123, #125, #129, #132, #135, #136, #137. Public redesign #132 and stacked luxury #136 require deliberate reconciliation with #138; neither is merged by this change.

Main has no Reports page or reporting endpoints beyond the dashboard. No dead Reports link is added. A functioning, permission-safe Reports destination remains part of #144/#145/#146 and should reuse reconciled Contractor OS reporting foundations.

This pass is not completion of #144. Remaining acceptance includes an admin-wide workflow/terminology/failure-state audit, reusable screen conventions, role-appropriate navigation, duplicate control reduction, authenticated representative owner/office/crew journeys and rendered accessibility/responsive evidence. #144 stays open. Later phases are not declared complete.

Roadmap issue claims about running production/staging revisions have not been verified against live infrastructure in this pass. #99 production approval remains required. main pushes trigger a production deployment workflow; do not merge this PR as routine housekeeping.

No production deployment, customer communications, provider activation, payments, ad publication or external account changes performed.
