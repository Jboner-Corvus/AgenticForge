#!/bin/bash

# ==============================================================================
# Configuration & Constantes
# ==============================================================================
# Obtenir le répertoire où se trouve le script pour rendre les chemins robustes
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)

# Nom du service dans docker-compose.yml pour les commandes spécifiques à Docker
APP_SERVICE_NAME="server"
# Port Redis standardisé pour tout l'environnement
REDIS_PORT_STD=6379

# Couleurs pour l'interface
COLOR_ORANGE='\e[38;5;208m'
COLOR_GREEN='\e[0;32m'
COLOR_RED='\e[0;31m'
COLOR_BLUE='\e[0;34m'
COLOR_YELLOW='\e[1;33m'
COLOR_CYAN='\e[0;36m'
NC='\e[0m' # Pas de couleur

# ==============================================================================
# Fonctions d'aide
# ==============================================================================

usage() {
    echo "Utilisation: $0 [commande]"
    echo ""
    echo "Commandes disponibles:"
    echo "  start             : Démarre tous les services (Docker et worker local)."
    echo "  stop              : Arrête tous les services (Docker et worker local)."
    echo "  restart [worker]  : Redémarre tous les services ou seulement le worker."
    echo "  status            : Affiche le statut des conteneurs Docker."
    echo "  logs [service]    : Affiche les logs. 'service' peut être 'worker' ou 'docker'."
    echo "  rebuild           : Force la reconstruction des images Docker et redémarre."
    echo "  clean-docker      : Nettoie le système Docker (supprime conteneurs, volumes, etc.)."
    echo "  shell             : Ouvre un shell dans le conteneur du serveur."
    echo "  lint              : Lance le linter sur le code."
    echo "  format            : Formate le code."
    echo "  test              : Lance les tests."
    echo "  typecheck         : Vérifie les types TypeScript."
    echo "  menu              : Affiche le menu interactif (défaut)."
    exit 1
}

# ==============================================================================
# Fonctions de vérification du système
# ==============================================================================

# Vérifie et crée un fichier .env par défaut s'il n'existe pas.
check_and_create_env() {
    if [ ! -f .env ]; then
        echo -e "${COLOR_YELLOW}Le fichier .env n'a pas été trouvé. Création d'un nouveau fichier .env...${NC}"
        cat > .env << EOF
# Fichier .env généré automatiquement. Remplissez les valeurs.
# Port exposé par le serveur principal
PUBLIC_PORT=8080
# Port de l'interface web
WEB_PORT=3002

# --- Configuration Redis ---
# Le worker local se connectera à Redis via localhost sur ce port.
# Assurez-vous que ce port correspond à celui exposé dans docker-compose.yml.
REDIS_HOST=localhost
REDIS_PORT=${REDIS_PORT_STD}
REDIS_HOST_PORT=${REDIS_PORT_STD}
REDIS_PASSWORD=""

# --- Configuration du LLM et de l'Authentification ---
LLM_API_KEY="votre_cle_api_gemini"
LLM_MODEL_NAME=gemini-1.5-flash
AUTH_TOKEN="un_token_secret_et_long_de_votre_choix"

# --- Configuration Technique ---
NODE_ENV=development
LOG_LEVEL=info
EOF
        echo -e "${COLOR_GREEN}✓ Le fichier .env a été créé. Veuillez le remplir avec vos informations.${NC}"
    fi
}

