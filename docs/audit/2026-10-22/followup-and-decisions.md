# Audit follow-up and remaining decisions

## Review scope

This is stacked on PR #182, whose production base was verified in hPanel as
`fix/hero-button-css` at `fdf4ef0bc9c8f4044b5cd84515a5eb1ae1eaf23e` on 22 October.
The exact tested follow-up SHA and final check results are recorded in its PR.
No merge, deployment, hosting change, provider activation, external profile edit,
production test lead or external notification is part of this work.

### #176: analytics preparation

Expose only the specific public `VITE_GA_MEASUREMENT_ID` name alongside the
existing `NEXT_PUBLIC_` prefix. Require the explicit analytics enable flag as well
as a syntactically valid ID; the example remains disabled with an empty ID.
No property ID was guessed, added to hosting, or activated.

Both public form paths now require `success: true`, `lead_saved: true` and a
positive `lead_id` before success navigation or `lead_submit_success`. The
existing API emits this contract after the lead and durable CRM notification
transaction. A 200 response without this contract remains an error. Form input
and attribution remain available for retry. Unit/API mocks and intercepted
browser responses establish code behaviour, not new production persistence.

The embedded form now emits the same success/error names as the popup.
`source` identifies embedded contact, header, service page or calculator.
Existing CTA click labels distinguish the two service body placements.
Call/email clicks, form opens and steps are intent signals, never completed
leads. No contact fields, project notes or database identifiers are included in
conversion properties. Page-view paths and GA page/referrer URLs omit query
strings and fragments. Analytics/storage exceptions cannot interrupt enquiries.
Marketing instrumentation excludes account and CRM paths, and contact-intent
events omit the phone/email destination itself. Account-level automatic
measurement still needs review before activating a vendor tag.

Still blocked on #120: approved GA4 property/public ID, account access, consent
basis and configuration owner. Before enabling, inspect enhanced measurement
and GTM/other tags for duplicate page/form events and automatic field capture.
Verify DebugView/Realtime against a separately approved isolated saved-enquiry
test: one completed event per confirmed save; none for invalid, failed or unsaved
responses; calls remain separate. Record baseline sessions, saved enquiries and
qualified leads from trusted account/CRM data. No baseline was fabricated.

### #180 and #181: navigation and crawler policy

Replace the nonexistent About target with the existing Our Process section.
Remove public Admin navigation while retaining authentication/routes unchanged.
Add permanent crawlable links to all five service routes, also advancing #142.
Search crawler groups use the same private-route exclusions as the wildcard
group. GPTBot stays blocked; the canonical sitemap and staging block remain.
Robots rules do not secure data; authentication and noindex are separate.

### #179: gallery reduction

PR #132 already proposes a static gallery as part of its pending redesign.
This focused adaptation removes only the current gallery's cloned scrolling
rows, preserving its data, filters, ordering, lightbox and touch handlers. It does
not import the redesign or its business claims. Reconcile this shared component
when #138 integrates a selected design; do not reimplement it a third time.

Render twelve existing images initially with Show all/Show fewer; expanded
content contains 41 unique photo buttons, rather than 123 cloned stops. There
is no continuous animation to pause, including under reduced motion. Thumbnail
dimensions and square aspect ratio reserve space; lazy loading/async decoding
remain, and the lightbox image is eager. Photo tags are AI-generated metadata,
not independently verified local project proof or permission to publish new uses.

Baseline measured in a hydrated loopback production build, before this gallery
change: 123 photo buttons, 143 image elements, 50 distinct `src` values and
229,475 serialized DOM characters. The follow-up browser attachment records
the same counts after the change. DOM characters are not compressed transfer
bytes; image counts are not download counts. This is no claim of improved field
Core Web Vitals or a Lighthouse score. Network, LCP/CLS and physical-device
performance remain separately unverified. Existing local gallery assets are
used; no photos, reviews or business credentials were invented.

The same hydrated loopback measurement after the change recorded 12 photo
buttons, 32 images, 21 distinct image `src` values and 140,467 DOM characters.
The lightbox is portalled to the body to avoid clipping by the animated section;
browser checks assert full viewport coverage and keyboard focus wrapping.

### Validation record

- Final frozen-candidate full unit suite: 186 passed, nine opt-in database checks
  skipped. This includes the final lightbox portal and analytics privacy changes.
- Final frozen-candidate full browser suite: 57 passed across desktop, tablet and
  mobile. Gallery thumbnails load, filters and expand/collapse work, viewport
  bounds/focus wrapping pass, and all existing enquiry/privacy checks pass.
- Production build and Hostinger entry generation passed after the final source
  adjustment. Type generation, TypeScript checking and lint passed; lint reports
  zero errors and 318 warnings. Build emits sourcemap/chunk warnings in unchanged
  components. No application failure remains in the unit checks.
- The initial browser run passed 56 cases and timed out once looking for the
  mobile header CTA. That run overlapped a rebuild replacing client assets, so
  it is retained as an invalidated run, not attributed to an existing product
  defect. A fresh server and fixed artifact are used for the final run recorded
  in the PR. An earlier launch also encountered the documented Windows npm
  command-resolution problem before the server was ready.
- No new database-backed, production delivery, GA4 DebugView, physical-device,
  screen-reader or field-performance result is claimed. Local responsive browser
  checks use desktop Chromium, iPad Mini emulation and Pixel 5 emulation. Existing
  test privacy/attribution and private-route/noindex checks remain part of the run.
