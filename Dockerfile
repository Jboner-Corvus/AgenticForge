FROM node:20-alpine
WORKDIR /usr/src/app

# Installer pnpm
RUN npm install -g pnpm

# Copier les fichiers de manifeste pour le cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json tsconfig.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/ui/package.json ./packages/ui/

# Installer les dépendances
RUN pnpm install --prod=false

# Copier le reste du code
COPY . .

# Compiler le projet
RUN pnpm run build

EXPOSE 8080 3000

CMD [ "pnpm", "start" ]