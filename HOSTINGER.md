# Hostinger Node.js deployment

## Production policy — 2026-10-22

Cameron selected **Hostinger shared hosting only**, with manual, reviewed releases.
GitHub Actions deployment and container image publication are disabled on main.
Hostinger Git auto-deployment is off. Keep CI validation enabled; do not dispatch
old Coolify workflows or push a watched production branch as a release shortcut.

Authenticated hPanel inspection identified:

- Website: `arcanpainting.ca`; hosting account `u257752935`.
- Current deployment: `01a0d9c4-0814-7168-9ced-4b09240dd1a3`.
- Current deployed commit: `6429480905bf849787a214064ca6a0758f883495`.
- Stored Git branch: `codex/arcan-mysql-migration`.
- Other framework, Node 24.x, root `./`, `npm run build`, npm,
  output `build`, entry `build/server/hostinger.cjs`, devDependencies included.
- Runtime uses the hosting-local MariaDB connection and an external persistent
  gallery directory. Preserve runtime secrets and persistent data as configured.

PR #173 head `c7829ac254e77fb2bf62278d25e59665fa179699` is 38 commits ahead
of this deployed revision. Deploying that head would include unrelated changes,
including financial code and migrations. For #141, backport the three application
file changes onto the deployed revision and validate that isolated candidate.
Do not deploy main or the full PR branch for this privacy-only release.

### Manual release and rollback gates

1. Record the deployed revision, stored build settings and persistent-data paths.
   Verify current file and **actual runtime database** backups; the first database
   selected in the backup screen may belong to another site on the hosting plan.
   Confirm the persistent gallery/uploads are preserved separately when excluded
   from the website backup. Do not expose credentials in release evidence.
2. Build and review an isolated source candidate; run lint, typecheck, unit,
   browser and disposable-database attribution checks. Prove no migrations,
   finance changes or dependency changes are included relative to production.
3. Preserve an immutable copy of the prior source revision for rollback. A
   historical deployment record alone does not prove its source can be rebuilt;
   redeploy uses the latest head of the selected branch, which may be deleted.
4. In hPanel, Website Dashboard -> Redeploy opens settings; it does not release
   until Save and redeploy is selected. Review the exact candidate source,
   retain existing Node/build/entry/runtime settings, keep auto-deploy off,
   and use only the verified shared-hosting application. Never change DNS.
5. After release, record the new deployment UUID and SHA. Verify /api/health,
   homepage and both contact forms. Use clearly synthetic leads; verify clean
   /thank-you URLs and all seven attribution values in durable notification
   metadata linked to each saved lead. Do not infer storage from a 200 alone.
6. If verification fails, restore the saved prior application source/settings
   through the same verified destination. Preserve database writes and gallery
   data; do not restore a whole database just to roll back these code-only fixes.

Shared-hosting file/database backups were listed for 2026-10-21 09:52 (hPanel
shown time); successful restoration and gallery backup coverage remain untested.
VPS retirement is authorized but **not completed**: Hostinger shows a
`backup_create` action started 2026-10-22 06:41 and disables management controls
while it runs. SSH from the execution environment is unreachable. Identify and
archive only Arcan's exact containers/volumes/configuration before removal;
do not stop or delete the shared VPS or unrelated applications.

This is React Router on Hono, with an ES module server that uses top-level await.
Hostinger's LiteSpeed launcher loads the configured entry with `require()`. Pointing
it at `build/server/index.js` fails with `ERR_REQUIRE_ASYNC_MODULE` even after a
successful build. `npm run build` also generates a small CommonJS entry which
loads that server with dynamic `import()`.

Use these Hostinger build settings:

- Framework: Other
- Node.js: 24
- Root: `./`
- Build command: `npm run build` (API `build_script`: `build`)
- Output: `build`
- Entry: `build/server/hostinger.cjs`
- Package manager: npm; include devDependencies during installation

