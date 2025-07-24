#!/bin/bash

# ==============================================================================
# Configuration & Constantes
# ==============================================================================
# Obtenir le répertoire où se trouve le script pour rendre les chemins robustes
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

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
    echo "   start          : Démarre tous les services (Docker et worker local)."
    echo "   stop           : Arrête tous les services (Docker et worker local)."
    echo "   restart [worker]: Redémarre tous les services ou seulement le worker."
    echo "   status         : Affiche le statut des conteneurs Docker."
    echo "   logs [docker]  : Affiche les 100 dernières lignes des logs du worker ou des conteneurs Docker."
    echo "   rebuild        : Force la reconstruction des images Docker et redémarre."
    echo "   clean-docker   : Nettoie le système Docker (supprime conteneurs, volumes, etc.)."
    echo "   shell          : Ouvre un shell dans le conteneur du serveur."
    echo "   lint           : Lance le linter sur le code."
    echo "   format         : Formate le code."
    echo "   test           : Lance les tests."
    echo "   typecheck      : Vérifie les types TypeScript."
    echo "   all-checks     : Lance toutes les vérifications (TypeCheck, Lint, Test, Format)."
    echo "   menu           : Affiche le menu interactif (défaut)."
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
LLM_MODEL_NAME=gemini-2.5-flash
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

    # Méthode 3: Utiliser un conteneur Docker temporaire pour pinger Redis
    if command -v docker &> /dev/null; then
        echo "Info: 'redis-cli' et 'nc' non trouvés. Utilisation d'un conteneur Docker temporaire pour pinger Redis."
        # Démarrer un conteneur redis-cli temporaire et le faire pinger le Redis principal
        # Utilise --network host pour que le conteneur puisse accéder à localhost du host
        # Ou, si Docker Compose est utilisé, il faut s'assurer que le conteneur temporaire est sur le même réseau
        # Pour l'instant, on suppose que Redis est accessible via le réseau Docker Compose si démarré par docker-compose.
        # Si Redis est sur localhost du host, --network host est nécessaire.
        # Pour simplifier, on va pinger le service 'redis' du docker-compose network.
        # Si le script est exécuté en dehors de docker-compose, cela peut échouer.
        # Une approche plus robuste serait de pinger 'localhost' si le Redis est local,
        # ou le nom du service 'redis' si on est dans un contexte docker-compose.
        # Pour l'instant, on va pinger le service 'redis' du docker-compose network.
        # Cela suppose que le script est exécuté dans un contexte où le réseau docker-compose est actif.

        # Obtenir le nom du réseau Docker Compose
        DOCKER_COMPOSE_PROJECT_NAME=$(basename "$PWD" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]*//g')
        DOCKER_NETWORK_NAME="${DOCKER_COMPOSE_PROJECT_NAME}_default" # Nom par défaut du réseau

        echo -e "${COLOR_YELLOW}Tentative de ping de Redis via un conteneur Docker temporaire sur le réseau ${DOCKER_NETWORK_NAME}...${NC}"
        for i in {1..30}; do
            # Exécuter un conteneur temporaire sur le même réseau Docker Compose
            if docker run --rm --network ${DOCKER_NETWORK_NAME} redis:alpine redis-cli -h redis -p ${REDIS_PORT_STD} ping > /dev/null 2>&1; then
                echo -e "\n${COLOR_GREEN}✓ Redis est opérationnel via Docker. Ajout d'une pause de 2s...${NC}"
                sleep 2 # Ajoute une pause de 2 secondes
                return 0
            fi
            printf "."
            sleep 1
        done
        echo -e "\n${COLOR_RED}✗ Timeout: Impossible de pinger Redis via Docker après 30 secondes.${NC}"
        return 1
    fi

    # Méthode 4: Avertissement et délai si aucun outil n'est disponible (y compris Docker)
    echo -e "${COLOR_RED}AVERTISSEMENT: 'redis-cli', 'nc' et 'docker' ne sont pas installés.${NC}"
    echo "Impossible de vérifier automatiquement si Redis est prêt."
    echo "Suggestion pour Debian/Ubuntu: sudo apt-get update && sudo apt-get install redis-tools docker.io"
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
        . "${SCRIPT_DIR}/.env" # Use . (dot) for POSIX compliance
        set +a # Arrête l'exportation automatique
    else
        echo -e "${COLOR_RED}✗ Le fichier .env est introuvable. Lancement de la création...${NC}"
        check_and_create_env
        set -a
        . "${SCRIPT_DIR}/.env" # Use . (dot) for POSIX compliance
        set +a
    fi
}

