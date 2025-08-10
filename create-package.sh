#!/bin/bash
set -e

# --- Options ---
SKIP_BUILD=false
CLEAN_BUILD=false

# Gestion des arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --clean)
      CLEAN_BUILD=true
      shift
      ;;
    --help|-h)
      echo "📦 Script de création de paquet de déploiement AgenticForge"
      echo ""
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --skip-build    Ignorer le build et utiliser les dist existants"
      echo "  --clean         Nettoyer avant le build (rm -rf dist + node_modules)"
      echo "  --help, -h      Afficher cette aide"
      echo ""
      echo "Par défaut, le script build automatiquement depuis les sources."
      exit 0
      ;;
    *)
      echo "Option inconnue: $1"
      echo "Utilisez --help pour voir les options disponibles"
      exit 1
      ;;
  esac
done

echo "📦 Création du paquet de déploiement pour AgenticForge..."

# --- Configuration ---
VERSION=$(node -p "require('./package.json').version")
PACKAGE_NAME="agentic-forge-v${VERSION}.tar.gz"
STAGING_DIR="gforge-package"

# --- Build ou vérification ---
if [ "$SKIP_BUILD" = true ]; then
    echo "⚠️  Option --skip-build activée, utilisation des builds existants"
    # --- Vérification ---
    if [ ! -d "packages/core/dist" ] || [ ! -d "packages/ui/dist" ]; then
      echo "❌ Erreur : Les dossiers 'dist' sont introuvables."
      echo "Veuillez soit :"
      echo "  1. Lancer le build avec: $0 (sans --skip-build)"
      echo "  2. Ou faire le build manuellement: pnpm build"
      exit 1
    fi
    echo "✅ Builds existants trouvés"
else
    echo "🔍 Vérification de l'environnement de build..."

# Vérification de Node.js et pnpm
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js n'est pas installé. Installation requise pour le build."
    exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
    echo "⚠️  pnpm n'est pas installé. Installation automatique..."
    npm install -g pnpm
fi

    echo "✅ Environment de build vérifié"

    # Nettoyage optionnel avant build
    if [ "$CLEAN_BUILD" = true ]; then
        echo "🧹 Nettoyage complet (--clean activé)..."
        rm -rf packages/*/dist packages/*/node_modules node_modules
        echo "✅ Nettoyage terminé"
    fi

    # Build automatique des packages
    echo "🏗️  Construction des packages depuis les sources..."
    echo "📋 Installation des dépendances..."
    pnpm install

    echo "🔨 Build du package core..."
    pnpm --filter=./packages/core build

    echo "🎨 Build du package ui..."
    pnpm --filter=./packages/ui build

    # Vérification finale que les builds ont réussi
    if [ ! -d "packages/core/dist" ] || [ ! -d "packages/ui/dist" ]; then
      echo "❌ Erreur : Le build a échoué. Les dossiers 'dist' sont introuvables."
      exit 1
    fi

    echo "✅ Build terminé avec succès"
fi

echo "🧹 Nettoyage d'une précédente tentative..."
rm -rf "$STAGING_DIR"
rm -f "$PACKAGE_NAME"

echo "🏗️ Assemblage des fichiers de production dans le dossier '$STAGING_DIR'..."
mkdir -p "$STAGING_DIR/packages/core"
mkdir -p "$STAGING_DIR/packages/ui"

# --- Copie des fichiers ---
# 1. Code compilé
cp -r packages/core/dist "$STAGING_DIR/packages/core/"
cp -r packages/ui/dist "$STAGING_DIR/packages/ui/"

# 2. Dépendances et manifestes
cp package.json pnpm-lock.yaml pnpm-workspace.yaml "$STAGING_DIR/"

# 3. Fichier d'environnement (template)
# On ne copie jamais le .env réel, seulement un modèle
cat > "$STAGING_DIR/.env.template" << EOF
# Fichier d'environnement pour la production
PUBLIC_PORT=8080
WEB_PORT=3002
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=""

