# Use official Bun image
FROM oven/bun:1.2-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies (no --frozen-lockfile since we update deps)
RUN bun install

# Copy ALL source code including configs
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1.2-alpine AS runner

WORKDIR /app

# Copy built application and runtime dependencies from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public

# CRITICAL: Copy src/app/api so __create/route-builder can scan it at runtime
COPY --from=builder /app/src ./src

# Create wrapper to prevent Bun auto-serve double-bind
RUN echo 'import("./build/server/index.js").catch(e => { console.error(e); process.exit(1); });' > /app/start.mjs

# Set permissions for existing bun user (already in base image)
RUN chown -R bun:bun /app
USER bun

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Run via wrapper to avoid Bun auto-serve double-bind issue
CMD ["/usr/local/bin/bun", "run", "/app/start.mjs"]