Set `NPM_CONFIG_INCLUDE=dev` if installing with `NODE_ENV=production`. Use
`.env.example` for runtime variable names. `DATABASE_URL` must reference the
intended database (currently hosting-local MariaDB in production). Set `APP_URL` and `PUBLIC_APP_URL` to the canonical
HTTPS origin. Do not copy placeholder credentials from the example.

Check the runtime logs after the build completes, then verify homepage, quote,
contact, sign-in, and `/api/health` on the actual Node app origin. A successful
response from the public domain can come from a different deployment while DNS
points elsewhere. Do not change DNS or domain binding without owner approval.

The existing `npm start` command and Docker/Caddy setup remain unchanged.

## Historical migration and persistent gallery reference

The MySQL service on this Hostinger plan runs **MariaDB 11.8**. Set `DATABASE_URL`
to a `mysql://` connection to that service; keep the full value in hPanel secrets.
The adapter targets MariaDB (including INSERT/DELETE RETURNING), **not MySQL 8**.
PostgreSQL connections continue using the existing pg adapter for VPS rollback.
Use `sslmode=require` with a trusted certificate for remote database connections;
the hosting-local connection uses loopback. Do not expose the database publicly.

`GALLERY_ROOT` is the absolute path of the persistent **gallery directory**, outside
`public_html` and deployment releases. Its `images` and `thumbnails` subdirectories
remain available at the existing `/gallery/...` URLs. Missing files return 404.
Leave this variable unset to use the repository's existing `public/gallery`.

`UPLOAD_ROOT` is the absolute path of a persistent **uploads directory** (job progress
photos, company logo), also outside `public_html` and deployment releases. Files are
served at `/uploads/...` with random names. Without it, uploads go to `./uploads`
inside the release and are lost on the next deploy.

### Historical migration rehearsal — do not run for ordinary releases

1. Keep the existing VPS serving traffic during preparation. Preserve a custom
   `pg_dump` backup and a gallery archive in a private directory (mode 700/600).
2. Run `scripts/migration/export-postgres.py` on the VPS. It reads `arcan-db` in a
   repeatable-read snapshot and writes JSON to stdout. Redirect it directly to a
   private file; it contains customer data and password hashes.
3. Create a separate empty Hostinger database. Store its mysql2 connection options
   in a private JSON file. Pass that file using `MYSQL_CREDENTIALS`, and the snapshot
   path as the sole argument to `scripts/migration/import-postgres.mjs`. Use
   `MYSQL_TUNNEL_PORT` for an SSH tunnel. The importer refuses nonempty targets.
4. The importer preserves IDs, sequence positions, foreign keys, unique keys,
   check constraints, JSON, booleans, timestamps and numeric values. Nonunique
   partial indexes become full indexes; nullable unique indexes retain equivalent
   uniqueness. Unsupported types or constraints fail rather than being discarded.
   It compares every imported field and reports counts plus a content hash, without
   printing records. Set `VERIFY_ONLY=1` to repeat the comparison without importing.
5. Copy the gallery archive to a new dated persistent directory, extract it, and
   compare SHA-256 manifests for every file before setting `GALLERY_ROOT`.
6. Run `npm run build && npm test`. Against the isolated target only, run
   `MYSQL_INTEGRATION_TEST=1 npm test -- test/mysql-integration.test.js` with its
   `DATABASE_URL` securely injected. These tests create disposable tables/accounts,
   exercise credits and transaction locks, and clean up their own fixtures.
7. Deploy the reviewed branch to the Hostinger origin and verify pages, database
   health, sign-in, protected routes and image content types. Do not enable email,
   scheduled jobs or payment processing on both copies.

The snapshot is a rehearsal, not a synchronized replica. Before a separately
approved cutover, stop source writes briefly, capture a fresh snapshot/gallery
manifest, import into another empty target, verify again, and configure required
runtime integrations. Agree on the final serving system before changing DNS or
binding the domain. Keep the original VPS and backup available for rollback;
reconcile any writes made after a cutover before switching back.
