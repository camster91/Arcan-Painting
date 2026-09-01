# Arcan Painting Contractor OS Roadmap

Last reconciled: 2026-09-01

Branch: `codex/arcan-contractor-os`  
Status: active implementation  
Production release: approval-gated

This is the authoritative product roadmap for the admin application. `REMEDIATION.md`
remains the record for the public-site SEO/GEO/AEO/CRO release; `TODO.md` is historical.

## Product objective

Give a painting contractor one dependable operating system for the complete revenue and
delivery journey:

`inquiry -> qualification -> site visit -> estimate -> approval -> deposit -> scheduled job -> field delivery -> closeout -> invoice -> payment -> review/referral`

The primary success measure is the percentage of real jobs that complete this journey
without duplicate entry, an offline spreadsheet, or an untracked customer handoff.

## Users and jobs to be done

| User                    | Critical job                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------ |
| Owner / operator        | See pipeline, schedule, cash, margin, risks, and next actions in one place           |
| Estimator / salesperson | Qualify, visit, scope, price, follow up, and win work quickly                        |
| Project manager         | Turn sold work into a staffed, documented, profitable job                            |
| Crew member             | See today's scope and record time, materials, progress, photos, and issues on mobile |
| Office / bookkeeper     | Control contracts, deposits, invoices, receivables, records, and exports             |
| Customer                | Review, approve, sign, pay, receive updates, and close out the project simply        |

## Status rules

- `complete`: implemented and verified through the UI and API with durable evidence.
- `partial`: useful code exists, but a required step, integration, or proof is missing.
- `blocked`: a named external decision, credential, vendor, or business fact is required.
- `missing`: no usable implementation exists.
- A screen, table, or generated response alone does not make a workflow complete.

## Current-state scorecard

| Capability                                 | Status          | Evidence / gap                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------ | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public inquiry capture and CRM persistence | Complete        | Contact and quote submissions were verified through isolated staging data                                                                                                                                                                                                                                               |
| Leads and clients                          | Partial         | CRUD/search, aligned lifecycle stages, durable attribution, stage timestamps, lost reasons, and a unified customer activity timeline exist; automated nurture remains incomplete                                                                                                                                        |
| Site visits and scheduling                 | Partial         | Appointments, availability, calendar, and schedules exist; external calendar transport is disabled                                                                                                                                                                                                                      |
| Painting estimate builder                  | Partial         | Areas, surfaces, prep, coatings, colors, sheen, exclusions, production assumptions, materials, PDF, send, transactional approval, and duplicate code exist; rendered staging approval remains unverified                                                                                                                |
| Contracts                                  | Partial         | CRUD, templates, PDF, send, and portal e-sign exist; rendered staging and legal-policy review remain unverified                                                                                                                                                                                                         |
| Projects and field progress                | Partial         | Multi-person assignment-scoped Today queue, sold scope, scheduled-job start, concurrency-safe time tracking, receipt-backed materials/expenses, progress/photos/notes, checklists, audited change orders, severity-ranked issues, governed closeout, and safe offline retries exist; authenticated mobile proof remains |
| Invoices and payments                      | Partial         | Validated deposit/progress/final invoices, APIs, PDFs, send, owner-controlled immutable payment records, cleared-cash reconciliation, aging, refunds, receipts, and accounting export exist; hosted payment remains incomplete                                                                                          |
| Customer communications                    | Partial         | Template, workflow, logs, health, gated dispatch, and a concurrency-safe delayed worker exist; production provider verification remains incomplete                                                                                                                                                                      |
| Customer portal                            | Partial         | Revocable hashed links, estimate approval, contract signature, change-order decisions, invoices, cleared-payment receipts, and customer-safe project updates exist; hosted payment and rendered staging QA remain                                                                                                       |
| Job costing and margin                     | Partial         | Estimate budgets, server-priced labor actuals, receipt-backed project expenses, vendor purchase commitments, projected costs, billing, cleared collections, credits, gross profit, and margin reconcile per job and across the portfolio; rendered staging proof remains                                                |
| Marketing operations                       | Partial         | Durable attribution, cleared-revenue funnel reporting, consent-aware follow-up/reactivation/review/referral queues, inactive seed templates, and send-time consent rechecks exist; external platform connections remain approval-gated                                                                                  |
| Owner reporting                            | Partial         | Real period trends, sales funnel, attribution, lost reasons, cross-project margin risk, cash, commitments, and receivable aging exist; rendered staging proof remains                                                                                                                                                   |
| AI assistance                              | Non-operational | UI and routes exist, but required providers are absent or disabled; AI must not be on the critical path                                                                                                                                                                                                                 |
| Security, audit, recovery                  | Partial         | Auth, CSRF, rate limits, audit and recovery routes exist; full permission, privacy, restore, and field-device validation remains                                                                                                                                                                                        |

