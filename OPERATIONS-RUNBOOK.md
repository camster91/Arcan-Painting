# Arcan Painting operations runbook

## Release gate

Production requires an exact commit SHA, clean worktree, passing tests/typecheck/build, staging browser evidence, dependency and secret review, a verified database backup, a rollback image, and action-time owner approval for that SHA. Run `bash scripts/deploy-vps.sh SHA` only after those gates are recorded.

The deploy script archives the requested Git object, verifies the local production build, creates and validates a PostgreSQL custom-format dump on Ashbi, captures the prior source and container image, builds the candidate, and automatically returns to the prior image if health never becomes ready. Caddy is changed only after container health succeeds.

## Backup and restore

Backups live in `/opt/arcan-backups` on Ashbi. Verify the newest dump with `bash scripts/verify-vps-backup.sh`. A real restore drill must use an isolated staging database first. Production restore is destructive and requires `bash scripts/restore-vps-backup.sh BACKUP.dump "RESTORE BACKUP.dump"`; it captures a pre-restore dump before stopping the app and replacing the database.

After a restore, verify database health, owner login, lead search, estimate/contract/project history, invoice totals, payment ledger, customer portal, and one assigned-crew journey. Record the backup checksum, start/end time, restored environment, and result.

## Privacy and retention

`GET /api/admin/privacy` returns the policy. `GET /api/admin/privacy?lead_id=ID` creates an audited no-store customer export. Anonymization requires owner access, CSRF, and the exact phrase `ANONYMIZE ID`; it is blocked by unsettled invoices, active projects, signed contracts, or financial records. It revokes portal access, cancels queued messages, opts the customer out, removes direct identifiers, and writes an audit event.

## Incident response

For a suspected credential or data incident: restrict ingress, preserve logs and database/image artifacts, revoke affected sessions and tokens, rotate only confirmed exposed secrets, assess affected records and time window, document actions in UTC, and follow applicable notification obligations. Never erase evidence to make a service healthy.

For application failure: inspect `docker compose ps`, app/db logs, `/api/health`, disk capacity, and the exact deployed image. Roll back the image before considering a database restore. Database restore is the last resort when data corruption or loss is proven.

## Integration ownership

Stripe, email, maps, analytics, advertising, call tracking, Search Console, business profile, accounting, Sentry, and OpenClaw each need an owner, environment, credential location, last successful test, failure signal, fallback, and revocation procedure. Provider configuration is not considered complete until its staging transaction and identifier mapping are recorded without exposing secrets.
