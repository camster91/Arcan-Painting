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

| User | Critical job |
| --- | --- |
| Owner / operator | See pipeline, schedule, cash, margin, risks, and next actions in one place |
| Estimator / salesperson | Qualify, visit, scope, price, follow up, and win work quickly |
| Project manager | Turn sold work into a staffed, documented, profitable job |
| Crew member | See today's scope and record time, materials, progress, photos, and issues on mobile |
| Office / bookkeeper | Control contracts, deposits, invoices, receivables, records, and exports |
| Customer | Review, approve, sign, pay, receive updates, and close out the project simply |

## Status rules

- `complete`: implemented and verified through the UI and API with durable evidence.
- `partial`: useful code exists, but a required step, integration, or proof is missing.
- `blocked`: a named external decision, credential, vendor, or business fact is required.
- `missing`: no usable implementation exists.
- A screen, table, or generated response alone does not make a workflow complete.

## Current-state scorecard

| Capability | Status | Evidence / gap |
| --- | --- | --- |
| Public inquiry capture and CRM persistence | Complete | Contact and quote submissions were verified through isolated staging data |
| Leads and clients | Partial | CRUD/search, aligned lifecycle stages, durable attribution, stage timestamps, lost reasons, and a unified customer activity timeline exist; automated nurture remains incomplete |
| Site visits and scheduling | Partial | Appointments, availability, calendar, and schedules exist; external calendar transport is disabled |
| Painting estimate builder | Partial | Areas, surfaces, prep, materials, PDF, send, transactional approval, and duplicate code exist; rendered staging approval remains unverified |
| Contracts | Partial | CRUD, templates, PDF, send, and portal e-sign exist; rendered staging and legal-policy review remain unverified |
| Projects and field progress | Partial | Multi-person assignment-scoped Today queue, scheduled-job start, concurrency-safe time tracking, progress, checklists, audited change orders, and severity-ranked site issues exist; materials, offline retry, and closeout remain incomplete |
| Invoices and payments | Partial | Validated deposit/progress/final invoices, APIs, PDFs, send, owner-controlled immutable payment records, cleared-cash reconciliation, aging, refunds, receipts, and accounting export exist; hosted payment remains incomplete |
| Customer communications | Partial | Template, workflow, logs, health, gated dispatch, and a concurrency-safe delayed worker exist; production provider verification remains incomplete |
| Customer portal | Partial | Revocable hashed links, estimate approval, contract signature, change-order decisions, invoices, cleared-payment receipts, and customer-safe project updates exist; hosted payment and rendered staging QA remain |
| Job costing and margin | Partial | Estimate budgets, server-priced labor actuals, receipt-backed project expenses, vendor purchase commitments, projected costs, billing, cleared collections, credits, gross profit, and margin reconcile per job; portfolio reporting remains |
| Marketing operations | Partial | Durable attribution, cleared-revenue funnel reporting, consent-aware follow-up/reactivation/review/referral queues, inactive seed templates, and send-time consent rechecks exist; external platform connections remain approval-gated |
| Owner reporting | Partial | Real period trends, sales funnel, attribution, lost reasons, job margin, cash, commitments, and receivable aging exist; cross-project margin reporting remains incomplete |
| AI assistance | Non-operational | UI and routes exist, but required providers are absent or disabled; AI must not be on the critical path |
| Security, audit, recovery | Partial | Auth, CSRF, rate limits, audit and recovery routes exist; full permission, privacy, restore, and field-device validation remains |

## Delivery plan

### P0 — Make the revenue spine dependable

- [x] Replace the invoice-creation placeholder with a validated, accessible workflow.
- [x] Correct invoice/payment aggregation and protect financial invariants with tests.
- [ ] Define and enforce lifecycle states and allowed transitions from lead through paid job.
- [x] Add one activity timeline joining customer, estimate, contract, project, invoice, payment, and communication events.
- [ ] Add explicit conversion actions that carry data forward instead of requiring re-entry.
- [ ] Verify estimate approval, contract acceptance, deposit, project creation, completion, invoice, and payment end to end.

Acceptance: a test customer can travel from new inquiry to paid closeout on staging, with
every transition persisted, attributed, auditable, and visible after reload.

### P1 — Customer communication and self-service

- [x] Remove or repair every admin screen whose backing route is absent.
- [ ] Implement provider-neutral message delivery with delivery state, failure state, retries, and logs.
- [ ] Add configurable email/SMS providers only after credentials and commercial approval.
- [ ] Build a secure customer portal for estimates, contracts, approvals, signatures, invoices, receipts, project updates, and change orders. (Core approval/document slice implemented; remaining scope and rendered QA pending.)
- [ ] Add template governance, reminders, opt-out/consent controls, and a unified communication timeline.

Acceptance: no message is reported as sent unless the provider confirms it; customers can
complete the required document and payment actions without staff intervention.

### P1 — Painting-specific field operations

- [ ] Turn estimate scope into job scope: rooms/areas, surfaces, prep, coatings, colors, sheen, quantities, exclusions, and production assumptions.
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
- [ ] Add approved portfolio/case-study workflow and local search profile operations without inventing business proof.
- [ ] Integrate ad, analytics, call-tracking, Search Console, and business-profile sources only after access and identifier approval.

Acceptance: every campaign can be connected to qualified leads, won revenue, cost, and
follow-up action without unsupported claims or silent data gaps.

### P2 — Owner control plane and hardening

- [x] Replace mock trends with period-over-period source data and documented KPI definitions.
- [x] Add role-based permissions for owner, office, estimator, project manager, crew, and read-only finance.
- [ ] Complete audit coverage for sensitive, financial, permission, export, and customer-facing actions.
- [ ] Verify privacy, retention, export, deletion, secret handling, dependency risk, abuse controls, accessibility, responsive behavior, performance, backups, and restores.
- [ ] Publish operator, incident, integration, staging, rollback, and release runbooks.

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