## Delivery plan

### P0 — Make the revenue spine dependable

- [x] Replace the invoice-creation placeholder with a validated, accessible workflow.
- [x] Correct invoice/payment aggregation and protect financial invariants with tests.
- [x] Define and enforce lifecycle states and allowed transitions from lead through paid job.
- [x] Add one activity timeline joining customer, estimate, contract, project, invoice, payment, and communication events.
- [x] Add explicit conversion actions that carry data forward instead of requiring re-entry.
- [ ] Verify estimate approval, contract acceptance, deposit, project creation, completion, invoice, and payment end to end.

Acceptance: a test customer can travel from new inquiry to paid closeout on staging, with
every transition persisted, attributed, auditable, and visible after reload.

### P1 — Customer communication and self-service

- [x] Remove or repair every admin screen whose backing route is absent.
- [x] Implement provider-neutral message delivery with delivery state, failure state, retries, and logs.
- [ ] Add configurable email/SMS providers only after credentials and commercial approval.
- [ ] Build a secure customer portal for estimates, contracts, approvals, signatures, invoices, receipts, project updates, and change orders. (Core approval/document slice implemented; remaining scope and rendered QA pending.)
- [x] Add template governance, reminders, opt-out/consent controls, and a unified communication timeline.

Acceptance: no message is reported as sent unless the provider confirms it; customers can
complete the required document and payment actions without staff intervention.

### P1 — Painting-specific field operations

- [x] Turn estimate scope into job scope: rooms/areas, surfaces, prep, coatings, colors, sheen, quantities, exclusions, and production assumptions. (Code and automated gates complete; authenticated rendered staging proof remains in the release gate.)
- [ ] Add crew assignments, mobile daily view, arrival/departure, time, material usage, photos, notes, delays, and safety/issues.
- [x] Add change orders with scope, price, schedule impact, approval, and audit trail.
- [ ] Add punch list, final walkthrough, completion evidence, care instructions, and closeout package.
- [ ] Provide offline-tolerant field entry and conflict-safe retry behavior.

Acceptance: a crew can run a real job from a phone while the owner sees current scope,
progress, labor, materials, risks, approvals, and closeout state.

### P1 — Financial control

- [x] Add estimate budget, committed cost, labor/material actuals, change-order impact, invoice schedule, collected cash, and gross-margin reconciliation.
- [x] Enforce non-negative balances, overpayment handling, payment status rules, and immutable financial audit events.
- [x] Add expenses, tax treatment, aging, deposit/progress/final invoice schedules, refund/void handling, and CSV/accounting exports.
- [x] Add an accounting integration seam; select a vendor only after owner workflow and cost review.

Acceptance: job-level budget, actual cost, billed amount, collected amount, receivable, and
gross margin reconcile to source transactions.

### P2 — Marketing, reputation, and sales operations

- [x] Report source, campaign, landing page, service, and lead-to-revenue conversion.
- [x] Add qualified-lead, estimate, win/loss, sales-cycle, close-rate, average-ticket, and lost-reason reporting.
- [x] Add consent-aware nurture, estimate follow-up, dormant-lead reactivation, review requests, referrals, and repeat-customer campaigns.
- [x] Add approved portfolio/case-study workflow without inventing business proof; local search profile publication remains access-gated.
- [ ] Integrate ad, analytics, call-tracking, Search Console, and business-profile sources only after access and identifier approval.