# Arrête proprement le processus worker local.
stop_worker() {
    echo -e "${COLOR_YELLOW}Arrêt du worker local...${NC}"
    pkill -f "tsx watch src/worker.ts" 2>/dev/null
    pkill -f "node --loader ts-node/esm src/worker.ts" 2>/dev/null
    pkill -f "node dist/worker.js" 2>/dev/null

    if [ -f "${SCRIPT_DIR}/worker.pid" ]; then
        WORKER_PID=$(cat "${SCRIPT_DIR}/worker.pid")
        if kill $WORKER_PID 2>/dev/null; then
            echo -e "${COLOR_GREEN}✓ Worker (PID ${WORKER_PID}) arrêté.${NC}"
        else
            echo -e "${COLOR_YELLOW}Impossible d'arrêter le worker (PID ${WORKER_PID}). Il n'était peut-être pas en cours d'exécution ou a déjà été tué.${NC}"
        fi
        rm -f "${SCRIPT_DIR}/worker.pid"
    else
        echo -e "${COLOR_YELLOW}Fichier worker.pid non trouvé. Le worker est déjà arrêté ou a été tué par pkill.${NC}"
    fi
}

# Arrête le collecteur de logs Docker.
stop_docker_log_collector() {
    echo -e "${COLOR_YELLOW}Arrêt du collecteur de logs Docker...${NC}"
    if [ -f "${SCRIPT_DIR}/docker-logs.pid" ]; then
        DOCKER_LOG_PID=$(cat "${SCRIPT_DIR}/docker-logs.pid")
        if kill $DOCKER_LOG_PID 2>/dev/null; then
            echo -e "${COLOR_GREEN}✓ Collecteur de logs Docker (PID ${DOCKER_LOG_PID}) arrêté.${NC}"
        else
            echo -e "${COLOR_YELLOW}Impossible d'arrêter le collecteur de logs (PID ${DOCKER_LOG_PID}). Il n'était peut-être pas en cours d'exécution.${NC}"
        fi
        rm -f "${SCRIPT_DIR}/docker-logs.pid"
    else
        echo -e "${COLOR_YELLOW}Fichier docker-logs.pid non trouvé. Le collecteur est probablement déjà arrêté.${NC}"
    fi
}

# Démarre le worker en arrière-plan.
start_worker() {
    local PID_FILE="${SCRIPT_DIR}/worker.pid"

    if [ -f "$PID_FILE" ]; then
        local PID
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" > /dev/null 2>&1; then
            echo -e "${COLOR_YELLOW}✓ Le worker est déjà en cours d'exécution (PID: ${PID}).${NC}"
            return 0
        else
            echo -e "${COLOR_RED}✗ Fichier PID trouvé (stale), mais le processus n'existe pas. Nettoyage...${NC}"
            rm "$PID_FILE"
        fi
    fi

    echo -e "${COLOR_YELLOW}Démarrage du worker local en arrière-plan...${NC}"
    cd "${SCRIPT_DIR}/packages/core"
    
    if [ "$NODE_ENV" = "production" ]; then
        echo -e "${COLOR_YELLOW}Démarrage du worker en mode production...${NC}"
        NODE_OPTIONS='--enable-source-maps' pnpm exec node dist/worker.js > "${SCRIPT_DIR}/worker.log" 2>&1 &
    else
        echo -e "${COLOR_YELLOW}Démarrage du worker en mode développement...${NC}"
        NODE_OPTIONS='--enable-source-maps' pnpm exec tsx watch src/worker.ts > "${SCRIPT_DIR}/worker.log" 2>&1 &
    fi
    
    local WORKER_PID=$!
    echo $WORKER_PID > "$PID_FILE"
    echo -e "${COLOR_GREEN}✓ Worker démarré avec le PID ${WORKER_PID}. Logs disponibles dans worker.log.${NC}"
    cd "${SCRIPT_DIR}"
}

