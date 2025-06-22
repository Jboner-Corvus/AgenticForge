#!/bin/bash

# ==============================================================================
# Configuration & Constants
# ==============================================================================
# Service name in docker-compose.yml
APP_SERVICE_NAME="agentic-forge-app"

# Colors for the UI
COLOR_ORANGE='\e[38;5;208m'
COLOR_GREEN='\e[0;32m'
COLOR_RED='\e[0;31m'
COLOR_BLUE='\e[0;34m'
COLOR_YELLOW='\e[1;33m'
COLOR_CYAN='\e[0;36m'
NC='\e[0m' # No Color

# ==============================================================================
# Functions for .env file management and system checks
# ==============================================================================

# Function to check for and create .env file if it doesn't exist
check_and_create_env() {
    if [ ! -f .env ]; then
        echo -e "${COLOR_YELLOW}Le fichier .env n'a pas été trouvé. Création d'un nouveau fichier .env...${NC}"
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
# L'URL de base n'est plus nécessaire pour l'API Google, commentez-la ou supprimez-la.
# LLM_API_BASE_URL=
WEB_PORT=3000
# Utilisez votre clé d'API Google Gemini
LLM_API_KEY="votre clef"

# Spécifiez un modèle Gemini, par exemple "gemini-1.5-pro-latest"
LLM_MODEL_NAME=gemini-2.5-flash
PYTHON_SANDBOX_IMAGE="python:3.11-slim"
BASH_SANDBOX_IMAGE="alpine:latest"
CODE_EXECUTION_TIMEOUT_MS=60000
EOF
        echo -e "${COLOR_GREEN}Le fichier .env a été créé. Veuillez le remplir avec vos informations d'identification.${NC}"
    fi
}

# Function to check Docker permissions and prompt for a fix
check_docker_permissions() {
    # Vérifie si la commande docker existe
    if ! command -v docker &> /dev/null; then
        echo -e "${COLOR_RED}La commande 'docker' est introuvable. Assurez-vous que Docker est installé et dans votre PATH.${NC}"
        exit 1
    fi

    # Vérifie si le groupe 'docker' existe
    if ! getent group docker > /dev/null; then
        echo -e "${COLOR_YELLOW}Le groupe 'docker' n'existe pas. Tentative de création...${NC}"
        sudo groupadd docker
        if [ $? -ne 0 ]; then
            echo -e "${COLOR_RED}Échec de la création du groupe 'docker'. Veuillez le créer manuellement et réessayer.${NC}"
            exit 1
        fi
    fi

    # Vérifie si l'utilisateur est dans le groupe docker
    if ! id -nG "$USER" | grep -qw "docker"; then
        echo -e "${COLOR_RED}ATTENTION : Votre utilisateur '$USER' ne fait pas partie du groupe 'docker'.${NC}"
        echo -e "${COLOR_YELLOW}Cela est nécessaire pour que l'application puisse communiquer avec Docker sans utiliser 'sudo' à chaque fois.${NC}"
        read -p "Voulez-vous que le script tente d'ajouter '$USER' au groupe 'docker' ? (o/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Oo]$ ]]; then
            echo -e "${COLOR_YELLOW}Exécution de 'sudo usermod -aG docker ${USER}'...${NC}"
            echo "Veuillez entrer votre mot de passe si demandé."
            sudo usermod -aG docker "${USER}"
            if [ $? -eq 0 ]; then
                echo -e "${COLOR_GREEN}Utilisateur ajouté au groupe 'docker' avec succès.${NC}"
                echo -e "${COLOR_RED}IMPORTANT : Vous devez vous déconnecter et vous reconnecter complètement pour que ce changement prenne effet.${NC}"
                echo -e "${COLOR_YELLOW}Alternativement, vous pouvez exécuter 'newgrp docker' dans votre terminal pour appliquer les changements à cette session, puis relancer ce script.${NC}"
                read -p "Appuyez sur Entrée pour quitter le script et appliquer les changements."
                exit 0
            else
                echo -e "${COLOR_RED}Échec de l'ajout de l'utilisateur au groupe 'docker'. Veuillez le faire manuellement.${NC}"
                exit 1
            fi
        else
            echo -e "${COLOR_GREEN}Opération annulée. L'application risque de rencontrer des erreurs de permission Docker.${NC}"
            read -p "Appuyez sur Entrée pour continuer malgré tout..."
        fi
    fi
}

# ==============================================================================
# Functions for Menu Actions
# ==============================================================================

# --- Docker & Services ---

start_services() {
    check_and_create_env
    echo -e "${COLOR_YELLOW}Démarrage des services Docker...${NC}"
    docker-compose up --build -d
    echo -e "${COLOR_GREEN}Services démarrés.${NC}"
    read -p "Appuyez sur Entrée pour continuer..."
}

restart_services() {
    echo -e "${COLOR_YELLOW}Redémarrage des services Docker...${NC}"
    docker-compose down
    docker-compose up --build -d
    echo -e "${COLOR_GREEN}Services redémarrés.${NC}"
    read -p "Appuyez sur Entrée pour continuer..."
}

stop_services() {
    echo -e "${COLOR_YELLOW}Arrêt des services Docker...${NC}"
    docker-compose down
    echo -e "${COLOR_GREEN}Services arrêtés.${NC}"
    read -p "Appuyez sur Entrée pour continuer..."
}

show_status() {
    echo -e "${COLOR_CYAN}Statut des conteneurs Docker :${NC}"
    docker-compose ps
    read -p "Appuyez sur Entrée pour continuer..."
}

