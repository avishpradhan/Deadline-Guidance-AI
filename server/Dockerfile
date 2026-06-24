# Stage 1: Install production dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Copy node_modules and code
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src/ ./src
COPY scripts/ ./scripts

# Expose default port (Cloud Run overrides this with PORT env var)
EXPOSE 5000

# Start server
CMD ["node", "src/index.js"]
