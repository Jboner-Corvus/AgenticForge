#!/bin/bash

# ==============================================================================
# Configuration & Constantes
# ==============================================================================
SERVER_PID_FILE=".server.pid"
WORKER_PID_FILE=".worker.pid"
# Le PID de Redis n'est plus nécessaire
# REDIS_PID_FILE=".redis.pid" 
SERVER_LOG_FILE="server.log"
WORKER_LOG_FILE="worker.log"
# Le log de Redis n'est plus nécessaire
# REDIS_LOG_FILE="redis.log"

COLOR_ORANGE='\e[38;5;208m'; COLOR_GREEN='\e[0;32m'; COLOR_RED='\e[0;31m';
COLOR_BLUE='\e[0;34m'; COLOR_YELLOW='\e[1;33m'; COLOR_CYAN='\e[0;36m'; NC='\e[0m';

# ==============================================================================
# Fonction d'Aide pour l'Exécution Verbeuse
# ==============================================================================
run_verbose() {
    local description=$1; shift; local command_str="$@"
    echo -en "${COLOR_YELLOW}  -> ${description}... ${NC}"
    output=$(eval "$command_str" 2>&1); local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        echo -e "${COLOR_GREEN}✔ Terminé${NC}"
    else
        echo -e "${COLOR_RED}❌ ÉCHEC (code: $exit_code)${NC}"
        echo -e "\n--- Sortie de la commande ---";
        echo "$output"; echo "---------------------------"
        exit $exit_code
    fi
}

# ==============================================================================
# Fonctions de Vérification
# ==============================================================================
check_dependencies() {
    echo -e "${COLOR_CYAN}--- Vérification des dépendances ---${NC}"
    run_verbose "Vérification de Node.js v20+" "node -v | grep -q 'v2[0-9]'"
    run_verbose "Vérification de pnpm" "command -v pnpm"
    # Le serveur Redis local n'est plus une dépendance
    # run_verbose "Vérification de Redis" "command -v redis-server"
    run_verbose "Vérification de Docker" "command -v docker"
    run_verbose "Vérification de Docker Compose" "docker compose version"
}

# ==============================================================================
# Fonctions de Gestion des Services
# ==============================================================================
start_process() {
    local name=$1; local cmd=$2; local pid_file=$3; local log_file=$4;
    if [ -f "$pid_file" ] && ps -p $(cat "$pid_file") > /dev/null; then
        echo -e "${COLOR_YELLOW}  -> Processus $name déjà démarré.${NC}"; return;
    fi
    echo -e "${COLOR_YELLOW}  -> Démarrage de $name en arrière-plan...${NC}"
    nohup $cmd > "$log_file" 2>&1 &
    echo $! > "$pid_file"; sleep 1
    if ps -p $(cat "$pid_file") > /dev/null; then
        echo -e "${COLOR_GREEN}     ✔ Démarré (PID $(cat "$pid_file")). Logs dans '$log_file'${NC}";
    else
        echo -e "${COLOR_RED}     ❌ Échec du démarrage de $name. Voir '$log_file'.${NC}"; rm -f "$pid_file";
    fi
}

stop_process() {
    local name=$1; local pid_file=$2;
    if [ -f "$pid_file" ]; then
        echo -e "${COLOR_YELLOW}  -> Arrêt du processus $name...${NC}"; kill $(cat "$pid_file") &>/dev/null;
        rm "$pid_file";
        echo -e "${COLOR_GREEN}     ✔ Arrêté.${NC}";
    fi
}

start_all() {
    check_dependencies
    echo -e "\n${COLOR_CYAN}--- Démarrage de l'Environnement Complet ---${NC}"
    run_verbose "Build de l'application Front-end" "pnpm --filter @agenticforge/ui build"
    echo -e "${COLOR_CYAN}--- Démarrage des services via Docker Compose (Nginx, Redis) ---${NC}"
    run_verbose "Démarrage et build des conteneurs" "docker compose up -d --build"
    echo -e "${COLOR_CYAN}--- Lancement des services locaux en arrière-plan ---${NC}"
    # Redis n'est plus démarré localement
    # start_process "Redis" "redis-server" "$REDIS_PID_FILE" "$REDIS_LOG_FILE"
    start_process "Backend API" "pnpm --filter @agenticforge/core start" "$SERVER_PID_FILE" "$SERVER_LOG_FILE"
    start_process "Worker" "pnpm --filter @agenticforge/core start:worker" "$WORKER_PID_FILE" "$WORKER_LOG_FILE"
    echo -e "\n${COLOR_GREEN}🚀 Application démarrée ! Accessible sur http://localhost${NC}"
}

stop_all() {
    echo -e "\n${COLOR_CYAN}--- Arrêt de l'Environnement Complet ---${NC}"
    echo -e "${COLOR_YELLOW}  -> Arrêt des conteneurs Docker (Nginx, Redis)...${NC}"
    docker compose down
    echo -e "${COLOR_GREEN}     ✔ Conteneurs Docker arrêtés.${NC}"
    stop_process "Worker" "$WORKER_PID_FILE"
    stop_process "Backend API" "$SERVER_PID_FILE"
    # Redis n'est plus arrêté localement
    # stop_process "Redis" "$REDIS_PID_FILE"
    echo -e "\n${COLOR_GREEN}Tous les services sont arrêtés.${NC}"
}

