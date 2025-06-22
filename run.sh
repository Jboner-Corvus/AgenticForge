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
# Functions for Menu Actions
# ==============================================================================

# --- Docker & Services ---

start_services() {
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

show_animation() {
    clear
    echo -e "${COLOR_ORANGE}"
    echo '  ╔════ AGENTIC ════╗'
    echo '  ║  ▓▓▓▓▓▓▓▓▓▓▓▓▓  ║'
    echo '  ║ ▓ [FORGE] ▓▓▓▓▓ ║'
    echo '  ║ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ║'
    echo -e "  ║ ▓▓▓▓${COLOR_RED}▒▒${NC}${COLOR_ORANGE}▓▓[⚒]▓ ║"
    echo '  ╚══════════🐉═════╝'
    sleep 0.5
    
    clear
    echo -e "${COLOR_ORANGE}"
    echo '  ╔════ AGENTIC ════╗'
    echo '  ║  ▓▓▓▓▓▓▓▓▓▓▓▓▓  ║'
    echo '  ║ ▓ [FORGE] ▓▓▓▓▓ ║'
    echo '  ║ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ║'
    echo -e "  ║ ▓▓▓${COLOR_RED}▒▒▒${NC}${COLOR_ORANGE}▓[⚒]▓▓ ║"
    echo '  ╚══════════🐉═════╝'
    sleep 0.5
}

show_menu() {
    clear
    echo -e "${COLOR_ORANGE}🔨 Agentic Forge - Console de Gestion${NC}"
    echo -e "────────────────────────────────────────"
    echo ""
    echo -e "  ${COLOR_CYAN}Docker & Services${NC}"
    echo -e "   1) ${COLOR_GREEN}🟢 Démarrer${NC}         5) ${COLOR_BLUE}📊 Logs${NC}"
    echo -e "   2) ${COLOR_YELLOW}🔄 Redémarrer${NC}       6) ${COLOR_BLUE}🐚 Shell${NC}"
    echo -e "   3) ${COLOR_RED}🔴 Arrêter${NC}           7) ${COLOR_BLUE}🔨 Rebuild${NC}"
    echo -e "   4) ${COLOR_CYAN}⚡ Statut${NC}           8) ${COLOR_RED}🧹 Nettoyer Docker${NC}"
    echo ""
    echo -e "  ${COLOR_CYAN}Développement & Qualité${NC}"
    echo -e "  10) ${COLOR_BLUE}🔍 Lint${NC}             13) ${COLOR_BLUE}🧪 Tests${NC}"
    echo -e "  11) ${COLOR_BLUE}✨ Formater${NC}         14) ${COLOR_BLUE}📘 TypeCheck${NC}"
    echo -e "  12) ${COLOR_RED}🧽 Nettoyer Dev${NC}      15) ${COLOR_BLUE}📋 Audit${NC}"
    echo ""
    echo -e "  16) ${COLOR_RED}🚪 Quitter${NC}"
    echo ""
}

# ==============================================================================
# Main Loop
# ==============================================================================

# Initial animation
show_animation

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
