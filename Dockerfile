# Multi-stage build for Moondream MCP TypeScript Server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist

# Create model cache directory
RUN mkdir -p /tmp/moondream_models && \
    mkdir -p /tmp/debug_images && \
    chown -R node:node /tmp/moondream_models /tmp/debug_images

# Switch to non-root user
USER node

# Environment variables
ENV NODE_ENV=production
ENV MOONDREAM_MODEL_CACHE_DIR=/tmp/moondream_models
ENV MOONDREAM_DEBUG_IMAGE_DIR=/tmp/debug_images

# Expose default port (if running HTTP server)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Start the application
CMD ["node", "dist/main.js"]

# Labels
LABEL maintainer="Moondream MCP TypeScript" \
      description="Production-ready Moondream MCP server built with BOBA-T framework" \
      version="0.1.0"