# Démarre le collecteur de logs Docker en arrière-plan.
start_docker_log_collector() {
    local PID_FILE="${SCRIPT_DIR}/docker-logs.pid"

    if [ -f "$PID_FILE" ]; then
        local PID
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" > /dev/null 2>&1; then
            echo -e "${COLOR_YELLOW}✓ Le collecteur de logs Docker est déjà en cours d'exécution (PID: ${PID}).${NC}"
            return 0
        else
            echo -e "${COLOR_RED}✗ Fichier PID trouvé (stale), mais le processus n'existe pas. Nettoyage...${NC}"
            rm "$PID_FILE"
        fi
    fi

    echo -e "${COLOR_YELLOW}Démarrage du collecteur de logs Docker en arrière-plan...${NC}"
    docker compose -f "${SCRIPT_DIR}/docker-compose.yml" logs --follow > "${SCRIPT_DIR}/docker.log" 2>&1 &
    local DOCKER_LOG_PID=$!
    echo $DOCKER_LOG_PID > "$PID_FILE"
    echo -e "${COLOR_GREEN}✓ Collecteur de logs Docker démarré avec le PID ${DOCKER_LOG_PID}. Logs disponibles dans docker.log.${NC}"
}

# Démarre tous les services dans le bon ordre.
start_services() {
    cd "${SCRIPT_DIR}"
    check_and_create_env
    load_env_vars
    stop_worker # S'assurer que l'ancien worker est bien arrêté.
    stop_docker_log_collector # S'assurer que l'ancien collecteur est bien arrêté.

    # Avertissement sur le réseau Docker existant
    if docker network ls | grep -q "agentic_forge_network"; then
        PROJECT_NAME=$(basename "$PWD" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]*//g')
        EXISTING_NETWORK_PROJECT_LABEL=$(docker network inspect agentic_forge_network --format '{{ index .Labels "com.docker.compose.project" }}' 2>/dev/null)

        # If the network exists and either:
        # 1. It's not managed by docker compose (label is empty)
        # 2. It's managed by a *different* docker compose project
        if [[ -z "$EXISTING_NETWORK_PROJECT_LABEL" || "$EXISTING_NETWORK_PROJECT_LABEL" != "$PROJECT_NAME" ]]; then
             echo -e "${COLOR_YELLOW}AVERTISSEMENT: Un réseau 'agentic_forge_network' existe et semble appartenir à un autre projet ou n'est pas géré par Docker Compose.${NC}"
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
    
    if [ "$DOCKER" != "true" ]; then
        start_worker
    fi
    start_docker_log_collector
}

# Arrête tous les services.
stop_services() {
    echo -e "${COLOR_YELLOW}Arrêt des services Docker...${NC}"
    docker compose -f "${SCRIPT_DIR}/docker-compose.yml" down
    stop_worker
    stop_docker_log_collector
    echo -e "${COLOR_GREEN}✓ Services arrêtés.${NC}"
}

# Redémarre tous les services.
restart_all_services() {
    echo -e "${COLOR_YELLOW}Redémarrage complet de tous les services...${NC}"
    rm -f "${SCRIPT_DIR}/worker.log"
    rm -f "${SCRIPT_DIR}/docker.log"
    stop_services
    start_services
}

# Redémarre uniquement le worker.
restart_worker() {
    echo -e "${COLOR_YELLOW}Redémarrage du worker...${NC}"
    rm -f "${SCRIPT_DIR}/worker.log"
    load_env_vars
    stop_worker
    start_worker
}

# Affiche le statut des conteneurs.
show_status() {
    echo -e "${COLOR_CYAN}--- Statut des conteneurs Docker ---${NC}"
    docker compose -f "${SCRIPT_DIR}/docker-compose.yml" ps
}

