FROM mcr.microsoft.com/playwright:v1.53.2-jammy

WORKDIR /usr/src/app

# Installer pnpm
RUN npm install -g pnpm

# Copier les fichiers de manifeste et de configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json tsconfig.json ./
COPY packages/ packages/

# Install all dependencies
RUN pnpm install --prod=false

# SUPPRIMEZ la ligne "RUN npx playwright install --with-deps" car la nouvelle image l'inclut déjà

# Copier le reste du code
COPY . .
# Compiler le projet depuis la racine
RUN pnpm --filter @agenticforge/core build

EXPOSE 8080 3000

CMD [ "sh", "-c", "cd packages/core && node dist/server.js" ]