# Use official Bun image
FROM oven/bun:1.2-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1.2-alpine AS runner

WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S bun && \
    adduser -u 1001 -S bun -G bun

# Set permissions
RUN chown -R bun:bun /app
USER bun

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Start the application with debugging
CMD sh -c "
echo '=== Arcan Painting Startup Debug ==='
echo 'NODE_ENV: $NODE_ENV'
echo 'DATABASE_URL: $DATABASE_URL'
echo 'SESSION_SECRET: [hidden]'
echo 'NEXTAUTH_URL: $NEXTAUTH_URL'
echo 'Current directory: $(pwd)'
echo 'Contents of current directory:'
ls -la
echo 'Contents of build directory:'
ls -la build/
echo '--- Starting application ---'
bun run start
"