#!/bin/bash

# ==============================================================================
# Configuration & Constantes
# ==============================================================================
# Fichier pour stocker le Process ID (PID) de l'agent local
AGENT_PID_FILE=".agent.pid"
AGENT_LOG_FILE="agent.log"

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
        # Assurez-vous que REDIS_HOST est bien 'localhost' pour la connexion locale
        cat > .env << EOF
# Configuration pour un environnement HYBRIDE (Agent Local + Services Docker)
HOST_PORT=8080
PORT=4000
API_URL=http://localhost:4000
NODE_ENV=development
LOG_LEVEL=info
AUTH_TOKEN="votre-token-secret"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=""
LLM_API_KEY="votre-cle-gemini"
LLM_MODEL_NAME=gemini-1.5-flash
EOF
        echo -e "${COLOR_GREEN}Le fichier .env a été créé. Veuillez le remplir avec vos informations.${NC}"
        echo -e "${COLOR_YELLOW}IMPORTANT: REDIS_HOST a été défini sur 'localhost' pour cette configuration hybride.${NC}"
    fi
}

check_docker_permissions() {
    if ! command -v docker &> /dev/null; then
        echo -e "${COLOR_RED}La commande 'docker' est introuvable. Assurez-vous que Docker est installé et dans votre PATH.${NC}"
        exit 1
    fi
    if ! docker info > /dev/null 2>&1; then
        echo -e "${COLOR_RED}Impossible de se connecter au démon Docker. Est-ce qu'il est démarré ?${NC}"
        echo -e "${COLOR_YELLOW}Vérifiez également vos permissions (appartenance au groupe 'docker').${NC}"
        exit 1
    fi
}

# ==============================================================================
# Fonctions de gestion des services (HYBRIDE)
# ==============================================================================

start_local_agent() {
    if [ -f "$AGENT_PID_FILE" ]; then
        echo -e "${COLOR_YELLOW}L'agent local semble déjà fonctionner. Pour redémarrer, utilisez l'option 'Redémarrer'.${NC}"
        return
    fi
    echo -e "${COLOR_YELLOW}Démarrage de l'agent en local...${NC}"
    # Lancement en arrière-plan, redirection des logs, et stockage du PID
    nohup pnpm --filter agent-service start > "$AGENT_LOG_FILE" 2>&1 &
    echo $! > "$AGENT_PID_FILE"
    sleep 2 # Laisse un peu de temps au processus pour démarrer
    if ps -p $(cat "$AGENT_PID_FILE") > /dev/null; then
        echo -e "${COLOR_GREEN}Agent local démarré avec le PID $(cat "$AGENT_PID_FILE"). Les logs sont dans '$AGENT_LOG_FILE'.${NC}"
    else
        echo -e "${COLOR_RED}Échec du démarrage de l'agent local. Consultez '$AGENT_LOG_FILE' pour les erreurs.${NC}"
        rm "$AGENT_PID_FILE"
    fi
}

stop_local_agent() {
    if [ -f "$AGENT_PID_FILE" ]; then
        echo -e "${COLOR_YELLOW}Arrêt de l'agent local...${NC}"
        kill $(cat "$AGENT_PID_FILE")
        rm "$AGENT_PID_FILE"
        echo -e "${COLOR_GREEN}Agent local arrêté.${NC}"
    else
        echo -e "${COLOR_CYAN}L'agent local n'était pas en cours d'exécution.${NC}"
    fi
}

start_all_services() {
    check_and_create_env
    check_docker_permissions
    echo -e "${COLOR_YELLOW}Démarrage des services Docker (UI, Redis...)...${NC}"
    docker compose up -d
    start_local_agent
    echo -e "${COLOR_GREEN}Tous les services sont démarrés.${NC}"
}

stop_all_services() {
    echo -e "${COLOR_YELLOW}Arrêt des services Docker...${NC}"
    docker compose down
    stop_local_agent
    echo -e "${COLOR_GREEN}Tous les services sont arrêtés.${NC}"
}

restart_all_services() {
    echo -e "${COLOR_CYAN}Redémarrage de tous les services...${NC}"
    stop_all_services
    echo ""
    start_all_services
}

show_status() {
    echo -e "${COLOR_CYAN}--- Statut des Conteneurs Docker ---${NC}"
    docker compose ps
    echo -e "\n${COLOR_CYAN}--- Statut de l'Agent Local ---${NC}"
    if [ -f "$AGENT_PID_FILE" ] && ps -p $(cat "$AGENT_PID_FILE") > /dev/null; then
        echo -e "${COLOR_GREEN}🟢 Agent local : EN COURS (PID: $(cat "$AGENT_PID_FILE"))${NC}"
    else
        echo -e "${COLOR_RED}🔴 Agent local : ARRÊTÉ${NC}"
        # Nettoyage d'un fichier PID obsolète
        [ -f "$AGENT_PID_FILE" ] && rm "$AGENT_PID_FILE"
    fi
}