Acceptance: every campaign can be connected to qualified leads, won revenue, cost, and
follow-up action without unsupported claims or silent data gaps.

### P2 — Owner control plane and hardening

- [x] Replace mock trends with period-over-period source data and documented KPI definitions.
- [x] Add role-based permissions for owner, office, estimator, project manager, crew, and read-only finance.
- [ ] Complete audit coverage for sensitive, financial, permission, export, and customer-facing actions.
- [ ] Verify privacy, retention, export, deletion, secret handling, dependency risk, abuse controls, accessibility, responsive behavior, performance, backups, and restores.
- [x] Publish operator, incident, integration, staging, rollback, and release runbooks.

Acceptance: the owner can understand the business, control access, recover data, and run
the product without repository knowledge.

## External decisions and approval gates

The following do not block provider-neutral implementation, but they block claiming the
related integration complete:

- Approved email and SMS providers, sender domains/numbers, credentials, consent rules, and monthly budget.
- Payment processor and fee/chargeback/refund policy.
- Accounting system and chart-of-accounts/export requirements.
- GA4, Search Console, Google Business Profile, advertising, review, and call-tracking access.
- Approved service areas, hours, insurance/WSIB, warranties, brands, reviews, case studies, response SLA, and public commercial claims.

Production deployment, auto-releasing merges, purchases, sensitive production-data
operations, and real external communications require explicit action-time approval.

## Verification and release gate

- Clean install, typecheck, unit/integration suite, production build, dependency and secret checks.
- Authenticated and public rendered QA on desktop and mobile.
- Full staging journey with isolated data, real persistence, reload checks, failure states, accessibility, and responsive geometry.
- Exact application revision and image digest recorded.
- Database backup validated and rollback artifact proven.
- Production approval obtained immediately before release.
- Post-release health, data, authentication, core workflow, headers, logs, and rollback checks recorded.

## Work log

- 2026-09-01: Reconciled `origin/main`, production release records, schema, admin pages,
  APIs, and historical plans. Established this roadmap. Began P0 with invoice creation
  and financial-integrity validation.
- 2026-09-01: Made estimate-to-project approval transactional and retry-safe, rejecting
  invalid terminal-state conversions. Added the authenticated customer activity timeline
  across sales, scheduling, delivery, billing, payment, follow-up, and email records.
- 2026-09-01: Restored missing email administration APIs for provider health, owner-only
  test delivery, templates, workflow configuration, and delivery logs. The UI now states
  honestly that automatic workflow execution is not active; no external email was sent.
- 2026-09-01: Added a retry-safe business-event dispatcher and concurrency-safe delayed
  email worker for estimate sent/approved and invoice sent events. Automation is opt-in
  through `EMAIL_AUTOMATIONS_ENABLED`; disabled is the documented default. Closed an
  authentication bypass where an unset cron secret could previously authorize a worker.
- 2026-09-01: Enforced audited project lifecycle transitions and connected project-start
  and cleared-payment events to the gated workflow queue. Added row claiming, parallel
  worker protection, and recovery of abandoned email jobs after worker failure.
- 2026-09-01: Added painting-project change orders with scope/reason, HST, schedule
  impact, lifecycle controls, audit events, and project-level UI. Approval applies value
  and schedule impact transactionally and retry-safely; voiding reverses the adjustment.
- 2026-09-01: Removed fabricated dashboard comparisons. Owner KPI changes now compare
  new leads, estimates, projects, and cleared-payment revenue with the actual preceding
  period, displaying `No baseline` rather than inventing a percentage.
- 2026-09-01: Added the secure customer-portal foundation: owner-created and revocable
  expiring links stored only as SHA-256 hashes, customer estimate approval, explicit-consent
  contract signature, retry-safe change-order decisions, and non-draft invoice visibility.
  Bearer tokens are excluded from SEO metadata and referrers. Rendered staging verification,
  hosted payment, receipts, and project-update presentation remain open.
