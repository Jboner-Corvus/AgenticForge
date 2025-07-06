FROM node:20-alpine
WORKDIR /usr/src/app

# Installer pnpm
RUN npm install -g pnpm

# Copier les fichiers du projet
COPY . .

# Installer les dépendances
RUN pnpm install --prod=false

# Compiler le projet
RUN pnpm run build

EXPOSE 8080 3000

CMD [ "pnpm", "start" ]
