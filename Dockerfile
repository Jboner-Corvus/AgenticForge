# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Accept build arguments
ARG VITE_AUTH_TOKEN
ENV VITE_AUTH_TOKEN=$VITE_AUTH_TOKEN

# Installer pnpm
RUN npm install -g pnpm

# Copier les fichiers de manifeste et de configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json tsconfig.json ./
COPY scripts/ ./scripts/
COPY packages/core/package.json packages/core/package.json
COPY packages/ui/package.json packages/ui/package.json

# Installer toutes les dépendances du workspace
RUN pnpm install --frozen-lockfile

# Copier le code source
COPY packages/core/ ./packages/core/
COPY packages/ui/ ./packages/ui/

# Nettoyer et construire le core
RUN rm -rf packages/core/dist && cd packages/core && pnpm build

# Construire l'UI si le répertoire dist n'existe pas
RUN if [ ! -d "packages/ui/dist" ]; then \
      echo "Building UI in container..." && \
      cd packages/ui && \
      NODE_ENV=production pnpm run build; \
    else \
      echo "Using pre-built UI from host"; \
    fi

# Stage 2: Production
FROM node:20-alpine

WORKDIR /usr/src/app

# Install minimal packages
RUN apk add --no-cache \
    ca-certificates \
    curl

# Copier les dépendances depuis le builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/packages/core/node_modules ./packages/core/node_modules

# Copier les fichiers compilés
COPY --from=builder /usr/src/app/packages/core/dist ./packages/core/dist
COPY --from=builder /usr/src/app/packages/core/package.json ./packages/core/package.json

# Copier les fichiers UI depuis le builder
COPY --from=builder /usr/src/app/packages/ui/dist ./packages/ui/dist
COPY --from=builder /usr/src/app/packages/ui/package.json ./packages/ui/package.json

# Copier les fichiers racine
COPY package.json ./
COPY .env ./

RUN mkdir -p workspace

# Set default API base URL (can be overridden at runtime)
ENV VITE_API_BASE_URL=/

EXPOSE 8080 3000

CMD [ "node", "packages/core/dist/server-start.js" ]