- 2026-09-01: Extended the portal with customer-safe project progress, milestone photos,
  and cleared-payment receipts. Internal job notes, labor/cost data, issues, and payment
  references remain excluded from the public response; progress is private unless staff
  explicitly checks the customer-visible control. Hosted payment remains approval-gated.
- 2026-09-01: Rebuilt the mobile field foundation around an assignment-scoped Today
  queue covering due/overdue scheduled work and active jobs. Clock-in now locks the team
  member, prevents overlapping timers, validates shift bounds and project access, and
  transactionally starts scheduled work. Repaired missing fresh-schema fields for project
  progress and completion checklists, enabled assigned painters to report progress, and
  separated owner-authored checklist structure from crew execution.
- 2026-09-01: Added durable multi-person project crews with owner controls and audited,
  transactional membership replacement. Project lists, field queues, progress, checklists,
  change-order visibility, and time entry access now recognize either the primary painter
  or an active crew membership. Also repaired missing fresh-schema team cost fields.
- 2026-09-01: Added a project issue register for damage, access, materials, schedule,
  safety, quality, and customer blockers. Assigned crews can raise, start, and resolve
  issues with required resolution evidence; only owners can void or reassign them. Today
  surfaces open and urgent counts, while every mutation is audited.
- 2026-09-01: Connected field activity to job costing. Time entries now use the protected
  team-member cost rate, while assigned crews can record categorized, tax-separated expenses
  with HTTPS receipt evidence. Owners receive a project reconciliation of estimate budgets,
  labor and expense actuals, contract value, gross profit/margin, invoicing, collections,
  and receivables; expense creation and voids are audited.
- 2026-09-01: Hardened the payment ledger. Access and mutation are owner-only, pending
  funds no longer reduce receivables, invoice balances cannot go negative, overpayments
  surface as customer credits, settled financial facts cannot be edited, cleared entries
  can only transition to refunded, and physical deletion was removed from the API and UI.
- 2026-09-01: Added owner-controlled vendor purchase commitments with draft, approval,
  ordered, received, and cancelled states. Approved and ordered costs now affect projected
  job cost and margin; receiving is concurrency-safe and transactionally converts the
  commitment into one receipt-linked actual expense so committed and actual cost do not overlap.
- 2026-09-01: Added authoritative receivable aging and a formula-injection-safe,
  owner-only accounting CSV across invoices, payments, expenses, and purchase commitments.
  The export is deliberately vendor-neutral and non-cacheable pending an explicit accounting
  platform choice, while the invoice workspace surfaces current through 90-plus-day balances.
- 2026-09-01: Made acquisition attribution durable on lead records and aligned the admin
  lifecycle to new, contacted, qualified, proposal sent, follow-up, won, and lost. Stage
  timestamps and required lost reasons now support an owner funnel by source, campaign,
  landing page, and service, with qualified/estimate/win conversion, sales cycle, average
  ticket, close rate, spend efficiency, cleared revenue, and CSV export.
- 2026-09-01: Added explicit unknown/opted-in/opted-out consent records plus owner previews
  for estimate follow-up, dormant-lead reactivation, review, and referral candidates.
  Lifecycle templates and workflows seed inactive; queueing requires owner confirmation and
  the delayed worker rechecks consent immediately before delivery, cancelling unsafe jobs.
- 2026-09-01: Added contractor-specific RBAC for owner, office, estimator, project manager,
  crew, and finance read-only users. Navigation, invitations, protected route policy, and
  representative financial, sales, project, and marketing APIs now enforce method-aware roles.
- 2026-09-01: Added owner-only audited customer export and anonymization with exact
  confirmation and retention holds, plus privacy retention policy, backup verification,
  restore tooling, rollback-aware deployment, and an operator runbook. Dependency audit
  reported no production vulnerabilities.