show_logs() {
    echo -e "${COLOR_CYAN}Affichage des logs (Ctrl+C pour quitter)...${NC}"
    docker-compose logs -f
    read -p "Appuyez sur Entrée pour continuer..."
}

shell_access() {
    echo -e "${COLOR_YELLOW}Ouverture d'un shell dans le conteneur '${APP_SERVICE_NAME}'...${NC}"
    docker-compose exec "${APP_SERVICE_NAME}" /bin/bash
    read -p "Appuyez sur Entrée pour continuer..."
}

rebuild_services() {
    echo -e "${COLOR_YELLOW}Reconstruction des images Docker sans cache...${NC}"
    docker-compose build --no-cache
    echo -e "${COLOR_GREEN}Reconstruction terminée. Pensez à redémarrer les services.${NC}"
    read -p "Appuyez sur Entrée pour continuer..."
}

clean_docker() {
    echo -e "${COLOR_RED}ATTENTION : Cette action va supprimer les conteneurs, les volumes et les réseaux orphelins.${NC}"
    read -p "Êtes-vous sûr de vouloir continuer? (o/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        echo -e "${COLOR_YELLOW}Nettoyage du système Docker...${NC}"
        docker-compose down -v --remove-orphans
        echo -e "${COLOR_GREEN}Nettoyage terminé.${NC}"
    else
        echo -e "${COLOR_GREEN}Opération annulée.${NC}"
    fi
    read -p "Appuyez sur Entrée pour continuer..."
}

# --- Development & Quality ---

lint_code() {
    echo -e "${COLOR_YELLOW}Lancement du linter sur le code source...${NC}"
    docker-compose exec "${APP_SERVICE_NAME}" npm run lint
    read -p "Appuyez sur Entrée pour continuer..."
}

format_code() {
    echo -e "${COLOR_YELLOW}Formatage du code avec Prettier...${NC}"
    docker-compose exec "${APP_SERVICE_NAME}" npm run format
    read -p "Appuyez sur Entrée pour continuer..."
}

clean_dev() {
    echo -e "${COLOR_YELLOW}Nettoyage de l'environnement de développement (node_modules, dist)...${NC}"
    docker-compose exec "${APP_SERVICE_NAME}" sh -c "rm -rf node_modules dist && npm install"
    echo -e "${COLOR_GREEN}Nettoyage et réinstallation des dépendances terminés.${NC}"
    read -p "Appuyez sur Entrée pour continuer..."
}

run_tests() {
    echo -e "${COLOR_YELLOW}Lancement des tests...${NC}"
    # Note: The current package.json has no test script defined.
    docker-compose exec "${APP_SERVICE_NAME}" npm test
    read -p "Appuyez sur Entrée pour continuer..."
}

type_check() {
    echo -e "${COLOR_YELLOW}Vérification des types avec TypeScript...${NC}"
    docker-compose exec "${APP_SERVICE_NAME}" npx tsc --noEmit
    read -p "Appuyez sur Entrée pour continuer..."
}

audit_dependencies() {
    echo -e "${COLOR_YELLOW}Audit des dépendances NPM...${NC}"
    docker-compose exec "${APP_SERVICE_NAME}" npm audit
    read -p "Appuyez sur Entrée pour continuer..."
}

# ==============================================================================
# UI Functions
# ==============================================================================

show_menu() {
    clear
    echo -e "${COLOR_ORANGE}"
    echo '   ╔══════════════════════════════════╗'
    echo '   ║      A G E N T I C  F O R G E    ║'
    echo '   ╠═══════════════════╦══════════════╣'
    echo -e "   ║        ${NC}🐉${COLOR_ORANGE}         ║       ${NC}⚒️${COLOR_ORANGE}      ║"
    echo '   ╚═══════════════════╩══════════════╝'
    echo -e "${NC}"
    echo ""
    echo -e "──────────────────────────────────────────"
    echo ""
    echo -e "  ${COLOR_CYAN}Docker & Services${NC}"
    printf "   1) ${COLOR_GREEN}🟢 Démarrer${NC}         5) ${COLOR_BLUE}📊 Logs${NC}\n"
    printf "   2) ${COLOR_YELLOW}🔄 Redémarrer${NC}       6) ${COLOR_BLUE}🐚 Shell${NC}\n"
    printf "   3) ${COLOR_RED}🔴 Arrêter${NC}           7) ${COLOR_BLUE}🔨 Rebuild${NC}\n"
    printf "   4) ${COLOR_CYAN}⚡ Statut${NC}            8) ${COLOR_RED}🧹 Nettoyer Docker${NC}\n"
    echo ""
    echo -e "  ${COLOR_CYAN}Développement & Qualité${NC}"
    printf "  10) ${COLOR_BLUE}🔍 Lint${NC}             13) ${COLOR_BLUE}🧪 Tests${NC}\n"
    printf "  11) ${COLOR_BLUE}✨ Formater${NC}         14) ${COLOR_BLUE}📘 TypeCheck${NC}\n"
    printf "  12) ${COLOR_RED}🧽 Nettoyer Dev${NC}      15) ${COLOR_BLUE}📋 Audit${NC}\n"
    echo ""
    printf "  16) ${COLOR_RED}🚪 Quitter${NC}\n"
    echo ""
}

# ==============================================================================
# Main Loop
# ==============================================================================

# Vérification unique des permissions Docker au démarrage du script
check_docker_permissions

while true; do
    show_menu
    read -p "Votre choix : " choice

    case $choice in
        1) start_services ;;
        2) restart_services ;;
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
            read -p "Appuyez sur Entrée pour continuer..."
            ;;
    esac
done