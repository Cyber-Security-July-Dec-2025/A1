# Node.js server Dockerfile
FROM node:18-alpine as deps

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install prod dependencies in a clean layer
RUN npm ci --only=production

FROM node:18-alpine as builder
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY . .

# No build step needed for pure Node server, but this stage
# ensures we only copy necessary runtime files in final image

FROM node:18-alpine as runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.js ./
COPY --from=builder /app/. /app/

# Copy source code
COPY . .

# Create storage directory
RUN mkdir -p storage

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application
CMD ["npm", "start"]
