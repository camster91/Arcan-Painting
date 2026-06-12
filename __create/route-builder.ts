import { Hono } from 'hono';
import type { Handler } from 'hono/types';
import { appendFileSync } from 'node:fs';
import updatedFetch from '../src/__create/fetch';

const API_BASENAME = '/api';
const api = new Hono();

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' && globalThis.fetch) {
  globalThis.fetch = updatedFetch;
}

appendFileSync("/tmp/rb-debug.log", `[${new Date().toISOString()}] route-builder.ts loaded\n`);

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
// before createHonoServer() runs.
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
appendFileSync("/tmp/rb-debug.log", `[${new Date().toISOString()}] registerRoutes() returned, api has ${api.routes.length} routes\n`);

export { api, API_BASENAME };
