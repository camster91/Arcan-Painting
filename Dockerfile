# syntax=docker/dockerfile:1.7
# Multi-stage build for Arcan Painting.
#
# Stage 1 (build):  full devDeps + run `npm run build` -> build/{client,server}
# Stage 2 (deps):   prodDeps only (so the runtime image has argon2, pg, etc. but no Vite)
# Stage 3 (runtime): node:22.20.0-alpine, non-root, just the bundled build + prodDeps.
#
# Why node:22: the locked server dependency requires Node 22.20 or newer.
# The locked server dependency requires Node 22.20 or newer. Keep build and
# runtime on the same supported LTS line so native dependencies and the server
# execute against the same ABI.

# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:22.20.0-alpine AS build
WORKDIR /app

# argon2 is compiled during `npm ci` when a matching prebuild is unavailable.
# Keep these tools in the build stage only; the runtime image stays minimal.
RUN apk add --no-cache python3 make g++

# Install with devDeps so we have Vite, TypeScript, etc.
# --legacy-peer-deps: react-router-hono-server@2.26.0 peers @types/react@19,
# but the project is locked to React 18. Older versions of the plugin work
# fine with React 18 types — this just suppresses the version-mismatch
# warning that npm 10+ treats as a hard error.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --legacy-peer-deps

# Bring in source + config.
COPY . .

# Run the build. The Vite plugin `reactRouterHonoServer` is what wires the
# custom Hono server entry (__create/index.ts) into the build output.
RUN npm run build

# Prune devDeps from the same node_modules to keep the image small.
RUN npm prune --omit=dev

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:22.20.0-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# OCI labels
LABEL org.opencontainers.image.title="arcan-painting" \
      org.opencontainers.image.description="Arcan Painting marketing site + admin CRM" \
      org.opencontainers.image.source="https://github.com/camster91/Arcan-Painting" \
      org.opencontainers.image.licenses="UNLICENSED"

# wget is built into node:alpine (busybox). No curl / alpine-curl needed.
# Run as non-root for least-privilege.
RUN addgroup -S app 2>/dev/null || true \
 && adduser  -S app -G app 2>/dev/null || true

# Copy prodDeps, the build output, and any runtime-static files (public/).
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/build         ./build
COPY --from=build --chown=app:app /app/public        ./public
COPY --from=build --chown=app:app /app/package.json  ./

USER app
EXPOSE 3000

# Healthcheck hits the API health endpoint (200 = OK). Falls back to root
# only if /api/health is somehow missing.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

# Default entrypoint — the Hono server in build/server/index.js.
# When DATABASE_URL is configured, migrations run during startup before the
# database-backed CRM begins serving requests.
CMD ["node", "./build/server/index.js"]
