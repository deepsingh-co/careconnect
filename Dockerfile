# CareConnect - Multi-stage Docker Build
# Build stage for frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Build stage for backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ ./

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy backend
COPY --from=backend-builder --chown=nodejs:nodejs /app/server ./server

# Copy frontend build to be served by backend (or separate nginx)
COPY --from=frontend-builder --chown=nodejs:nodejs /app/client/dist ./client/dist

USER nodejs

EXPOSE 5000

ENV NODE_ENV=production

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/src/app.js"]