- Gallery screenshots wait for the reveal transition and all twelve thumbnail
  loads. Element/full-page screenshots may include a sticky header at its capture
  offset; use mobile views and automated viewport bounds to assess modal layout.
- Hosted CI is separate from these local results. The existing build workflow's
  PR base filter targets main, while these PRs deliberately use production/stack
  bases. No workflow or deployment setting was changed to bypass that policy.

Read-only hPanel recheck at approximately 11:15 Toronto time on 22 October still
showed `fix/hero-button-css` / `fdf4ef0bc9c8f4044b5cd84515a5eb1ae1eaf23e` as
Completed / Current, with deployment time 09:33:32. No production change occurred
in this task. Manual local browser verification also confirmed that clicking the
close button removes the service dialog and restores focus to its body CTA.

## #178: shorter-form hypothesis prepared for review

Keep the existing form until an experiment is approved. Proposed variant:

1. Service and brief project scope; retain the preselected service and editable
   calculator context. Ask for municipality/postal area and target timing only
   after confirming how the team uses them; do not require a full street address
   at first contact without a business need.
2. Name and one preferred contact method, conditionally requiring only that
   method. Preserve the existing privacy notice.
3. Review and submit. Use accurate next-step language approved by the team;
   do not promise an exact price, free visit or response deadline by default.

Hypothesis: fewer steps may improve saved-enquiry completion without reducing
qualification. Primary measure: confirmed saved enquiries / unique eligible form
starts. Guardrails: duplicate/error rates, spam, qualified-lead rate and the
team's follow-up workload. Segment by service, device and CTA placement. Decide
sample size/duration after establishing baseline volume; no unsupported uplift
or completion claim. Approve an isolated test destination and notification
handling before proving persistence/delivery with synthetic data.

## #177 and #142: homepage and useful local content preparation

Preserve #132/#136 and #138/#140 ownership until Cameron selects the public
design. Do not call the editorial design live. A provisional offer structure for
review is: **[approved service] in [approved coverage]**, a specific approved
project image and outcome, then **Discuss your project**. A factual interim
draft is "Painting and wallpaper services, planned around your project" with
"Share your space, surfaces and finish ideas with Arcan Painting." These are
copy hypotheses, not approved production changes or evidence of local expertise.

For each priority service, collect one owner-confirmed case study: project type,
approved locality, scope/surface condition, preparation, finish/material choice,
constraints, outcome, and rights-cleared photos. Obtain explicit permission for
client names, quotes and before/after displays. Existing filenames, AI gallery
tags and stock images cannot establish locality, results or display rights.

Then write differentiated service scope, process, preparation, cost drivers and
direct FAQs using those facts. The literal furniture-protection FAQ typo is
corrected without adding a business claim. Keep existing titles, canonical and
schema policy until approved facts support changes. Do not add ratings,
credentials, warranties, prices, response promises or years of experience.

All generated location routes remain noindex and absent from the sitemap.
Confirm actual coverage and useful original local evidence before enabling an
individual page. Obtain Search Console/backlink evidence before retiring or
redirecting historical routes. Business Profile/directory edits stay behind
explicit authorization and verified access. No AI-specific file or speculative
schema is added, and no AI visibility or rich-result outcome is promised.

## Release and rollback

Draft PRs are review artifacts. Before any release, reverify the current hPanel
revision, exact composed candidate, backup and rollback, then obtain Cameron's
explicit approval. For the follow-up alone, revert its commit to PR #182's
`d788495b5cdc263e947a8e4349ad09def64c6e6e` source after the review fixes. For the full frontend release,
the verified production source is `fdf4ef0bc9c8f4044b5cd84515a5eb1ae1eaf23e`.
No migrations were added. Preserve database, runtime secrets and persistent
gallery. Review confirmed Hostinger auto-deployment is ON, using the visible
green badge and "Turn off auto-deployment" menu. The earlier checkbox-based
interpretation was incorrect. Do not update the watched production branch or
change that setting without Cameron's approval.
Main and all Contractor OS/security/financial branches remain unchanged.

## Review follow-up

The review restores focus to each newly displayed popup question, removes the
calculator's obsolete drag handlers so touch scrolling remains available, and
rejects malformed save acknowledgement IDs before recording completed leads.
Functional tests cover these changes. Test counts above describe the original
PR snapshot; the updated PR review and release approval report identify the
final tested revision and current results.

Read-only Hostinger verification confirmed Node 24.x, root ./, npm run build,
output build and entry build/server/hostinger.cjs. Runtime database is
u257752935_arcan_prod at localhost; its 2026-10-21 09:52 backup is selectable in
hPanel. Database export integrity and restoration have not been exercised.
The Files backup browser stalled at Loading files, so its coverage is unverified.

The persistent gallery is outside deployment artifacts, at
/home/u257752935/arcan-data/cutover-20260925-164458/gallery. The existing sibling
gallery-pre-141-20261022.zip is 112096432 bytes; its SHA-256 is
eb37d01bcf9d77a511a6d7644921ad06667fbd5ed803b1205f11d0058b66984e.
ZIP CRC checks pass; all 140 member names, sizes and CRCs match the current
gallery. No upload root is configured or used by the current code. Only one
deployed artifact version is retained, so rollback must use the pinned baseline
source rebuild rather than assume a previous artifact is available. No restore,
backup creation, settings change or deployment was performed.
