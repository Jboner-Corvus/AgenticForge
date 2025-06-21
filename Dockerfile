# Stage 1: Builder
# This stage installs all dependencies (including dev) and builds the TypeScript code.
FROM node:24-alpine AS builder
WORKDIR /usr/src/app
# Enable pnpm via corepack
RUN corepack enable
# Copy package manifests
COPY package.json pnpm-lock.yaml* ./
# Install all dependencies to build the project
RUN pnpm install --frozen-lockfile
# Copy the rest of the source code
COPY . .
# Run the build script
RUN pnpm run build

# Stage 2: Production
# This stage creates a lean production image with only necessary dependencies and artifacts.
FROM node:24-alpine AS production
WORKDIR /usr/src/app
# Enable pnpm via corepack
RUN corepack enable

# Configure pnpm's home directory
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN mkdir -p /pnpm

# Copy package manifests again for the production install
COPY package.json pnpm-lock.yaml* ./

# --- FIX ---
# Install ONLY production dependencies and IGNORE scripts (like husky's "prepare").
# This prevents the "husky: not found" error during the Docker build.
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copy the built application from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Install necessary system dependencies for runtime (Playwright, Docker)
# Using --no-cache to keep the image size down
RUN apk add --no-cache \
    udev \
    ttf-freefont \
    chromium \
    curl \
    wget \
    procps \
    netcat-openbsd \
    docker

# Create a non-root user and group for better security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create and set permissions for the workspace directory
RUN mkdir -p /usr/src/app/workspace && \
    chown -R appuser:appgroup /usr/src/app && \
    chmod -R 755 /usr/src/app

# Switch to the non-root user
USER appuser

# Expose the ports for the server and web interface
EXPOSE 8080 3000

# Default command to start the main server
CMD ["pnpm", "start"]
