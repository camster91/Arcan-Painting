# Arcan Painting operations runbook

- Owner: Arcan Painting owner/operator
- Technical environment: Ashbi VPS (`coolify` SSH alias)
- Production origin: `127.0.0.1:3000` behind Caddy
- Staging origin: `127.0.0.1:3215` on `arcan-staging-net`

This document is the operator, staging, release, rollback, incident, recovery, and
integration runbook. Do not paste credentials, tokens, customer data, or database URLs into
this file or release evidence.

## Daily operator checks

1. Confirm the dashboard uses the expected reporting period and inspect overdue follow-ups,
   estimates awaiting decisions, today's schedule, urgent field issues, receivable aging,
   failed messages, and low-margin jobs.
2. Assign every active job to named crew members and confirm they can see only assigned work.
3. Reconcile completed time, expenses, purchase orders, progress evidence, and change orders
   before approving completion or issuing a final invoice.
4. Treat provider-disabled, queued, failed, refunded, and pending states literally. Never tell
   a customer an email was sent or payment cleared unless the recorded provider/ledger state
   confirms it.
5. Use customer export/anonymization only for a documented request and preserve financial,
   signed-contract, and legal-retention records.

## Staging validation

Use an isolated database, network, container, port, and staging-only account. Record the exact
application Git SHA, immutable image ID, test count, build result, dependency audit, schema
migrations, backup checksum, and production image before testing. Never copy production
credentials or unrestricted production customer data into staging.

Exercise the complete journey with disposable records: inquiry, qualification, estimate scope,
approval, contract signature, deposit, scheduled project, assigned crew, time/progress/expense,
issue and change order, closeout evidence, final invoice, cleared payment, receipt, and
review/referral eligibility. Reload after every important write. Test owner and representative
restricted roles, failure states, keyboard access, narrow mobile geometry, offline-safe updates,
and logout/session revocation. Remove disposable accounts, sessions, links, files, and records
after evidence is captured.

## Release gate

Production requires an exact commit SHA, clean worktree, passing tests/typecheck/build, staging browser evidence, dependency and secret review, a verified database backup, a rollback image, and action-time owner approval for that SHA. Run `bash scripts/deploy-vps.sh SHA` only after those gates are recorded.

The deploy script archives the requested Git object, verifies the local production build, creates and validates a PostgreSQL custom-format dump on Ashbi, captures the prior source and container image, builds the candidate, and automatically returns to the prior image if health never becomes ready. Caddy is changed only after container health succeeds.

Before invoking it, the owner must approve the exact application SHA in the active release
conversation. A prior general approval does not authorize a later candidate. Record the
approval time, approved SHA, staged image ID, current production image, backup path/checksum,
and rollback tag. Do not deploy a docs-only evidence commit as though it were a different app
artifact; name the application SHA that produced the image.

After release, verify the production image ID, `/api/health`, public canonical/robots/sitemap,
security headers, sign-in and logout, one read-only admin screen, one permission denial, lead
capture persistence, logs, database health, and the absence of unexpected migration errors.
Record the UTC start/end time and results. Keep the rollback image and database dump until the
retention policy permits removal.

## Rollback

Prefer an application-image rollback when health, authentication, rendering, or workflow logic
regresses and the database remains sound. Stop customer-facing writes if continued use could
compound damage. Identify the exact prior image and release manifest, redeploy that image, then
repeat production health/auth/core-workflow checks. Additive schema from a newer app may remain;
do not reverse schema manually unless a reviewed migration explicitly supports it.

Use database restore only for proven corruption or data loss. It replaces current data and needs
the exact confirmation described below. Preserve a pre-restore dump and incident timeline first.
Escalate instead of guessing if the previous application cannot safely read the current schema.

## Backup and restore

Backups live in `/opt/arcan-backups` on Ashbi. Verify the newest dump with `bash scripts/verify-vps-backup.sh`. A real restore drill must use an isolated staging database first. Production restore is destructive and requires `bash scripts/restore-vps-backup.sh BACKUP.dump "RESTORE BACKUP.dump"`; it captures a pre-restore dump before stopping the app and replacing the database.

After a restore, verify database health, owner login, lead search, estimate/contract/project history, invoice totals, payment ledger, customer portal, and one assigned-crew journey. Record the backup checksum, start/end time, restored environment, and result.

## Privacy and retention

`GET /api/admin/privacy` returns the policy. `GET /api/admin/privacy?lead_id=ID` creates an audited no-store customer export. Anonymization requires owner access, CSRF, and the exact phrase `ANONYMIZE ID`; it is blocked by unsettled invoices, active projects, signed contracts, or financial records. It revokes portal access, cancels queued messages, opts the customer out, removes direct identifiers, and writes an audit event.

## Incident response

For a suspected credential or data incident: restrict ingress, preserve logs and database/image artifacts, revoke affected sessions and tokens, rotate only confirmed exposed secrets, assess affected records and time window, document actions in UTC, and follow applicable notification obligations. Never erase evidence to make a service healthy.

For application failure: inspect `docker compose ps`, app/db logs, `/api/health`, disk capacity, and the exact deployed image. Roll back the image before considering a database restore. Database restore is the last resort when data corruption or loss is proven.

Classify severity by customer/data impact: critical for confirmed exposure, destructive data
loss, unauthorized financial action, or complete production outage; high for widespread broken
core workflows; medium for contained degradation; low for cosmetic or noncritical defects.
Name one incident lead, keep a UTC decision log, preserve evidence, communicate known facts and
uncertainty, and define the next update time. Close only after containment, recovery checks,
affected-party/legal review where applicable, root cause, corrective actions, and owner signoff.

## Integration ownership

Stripe, email, maps, analytics, advertising, call tracking, Search Console, business profile, accounting, Sentry, and OpenClaw each need an owner, environment, credential location, last successful test, failure signal, fallback, and revocation procedure. Provider configuration is not considered complete until its staging transaction and identifier mapping are recorded without exposing secrets.

For each approved integration, record in a protected operator system: provider and account ID,
business owner, technical owner, purpose and data classes, consent/legal basis, environment,
secret-manager reference, allowed callback origins, webhook verification method, least-privilege
scopes, cost/budget, rate limits, alert destination, last staging and production tests, data
retention/deletion behavior, outage fallback, credential rotation date, and revocation steps.
Do not enable a provider until failure and retry behavior is truthful and duplicate webhooks or
replayed callbacks are idempotent.

## Handoff evidence template

- Application SHA and immutable image ID:
- Environment and public origin:
- Tests, typecheck, build, dependency and secret checks:
- Database migration and backup/restore evidence:
- Desktop, mobile, accessibility, and representative-role evidence:
- Full lifecycle records created and cleanup performed:
- External integrations deliberately enabled or disabled:
- Known limitations and business/legal decisions still required:
- Production approval, release time, rollback artifact, and post-release checks:
