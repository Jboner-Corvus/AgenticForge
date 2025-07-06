#!/bin/bash

# ==============================================================================
# Configuration & Constantes
# ==============================================================================
# Nom du service dans docker-compose.yml pour les commandes spécifiques à Docker
APP_SERVICE_NAME="server"

# Couleurs pour l'interface
COLOR_ORANGE='\e[38;5;208m'
COLOR_GREEN='\e[0;32m'
COLOR_RED='\e[0;31m'
COLOR_BLUE='\e[0;34m'
COLOR_YELLOW='\e[1;33m'
COLOR_CYAN='\e[0;36m'
NC='\e[0m' # Pas de couleur

# ==============================================================================
# Fonctions de vérification du système
# ==============================================================================

check_and_create_env() {
    if [ ! -f .env ]; then
        echo -e "${COLOR_YELLOW}Le fichier .env n'a pas été trouvé. Création d'un nouveau fichier .env...${NC}"
        # (Le code pour créer .env reste le même)
        cat > .env << EOF
# Copiez ce fichier en .env et remplissez les valeurs.
HOST_PORT=8080
PORT=8080
NODE_ENV=development
LOG_LEVEL=info
AUTH_TOKEN="votre clef"
REDIS_HOST=redis
REDIS_PORT=6378
REDIS_HOST_PORT=6378
REDIS_PASSWORD="votre clef"
WEB_PORT=3000
LLM_API_KEY="votre clef"
LLM_MODEL_NAME=gemini-1.5-flash
PYTHON_SANDBOX_IMAGE="python:3.11-slim"
BASH_SANDBOX_IMAGE="alpine:latest"
CODE_EXECUTION_TIMEOUT_MS=60000
EOF
        echo -e "${COLOR_GREEN}Le fichier .env a été créé. Veuillez le remplir avec vos informations d'identification.${NC}"
    fi
}

check_docker_permissions() {
    # (La logique de vérification des permissions Docker reste la même)
    if ! command -v docker &> /dev/null; then
        echo -e "${COLOR_RED}La commande 'docker' est introuvable. Assurez-vous que Docker est installé et dans votre PATH.${NC}"
        exit 1
    fi
    if ! getent group docker > /dev/null; then
        sudo groupadd docker
    fi
    if ! id -nG "$USER" | grep -qw "docker"; then
        echo -e "${COLOR_RED}ATTENTION : Votre utilisateur '$USER' ne fait pas partie du groupe 'docker'.${NC}"
        read -p "Voulez-vous que le script tente d'ajouter '$USER' au groupe 'docker' ? (o/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Oo]$ ]]; then
            sudo usermod -aG docker "${USER}"
            echo -e "${COLOR_GREEN}Utilisateur ajouté au groupe 'docker'. Vous devez vous déconnecter et vous reconnecter pour que cela prenne effet.${NC}"
            exit 0
        fi
    fi
}


# ==============================================================================
# Fonctions pour les Actions du Menu
# ==============================================================================

start_services() {
    check_and_create_env
    echo -e "${COLOR_YELLOW}Démarrage des services Docker...${NC}"
    docker compose up --build -d
    echo -e "${COLOR_GREEN}Services démarrés.${NC}"
}

# --- MODIFICATION DEMANDÉE (Option 2) ---
apply_changes_and_restart() {
    echo -e "${COLOR_YELLOW}Arrêt des services en cours...${NC}"
    docker compose down
    echo -e "${COLOR_YELLOW}Application des changements (reconstruction) et redémarrage...${NC}"
    docker compose up --build -d
    echo -e "${COLOR_GREEN}Services mis à jour et redémarrés.${NC}"
}

stop_services() {
    echo -e "${COLOR_YELLOW}Arrêt des services Docker...${NC}"
    docker compose down
    echo -e "${COLOR_GREEN}Services arrêtés.${NC}"
}

show_status() {
    echo -e "${COLOR_CYAN}Statut des conteneurs Docker :${NC}"
    docker compose ps
}

show_logs() {
    echo -e "${COLOR_CYAN}Affichage des logs (Ctrl+C pour quitter)...${NC}"
    docker compose logs -f
}

shell_access() {
    echo -e "${COLOR_YELLOW}Ouverture d'un shell dans le conteneur '${APP_SERVICE_NAME}'...${NC}"
    docker compose exec "${APP_SERVICE_NAME}" /bin/bash
}

# --- MODIFICATION DEMANDÉE (Option 7) ---
rebuild_services() {
    echo -e "${COLOR_YELLOW}Reconstruction forcée des images Docker (sans cache)...${NC}"
    docker compose build --no-cache
    echo -e "${COLOR_GREEN}Reconstruction terminée.${NC}"
    echo -e "${COLOR_YELLOW}Démarrage automatique des services...${NC}"
    docker compose up -d
    echo -e "${COLOR_GREEN}Services démarrés avec les nouvelles images.${NC}"
}

