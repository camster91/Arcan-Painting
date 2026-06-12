FROM node:22-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
# Create structure for Hono
RUN mkdir -p /app/build/server/src/app && \
    cp -r /app/src/app/api /app/build/server/src/app/api && \
    mkdir -p /app/build/server/migrations && \
    cp /app/src/migrations/*.js /app/build/server/migrations/
# Transform imports
RUN node fix-imports.js
EXPOSE 3000
ENV NODE_ENV=production
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -sf http://localhost:3000/ || exit 1
CMD ["node", "build/server/index.js"]