# --- Configuration LLM (PRIORITE FAIBLE) ---
# Ces clés sont utilisées UNIQUEMENT si aucune clé n'est ajoutée via l'interface web
# Pour une gestion avancée des clés (rotation, multiple providers), utilisez l'interface
LLM_API_KEY="votre_cle_api_gemini"
LLM_MODEL_NAME=gemini-1.5-flash
LLM_PROVIDER=gemini

# --- Sécurité ---
AUTH_TOKEN="un_token_secret_et_long_genere_pour_la_prod"
NODE_ENV=production
LOG_LEVEL=info
EOF

# 4. Script d'installation automatique
cat > "$STAGING_DIR/install.sh" << 'EOF'
#!/bin/bash
set -e

echo "🚀 Installation d'AgenticForge..."

# Vérification des prérequis
echo "📋 Vérification des prérequis..."
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js 18+ avant de continuer."
    exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
    echo "⚠️  pnpm n'est pas installé. Installation automatique..."
    npm install -g pnpm
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ requis. Version actuelle: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) détecté"
echo "✅ pnpm $(pnpm --version) détecté"

# Configuration de l'environnement
echo "⚙️  Configuration de l'environnement..."
if [ ! -f ".env" ]; then
    cp .env.template .env
    echo "📝 Fichier .env créé depuis le template"
    echo "⚠️  IMPORTANT: Éditez le fichier .env avec vos vraies valeurs avant de démarrer"
else
    echo "ℹ️  Le fichier .env existe déjà"
fi

# Installation des dépendances
echo "📦 Installation des dépendances..."
pnpm install --frozen-lockfile --prod

echo ""
echo "🎉 Installation terminée !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Éditez le fichier .env avec vos vraies valeurs"
echo "2. Assurez-vous que Redis est démarré"
echo "3. Démarrez l'application avec: ./start.sh"
echo ""
EOF

# 5. Script de démarrage
cat > "$STAGING_DIR/start.sh" << 'EOF'
#!/bin/bash
set -e

echo "🚀 Démarrage d'AgenticForge..."

# Vérification du fichier .env
if [ ! -f ".env" ]; then
    echo "❌ Fichier .env manquant. Exécutez d'abord ./install.sh"
    exit 1
fi

# Vérification des variables critiques
source .env
if [ "$LLM_API_KEY" = "votre_cle_api_gemini" ]; then
    echo "❌ Veuillez configurer votre LLM_API_KEY dans le fichier .env"
    exit 1
fi

if [ "$AUTH_TOKEN" = "un_token_secret_et_long_genere_pour_la_prod" ]; then
    echo "❌ Veuillez configurer votre AUTH_TOKEN dans le fichier .env"
    exit 1
fi

# Test de connexion Redis
echo "📡 Test de connexion Redis..."
if ! timeout 5 bash -c "</dev/tcp/${REDIS_HOST:-localhost}/${REDIS_PORT:-6379}" 2>/dev/null; then
    echo "❌ Impossible de se connecter à Redis sur ${REDIS_HOST:-localhost}:${REDIS_PORT:-6379}"
    echo "Assurez-vous que Redis est démarré"
    exit 1
fi

echo "✅ Redis connecté"

# Démarrage des services
echo "🔄 Démarrage des services..."
echo "🌐 Interface Web: http://localhost:${WEB_PORT:-3002}"
echo "🤖 API Worker: http://localhost:${PUBLIC_PORT:-8080}"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter"

# Démarrage en parallèle
pnpm start:worker &
WORKER_PID=$!

pnpm start &
WEB_PID=$!

