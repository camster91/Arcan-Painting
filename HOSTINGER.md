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
