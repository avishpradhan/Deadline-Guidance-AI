# Stage 1: Build React static assets
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency configs
COPY package*.json ./
RUN npm ci

# Copy application source
COPY . .

# Receive Vite build argument and export as environment variable
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build client assets
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Copy built files
COPY --from=builder /app/dist ./

# Copy Nginx configuration and entrypoint script
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/entrypoint.sh /entrypoint.sh

# Grant execution permissions to entrypoint script
RUN chmod +x /entrypoint.sh

# Expose default port (dynamic at runtime)
EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
