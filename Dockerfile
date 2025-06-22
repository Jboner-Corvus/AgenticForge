# Stage 1: Builder
FROM node:24-alpine AS builder
WORKDIR /usr/src/app
RUN corepack enable
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Stage 2: Production
FROM node:24-alpine AS production
WORKDIR /usr/src/app
RUN corepack enable

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN mkdir -p /pnpm

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

COPY --from=builder /usr/src/app/dist ./dist

# Install necessary system dependencies
RUN apk add --no-cache \
    udev \
    ttf-freefont \
    chromium \
    curl \
    wget \
    procps \
    netcat-openbsd \
    docker

# Create workspace directory
RUN mkdir -p /usr/src/app/workspace && \
    chmod -R 755 /usr/src/app

# NOTE: Running as root for Docker access
# In production, use proper Docker socket permissions

EXPOSE 8080 3000

CMD ["pnpm", "start"]