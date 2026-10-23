# Operations and release boundaries

## Current source behaviour

The app is React Router on Hono. `npm run build` produces `build/` and the Hostinger CommonJS entry; `npm start` runs `build/server/index.js`. DATABASE_URL selects PostgreSQL (`pg`) or MariaDB (`mysql2`); adapter/migration parity must be preserved. See [Hostinger preparation](../HOSTINGER.md) for persistent gallery/uploads and copy verification.

Authentication uses the local-auth routes, argon2 passwords, server-side sessions, route-level role checks and CSRF protection. Source references: [auth helper](../src/app/api/utils/auth.js), [CSRF helper](../src/app/api/utils/csrf.js), [API registration](../__create/route-builder.ts), [local-auth routes](../src/app/api/local-auth). Archived NextAuth/passwordless-only descriptions are not current instructions. SameSite alone does not replace the implemented CSRF checks.

Provider implementations and runtime configuration are separate. [Telegram](../src/app/api/utils/telegram.js) is a no-op. [Email](../src/app/api/utils/send-email.js) contains a Maton/Gmail implementation that fails when its key is missing; this is not proof of approved or working production delivery. Stripe source exists; it is not permission to activate payments or charge anyone. #119/#120 own external decisions.

## Topology is an unresolved release prerequisite

Historical records describe Traefik on the Ashbi VPS, older Caddy/Coolify paths and a Hostinger rehearsal. This cleanup has not inspected live infrastructure and does not choose or change the serving system. #103 must establish one authoritative topology and reconcile the actual listener, runtime, workflows, persistent storage, backups and rollback before #99 release approval.

Current workflows include automatic Coolify deployment on main pushes, a separate manually dispatched Coolify trigger, a manual preview workflow and main/version-tag image publication. Keep these unchanged in this cleanup. A docs-only main merge can still trigger `deploy.yml`; do not merge the cleanup PR under a no-deployment instruction. Archive tags use `archive/2026-10-21/`, outside the image workflow's `v*` tag trigger.

## Release

#99 owns approval of the final exact SHA, proportionate checks, isolated staging, verified backups, rollback and post-release observation. CI success does not establish a production release. Do not trigger workflows, deploy, change DNS, activate providers or mutate production as part of repository cleanup.

The stale-issue workflow can close inactive work after 37 days and currently exempts only pinned/security/enhancement. Active roadmap and waiting decisions need deliberate tracking; changing that workflow is a separate reviewed maintenance change, not performed here.
