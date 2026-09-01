import { Hono } from 'hono';
import type { Handler } from 'hono/types';
import updatedFetch from '../src/__create/fetch';
import { getCurrentUser } from '../src/app/api/utils/auth.js';
import { hasPermission } from '../src/app/api/utils/permissions.js';
import { requireCsrf, shouldRequireCsrf } from '../src/app/api/utils/csrf.js';
import { requiredApiPermission } from '../src/app/api/utils/api-access-policy.js';

const API_BASENAME = '/api';
const api = new Hono();

// Enforce the double-submit CSRF check once for every unsafe API request made
// with the ambient browser session. Route handlers retain their authorization
// and input-validation responsibilities; this protects existing and future
// authenticated mutation routes from being missed by a route-local check.
api.use('*', async (c, next) => {
  const requiredPermission = requiredApiPermission(c.req.path, c.req.method);
  if (requiredPermission) {
    const user = await getCurrentUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    if (!hasPermission(user, requiredPermission)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
  }
  if (shouldRequireCsrf(c.req.raw)) {
    const csrfError = requireCsrf(c.req.raw);
    if (csrfError) return csrfError;
  }
  return next();
});

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' && globalThis.fetch) {
  globalThis.fetch = updatedFetch;
}

// Transform a file path from `import.meta.glob('../src/app/api/**/route.{...}')`
// into a Hono route path. Examples:
//   '../src/app/api/route.js'                            -> '/'
//   '../src/app/api/users/[id]/route.js'                -> '/users/:id'
//   '../src/app/api/posts/[...slug]/route.js'           -> '/posts/:slug{.+}'
function getHonoPath(routeFile: string): string {
  const relativePath = routeFile.replace(/^.*\/src\/app\/api/, ''); // e.g. '/users/[id]/route.js'
  const parts = relativePath.split('/').filter(Boolean);
  const routeParts = parts.slice(0, -1); // drop the trailing 'route.js' / 'route.ts'
  if (routeParts.length === 0) {
    return '/';
  }
  const transformedParts = routeParts.map((segment) => {
    const match = segment.match(/^(\[(\.{3})?[^\]]+\])$/);
    if (match) {
      const inner = match[1].slice(1, -1); // strip the [ and ]
      const isCatchAll = inner.startsWith('...');
      const param = isCatchAll ? inner.slice(3) : inner;
      return isCatchAll ? `:${param}{.+}` : `:${param}`;
    }
    return segment;
  });
  return '/' + transformedParts.join('/');
}

// Use Vite's import.meta.glob to statically analyze and bundle every route
// file under src/app/api/**. Eager mode means the routes are imported
// up-front, so registerRoutes() can wire them onto the Hono instance
// Use Vite's import.meta.glob to statically analyze and bundle API routes
const apiRouteModules = import.meta.glob(
  '../src/app/api/**/route.{js,ts,jsx,tsx}',
  { eager: true }
);

function registerRoutes() {
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  for (const [routeFile, moduleExport] of Object.entries(apiRouteModules)) {
    const route = moduleExport as any;
    const honoPath = getHonoPath(routeFile);

    for (const method of methods) {
      if (route[method]) {
        const handler: Handler = async (c) => {
          const params = c.req.param();
          return await route[method](c.req.raw, { params });
        };
        const methodLowercase = method.toLowerCase();
        switch (methodLowercase) {
          case 'get':
            api.get(honoPath, handler);
            break;
          case 'post':
            api.post(honoPath, handler);
            break;
          case 'put':
            api.put(honoPath, handler);
            break;
          case 'delete':
            api.delete(honoPath, handler);
            break;
          case 'patch':
            api.patch(honoPath, handler);
            break;
          default:
            console.warn(`Unsupported method: ${method}`);
            break;
        }
      }
    }
  }
}

registerRoutes();

// Soft-404 antipattern fix: when no API route matches the path, return
// 404 JSON instead of falling through to the React Router SSR catch-all
// (which would render the homepage HTML with the homepage's <title> and
// canonical, telling crawlers "this is a duplicate of the homepage").
// Memory: per the 2026-06-14 audit, /api/blog, /api/posts, /api/ads/*
// were the worst offenders. Now: every /api/* miss returns 404 JSON.
api.notFound((c) => {
  return c.json(
    { error: 'Not Found', path: c.req.path, method: c.req.method },
    404,
  );
});

export { api, API_BASENAME };