# Affiche les 100 dernières lignes des logs du worker.
show_worker_logs() {
    echo -e "${COLOR_CYAN}--- Logs du Worker (100 dernières lignes) ---${NC}"
    if [ -f "${SCRIPT_DIR}/worker.log" ]; then
        tail -100 "${SCRIPT_DIR}/worker.log"
    else
        echo -e "${COLOR_RED}✗ Le fichier worker.log n'existe pas.${NC}"
    fi
}

# Affiche les 100 dernières lignes des logs des conteneurs Docker.
show_docker_logs() {
    echo -e "${COLOR_CYAN}--- Logs des conteneurs Docker (100 dernières lignes) ---${NC}"
    if [ -f "${SCRIPT_DIR}/docker.log" ]; then
        tail -100 "${SCRIPT_DIR}/docker.log"
    else
        echo -e "${COLOR_RED}✗ Le fichier docker.log n'existe pas.${NC}"
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
    rm -f "${SCRIPT_DIR}/worker.log"
    rm -f "${SCRIPT_DIR}/docker.log"
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
    pnpm --filter @agenticforge/ui exec tsc --noEmit -p tsconfig.vitest.json
    echo -e "${COLOR_YELLOW}Vérification des types TypeScript pour le Core...${NC}"
    pnpm --filter=@agenticforge/core exec tsc --noEmit
}

