# Build stage for frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy package files first
COPY user/package*.json ./
RUN npm ci

# Copy source files (excluding node_modules via .dockerignore)
COPY user/src ./src
COPY user/public ./public
COPY user/index.html ./
COPY user/vite.config.js ./
COPY user/tailwind.config.js ./
COPY user/postcss.config.js ./
COPY user/jsconfig.json ./
COPY user/components.json ./

# Build
RUN npm run build

# Build stage for backend
FROM golang:1.21-alpine AS backend-builder

# Install build dependencies for CGO (SQLite)
RUN apk add --no-cache gcc musl-dev

WORKDIR /app
COPY compute/go.mod compute/go.sum ./
RUN go mod download
COPY compute/ ./
RUN CGO_ENABLED=1 GOOS=linux go build -o hextech-panel .

# Production stage
FROM alpine:3.19
RUN apk add --no-cache ca-certificates sqlite-libs

WORKDIR /app

# Copy built artifacts
COPY --from=backend-builder /app/hextech-panel .
COPY --from=frontend-builder /app/frontend/dist ./frontend

# Create data directories
RUN mkdir -p /data /srv/cdn

# Environment variables with sensible defaults
# All of these can be overridden by the user
ENV PORT=8080
ENV DB_PATH=/data/hextech.db
ENV STATIC_DIR=/app/frontend
ENV CDN_PATH=/srv/cdn
ENV PUBLIC_HOSTNAME=localhost
ENV ALLOWED_ORIGINS=*
ENV MAX_UPLOAD_SIZE=104857600
ENV DEV_MODE=false

# OCI Labels for container registries
LABEL org.opencontainers.image.title="Hextech File Hosting"
LABEL org.opencontainers.image.description="Self-hosted CDN management panel with zero-trust security"
LABEL org.opencontainers.image.vendor="Hextech"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/v1ggs-dev/hextech-file-hosting"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/csrf-token || exit 1

CMD ["./hextech-panel"]
