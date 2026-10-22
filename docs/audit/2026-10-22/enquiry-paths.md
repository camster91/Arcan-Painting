# Enquiry path repair: #174, #175; service choices in #178

## Production identity and scope

Read-only authenticated hPanel inspection on 22 October 2026 confirmed the
Completed / Current deployment on `fix/hero-button-css`, revision
`fdf4ef0bc9c8f4044b5cd84515a5eb1ae1eaf23e`, shown deployment time 09:33:32.
Source: https://hpanel.hostinger.com/websites/arcanpainting.ca/node/deployments.
Review correction: auto-deployment is ON. The visible green dashboard badge and
its "Turn off auto-deployment" menu confirm it. The accessibility checkbox value
was misleading. No hosting setting was changed. Do not push to the configured
production branch without release approval.
`HOSTINGER.md` on main still records an earlier release and is historical evidence.

This branch starts at that deployed revision, retaining its privacy, MariaDB,
Tailwind and dependency security corrections. It does not replace main, integrate
the editorial/luxury designs (#132/#136), or revert Contractor OS work. PR #173
owns the broader main-based attribution implementation; the production backport
already supplies clean thank-you URLs and matching attribution. #171/#172/#157
remain separate. Do not deploy main or retarget this change there without a
deliberate reconciliation of the divergent source trees.

## Changes

- Supply the missing `isOpen` state on the five service pages; preselect the
  advertised service in both body and header forms, allowing visitors to change it.
- Use one shared service list in both enquiry forms, including Wallpaper. The
  existing backend accepts bounded service text; no database migration is needed.
- Open the shared enquiry form from the calculator. Copy only planning inputs
  into editable notes; retain service and first-touch attribution in the POST.
  Do not put contact details or calculator notes into query strings or analytics.
- Let the calculator card occupy normal document flow so its CTA is reachable
  on small screens. Existing rates, currency assumptions and CTA wording remain
  subject to owner review; these are not newly approved price commitments.
- Portal the modal to `document.body` so a scrolled header's backdrop cannot
  contain and clip its fixed overlay. Keyboard trapping, close and focus return
  remain in the shared component.

## Verification and evidence

The PR records the exact committed SHA corresponding to the tested source tree.
Commands use Node 22.23.2 and the committed production-base lockfile.

- Production React Router build plus Hostinger entry generation passed.
- ESLint passed with zero errors and 318 warnings on this production base.
- React Router type generation and TypeScript no-emit checking passed.
- Eleven new rendered regression cases cover all ten body CTAs and calculator
  context/focus/reopening. The first calculator assertion used an unsupported
  matcher; it was corrected and the focused suite passed. It was a test defect.
- Final full unit suite: 174 passed, nine opt-in database checks skipped.
- Final full browser suite: 51 passed across desktop, tablet and mobile.
- Browser cases cover the five services' two body CTAs and header at desktop,
  iPad Mini and Pixel 5 sizes, keyboard opening, Tab wrapping, Escape, focus
  return, modal viewport bounds, and horizontal overflow. Calculator cases use
  intercepted synthetic POST responses to cover pending, failure, retry,
  unchanged payload/attribution and clean success navigation.
- Existing privacy browser cases cover email/phone on both form paths. No real
  database insert, production test lead or external notification was performed.
- Screenshots are in `screenshots/`. Full-page calculator screenshots capture a
  sticky header at the current scroll offset; they are not a stitching-free
  visual measurement. Modal screenshots and viewport-boundary assertions are
  the evidence for the repaired overlay placement.

Local Windows `npm ci` initially failed on argon2's lifecycle command resolution.
`npm ci --ignore-scripts` completed; the shipped Windows argon2 prebuild loaded.
This shell also failed to resolve npm-script commands, so validation used the
installed tools' Node entry points: `@react-router/dev/bin.js`,
`scripts/build-hostinger-entry.mjs`, `typescript/bin/tsc`, `eslint/bin/eslint.js`,
`vitest/vitest.mjs`, and `@playwright/test/cli.js`. No package or lockfile was
changed to work around the host. Build sourcemap/chunk warnings are recorded
separately from failures. Database integration tests remain opt-in.

## Rollback and release boundary

Review only. No merge, deployment, hosting/provider activation or account/profile
change is authorized by this PR. Before release, re-read hPanel's current SHA,
confirm backup/rollback availability, and approve the exact candidate. For a
code-only rollback, use the preserved baseline `fix/hero-button-css` at
`fdf4ef0bc9c8f4044b5cd84515a5eb1ae1eaf23e` through the reviewed Hostinger procedure.
Keep runtime secrets, database and persistent gallery intact. Do not restore the
database for these frontend changes. Auto-deployment is currently on; any change
to that setting requires Cameron's explicit approval before a manual release.

Outstanding #178 acceptance: approved isolated persistence/delivery destination,
shorter-form hypothesis and agreed next-step wording. #176 owns saved-enquiry
conversion checks and approved GA4/consent configuration; a call click or form
start is not a completed lead.
