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

// The /sitemap.xml and /robots.txt routes live in src/app/sitemap.xml/route.js
// and src/app/robots.txt/route.js. They're file-based GET handlers that get
// auto-mounted by the same import.meta.glob that handles /api/* routes, but
// the API glob is rooted at src/app/api/** so the top-level routes never
// get auto-mounted. Mount them here explicitly so the file-based versions
// win over the hardcoded fallbacks below. The file-based versions are
// always fresher and reflect the live route table.
import * as sitemapRoute from '../src/app/sitemap.xml/route.js';
import * as robotsRoute from '../src/app/robots.txt/route.js';
app.get('/sitemap.xml', (c) => sitemapRoute.GET(c.req.raw));
app.get('/robots.txt', (c) => robotsRoute.GET(c.req.raw));



// Run password migration on startup (hash any remaining plain-text passwords).
// IMPORTANT: ensureSchema() must run first so the `auth_users` table exists;
// otherwise the migration tries to ALTER a non-existent table and the boot
// log gets an ugly "relation does not exist" error. Schema is idempotent
// (CREATE TABLE IF NOT EXISTS) so calling it on every boot is safe.
await ensureSchema().catch((err) => {
  console.error('[startup] ensureSchema failed:', err?.message || err);
});
migratePasswords().catch((err) =>
  console.error('[startup] Password migration failed:', err)
);

export default await createHonoServer({
  app,
  defaultLogger: false,
});
