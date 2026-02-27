# Use official Bun image
FROM oven/bun:1.2-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
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

# Copy tsconfig so Bun resolves @/ path aliases at runtime
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Copy src/ to /app/src/ and symlink build/server/src -> src
# (route-builder scans build/server/src/app/api at runtime)
COPY --from=builder /app/src ./src
RUN ln -sf /app/src /app/build/server/src

# Install @auth/create shim so routes that import it work correctly
# This replaces the proprietary create.xyz internal package with our local auth shim
COPY --from=builder /app/shims/@auth/create /app/node_modules/@auth/create

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
