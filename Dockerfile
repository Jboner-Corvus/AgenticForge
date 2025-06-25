# Dockerfile Final et Optimisé

# --- Phase 1: Builder ---
# On utilise une image Node.js complète pour installer les dépendances et compiler le code.
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# Installer pnpm
RUN npm install -g pnpm

# Copier les fichiers de dépendances et installer TOUTES les dépendances (dev et prod)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copier tout le reste du code source
COPY . .

# Compiler le code TypeScript en JavaScript
RUN pnpm run build

# --- Phase 2: Production ---
# On repart d'une image Node.js propre pour un conteneur léger.
FROM node:20-alpine
WORKDIR /usr/src/app

# Installer pnpm
RUN npm install -g pnpm

# Copier les fichiers de dépendances
COPY package.json pnpm-lock.yaml ./
# Installer UNIQUEMENT les dépendances de production
RUN pnpm install --prod --frozen-lockfile

# Copier le code compilé depuis la phase de build
COPY --from=builder /usr/src/app/dist ./dist

# Copier les fichiers publics nécessaires au webServer
COPY --from=builder /usr/src/app/public ./public

EXPOSE 8080 3000

# La commande par défaut (peut être surchargée par docker-compose)
CMD [ "pnpm", "run", "start" ]