clean_docker() {
    echo -e "${COLOR_RED}ATTENTION : Cette action va supprimer les conteneurs, les volumes et les réseaux orphelins.${NC}"
    read -p "Êtes-vous sûr de vouloir continuer? (o/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        echo -e "${COLOR_YELLOW}Nettoyage du système Docker...${NC}"
        docker compose down -v --remove-orphans
        echo -e "${COLOR_GREEN}Nettoyage terminé.${NC}"
    fi
}

# --- Développement & Qualité (Local) ---

lint_code() {
    echo -e "${COLOR_YELLOW}Lancement du linter avec correction automatique pour tous les packages...${NC}"
    pnpm --recursive run lint
}

format_code() {
    echo -e "${COLOR_YELLOW}Formatage du code source local avec Prettier pour tous les packages...${NC}"
    pnpm --recursive run format
}

clean_dev() {
    echo -e "${COLOR_RED}Nettoyage de l'environnement de développement local...${NC}"
    echo -e "${COLOR_YELLOW}Votre mot de passe peut être requis pour supprimer les fichiers appartenant à 'root'.${NC}"
    docker compose down # Arrête les conteneurs pour libérer les fichiers
    if sudo rm -rf node_modules dist .pnpm-store pnpm-lock.yaml; then
        echo -e "${COLOR_GREEN}Anciens dossiers supprimés avec succès.${NC}"
    else
        echo -e "${COLOR_RED}Échec de la suppression des dossiers. Veuillez vérifier les permissions.${NC}"
        return
    fi
    echo -e "${COLOR_YELLOW}Réinstallation propre des dépendances...${NC}"
    pnpm install
    echo -e "${COLOR_GREEN}Nettoyage et réinstallation terminés.${NC}"
}

run_tests() {
    echo -e "${COLOR_YELLOW}Lancement des tests en local...${NC}"
    pnpm test
}

type_check() {
    echo -e "${COLOR_YELLOW}Vérification des types avec TypeScript en local...${NC}"
    pnpm exec tsc --noEmit
}

audit_dependencies() {
    echo -e "${COLOR_YELLOW}Audit des dépendances NPM en local...${NC}"
    pnpm audit
}

# ==============================================================================
# UI du Menu
# ==============================================================================
show_menu() {
    clear
    echo -e "${COLOR_ORANGE}"
    echo '   ╔══════════════════════════════════╗'
    echo '   ║      A G E N T I C  F O R G E    ║'
    echo '   ╚══════════════════════════════════╝'
    echo -e "${NC}"
    echo -e "──────────────────────────────────────────"
    echo -e "  ${COLOR_CYAN}Docker & Services${NC}"
    printf "   1) ${COLOR_GREEN}🟢 Démarrer${NC}         5) ${COLOR_BLUE}📊 Logs${NC}\n"
    printf "   2) ${COLOR_YELLOW}🔄 Redémarrer${NC}       6) ${COLOR_BLUE}🐚 Shell (Container)${NC}\n"
    printf "   3) ${COLOR_RED}🔴 Arrêter${NC}          7) ${COLOR_BLUE}🔨 Rebuild (no cache)${NC}\n"
    printf "   4) ${COLOR_CYAN}⚡ Statut${NC}           8) ${COLOR_RED}🧹 Nettoyer Docker${NC}\n"
    echo ""
    echo -e "  ${COLOR_CYAN}Développement & Qualité (Local)${NC}"
    printf "  10) ${COLOR_BLUE}🔍 Lint & Fix${NC}        13) ${COLOR_BLUE}🧪 Tests${NC}\n"
    printf "  11) ${COLOR_BLUE}✨ Formater${NC}          14) ${COLOR_BLUE}📘 TypeCheck${NC}\n"
    printf "  12) ${COLOR_RED}🧽 Nettoyer Dev${NC}      15) ${COLOR_BLUE}📋 Audit${NC}\n"
    echo ""
    printf "  16) ${COLOR_RED}🚪 Quitter${NC}\n"
    echo ""
}

# ==============================================================================
# Boucle Principale
# ==============================================================================
check_docker_permissions

while true; do
    show_menu
    read -p "Votre choix : " choice

    case $choice in
        1) start_services ;;
        2) apply_changes_and_restart ;;
        3) stop_services ;;
        4) show_status ;;
        5) show_logs ;;
        6) shell_access ;;
        7) rebuild_services ;;
        8) clean_docker ;;
        10) lint_code ;;
        11) format_code ;;
        12) clean_dev ;;
        13) run_tests ;;
        14) type_check ;;
        15) audit_dependencies ;;
        16)
            echo -e "${COLOR_GREEN}Au revoir!${NC}"
            exit 0
            ;;
        *)
            echo -e "${COLOR_RED}Choix invalide. Veuillez réessayer.${NC}"
            ;;
    esac
    read -p $'\nAppuyez sur Entrée pour retourner au menu...'
done