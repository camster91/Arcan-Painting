import { Hono } from 'hono';
import type { Handler } from 'hono/types';
import updatedFetch from '../src/__create/fetch';

const API_BASENAME = '/api';
const api = new Hono();

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' && globalThis.fetch) {
  globalThis.fetch = updatedFetch;
}

// Helper function to transform file path to Hono route path
function getHonoPath(routeFile: string): string {
  // routeFile looks like '../src/app/api/route.js' or '../src/app/api/users/[id]/route.js'
  const relativePath = routeFile.replace(/^.*\/src\/app\/api/, ''); // e.g. '/users/[id]/route.js'
  const parts = relativePath.split('/').filter(Boolean);
  const routeParts = parts.slice(0, -1); // Remove 'route.js' or 'route.ts'
  if (routeParts.length === 0) {
    return '/';
  }
  const transformedParts = routeParts.map((segment) => {
    const match = segment.match(/^\[(\.{3})?([^\]]+)\]$/);
    if (match) {
      const [_, dots, param] = match;
      return dots === '...'
        ? `:${param}{.+}`
        : `:${param}`;
    }
    return segment;
  });
  return '/' + transformedParts.join('/');
}

// Use Vite's import.meta.glob to statically analyze and bundle API routes
const apiRouteModules = import.meta.glob('../src/app/api/**/route.{js,ts,jsx,tsx}', { eager: true });

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

export { api, API_BASENAME };

