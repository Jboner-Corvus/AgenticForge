FROM node:20-alpine
WORKDIR /usr/src/app

# Installer pnpm
RUN npm install -g pnpm && apk add --no-cache curl

# Copier les fichiers de manifeste et de configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json tsconfig.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/ui/package.json ./packages/ui/

# Install all dependencies
RUN pnpm install --prod=false --prod=false

# Copier le reste du code
COPY . .

# Compiler le projet depuis la racine
RUN pnpm --filter @agenticforge/core build

EXPOSE 8080 3000

CMD [ "sh", "-c", "cd packages/core && node dist/server.js" ]