# Nouvelle fonction pour vérifier la disponibilité de Redis de manière robuste
check_redis_availability() {
    echo -e "${COLOR_YELLOW}Attente de la disponibilité de Redis sur le port ${REDIS_PORT_STD}...${NC}"

    # Méthode 1: Essayer avec redis-cli si disponible (la plus fiable)
    if command -v redis-cli &> /dev/null; then
        echo "Info: Utilisation de 'redis-cli' pour vérifier la connexion."
        # Boucle avec un timeout pour éviter de rester bloqué indéfiniment
        for i in {1..30}; do
            if redis-cli -p ${REDIS_PORT_STD} ping > /dev/null 2>&1; then
                echo -e "\n${COLOR_GREEN}✓ Redis est opérationnel. Ajout d'une pause de 2s...${NC}"
                sleep 2 # Ajoute une pause de 2 secondes
                return 0
            fi
            printf "."
            sleep 1
        done
        echo -e "\n${COLOR_RED}✗ Timeout: Impossible de pinger Redis après 30 secondes.${NC}"
        echo -e "${COLOR_RED}Cause probable: Problème de réseau Docker. Essayez l'option '8) Nettoyer Docker'.${NC}"
        return 1
    fi

    # Méthode 2: Essayer avec netcat (nc) comme alternative
    if command -v nc &> /dev/null; then
        echo "Info: 'redis-cli' non trouvé. Utilisation de 'netcat' (nc) pour vérifier le port."
        for i in {1..30}; do
            if nc -z localhost ${REDIS_PORT_STD} > /dev/null 2>&1; then
                echo -e "\n${COLOR_GREEN}✓ Le port Redis est ouvert. En supposant que Redis est opérationnel. Ajout d'une pause de 2s...${NC}"
                sleep 2 # Ajoute une pause de 2 secondes
                return 0
            fi
            printf "."
            sleep 1
        done
        echo -e "\n${COLOR_RED}✗ Timeout: Le port Redis n'est pas ouvert après 30 secondes.${NC}"
        return 1
    fi

    # Méthode 3: Avertissement et délai si aucun outil n'est disponible
    echo -e "${COLOR_RED}AVERTISSEMENT: 'redis-cli' et 'nc' ne sont pas installés.${NC}"
    echo "Impossible de vérifier automatiquement si Redis est prêt."
    echo "Suggestion pour Debian/Ubuntu: sudo apt-get update && sudo apt-get install redis-tools"
    echo "Le script va continuer après un délai de sécurité de 15 secondes..."
    sleep 15
    return 0
}


# ==============================================================================
# Fonctions de gestion des services
# ==============================================================================

# Charge les variables du fichier .env pour les rendre disponibles dans ce script.
load_env_vars() {
    if [ -f .env ]; then
        set -a # Exporte automatiquement les variables
        source .env
        set +a # Arrête l'exportation automatique
    else
        echo -e "${COLOR_RED}✗ Le fichier .env est introuvable. Lancement de la création...${NC}"
        check_and_create_env
        set -a
        source .env
        set +a
    fi
}

# Arrête proprement le processus worker local.
stop_worker() {
    echo -e "${COLOR_YELLOW}Arrêt du worker local...${NC}"
    if [ -f "${SCRIPT_DIR}/worker.pid" ]; then
        WORKER_PID=$(cat "${SCRIPT_DIR}/worker.pid")
        if kill $WORKER_PID 2>/dev/null; then
            echo -e "${COLOR_GREEN}✓ Worker (PID ${WORKER_PID}) arrêté.${NC}"
        else
            echo -e "${COLOR_YELLOW}Impossible d'arrêter le worker (PID ${WORKER_PID}). Il n'était peut-être pas en cours d'exécution.${NC}"
        fi
        rm "${SCRIPT_DIR}/worker.pid"
    else
        echo -e "${COLOR_YELLOW}Fichier worker.pid non trouvé. Le worker est déjà arrêté.${NC}"
    fi
}

# Démarre le worker en arrière-plan.
start_worker() {
    echo -e "${COLOR_YELLOW}Démarrage du worker local en arrière-plan...${NC}"
    cd "${SCRIPT_DIR}/packages/core"
    
    # Exécute le worker avec tsx et enregistre la sortie et le PID.
    # L'utilisation de --enable-source-maps est recommandée pour un meilleur débogage.
    NODE_OPTIONS='--enable-source-maps' pnpm exec tsx watch src/worker.ts > "${SCRIPT_DIR}/worker.log" 2>&1 &
    
    WORKER_PID=$!
    echo $WORKER_PID > "${SCRIPT_DIR}/worker.pid"
    echo -e "${COLOR_GREEN}✓ Worker démarré avec le PID ${WORKER_PID}. Logs disponibles dans worker.log.${NC}"
    cd "${SCRIPT_DIR}" # Revenir au répertoire du script
}

