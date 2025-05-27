# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Import reflect-metadata at the start
RUN echo "import 'reflect-metadata';" > temp.ts && cat src/main.ts >> temp.ts && mv temp.ts src/main.ts

# Set environment for build
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=true

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

# Install dependencies required for production
RUN apk add --no-cache tini

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --legacy-peer-deps && \
    npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy necessary files
COPY --from=builder /app/nest-cli.json ./
COPY --from=builder /app/tsconfig.json ./

# Create logs directory with correct permissions
RUN mkdir -p logs && chown -R nestjs:nodejs logs

# Set environment variables
ENV NODE_ENV=production
ENV TZ=UTC

# Switch to non-root user
USER nestjs

# Use tini as entrypoint
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "dist/main"]

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD wget -q --spider http://localhost:3000/health || exit 1 