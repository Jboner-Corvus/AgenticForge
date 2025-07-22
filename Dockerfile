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

# Construire le projet
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /usr/src/app

# Copier uniquement les dépendances de production et les fichiers nécessaires
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/packages ./packages
COPY package.json ./
COPY .env ./

# Supprimer pnpm si non nécessaire à l'exécution
# RUN npm uninstall -g pnpm # Uncomment if pnpm is not needed at runtime

EXPOSE 8080 3000

CMD [ "node", "packages/core/dist/webServer.js" ]