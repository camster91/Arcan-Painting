# Hostinger Node.js deployment

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
intended PostgreSQL database. Set `APP_URL` and `PUBLIC_APP_URL` to the canonical
HTTPS origin. Do not copy placeholder credentials from the example.

Check the runtime logs after the build completes, then verify homepage, quote,
contact, sign-in, and `/api/health` on the actual Node app origin. A successful
response from the public domain can come from a different deployment while DNS
points elsewhere. Do not change DNS or domain binding without owner approval.

The existing `npm start` command and Docker/Caddy setup remain unchanged.

## MariaDB migration and persistent gallery

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

### Repeatable copy and verification

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
