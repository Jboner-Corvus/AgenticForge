# Dockerfile Final et Optimisé

# --- Phase 1: Builder pour le Backend (Server/Worker) ---
FROM node:20-alpine AS backend_builder
WORKDIR /usr/src/app

# Installer pnpm
RUN npm install -g pnpm

# Copier les fichiers de dépendances et installer TOUTES les dépendances (dev et prod)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Copier tout le reste du code source
COPY . .

# Compiler le code TypeScript en JavaScript
RUN pnpm run build:no-dts

# --- Phase 2: Builder pour le Frontend (UI) ---
FROM node:20-alpine AS frontend_builder
WORKDIR /usr/src/app/ui

# Installer pnpm
RUN npm install -g pnpm

# Copier les fichiers de dépendances du frontend et installer TOUTES les dépendances
COPY ui/package.json ui/pnpm-lock.yaml ./
RUN pnpm install

# Copier tout le reste du code source du frontend
COPY ui . .

# Compiler le code TypeScript du frontend en JavaScript
RUN pnpm --filter ui run build

# --- Phase 3: Production ---
FROM node:20-alpine
WORKDIR /usr/src/app

# Installer pnpm
RUN npm install -g pnpm

# Copier les fichiers de dépendances du backend
COPY package.json pnpm-lock.yaml ./

# Installer UNIQUEMENT les dépendances de production
RUN pnpm install --prod


# Copier le code compilé du backend depuis la phase de build
COPY --from=backend_builder /usr/src/app/dist ./dist
COPY --from=backend_builder /usr/src/app/dist/tools ./dist/tools

# Copier les fichiers publics nécessaires au webServer (si toujours utilisés par le backend)
COPY --from=backend_builder /usr/src/app/public ./public

# Copier les fichiers compilés du frontend depuis la phase de build
COPY --from=frontend_builder /usr/src/app/ui/ui/dist ./ui-dist

# Copier le code source du frontend pour que pnpm puisse le trouver
COPY ui ./ui

# Copier le code source des outils pour le chargement dynamique
COPY src/tools ./tools





EXPOSE 8080 3000

# La commande par défaut (peut être surchargée par docker-compose)
CMD [ "pnpm", "run", "start" ]
