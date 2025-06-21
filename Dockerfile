# ==============================================================================
# Dockerfile pour Agentic Prometheus
# Utilise une construction multi-étapes pour optimiser la taille et la sécurité.
# ==============================================================================

# --- Étape 1: Builder ---
# Cette étape installe toutes les dépendances (dev et prod) et compile le code.
FROM node:24-alpine AS builder

# Définir le répertoire de travail
WORKDIR /usr/src/app

# Copier les fichiers de manifeste de paquets
COPY package.json pnpm-lock.yaml ./

# Installer les dépendances avec pnpm
RUN npm install -g pnpm
# CORRECTION: Ajout de --ignore-scripts pour ne pas exécuter le hook husky
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copier le reste du code source de l'application
COPY . .

# Compiler le code TypeScript en JavaScript
RUN pnpm run build

# --- Étape 2: Production ---
# Cette étape crée l'image finale avec uniquement ce qui est nécessaire pour l'exécution.
FROM node:24-alpine AS production

# Définir le répertoire de travail
WORKDIR /usr/src/app

# Copier les fichiers de manifeste de paquets
COPY package.json pnpm-lock.yaml ./

# Installer UNIQUEMENT les dépendances de production
RUN npm install -g pnpm
# CORRECTION: Ajout de --ignore-scripts pour ne pas exécuter le hook husky
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copier le code compilé depuis l'étape 'builder'
COPY --from=builder /usr/src/app/dist ./dist

# Copier le répertoire public pour l'interface web
COPY --from=builder /usr/src/app/public ./public

# Exposer le port par défaut du serveur principal.
EXPOSE 8080

# La commande par défaut pour démarrer le serveur principal.
CMD ["pnpm", "run", "start"]
