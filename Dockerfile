FROM node:20.11.0-alpine AS builder
WORKDIR /usr/src/app
RUN corepack enable
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM node:20.11.0-alpine
WORKDIR /usr/src/app
RUN corepack enable
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /usr/src/app/dist ./dist

# Installer les dépendances système nécessaires
RUN apk add --no-cache \
    udev \
    ttf-freefont \
    chromium \
    curl \
    wget \
    procps \
    netcat-openbsd

# Créer le groupe et l'utilisateur
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Créer le dossier workspace avec les bonnes permissions
RUN mkdir -p /usr/src/app/workspace && \
    chown -R appuser:appgroup /usr/src/app && \
    chmod -R 755 /usr/src/app

# Changer vers l'utilisateur non-root
USER appuser

EXPOSE 8080 3000
CMD ["pnpm", "start"]