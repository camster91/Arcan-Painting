# Development helper artifacts

This directory contains source artifacts retained from the original application
scaffold. They are not route modules and must not be imported by public or
admin routes.

`fetch.ts` is the one intentional exception: `__create/route-builder.ts` uses
it to wrap `fetch` only when `NODE_ENV` is not `production`. The production
server starts from `__create/index.ts`, and the production build must remain
free of imports of `HotReload`, `PolymorphicComponent`, `dev-error-overlay`,
`hmr-sandbox-store`, and `useDevServerHeartbeat`.

Before deleting or regenerating this directory, run the production build and
verify the route-builder development behavior. Keep development-only helpers
out of the route tree and production entrypoints.