- 2026-09-01: Built and deployed exact revision `f185122` to the isolated Ashbi staging
  application. Recorded 84 passing test files (250 tests), typecheck, production build,
  zero production dependency vulnerabilities, public route/auth-boundary checks, image ID,
  and a 60-table backup restore drill in `STAGING-EVIDENCE.md`. Production remained on
  `arcan-painting:175d567`; authenticated rendered and mobile journeys remain open.
- 2026-09-01: Added the missing portfolio operations workspace. Managed gallery items now
  move through draft, review, and approved states; customer consent and business proof are
  mandatory before approval or public visibility, and approval/publication changes are
  audited. Google Business Profile publication remains external-access gated.
- 2026-09-01: Replaced the isolated staging application with exact candidate `24f5f03`
  (`sha256:32c657f01be85156201fb1192e6ac603b9ef12304515a4190e0269aa7b88a9f7`).
  The full suite now records 85 passing files and 253 tests. Public routes, admin redirects,
  protected API boundaries, and health passed again; production remained unchanged.
- 2026-09-01: Enforced a legal lead lifecycle graph with audited transitions. Estimate
  approval now atomically marks the related lead won and creates or reuses exactly one
  scheduled project, while manual estimate-to-project creation rejects unapproved or
  already-converted estimates instead of duplicating data.
- 2026-09-01: Deployed exact lifecycle candidate `8a2c152` to isolated Ashbi staging as
  image `sha256:813bd11dca80df42c3a6689285417098d25d9a4e409ac7e9cd7cb711fd1e3d5d`.
  The gate records 86 passing test files and 256 tests plus typecheck and production build;
  staging health passed and production remained unchanged.
- 2026-09-01: Replaced hard-coded email health and delivery assumptions with an explicit
  provider seam supporting disabled, Maton Gmail, and approved HTTPS email transports.
  Configuration validation, provider acceptance, failures, retries, queue state, logs,
  templates, consent rechecks, and customer timeline evidence remain truthful when no
  provider is enabled; no external message was sent.
- 2026-09-01: Deployed exact communications candidate `08c7b19` to isolated Ashbi staging
  as image `sha256:885a078aa0913000344e77d77038c1af903f64f232e71b701ad7df9459ce7b20`.
  The gate records 87 passing test files and 260 tests, production build, and no production
  dependency vulnerabilities. Staging is healthy; production remains `175d567`.
- 2026-09-01: Added painting-specific closeout defaults for final walkthrough, punch-list
  resolution, completion photos, and care instructions. Project creation and estimate
  conversion seed them transactionally. Completion is now rejected unless progress is 100%,
  all required steps are evidenced, site issues are resolved, and every crew timer is stopped.
- 2026-09-01: Deployed exact closeout candidate `bf15a56` to isolated Ashbi staging as
  image `sha256:784ea2c1a934c0cb891ec249b02ce7a9ee996cc2aaff2be9dd9e87b5be1d5082`.
  The gate records 88 passing test files and 262 tests plus typecheck and production build;
  staging is healthy and production remains unchanged.
- 2026-09-01: Replaced the non-functional service-worker outbox placeholder with a bounded
  IndexedDB queue for absolute project, progress, and closeout updates. It retries in order,
  caps failures, reports queue outcomes, clears on login/logout, never caches authenticated
  API responses or admin pages, and refuses to queue creates, approvals, payments, or deletes.
  Offline creation workflows remain open rather than being represented as safe.
- 2026-09-01: Deployed exact offline-safety candidate `124a4ec` to isolated Ashbi staging as
  image `sha256:73b9f4e8b7e4a84ba3b7bbbdec7d05b0bb9cf9a0452c9523353939d1d5109cad`.
  The gate records 89 passing test files and 265 tests plus typecheck and production build;
  staging is healthy and production remains unchanged.
- 2026-09-01: A direct staging probe found the worker and manifest returned HTML 404s.
  Root cause was an explicit Docker ignore for `public/sw.js` plus a missing manifest and
  install icons. The runtime artifact now includes the worker, a field-focused manifest,
  192/512 install icons, and the notification badge; reachability must be re-proven after rebuild.