# Démarre tous les services dans le bon ordre.
start_services() {
    cd "${SCRIPT_DIR}"
    check_and_create_env
    load_env_vars
    stop_worker # S'assurer que l'ancien worker est bien arrêté.

    # Avertissement sur le réseau Docker existant
    if docker network ls | grep -q "agentic_forge_network"; then
        PROJECT_NAME=$(basename "$PWD" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]*//g')
        if ! docker network inspect agentic_forge_network | grep -q "\"Name\": \"${PROJECT_NAME}_agentic_network\""; then
             echo -e "${COLOR_YELLOW}AVERTISSEMENT: Un réseau 'agentic_forge_network' existe mais semble appartenir à un autre projet.${NC}"
             echo -e "${COLOR_YELLOW}Cela peut causer des problèmes. Il est fortement recommandé d'exécuter l'option '8) Nettoyer Docker'.${NC}"
        fi
    fi

    echo -e "${COLOR_YELLOW}Construction du package 'core' (si nécessaire)...${NC}"
    cd "${SCRIPT_DIR}"
    pnpm --filter @agenticforge/core build

    echo -e "${COLOR_YELLOW}Démarrage des services Docker...${NC}"
    DOCKER_COMPOSE_FILES="${SCRIPT_DIR}/docker-compose.yml"
    docker compose -f $DOCKER_COMPOSE_FILES up -d
    
    # Utilisation de la nouvelle fonction de vérification robuste
    if ! check_redis_availability; then
        echo -e "${COLOR_RED}Le démarrage est interrompu car Redis n'est pas accessible.${NC}"
        return 1
    fi
    
    start_worker
}

# Arrête tous les services.
stop_services() {
    echo -e "${COLOR_YELLOW}Arrêt des services Docker...${NC}"
    docker compose -f "${SCRIPT_DIR}/docker-compose.yml" down
    stop_worker
    echo -e "${COLOR_GREEN}✓ Services arrêtés.${NC}"
}

# Redémarre tous les services.
restart_all_services() {
    echo -e "${COLOR_YELLOW}Redémarrage complet de tous les services...${NC}"
    stop_services
    start_services
}

# Redémarre uniquement le worker.
restart_worker() {
    echo -e "${COLOR_YELLOW}Redémarrage du worker...${NC}"
    stop_worker
    start_worker
}

# Affiche le statut des conteneurs.
show_status() {
    echo -e "${COLOR_CYAN}--- Statut des conteneurs Docker ---${NC}"
    docker compose -f "${SCRIPT_DIR}/docker-compose.yml" ps
}

# Affiche les logs pour un service donné.
show_logs() {
    if [ "$1" == "worker" ]; then
        echo -e "${COLOR_CYAN}--- Logs du Worker (tail -f) ---${NC}"
        if [ -f "${SCRIPT_DIR}/worker.log" ]; then
            tail -f "${SCRIPT_DIR}/worker.log"
        else
            echo -e "${COLOR_RED}✗ Le fichier worker.log n'existe pas.${NC}"
        fi
    else
        echo -e "${COLOR_CYAN}--- Affichage des logs Docker en continu (tail -f) ---${NC}"
        docker compose -f "${SCRIPT_DIR}/docker-compose.yml" logs -f
    fi
}

# Ouvre un shell dans le conteneur du serveur.
shell_access() {
    echo -e "${COLOR_YELLOW}Ouverture d'un shell dans le conteneur '${APP_SERVICE_NAME}'...${NC}"
    docker compose -f "${SCRIPT_DIR}/docker-compose.yml" exec "${APP_SERVICE_NAME}" /bin/bash
}

# Reconstruit les images Docker sans utiliser le cache.
rebuild_services() {
    echo -e "${COLOR_YELLOW}Arrêt des services pour la reconstruction...${NC}"
    stop_services

    echo -e "${COLOR_YELLOW}Reconstruction forcée des images Docker (sans cache)...${NC}"
    docker compose -f "${SCRIPT_DIR}/docker-compose.yml" build --no-cache
    echo -e "${COLOR_GREEN}✓ Reconstruction terminée.${NC}"
    
    echo -e "${COLOR_YELLOW}Redémarrage des services avec les nouvelles images...${NC}"
    start_services
}