run_all_checks() {
    echo -e "${COLOR_YELLOW}Lancement de toutes les vérifications (TypeCheck, Lint, Test, Format)...${NC}"

    ALL_CHECKS_OUTPUT=""
    FAILED_CHECKS=()
    ERROR_COUNT=0
    local exit_code=0

    # Ajouter l'en-tête au fichier de sortie
    ALL_CHECKS_OUTPUT+="# TODO List: Résoudre les erreurs de vérification\n\n"
    ALL_CHECKS_OUTPUT+="Ce document liste les problèmes identifiés par nos vérifications (TypeCheck, Lint, Test).\n\n"
    ALL_CHECKS_OUTPUT+="La correction de chaque erreur doit se faire **uniquement en modifiant le code source** \n\n"
    ALL_CHECKS_OUTPUT+="Il est interdit d'exécuter des commandes bash..\n" 
    ALL_CHECKS_OUTPUT+="Il est interdit de lancer une vérification.\n\n"
    ALL_CHECKS_OUTPUT+="Une fois la correction effectué, cochez la case \`[x]\`.\n\n"
    ALL_CHECKS_OUTPUT+="---\n\n"
    ALL_CHECKS_OUTPUT+="## Erreurs à corriger\n"

    # --- TypeCheck (UI & Core) ---
    echo -e "${COLOR_YELLOW}Vérification des types TypeScript pour l'UI...${NC}"
    set -o pipefail
    UI_TYPECHECK_OUTPUT=$(pnpm --filter @agenticforge/ui exec tsc --noEmit -p tsconfig.vitest.json 2>&1 | tee /dev/tty)
    exit_code=$?
    set +o pipefail
    if [ $exit_code -ne 0 ]; then
        FAILED_CHECKS+=("TypeCheck UI")
        while read -r line; do
            if [[ -n "$line" && "$line" == *"error TS"* ]]; then
                ERROR_COUNT=$((ERROR_COUNT + 1))
                ALL_CHECKS_OUTPUT+="\n${ERROR_COUNT}. [ ] **TypeCheck (UI):** \`${line}\`\n"
            fi
        done < <(echo "$UI_TYPECHECK_OUTPUT")
    fi

    echo -e "${COLOR_YELLOW}Vérification des types TypeScript pour le Core...${NC}"
    set -o pipefail
    CORE_TYPECHECK_OUTPUT=$(pnpm --filter=@agenticforge/core exec tsc --noEmit 2>&1 | tee /dev/tty)
    exit_code=$?
    set +o pipefail
    if [ $exit_code -ne 0 ]; then
        FAILED_CHECKS+=("TypeCheck Core")
        while read -r line; do
            if [[ -n "$line" && "$line" == *"error TS"* ]]; then
                ERROR_COUNT=$((ERROR_COUNT + 1))
                ALL_CHECKS_OUTPUT+="\n${ERROR_COUNT}. [ ] **TypeCheck (Core):** \`${line}\`\n"
            fi
        done < <(echo "$CORE_TYPECHECK_OUTPUT")
    fi

    # --- Lint ---
    echo -e "${COLOR_YELLOW}Lancement du linter...${NC}"
    set -o pipefail
    LINT_OUTPUT=$(pnpm --recursive run lint 2>&1 | tee /dev/tty)
    exit_code=$?
    set +o pipefail
    if [ $exit_code -ne 0 ]; then
        FAILED_CHECKS+=("Lint")
        while read -r line; do
            if [[ -n "$line" && "$line" == *"error"* ]]; then
                ERROR_COUNT=$((ERROR_COUNT + 1))
                ALL_CHECKS_OUTPUT+="\n${ERROR_COUNT}. [ ] **Lint:** \`${line}\`\n"
            fi
        done < <(echo "$LINT_OUTPUT")
    fi

    # --- Tests (AVEC CAPTURE DE BLOCS DÉTAILLÉS) ---
    echo -e "${COLOR_YELLOW}Lancement des tests...${NC}"
    set -o pipefail
    TEST_OUTPUT=$(pnpm --filter=@agenticforge/core test 2>&1 | tee /dev/tty)
    exit_code=$?
    set +o pipefail
    if [ $exit_code -ne 0 ]; then
        FAILED_CHECKS+=("Tests")
        local capture_mode=0
        local error_block=""

        while IFS= read -r line; do
            if [[ "$line" =~ ^[[:space:]]*FAIL || "$line" =~ ^⎯⎯⎯⎯⎯[[:space:]]*Uncaught[[:space:]]Exception ]]; then
                if [ $capture_mode -eq 1 ] && [ -n "$error_block" ]; then
                    ERROR_COUNT=$((ERROR_COUNT + 1))
                    ALL_CHECKS_OUTPUT+="\n${ERROR_COUNT}. [ ] **Test Failure:**\n\`\`\`text\n${error_block}\n\`\`\`\n"
                fi
                capture_mode=1
                error_block="$line"
            elif [[ "$line" =~ ^⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\[[0-9]+/[0-9]+\] ]]; then
                if [ $capture_mode -eq 1 ]; then
                    ERROR_COUNT=$((ERROR_COUNT + 1))
                    ALL_CHECKS_OUTPUT+="\n${ERROR_COUNT}. [ ] **Test Failure:**\n\`\`\`text\n${error_block}\n\`\`\`\n"
                    capture_mode=0
                    error_block=""
                fi
            elif [ $capture_mode -eq 1 ]; then
                error_block+="\n$line"
            fi
        done < <(echo "$TEST_OUTPUT")

        if [ $capture_mode -eq 1 ] && [ -n "$error_block" ]; then
            error_block_cleaned=$(echo -e "$error_block" | sed '/^ Test Files /,$d')
            ERROR_COUNT=$((ERROR_COUNT + 1))
            ALL_CHECKS_OUTPUT+="\n${ERROR_COUNT}. [ ] **Test Failure:**\n\`\`\`text\n${error_block_cleaned}\n\`\`\`\n"
        fi
    fi

    # --- Format ---
    echo -e "${COLOR_YELLOW}Formatage du code...${NC}"
    pnpm --filter=@agenticforge/core format > /dev/null 2>&1

    # --- Génération du rapport final ---
    if [ ${#FAILED_CHECKS[@]} -eq 0 ]; then
        SUCCESS_MSG="\n---\n\n✓ Toutes les vérifications ont réussi.\n"
        ALL_CHECKS_OUTPUT+="$SUCCESS_MSG"
        echo -e "${COLOR_GREEN}${SUCCESS_MSG}${NC}"
    else
        if [ $ERROR_COUNT -eq 0 ]; then
            ALL_CHECKS_OUTPUT+="\n- [ ] **Erreur Générale:** Une ou plusieurs vérifications ont échoué sans message d'erreur spécifique capturé. Veuillez examiner les logs ci-dessus.\n"
        fi

        FAIL_MSG="\n---\n\n✗ ${#FAILED_CHECKS[@]} type(s) de vérification ont échoué : ${FAILED_CHECKS[*]}."
        FAIL_MSG+="\nVeuillez consulter le fichier all-checks.md pour les ${ERROR_COUNT} erreur(s) détaillée(s).\n"
        ALL_CHECKS_OUTPUT+="$FAIL_MSG"
        echo -e "${COLOR_RED}${FAIL_MSG}${NC}"
    fi

    # Enlever les codes de couleur avant d'écrire dans le fichier
    echo -e "$ALL_CHECKS_OUTPUT" | sed 's/\x1b\[[0-9;]*m//g' > all-checks.md
    echo -e "${COLOR_YELLOW}Les résultats des vérifications ont été enregistrés dans all-checks.md.${NC}"
}

# ==============================================================================
# UI du Menu
# ==============================================================================
snow_menu() {
    clear
    echo -e "${COLOR_ORANGE}"
    echo '   ╔══════════════════════════════════╗'
    echo '   ║       A G E N T I C  F O R G E   ║'
    echo '   ╚══════════════════════════════════╝'
    echo -e "${NC}"
    echo -e "──────────────────────────────────────────"
    echo -e "   ${COLOR_CYAN}Docker & Services${NC}"
    printf "   1) ${COLOR_GREEN}🟢 Démarrer${NC}         5) ${COLOR_BLUE}📊 Logs Worker${NC}\n"
    printf "   2) ${COLOR_YELLOW}🔄 Redémarrer tout${NC}   6) ${COLOR_BLUE}🐚 Shell (Container)${NC}\n"
    printf "   3) ${COLOR_RED}🔴 Arrêter${NC}           7) ${COLOR_BLUE}🔨 Rebuild (no cache)${NC}\n"
    printf "   4) ${COLOR_CYAN}⚡ Statut${NC}            8) ${COLOR_RED}🧹 Nettoyer Docker${NC}\n"
    printf "   9) ${COLOR_YELLOW}🔄 Redémarrer worker${NC}  15) ${COLOR_BLUE}🐳 Logs Docker${NC}\n"
    echo ""
    echo -e "   ${COLOR_CYAN}Développement${NC}"
    printf "  10) ${COLOR_BLUE}🔍 Lint${NC}             12) ${COLOR_BLUE}🧪 Tests${NC}\n"
    printf "  11) ${COLOR_BLUE}✨ Format${NC}           13) ${COLOR_BLUE}📘 TypeCheck${NC}\n"
    printf "  14) ${COLOR_BLUE}✅ Toutes les vérifications${NC}\n"
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
        logs)
            case "$2" in
                docker) show_docker_logs ;;
                *) show_worker_logs ;;
            esac
            ;;
        rebuild) rebuild_services ;;
        clean-docker) clean_docker ;;
        shell) shell_access ;;
        lint) run_lint ;;
        format) run_format ;;
        test) run_tests ;;
        typecheck) run_typecheck ;;
        all-checks) run_all_checks ;;
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
    snow_menu
    read -p "Votre choix : " choice

    case $choice in
        1) start_services ;;
        2) restart_all_services ;;
        3) stop_services ;;
        4) show_status ;;
        5) show_worker_logs ;;
        6) shell_access ;;
        7) rebuild_services ;;
        8) clean_docker ;;
        9) restart_worker ;;
        15) show_docker_logs ;;
        10) run_lint ;;
        11) run_format ;;
        12) run_tests ;;
        13) run_typecheck ;;
        14) run_all_checks ;;
        16)
            echo -e "${COLOR_GREEN}Au revoir!${NC}"
            exit 0
            ;;
        *)
            echo -e "${COLOR_RED}Choix invalide. Veuillez réessayer.${NC}"
            ;;
    esac
    # Ajoute une pause avant de réafficher le menu pour que l'utilisateur puisse voir la sortie
    if [[ "1 2 3 4 5 6 7 8 9 10 11 12 13 14 15" =~ " $choice " ]]; then
        read -n 1 -s -r -p "Appuyez sur une touche pour continuer..."
    fi
done