- 2026-09-01: Rebuilt exact PWA artifact candidate `cd0a963` on isolated Ashbi staging.
  `/sw.js`, `/manifest.json`, both install icons, and the notification badge now return `200`
  with correct JavaScript, JSON, and PNG media types. Image
  `sha256:cd973d974ed14dc096acb2d53100d7bb50c22fb683fff8facc5449c69ae56756`
  is healthy; the gate records 89 files and 266 tests; production remains unchanged.
- 2026-09-01: Completed the sold-scope handoff from estimate creation to the assignment-scoped
  field Today view. The estimator now records coating product, color, sheen, prep quantities,
  area notes, exclusions, and production assumptions; the crew API returns that operational
  scope without pricing or cost data. Local gates pass with 90 test files and 269 tests,
  typecheck, and the production build. Authenticated rendered staging proof remains open.
- 2026-09-01: Built and deployed exact sold-scope candidate `65e69c3` to the isolated Ashbi
  staging stack as `arcan-painting-staging:65e69c3` (image ID
  `sha256:d3564c6559bdc6b705afd035993f4ef89d1626d3ca83fb7308aec11dc65792cc`).
  The additive schema migration, health, public PWA assets, anonymous authorization boundary,
  and admin sign-in redirect passed. Production remained healthy on `arcan-painting:175d567`.
- 2026-09-01: Expanded the consolidated operations runbook into an independent owner handoff
  covering daily operations, isolated staging, exact-artifact release approval, post-release
  evidence, image-first rollback, backup/restore, privacy, severity-based incident response,
  integration governance, and a reusable handoff checklist. Automated coverage prevents those
  required operating sections from silently disappearing.
- 2026-09-01: Added permission-scoped portfolio margin reporting to the owner dashboard. It
  reconciles each job and portfolio totals from contract value, protected labor cost, recorded
  expenses, open purchase commitments, invoices, and cleared payments; ranks lowest projected
  margins first; and highlights jobs below 25% for review. Restricted dashboard roles do not see
  a misleading authorization error. Targeted tests, typecheck, and production build pass.
- 2026-09-01: Built and deployed exact reporting candidate `70e1bd5` to isolated Ashbi staging
  as image `sha256:b076d2fcbb5cce45026e21b6b288ec9b692da666b49fe7b2685ff3d829ee607e`.
  The full suite records 92 files and 281 tests. The portfolio SQL executed successfully against
  the real staging schema, health and the anonymous authorization boundary passed, and production
  remained healthy on `arcan-painting:175d567`.
- 2026-09-01: Closed customer-document lifecycle and audit bypasses found during the completion
  audit. Estimate, contract, and invoice sends now require the matching role permission, reject
  terminal document states, use conditional state updates, and write central audit evidence.
  Generic estimate updates cannot approve or mutate sold estimates. Contract creation can no
  longer approve an estimate, and the admin UI/API can no longer fabricate a customer signature;
  consent-backed portal signing is authoritative. Contract templates now update all legal fields
  atomically, validate deposit percentages, and audit create/update/delete. Settings, team-member
  permissions, invitations, accounting exports, and marketing exports also gained audit coverage.
- 2026-09-01: Built and deployed exact lifecycle-hardening candidate `017ac90` to isolated Ashbi
  staging as image `sha256:045edf3f8bf5916b9db0fc6352c8cb6d73d387cac8f86322bd06aa2de0e9c76c`.
  The full gate records 99 passing files and 311 tests, typecheck, production build, and zero
  production dependency vulnerabilities. Health, PWA assets, reporting authorization, all three
  customer-document send boundaries, and contract-template boundaries passed. Both staging and
  production report zero restarts; production remains unchanged on `arcan-painting:175d567`.
- 2026-09-01: Closed two additional record-integrity gaps. Creating a default contract template
  now validates a true 0-100 deposit percentage and changes defaults inside the same transaction
  as the insert. Estimate deletion no longer deletes a related project: only an unlinked draft
  can be removed, while sent, approved, contracted, and scheduled estimates are retained as
  auditable business records. The full local gate passes with 100 files and 316 tests.