show_logs() {
    echo -e "${COLOR_CYAN}Quel journal souhaitez-vous consulter ?${NC}"
    echo " 1) Services Docker (UI, Redis, etc.)"
    echo " 2) Agent local (depuis le fichier '$AGENT_LOG_FILE')"
    read -p "Votre choix [1] : " log_choice
    case "$log_choice" in
        2)
            echo -e "${COLOR_YELLOW}Affichage des logs de l'agent local (Ctrl+C pour quitter)...${NC}"
            tail -f "$AGENT_LOG_FILE"
            ;;
        *)
            echo -e "${COLOR_YELLOW}Affichage des logs Docker (Ctrl+C pour quitter)...${NC}"
            docker compose logs -f
            ;;
    esac
}

rebuild_docker_images() {
    echo -e "${COLOR_YELLOW}Reconstruction forcée des images Docker (sans cache)...${NC}"
    docker compose build --no-cache
    echo -e "${COLOR_GREEN}Reconstruction des images terminée.${NC}"
    echo -e "${COLOR_YELLOW}Il est conseillé de redémarrer les services pour appliquer les changements.${NC}"
}

clean_docker() {
    echo -e "${COLOR_RED}ATTENTION : Ceci arrêtera et supprimera les conteneurs, volumes et réseaux Docker.${NC}"
    read -p "Êtes-vous sûr de vouloir continuer ? (o/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        stop_local_agent # S'assurer que l'agent local est aussi arrêté
        echo -e "${COLOR_YELLOW}Nettoyage du système Docker...${NC}"
        docker compose down -v --remove-orphans
        echo -e "${COLOR_GREEN}Nettoyage Docker terminé.${NC}"
    fi
}

# --- Fonctions de Développement Local (inchangées) ---

lint_code() {
    echo -e "${COLOR_YELLOW}Lancement du linter...${NC}"
    pnpm --recursive run lint
}

format_code() {
    echo -e "${COLOR_YELLOW}Formatage du code...${NC}"
    pnpm --recursive run format
}

run_tests() {
    echo -e "${COLOR_YELLOW}Lancement des tests...${NC}"
    pnpm test
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
    echo -e "         ${COLOR_YELLOW}(Mode Hybride)${NC}"
    echo -e "──────────────────────────────────────────"
    echo -e "  ${COLOR_CYAN}Gestion de l'Application (Hybride)${NC}"
    printf "   1) ${COLOR_GREEN}🟢 Démarrer Tous les Services${NC}\n"
    printf "   2) ${COLOR_YELLOW}🔄 Redémarrer Tous les Services${NC}\n"
    printf "   3) ${COLOR_RED}🔴 Arrêter Tous les Services${NC}\n"
    printf "   4) ${COLOR_CYAN}⚡ Statut (Docker + Local)${NC}\n"
    printf "   5) ${COLOR_BLUE}📊 Consulter les Logs${NC}\n"
    printf "   6) ${COLOR_BLUE}🔨 Reconstruire les Images Docker${NC}\n"
    printf "   7) ${COLOR_RED}🧹 Nettoyer Docker${NC}\n"
    echo ""
    echo -e "  ${COLOR_CYAN}Développement & Qualité (Local)${NC}"
    printf "  10) ${COLOR_BLUE}🔍 Lint & Fix${NC}       12) ${COLOR_BLUE}🧪 Tests${NC}\n"
    printf "  11) ${COLOR_BLUE}✨ Formater${NC}\n"
    echo ""
    printf "  13) ${COLOR_RED}🚪 Quitter${NC}\n"
    echo ""
}

# ==============================================================================
# Boucle Principale
# ==============================================================================
while true;
do
    show_menu
    read -p "Votre choix : " choice

    case $choice in
        1) start_all_services ;;
        2) restart_all_services ;;
        3) stop_all_services ;;
        4) show_status ;;
        5) show_logs ;;
        6) rebuild_docker_images ;;
        7) clean_docker ;;
        10) lint_code ;;
        11) format_code ;;
        12) run_tests ;;
        13)
            stop_all_services # Assure un arrêt propre en quittant
            echo -e "${COLOR_GREEN}Au revoir!${NC}"
            exit 0
            ;;
        *)
            echo -e "${COLOR_RED}Choix invalide. Veuillez réessayer.${NC}"
            ;;
    esac
    read -p $'\nAppuyez sur Entrée pour retourner au menu...'
done