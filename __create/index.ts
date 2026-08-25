import { AsyncLocalStorage } from 'node:async_hooks';
import nodeConsole from 'node:console';

// ── Sentry — must be the very first import ────────────────────────────────────
import { initSentryServer } from '../src/sentry.server.js';
initSentryServer();
// ─────────────────────────────────────────────────────────────────────────────

import { migratePasswords } from '../src/app/api/utils/migrate-passwords.js';
import { ensureSchema } from '../src/migrations/001-initial-schema.js';
import { Hono } from 'hono';
import { contextStorage } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import { createHonoServer } from 'react-router-hono-server/node';
import { serializeError } from 'serialize-error';
import { getHTMLForErrorPage } from './get-html-for-error-page';
import { API_BASENAME, api } from './route-builder';

const als = new AsyncLocalStorage<{ requestId: string }>();

for (const method of ['log', 'info', 'warn', 'error', 'debug'] as const) {
  const original = nodeConsole[method].bind(console);

  console[method] = (...args: unknown[]) => {
    const requestId = als.getStore()?.requestId;
    if (requestId) {
      original(`[traceId:${requestId}]`, ...args);
    } else {
      original(...args);
    }
  };
}

const app = new Hono();

app.use('*', requestId());

app.use('*', (c, next) => {
  const requestId = c.get('requestId');
  return als.run({ requestId }, () => next());
});

app.use(contextStorage());

app.onError(async (err, c) => {
  // Report to Sentry
  try {
    const { captureServerError } = await import('../src/sentry.server.js');
    captureServerError(err, {
      endpoint: c.req.path,
      method: c.req.method,
      status: 500,
      requestId: c.req.header('x-request-id') ?? c.get('requestId'),
    });
  } catch {
    // Sentry not available — continue
  }

  if (c.req.method !== 'GET') {
    return c.json(
      {
        error: 'An error occurred in your app',
        details: serializeError(err),
      },
      500
    );
  }
  return c.html(getHTMLForErrorPage(err), 200);
});

if (process.env.CORS_ORIGINS) {
  app.use(
    '/*',
    cors({
      origin: process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
    })
  );
}

// Note: the previous @auth/core + @hono/auth-js + @neondatabase/serverless
// stack (public OAuth + Anythings Neon adapter) was removed in 2026-06-12.
// The CRM uses its own local-auth flow at /api/local-auth/* (argon2id + pg),
// which is fully working. This app no longer references the deleted
// __create/adapter.ts, src/auth.js, src/app/account/*, or src/app/api/auth/*.

// Re-mount the /api sub-app. The previous version of this file (before
// the 2026-06-15 sitemap-fix patch) had app.route(API_BASENAME, api) at
// the bottom of the file. The patch's old_string match consumed it as
// a tail of the deleted app.get() blocks, so the line is back here as
// part of the new patch. Without this, /api/* routes (contact, leads,
// auth, etc.) stop matching and the SSR catch-all serves a 200 HTML
// body with status 200 — which is exactly the bug we hit on first
// re-verify after F1.
//
// The /api sub-app MUST be mounted BEFORE the /sitemap.xml and
// /robots.txt inline routes. When a request comes in for /api/*, the
// api sub-app processes it and returns 404 JSON (via api.notFound) if
// the route is unknown. By mounting the api sub-app first, we ensure
// api.notFound fires before the React Router catch-all mounted later
// in createHonoServer can take over. If we mount the api sub-app AFTER
// the top-level routes, the top-level routes win on prefix match, but
// since they don't match /api/* the request falls through to the
// React Router catch-all instead of to the api sub-app — which is
// exactly the bug that surfaced on first re-verify after the F1
// patch landed in the source.
//
// The file-based /sitemap.xml and /robots.txt routes live in
// src/app/sitemap.xml/route.js and src/app/robots.txt/route.js. The
// API glob is rooted at src/app/api/** so the top-level routes never
// get auto-mounted. Mount them here explicitly.
import * as sitemapRoute from '../src/app/sitemap.xml/route.js';
import * as robotsRoute from '../src/app/robots.txt/route.js';
app.route(API_BASENAME, api);
app.get('/sitemap.xml', (c) => sitemapRoute.GET(c.req.raw));
app.get('/robots.txt', (c) => robotsRoute.GET(c.req.raw));

// Soft-404 antipattern — second line of defense. Even though
// api.notFound() in route-builder.ts returns 404 JSON, the api sub-app
// doesn't always catch the request (depends on Hono's middleware
// matching semantics — confirmed by 2026-06-15 local re-verify where
// /api/blog fell through to the React Router catch-all). This direct
// catch-all on the parent app runs BEFORE the api sub-app, so any
// /api/* path that isn't matched returns 404 JSON. The api sub-app's
// own notFound still works for the cases it does match.
app.all('/api/*', (c) => {
  return c.json(
    {
      error: 'Not Found',
      path: c.req.path,
      method: c.req.method,
    },
    404,
  );
});



// Run database migrations before accepting requests when persistence is
// configured. Public pages must remain available without a database (for
// example, in a static smoke-test environment), while database-backed routes
// will still report their own configuration error if called.
//
// Password migration follows a successful schema migration so it cannot run
// against a missing auth_users table.
if (process.env.DATABASE_URL) {
  await ensureSchema()
    .then(() => migratePasswords())
    .catch((err) => {
      console.error('[startup] Database migrations failed:', err?.message || err);
    });
} else {
  console.warn('[startup] DATABASE_URL not set; persistence routes are unavailable');
}

// Override the publicAssets root. The upstream library defaults to
// `${BUILD_DIR}/client` (same as clientAssets) for the public assets
// directory. But our public/ (which holds /gallery/, /favicon.ico, the
// 108MB of webp photos) lives in the source tree, not the build output.
// Without this override, the serveStatic middleware can't find
// /gallery/images/*.webp and falls through to the React Router
// catch-all — which returns 200 with the home page HTML body and
// text/html content-type. This was a regression caught in the
// 2026-06-14 audit (F4 — webp MIME). Fixed by pointing publicAssets
// at ./public in production (matches dev behavior).
const publicAssetsRoot = process.env.NODE_ENV === "production"
  ? "./public"
  : "./public";

// Do not top-level-await this promise. The Hono server imports the React
// Router server build asynchronously; top-level await can deadlock when both
// builds share a chunk in the production bundle.
export default createHonoServer({
  defaultLogger: false,
  configure(server) {
    // Mount our API, XML, and defensive API 404 routes before the React
    // Router catch-all is registered by createHonoServer.
    server.route('/', app);
  },
  serveStaticOptions: {
    publicAssets: { root: publicAssetsRoot },
  },
});