- 2026-09-01: Built and deployed exact record-integrity candidate `dce979f` to isolated Ashbi
  staging as image `sha256:5088fff9fedfec62cff9100f6be7ee4d92c3c9b31f1fe84d58e4d68c9888c1f3`.
  Health, PWA assets, protected send/report/privacy/delete boundaries, and the real-schema
  retention query passed. Staging and production remain healthy with zero restarts; production
  is still pinned to `arcan-painting:175d567`.
- 2026-09-01: Hardened estimate duplication as a single transaction with explicit estimate-write
  permission and central audit evidence. Duplicates now preserve the full painting handoff scope,
  including area exclusions, production assumptions, coating product, colour, and sheen, and a
  failed nested copy can no longer leave a partial draft estimate behind.
- 2026-09-01: The real staging schema check caught and corrected the surface colour column name
  before authenticated use. Exact candidate `d8eac46` is now healthy on isolated Ashbi staging as
  image `sha256:c8c7195b61839eb20fc3e5123b54fc68a22cd125f5e8d20986282edf7f925e63`.
  All five sold-scope columns were confirmed in the live staging schema, the duplicate boundary
  returns `401` anonymously, and production remains healthy and restart-free on `175d567`.
- 2026-09-01: Closed scheduling and sales audit gaps. Follow-ups now enforce customer read/write
  permissions and audit create/update/delete. Availability slot creation, bulk generation, status
  changes, and deletion are audited. Slots with appointment history can no longer cascade-delete
  bookings; operators close or reopen them while deletion remains available only for unused slots.
- 2026-09-01: Built and deployed exact scheduling-retention candidate `0a49675` to isolated Ashbi
  staging as image `sha256:ac5cd807b7c7a358aa97063b22132dd63464ac5979be8a48d9bf13a2e4e61e7c`.
  The full gate records 103 files and 328 tests. The live schema accepted the retention and status
  queries, anonymous mutations were rejected at the CSRF boundary, and both staging and unchanged
  production remain healthy with zero restarts.
- 2026-09-01: Restricted onboarding company identity, progression, completion, and Google-prompt
  state to owner/admin users and added audit evidence for every action. Team availability
  create/update/delete now uses the same explicit trust boundary and central audit trail.
- 2026-09-01: Built and deployed exact owner-control candidate `7e4dcf7` to isolated Ashbi staging
  as image `sha256:9dd0b8a3f46ada7e0a0bee9d5a405eaff7a0926409a24c43653782748a3f68c4`.
  The full gate records 104 files and 332 tests. Anonymous onboarding and team-availability reads
  and writes return `401`; both staging and unchanged production are healthy with zero restarts.
- 2026-09-01: Hardened remaining operator records. Internal tasks now validate legal status and
  priority values and audit create/update/delete with assignment context. Delayed-email queue
  inspection now requires communications-management permission, protecting recipient and failure
  details from crew roles; owner and cron worker runs emit central processed/sent/failed evidence.
- 2026-09-01: Built and deployed exact operator-record candidate `424dbe8` to isolated Ashbi
  staging as image `sha256:011f91d8fde8260abc425dcfcbede62a0f1e3521f77bac2d7d4ed770353bc327`.
  The full gate records 106 files and 337 tests, passing typecheck, production build, and the
  production-dependency audit with zero vulnerabilities. Anonymous internal-task and delayed-email
  queue reads return `401`, task writes fail at the CSRF boundary with `403`, public health and PWA
  assets return `200`, and unchanged production remains healthy on `175d567` with zero restarts.
- 2026-09-01: Added actor-bound, PII-minimized audit evidence for manual notification creation and
  notification read-state changes. Consolidated agent database migration execution in the dedicated
  owner/admin endpoint and added central success/failure summaries alongside its agent-run record.
  The expanded full gate records 107 files and 341 tests, passing typecheck, production build, and
  the production-dependency audit with zero vulnerabilities.
