# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Installer pnpm
RUN npm install -g pnpm

# Copier les fichiers de manifeste et de configuration pour optimiser le cache Docker
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json tsconfig.json ./
COPY packages/core/package.json packages/core/package.json
COPY packages/ui/package.json packages/ui/package.json

# Installer toutes les dépendances
RUN pnpm install --prod=false

# Copier le reste du code
COPY . .

# Nettoyer et construire le projet
RUN rm -rf packages/core/dist && pnpm build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /usr/src/app

# Install Chromium for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Copier uniquement les dépendances de production et les fichiers nécessaires
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/packages/core/dist ./packages/core/dist
COPY --from=builder /usr/src/app/packages/ui/dist ./packages/ui/dist
COPY --from=builder /usr/src/app/packages/core/node_modules ./packages/core/node_modules
COPY package.json ./
COPY .env ./

# Install curl for healthcheck
RUN apk add --no-cache curl bash

# Explicitly link /bin/sh to /bin/bash
RUN ln -sf /bin/bash /bin/sh

# Supprimer pnpm si non nécessaire à l'exécution
# RUN npm uninstall -g pnpm # Uncomment if pnpm is not needed at runtime

RUN mkdir -p workspace

# Set environment variables for Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

EXPOSE 8080 3000

CMD [ "node", "packages/core/dist/server-start.js" ]