restart_all() {
    stop_all;
    echo -e "\n${COLOR_YELLOW}Redémarrage...${NC}";
    start_all;
}

show_status() {
    echo -e "${COLOR_CYAN}--- Statut des Services ---${NC}";
    echo -e "Services Docker:"
    docker compose ps
    echo -e "\nServices Locaux:"
    [[ -f "$SERVER_PID_FILE" && $(ps -p $(cat "$SERVER_PID_FILE") > /dev/null) ]] && echo -e "${COLOR_GREEN}🟢 Backend API (Local)${NC}" || echo -e "${COLOR_RED}🔴 Backend API (Local)${NC}"
    [[ -f "$WORKER_PID_FILE" && $(ps -p $(cat "$WORKER_PID_FILE") > /dev/null) ]] && echo -e "${COLOR_GREEN}🟢 Worker (Local)${NC}" || echo -e "${COLOR_RED}🔴 Worker (Local)${NC}"
}

show_logs() {
    local service=$1
    echo -e "${COLOR_YELLOW}Affichage des logs pour '$service'... (Ctrl+C pour arrêter)${NC}"
    case "$service" in
        backend) tail -f "$SERVER_LOG_FILE" ;;
        worker) tail -f "$WORKER_LOG_FILE" ;;
        # Logs pour les services Docker
        redis) docker compose logs -f redis ;;
        nginx) docker compose logs -f nginx ;;
        *) echo -e "${COLOR_RED}Service inconnu: '$service'. Services valides: backend, worker, redis, nginx${NC}"; exit 1 ;;
    esac
}

# ==============================================================================
# Fonctions de Développement
# ==============================================================================
lint_code() { run_verbose "Analyse et correction du code (Lint)" "pnpm --recursive run lint"; }
format_code() { run_verbose "Formatage du code (Prettier)" "pnpm --recursive run format"; }
run_tests() { run_verbose "Lancement des tests (Vitest)" "pnpm test"; }
type_check() { run_verbose "Vérification des types (TypeScript)" "pnpm exec tsc --noEmit"; }

# ==============================================================================
# Menu et Aide (inchangé)
# ==============================================================================
show_usage() {
    echo -e "${COLOR_CYAN}Usage en ligne de commande : ./run.sh [commande] [argument]${NC}"
    echo ""
    echo -e "${COLOR_YELLOW}Commandes disponibles:${NC}"
    echo "  start, stop, restart, status"
    echo "  lint, format, test, typecheck"
    echo "  logs [backend|worker|redis|nginx]"
    echo ""
    echo "Lancer sans arguments pour le menu interactif."
}

show_interactive_menu() {
    local choice
    while true; do
        clear
        echo -e "${COLOR_ORANGE}";
        echo '   ╔══════════════════════════════════╗'; echo '   ║      A G E N T I C  F O R G E      ║';
        echo '   ╚══════════════════════════════════╝'
        echo -e "       ${COLOR_YELLOW}Mode de Gestion : Mixte (Docker + Local)${NC}";
        echo -e "──────────────────────────────────────────────────"
        echo -e "  ${COLOR_CYAN}⚙️ Gestion de l'Application (Menu Interactif)${NC}"
        printf "   1) ${COLOR_GREEN}Démarrer${NC}   2) ${COLOR_RED}Arrêter${NC}   3) ${COLOR_YELLOW}Redémarrer${NC}   4) ${COLOR_CYAN}Statut${NC}\n"
        echo ""
        echo -e "  ${COLOR_CYAN}🛠️ Développement & Qualité${NC}"
        printf "  10) ${COLOR_BLUE}Lint${NC}   11) ${COLOR_BLUE}Format${NC}   12) ${COLOR_BLUE}Tests${NC}   13) ${COLOR_BLUE}TypeCheck${NC}\n"
        echo ""
        printf "  99) ${COLOR_RED}Quitter${NC}\n\n"
        read -p "Votre choix : " choice
        case $choice in
            1) start_all ;;
            2) stop_all ;;
            3) restart_all ;;
            4) show_status ;;
            10) lint_code ;;
            11) format_code ;;
            12) run_tests ;;
            13) type_check ;;
            99) stop_all; echo -e "${COLOR_GREEN}Au revoir!${NC}"; exit 0 ;;
            *) echo -e "${COLOR_RED}Choix invalide.${NC}" ;;
        esac
        read -p $'\nAppuyez sur Entrée pour continuer...'
    done
}

# ==============================================================================
# Bloc d'Exécution Principal (inchangé)
# ==============================================================================
if [ -z "$1" ]; then
    show_interactive_menu
fi

case "$1" in
    start) start_all ;;
    stop) stop_all ;;
    restart) restart_all ;;
    status) show_status ;;
    lint) lint_code ;;
    format) format_code ;;
    test) run_tests ;;
    typecheck) type_check ;;
    logs)
        if [ -z "$2" ]; then
            echo -e "${COLOR_RED}Erreur: La commande 'logs' nécessite un nom de service.${NC}";
            show_usage; exit 1;
        fi
        show_logs "$2"
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        echo -e "${COLOR_RED}Commande invalide: $1${NC}"; show_usage;
        exit 1
        ;;
esac

exit 0