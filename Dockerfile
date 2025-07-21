# Stage 1: Builder
FROM mcr.microsoft.com/playwright:v1.53.2-jammy AS builder

WORKDIR /usr/src/app

# Installer pnpm
RUN npm install -g pnpm

# Copier les fichiers de manifeste et de configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json tsconfig.json ./
COPY packages/core/src packages/core/src/
COPY packages/ui/src packages/ui/src/
COPY packages/core/package.json packages/core/package.json
COPY packages/ui/package.json packages/ui/package.json

# Installer toutes les dépendances
RUN pnpm install --prod=false

# Copier le reste du code
COPY . .

# Construire le projet
RUN pnpm build

# Stage 2: Production
FROM mcr.microsoft.com/playwright:v1.53.2-jammy

WORKDIR /usr/src/app

# Installer pnpm dans l'image finale
RUN npm install -g pnpm

# Copier les dépendances de production depuis le builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/packages ./packages

# Copier les fichiers de package.json pour exécuter les commandes
COPY package.json .
COPY .env .

EXPOSE 8080 3000

# --- COMMANDE CORRIGÉE ---
CMD [ "node", "packages/core/dist/webServer.js" ]