# Dockerfile Final et Optimisé

# --- Phase 1: Builder pour le Backend (Server/Worker) ---
FROM node:20-alpine AS backend_builder
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

# --- Phase 2: Builder pour le Frontend (UI) ---
FROM node:20-alpine AS frontend_builder
WORKDIR /usr/src/app/ui

# Installer pnpm
RUN npm install -g pnpm

# Copier les fichiers de dépendances du frontend et installer TOUTES les dépendances
COPY ui/package.json ui/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copier tout le reste du code source du frontend
COPY ui . .

# Compiler le code TypeScript du frontend en JavaScript
RUN pnpm run build

# --- Phase 3: Production ---
FROM node:20-alpine
WORKDIR /usr/src/app

# Installer pnpm
RUN npm install -g pnpm

# Copier les fichiers de dépendances du backend
COPY package.json pnpm-lock.yaml ./
# Installer UNIQUEMENT les dépendances de production du backend
RUN pnpm install --prod --frozen-lockfile

# Copier le code compilé du backend depuis la phase de build
COPY --from=backend_builder /usr/src/app/dist ./dist

# Copier les fichiers publics nécessaires au webServer (si toujours utilisés par le backend)
COPY --from=backend_builder /usr/src/app/public ./public

# Copier les fichiers compilés du frontend depuis la phase de build
COPY --from=frontend_builder /usr/src/app/ui/dist ./ui-dist

EXPOSE 8080 3000

# La commande par défaut (peut être surchargée par docker-compose)
CMD [ "pnpm", "run", "start" ]