# Isolated Hostinger privacy release candidate

Base: 6429480905bf849787a214064ca6a0758f883495, independently shown as current in authenticated hPanel on 2026-10-22.

Apply PR #173's changes to ContactSection, LeadFormPopup and the thank-you page to the deployed revision. Include the five existing main-branch ContactSection isPending substitutions so pending/retry browser coverage can run against the installed TanStack Query v5 API. No finance code, dependency changes, database migrations or production configuration changes are included. All remaining source files match production.

Local Node 24 checks: npm ci succeeded; 163 unit tests passed, nine opt-in database tests skipped; build and typecheck passed; lint zero errors, 319 warnings. Thank-you regression tests failed on the original production code, then passed after the fix. Local Chromium installation failed with a truncated archive; no local browser or real-database success is claimed for this candidate. The push validation workflows use Node 24 and disposable PostgreSQL 16/MariaDB 11.4 fixtures, with no production secrets or deploy steps. Hosted results must be checked independently before release.

The original PR head is 38 commits ahead of production and must not be deployed whole for this task. GitHub deployment/image publication workflows are harmless disabled stubs; Hostinger auto-deployment and PR previews are off. See HOSTINGER.md for independently observed hosting identity/settings, manual release, rollback and VPS retirement gates. Production deployment and live synthetic-lead persistence verification remain pending.