# Nettoie l'environnement Docker de manière agressive.
clean_docker() {
    echo -e "${COLOR_RED}ATTENTION : Cette action va supprimer les conteneurs, volumes ET réseaux non utilisés.${NC}"
    
        echo -e "${COLOR_YELLOW}Arrêt et suppression des conteneurs et volumes du projet...${NC}"
        docker compose -f "${SCRIPT_DIR}/docker-compose.yml" down -v --remove-orphans
        echo -e "${COLOR_YELLOW}Suppression des réseaux Docker non utilisés (prune)...${NC}"
        docker network prune -f
        echo -e "${COLOR_GREEN}✓ Nettoyage terminé.${NC}"
}

# ==============================================================================
# Fonctions de développement
# ==============================================================================

run_lint() {
    echo -e "${COLOR_YELLOW}Lancement du linter...${NC}"
    pnpm --recursive run lint
}

run_format() {
    echo -e "${COLOR_YELLOW}Formatage du code...${NC}"
    pnpm --filter=@agenticforge/core format
}

run_tests() {
    echo -e "${COLOR_YELLOW}Lancement des tests...${NC}"
    pnpm --filter=@agenticforge/core test
}

run_typecheck() {
    echo -e "${COLOR_YELLOW}Vérification des types TypeScript pour l'UI...${NC}"
    pnpm --filter=@agenticforge/ui exec tsc -b
    echo -e "${COLOR_YELLOW}Vérification des types TypeScript pour le Core...${NC}"
    pnpm --filter=@agenticforge/core exec tsc --noEmit
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
    printf "   2) ${COLOR_YELLOW}🔄 Redémarrer tout${NC}  6) ${COLOR_BLUE}🐚 Shell (Container)${NC}\n"
    printf "   3) ${COLOR_RED}🔴 Arrêter${NC}          7) ${COLOR_BLUE}🔨 Rebuild (no cache)${NC}\n"
    printf "   4) ${COLOR_CYAN}⚡ Statut${NC}           8) ${COLOR_RED}🧹 Nettoyer Docker${NC}\n"
    printf "   9) ${COLOR_YELLOW}🔄 Redémarrer worker${NC}\n"
    echo ""
    echo -e "  ${COLOR_CYAN}Développement${NC}"
    printf "  10) ${COLOR_BLUE}🔍 Lint${NC}           12) ${COLOR_BLUE}🧪 Tests${NC}\n"
    printf "  11) ${COLOR_BLUE}✨ Format${NC}         13) ${COLOR_BLUE}📘 TypeCheck${NC}\n"
    echo ""
    printf "  16) ${COLOR_RED}🚪 Quitter${NC}\n"
    echo ""
}

# ==============================================================================
# Boucle Principale
# ==============================================================================

# Si une commande est passée en argument, l'exécuter directement.
if [ "$#" -gt 0 ]; then
    case "$1" in
        start) start_services ;;
        stop) stop_services ;;
        restart)
            case "$2" in
                worker) restart_worker ;;
                *) restart_all_services ;;
            esac
            ;;
        status) show_status ;;
        logs) show_logs "$2" ;;
        rebuild) rebuild_services ;;
        clean-docker) clean_docker ;;
        shell) shell_access ;;
        lint) run_lint ;;
        format) run_format ;;
        test) run_tests ;;
        typecheck) run_typecheck ;;
        menu) # Tombe dans la boucle du menu
            ;;
        *)
            echo -e "${COLOR_RED}Commande invalide: $1${NC}"
            usage
            ;;
    esac
    if [ "$1" != "menu" ]; then
        exit 0
    fi
fi

# Boucle du menu interactif.
while true; do
    show_menu
    read -p "Votre choix : " choice

    case $choice in
        1) start_services ;;
        2) restart_all_services ;;
        3) stop_services ;;
        4) show_status ;;
        5) read -p "Quel service? (worker/docker) [docker]: " log_choice; show_logs ${log_choice:-docker} ;;
        6) shell_access ;;
        7) rebuild_services ;;
        8) clean_docker ;;
        9) restart_worker ;;
        10) run_lint ;;
        11) run_format ;;
        12) run_tests ;;
        13) run_typecheck ;;
        16)
            echo -e "${COLOR_GREEN}Au revoir!${NC}"
            exit 0
            ;;
        *)
            echo -e "${COLOR_RED}Choix invalide. Veuillez réessayer.${NC}"
            ;;
    esac
    read -p "Appuyez sur Entrée pour retourner au menu..."
done
