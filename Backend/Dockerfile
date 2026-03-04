# ── Stage 1: Base ──────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app

# Install production dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: Production ────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Copy installed node_modules from base
COPY --from=base /app/node_modules ./node_modules

# Copy application source
COPY src ./src
COPY package.json ./

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000

# Use the production start script (node, not nodemon)
CMD ["node", "src/index.js"]