# Gestionnaire d'arrêt propre
cleanup() {
    echo ""
    echo "🛑 Arrêt des services..."
    kill $WORKER_PID $WEB_PID 2>/dev/null || true
    wait
    echo "✅ Services arrêtés"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Attente
wait
EOF

# 6. README d'installation
cat > "$STAGING_DIR/README-INSTALLATION.md" << 'EOF'
# 🚀 Installation d'AgenticForge

## Prérequis

- **Node.js 18+** : [Télécharger Node.js](https://nodejs.org/)
- **Redis** : [Guide d'installation Redis](https://redis.io/download)
- **Système** : Linux, macOS ou Windows (avec WSL recommandé)

## Installation rapide

### 1. Extraire l'archive
```bash
tar -xzf agentic-forge-v*.tar.gz
cd agentic-forge-v*/
```

### 2. Exécuter l'installation automatique
```bash
chmod +x install.sh
./install.sh
```

### 3. Configurer l'environnement
Éditez le fichier `.env` :
```bash
nano .env
```

**Variables importantes à modifier :**
- `AUTH_TOKEN` : Un token secret long pour sécuriser l'API (OBLIGATOIRE)
- `LLM_API_KEY` : Votre clé API (Gemini, OpenAI, etc.) - OPTIONNEL si vous configurez les clés via l'interface web
- `REDIS_HOST` et `REDIS_PORT` : Configuration Redis si différente

**🔑 Gestion des clés LLM :**
- **Recommandé** : Utilisez l'interface web (Settings → LLM API Keys) pour une gestion avancée
- **Basique** : Configurez `LLM_API_KEY` dans .env pour une utilisation simple

### 4. Démarrer Redis
```bash
# Ubuntu/Debian
sudo systemctl start redis

# macOS avec Homebrew
brew services start redis

# Ou directement
redis-server
```

### 5. Démarrer AgenticForge
```bash
chmod +x start.sh
./start.sh
```

## Accès à l'application

- **Interface Web** : http://localhost:3002
- **API Worker** : http://localhost:8080

## Dépannage

### Node.js manquant
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node

# Windows
# Télécharger depuis https://nodejs.org/
```

### Redis manquant
```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis

# macOS
brew install redis
brew services start redis
```

### Erreur de permissions
```bash
chmod +x install.sh start.sh
```

### Port déjà utilisé
Modifiez `PUBLIC_PORT` et `WEB_PORT` dans le fichier `.env`

## Support

Pour obtenir de l'aide :
1. Vérifiez les logs dans la console
2. Consultez la documentation complète
3. Contactez le support technique
EOF

# Rendre les scripts exécutables
chmod +x "$STAGING_DIR/install.sh" "$STAGING_DIR/start.sh"

echo "✅ Fichiers assemblés."

# --- Création de l'archive ---
echo "🎁 Compression de l'archive '$PACKAGE_NAME'..."
tar -czf "$PACKAGE_NAME" -C "$STAGING_DIR" .

# --- Nettoyage ---
echo "🧹 Nettoyage du dossier d'assemblage..."
rm -rf "$STAGING_DIR"

echo "🎉 Terminé ! Le paquet de déploiement est prêt : ${PACKAGE_NAME}"
echo "Taille du paquet : $(du -h "$PACKAGE_NAME" | cut -f1)"
echo ""
echo "📋 Le paquet contient :"
echo "  - Code compilé (packages/core/dist et packages/ui/dist)"
echo "  - Scripts d'installation automatique (install.sh, start.sh)"
echo "  - Guide d'installation (README-INSTALLATION.md)"
echo "  - Template de configuration (.env.template)"
echo "  - Manifestes des dépendances"
echo ""
echo "🚀 Pour installer sur un serveur :"
echo "  1. Transférez ${PACKAGE_NAME}"
echo "  2. tar -xzf ${PACKAGE_NAME}"
echo "  3. cd vers le dossier extrait"
echo "  4. ./install.sh"
echo "  5. Éditez .env"
echo "  6. ./start.sh"
echo ""
echo "💡 Prochaine fois, vous pouvez utiliser :"
echo "  - $0 --skip-build  (pour éviter le rebuild)"
echo "  - $0 --clean       (pour un build propre)"
echo "  - $0 --help        (pour l'aide complète)"
