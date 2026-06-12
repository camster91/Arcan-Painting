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

app.get('/robots.txt', (c) => {
  const baseUrl = process.env.APP_URL || 'https://arcanpainting.ca';
  const robotsTxt = `User-agent: *
Allow: /
Allow: /thank-you
Allow: /#services
Allow: /#portfolio
Allow: /#about
Allow: /#contact

# Block admin areas from search engines
Disallow: /admin
Disallow: /admin/*
Disallow: /api/*

# Block specific files
Disallow: *.json$
Disallow: /favicon.ico

# Allow specific crawlers better access
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay for non-major search engines
User-agent: *
Crawl-delay: 1`;

  return c.text(robotsTxt, 200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=86400',
  });
});

app.get('/sitemap.xml', (c) => {
  const baseUrl = process.env.APP_URL || 'https://arcanpainting.ca';
  const currentDate = new Date().toISOString().split('T')[0];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>https://arcanpainting.ca/logo.png</image:loc>
      <image:caption>Arcan and Sons Professional Toronto Painting Services</image:caption>
      <image:title>Professional Painting Services GTA</image:title>
    </image:image>
  </url>

  <!-- Thank you page -->
  <url>
    <loc>${baseUrl}/thank-you</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

  <!-- Services section -->
  <url>
    <loc>${baseUrl}/#services</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Portfolio section -->
  <url>
    <loc>${baseUrl}/#portfolio</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- About section -->
  <url>
    <loc>${baseUrl}/#about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Contact section -->
  <url>
    <loc>${baseUrl}/#contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

</urlset>`;

  return c.text(sitemap, 200, {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=86400',
  });
});

app.route(API_BASENAME, api);

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
