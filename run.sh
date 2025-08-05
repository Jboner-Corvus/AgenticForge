#!/usr/bin/env bash

# ==============================================================================
# Configuration & Constantes
# ==============================================================================
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
APP_SERVICE_NAME="server"
REDIS_PORT_STD=6379

COLOR_ORANGE='\e[38;5;208m'
COLOR_GREEN='\e[0;32m'
COLOR_RED='\e[0;31m'
COLOR_BLUE='\e[0;34m'
COLOR_YELLOW='\e[1;33m'
COLOR_CYAN='\e[0;36m'
NC='\e[0m'

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
    echo "   rebuild-docker : Force la reconstruction des images Docker et redémarre."
    echo "   rebuild-worker : Reconstruit et redémarre le worker local."
    echo "   rebuild-all    : Reconstruit l'intégralité du projet (Docker et worker local)."
    echo "   clean-docker   : Nettoie le système Docker (supprime conteneurs, volumes, etc.)."
    echo "   shell          : Ouvre un shell dans le conteneur du serveur."
    echo "   lint           : Lance le linter sur le code."
    echo "   format         : Formate le code."
    echo "   test           : Lance tous les tests (unitaires et intégration)."
    echo "   test:unit      : Lance uniquement les tests unitaires (rapide)."
    echo "   test:integration: Lance uniquement les tests d'intégration (nécessite Docker)."
    echo "   typecheck      : Vérifie les types TypeScript."
    echo "   small-checks   : Lance les vérifications rapides (Lint, TypeCheck)."
    echo "   all-checks     : Lance toutes les vérifications (Lint, TypeCheck, Tests Unitaires)."
    echo "   menu           : Affiche le menu interactif (défaut)."
    exit 1
}

# ==============================================================================
# Fonctions de vérification du système
# ==============================================================================

check_and_create_env() {
    if [ ! -f .env ]; then
        echo -e "${COLOR_YELLOW}Le fichier .env n'a pas été trouvé. Création d'un nouveau fichier .env...${NC}"
        cat > .env << EOF
# Fichier .env généré automatiquement. Remplissez les valeurs.
PUBLIC_PORT=8080
WEB_PORT=3002
REDIS_HOST=localhost
REDIS_PORT=${REDIS_PORT_STD}
REDIS_HOST_PORT=${REDIS_PORT_STD}
REDIS_PASSWORD=""
LLM_API_KEY="votre_cle_api_gemini"
LLM_MODEL_NAME=gemini-2.5-flash
AUTH_TOKEN="un_token_secret_et_long_de_votre_choix"
NODE_ENV=development
LOG_LEVEL=info
EOF
        echo -e "${COLOR_GREEN}✓ Le fichier .env a été créé. Veuillez le remplir avec vos informations.${NC}"
    fi
}

check_redis_availability() {
    echo -e "${COLOR_YELLOW}Attente de la disponibilité de Redis sur le port ${REDIS_PORT_STD}...${NC}"
    if command -v redis-cli &> /dev/null; then
        for i in {1..30}; do
            if redis-cli -p ${REDIS_PORT_STD} ping > /dev/null 2>&1; then
                echo -e "\n${COLOR_GREEN}✓ Redis est opérationnel. Ajout d'une pause de 2s...${NC}"
                sleep 2
                return 0
            fi
            printf "."
            sleep 1
        done
        echo -e "\n${COLOR_RED}✗ Timeout: Impossible de pinger Redis après 30 secondes.${NC}"
        return 1
    fi
    echo -e "${COLOR_RED}AVERTISSEMENT: 'redis-cli' non trouvé. Impossible de vérifier la disponibilité de Redis.${NC}"
    sleep 15
    return 0
}

# ==============================================================================
# Fonctions de gestion des services
# ==============================================================================

load_env_vars() {
    if [ -f .env ]; then
        set -a
        . "${SCRIPT_DIR}/.env"
        set +a
    else
        check_and_create_env
        set -a
        . "${SCRIPT_DIR}/.env"
        set +a
    fi
}

stop_process_by_pid_file() {
    local pid_file=$1
    local process_name=$2
    if [ -f "$pid_file" ]; then
        local pid
        pid=$(cat "$pid_file")
        if kill -0 "$pid" > /dev/null 2>&1; then
            echo -e "${COLOR_YELLOW}Arrêt de ${process_name} (PID ${pid})...${NC}"
            kill "$pid"
            rm -f "$pid_file"
            echo -e "${COLOR_GREEN}✓ ${process_name} arrêté.${NC}"
        else
            rm -f "$pid_file"
        fi
    fi
}

stop_worker() {
    stop_process_by_pid_file "${SCRIPT_DIR}/worker.pid" "Worker"
}

stop_docker_log_collector() {
    stop_process_by_pid_file "${SCRIPT_DIR}/docker-logs.pid" "Collecteur de logs Docker"
}

start_worker() {
    local PID_FILE="${SCRIPT_DIR}/worker.pid"
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" > /dev/null 2>&1; then
        echo -e "${COLOR_YELLOW}✓ Le worker est déjà en cours d'exécution (PID: $(cat "$PID_FILE")).${NC}"
        return 0
    fi
    echo -e "${COLOR_YELLOW}Démarrage du worker local en arrière-plan...${NC}"
    cd "${SCRIPT_DIR}/packages/core"
    load_env_vars
    pnpm exec node dist/worker.js >> "${SCRIPT_DIR}/worker.log" 2>&1 &
    local WORKER_PID=$!
    echo $WORKER_PID > "$PID_FILE"
    echo -e "${COLOR_GREEN}✓ Worker démarré avec le PID ${WORKER_PID}. Logs dans worker.log.${NC}"
    cd "${SCRIPT_DIR}"
}

start_docker_log_collector() {
    local PID_FILE="${SCRIPT_DIR}/docker-logs.pid"
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" > /dev/null 2>&1; then
        echo -e "${COLOR_YELLOW}✓ Le collecteur de logs Docker est déjà en cours d'exécution (PID: $(cat "$PID_FILE")).${NC}"
        return 0
    fi
    echo -e "${COLOR_YELLOW}Démarrage du collecteur de logs Docker...${NC}"
    docker compose -f "${SCRIPT_DIR}/docker-compose.yml" logs --follow > "${SCRIPT_DIR}/docker.log" 2>&1 &
    local DOCKER_LOG_PID=$!
    echo $DOCKER_LOG_PID > "$PID_FILE"
    echo -e "${COLOR_GREEN}✓ Collecteur de logs démarré avec le PID ${DOCKER_LOG_PID}. Logs dans docker.log.${NC}"
}

start_services() {
    cd "${SCRIPT_DIR}"
    check_and_create_env
    load_env_vars
    stop_worker
    stop_docker_log_collector
    echo -e "${COLOR_YELLOW}Construction du package 'core'...${NC}"
    pnpm --filter @agenticforge/core build
    echo -e "${COLOR_YELLOW}Démarrage des services Docker...${NC}"
    docker compose -f "${SCRIPT_DIR}/docker-compose.yml" up -d
    if ! check_redis_availability; then
        echo -e "${COLOR_RED}Démarrage interrompu car Redis n'est pas accessible.${NC}"
        return 1
    fi
    start_worker
    start_docker_log_collector
}

stop_services() {
    cd "${SCRIPT_DIR}"
    echo -e "${COLOR_YELLOW}Arrêt des services Docker...${NC}"
    docker compose -f "${SCRIPT_DIR}/docker-compose.yml" down
    stop_worker
    stop_docker_log_collector
    echo -e "${COLOR_GREEN}✓ Services arrêtés.${NC}"
}

restart_all_services() {
    echo -e "${COLOR_YELLOW}Redémarrage complet...${NC}"
    rm -f "${SCRIPT_DIR}/worker.log" "${SCRIPT_DIR}/docker.log"
    stop_services
    start_services
}

restart_worker() {
    echo -e "${COLOR_YELLOW}Redémarrage du worker...${NC}"
    rm -f "${SCRIPT_DIR}/worker.log"
    load_env_vars
    stop_worker
    start_worker
}

show_status() {
    cd "${SCRIPT_DIR}"
    echo -e "${COLOR_CYAN}--- Statut des conteneurs Docker ---${NC}"
    docker compose -f "${SCRIPT_DIR}/docker-compose.yml" ps
}

show_logs() {
    local log_file=$1
    local log_name=$2
    echo -e "${COLOR_CYAN}--- Logs de ${log_name} (100 dernières lignes) ---${NC}"
    if [ -f "$log_file" ]; then
        tail -100 "$log_file"
    else
        echo -e "${COLOR_RED}✗ Le fichier ${log_file} n'existe pas.${NC}"
    fi
}

shell_access() {
    cd "${SCRIPT_DIR}"
    echo -e "${COLOR_YELLOW}Ouverture d'un shell dans le conteneur '${APP_SERVICE_NAME}'...${NC}"
    docker compose -f "${SCRIPT_DIR}/docker-compose.yml" exec "${APP_SERVICE_NAME}" /bin/bash
}

rebuild_docker() {
    cd "${SCRIPT_DIR}"
    echo -e "${COLOR_YELLOW}Reconstruction forcée des images Docker...${NC}"
    rm -f "${SCRIPT_DIR}/worker.log" "${SCRIPT_DIR}/docker.log"
    stop_services
    docker compose -f "${SCRIPT_DIR}/docker-compose.yml" build --no-cache
    start_services
}

clean_docker() {
    cd "${SCRIPT_DIR}"
    echo -e "${COLOR_RED}ATTENTION : Suppression des conteneurs, volumes ET réseaux non utilisés.${NC}"
    docker compose -f "${SCRIPT_DIR}/docker-compose.yml" down -v --remove-orphans
    docker network prune -f
    echo -e "${COLOR_GREEN}✓ Nettoyage terminé.${NC}"
}

rebuild_worker() {
    echo -e "${COLOR_YELLOW}Reconstruction du worker local...${NC}"
    rm -f "${SCRIPT_DIR}/worker.log"
    stop_worker
    cd "${SCRIPT_DIR}"
    pnpm --filter @agenticforge/core install
    pnpm --filter @agenticforge/core build
    start_worker
    echo -e "${COLOR_GREEN}✓ Worker local reconstruit et redémarré.${NC}"
}

rebuild_all() {
    rebuild_docker
    rebuild_worker
}

# ==============================================================================
# Fonctions de développement
# ==============================================================================

run_lint() {
    cd "${SCRIPT_DIR}"
    echo -e "${COLOR_YELLOW}Lancement du linter...${NC}"
    pnpm run lint
}

run_format() {
    cd "${SCRIPT_DIR}"
    echo -e "${COLOR_YELLOW}Formatage du code...${NC}"
    pnpm run format
}

run_typecheck() {
    cd "${SCRIPT_DIR}"
    echo -e "${COLOR_YELLOW}Vérification des types TypeScript...${NC}"
    local output_file
    output_file=$(mktemp)
    pnpm run typecheck >"$output_file" 2>&1
    local exit_code=$?
    echo "$output_file" > /tmp/typecheck_output_file
    if [ $exit_code -ne 0 ]; then
        cat "$output_file"
    fi
    return $exit_code
}

run_unit_tests() {
    cd "${SCRIPT_DIR}"
    echo -e "${COLOR_YELLOW}Lancement des tests unitaires...${NC}"
    # Run tests and capture output
    local output_file=$(mktemp)
    pnpm run test:unit >"$output_file" 2>&1
    local exit_code=$?
    
    # Show summary information
    echo "=== Résumé des tests unitaires ==="
    grep -E "(Test Files|Tests|Duration)" "$output_file" | tail -3
    
    # Show any failures
    if [ $exit_code -ne 0 ]; then
        echo ""
        echo -e "${COLOR_RED}Erreurs détectées :${NC}"
        # Extract just the key failure information without verbose logs
        grep -E "(FAILED|ERROR|failed|erreur)" "$output_file" | head -10
    fi
    
    # Save error details for report generation
    echo "$output_file" > /tmp/unit_test_output_file
    
    # Clean up temp file
    # rm -f "$output_file"  # Don't remove yet, needed for report generation
    
    # Return the actual exit code
    return $exit_code
}

run_integration_tests() {
    cd "${SCRIPT_DIR}"
    echo -e "${COLOR_YELLOW}Lancement des tests d'intégration...${NC}"
    echo -e "${COLOR_YELLOW}Démarrage des services Docker pour l'environnement de test...${NC}"
    start_services
    echo -e "${COLOR_GREEN}Services Docker démarrés. Lancement des tests...${NC}"
    
    # Run tests with limited output, but preserve full details in reports
    local output
    output=$(pnpm run test:integration 2>&1)
    local test_exit_code=$?
    
    # Show only summary information (last 10 lines instead of 20)
    echo "$output" | tail -10
    
    echo -e "${COLOR_YELLOW}Tests terminés. Arrêt des services Docker...${NC}"
    stop_services
    return $test_exit_code
}

run_all_tests() {
    run_unit_tests && run_integration_tests
}

_run_core_checks() {
    echo -e "${COLOR_YELLOW}Exécution du linter...${NC}"
    if ! run_lint; then
        echo -e "${COLOR_RED}✗ Le linter a échoué.${NC}"
        write_all_checks_report "failed" "lint"
        return 1
    fi
    
    echo -e "${COLOR_YELLOW}Vérification des types...${NC}"
    if ! run_typecheck; then
        echo -e "${COLOR_RED}✗ La vérification des types a échoué.${NC}"
        write_all_checks_report "failed" "typecheck"
        return 1
    fi
    
    return 0
}

run_small_checks() {
    cd "${SCRIPT_DIR}"
    local start_time
    start_time=$(date +%s)
    echo -e "${COLOR_YELLOW}Lancement des vérifications rapides (Lint, TypeCheck)...${NC}"
    
    if ! _run_core_checks; then
        local end_time
        end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo -e "${COLOR_RED}✗ Les vérifications rapides ont échoué après ${duration} secondes.${NC}"
        echo -e "${COLOR_CYAN}Consultez le fichier all-checks.md pour le rapport.${NC}"
        return 1
    fi
    
    write_all_checks_report "success" "small_checks"
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    echo -e "${COLOR_GREEN}✓ Toutes les vérifications rapides ont été exécutées avec succès en ${duration} secondes.${NC}"
    echo -e "${COLOR_CYAN}Consultez le fichier all-checks.md pour le rapport.${NC}"
    return 0
}

write_all_checks_report() {
    local status=$1  # "success" or "failed"
    local failed_step=$2  # "lint", "typecheck", or "unit_tests"
    local report_file="all-checks.md"
    echo -e "${COLOR_YELLOW}Génération du rapport complet des vérifications...${NC}"
    
    # Create markdown report header
    cat > "$report_file" << 'EOF'
# Rapport complet des vérifications

Ce document résume les résultats de toutes les vérifications (Lint, TypeCheck, Tests Unitaires).

---

## Statut des vérifications

EOF

    # Add status indicators
    if [ "$failed_step" = "lint" ]; then
        echo "❌ Lint" >> "$report_file"
    else
        echo "✅ Lint" >> "$report_file"
    fi
    
    if [ "$failed_step" = "typecheck" ]; then
        echo "❌ TypeCheck" >> "$report_file"
    else
        echo "✅ TypeCheck" >> "$report_file"
    fi
    
    if [ "$status" = "success" ] || [ "$failed_step" != "unit_tests" ]; then
        echo "✅ Tests Unitaires" >> "$report_file"
    else
        echo "❌ Tests Unitaires" >> "$report_file"
    fi

    echo "" >> "$report_file"
    echo "---" >> "$report_file"
    echo "" >> "$report_file"

    if [ "$status" = "success" ]; then
        echo "Toutes les vérifications ont été exécutées avec succès." >> "$report_file"
    else
        echo "## Détails des erreurs" >> "$report_file"
        echo "" >> "$report_file"
        
        if [ "$failed_step" = "unit_tests" ] && [ -f /tmp/unit_test_output_file ]; then
            local output_file
            output_file=$(cat /tmp/unit_test_output_file)
            
            local failed_tests
            failed_tests=$(grep -cE "FAIL|ERROR" "$output_file" | grep -v "failed" || echo 0)
            echo "### Tests Unitaires: $failed_tests erreur(s) détectée(s)" >> "$report_file"
            echo "" >> "$report_file"
            
            awk \
            \
            '\
            function end_block() {
                if (in_error_block) {
                    print "```"
                    in_error_block = 0
                }
            }
            BEGIN { error_num = 1; in_error_block = 0; }
            / FAIL | ERROR / {
                end_block()
                print "\n#### Erreur " error_num++ "\n"
                print "**Description:**"
                print "```"
                print $0
                in_error_block = 1
                next
            }
            /^(Test Files:|Tests:|Duration:)/ {
                end_block()
                print "\n---\n**Résumé des tests:**\n"
                print $0
                next
            }
            in_error_block {
                print $0
            }
            END {
                end_block()
            }
            ' \
            "$output_file" >> "$report_file"

        elif [ "$failed_step" = "lint" ]; then
            echo "### Le linter a échoué" >> "$report_file"
            echo "Veuillez vérifier les logs de la console pour les détails." >> "$report_file"
        
        elif [ "$failed_step" = "typecheck" ] && [ -f /tmp/typecheck_output_file ]; then
            local output_file
            output_file=$(cat /tmp/typecheck_output_file)
            echo "### La vérification des types a échoué" >> "$report_file"
            echo "" >> "$report_file"
            
            local error_count
            error_count=$(grep -cE "error TS[0-9]{4,}" "$output_file" || echo 0)
            echo "Nombre total d'erreurs : $error_count" >> "$report_file"
            echo "" >> "$report_file"

            echo "**Détails des erreurs :**" >> "$report_file"
            echo '```' >> "$report_file"
            grep -E "error TS[0-9]{4,}|found [0-9]+ error" "$output_file" >> "$report_file"
            echo '```' >> "$report_file"

        else
            echo "### Une erreur inattendue est survenue" >> "$report_file"
        fi
        echo "" >> "$report_file"
        echo "Certaines vérifications ont échoué." >> "$report_file"
    fi
    
    echo "" >> "$report_file"
    echo "---" >> "$report_file"
    echo "Généré le: $(date)" >> "$report_file"
    
    echo -e "${COLOR_GREEN}✓ Rapport complet des vérifications enregistré dans $report_file${NC}"
}


run_all_checks() {
    cd "${SCRIPT_DIR}"
    local start_time
    start_time=$(date +%s)
    echo -e "${COLOR_YELLOW}Lancement de TOUTES les vérifications (Lint, TypeCheck, Tests Unitaires)...${NC}"

    # Fonction pour nettoyer les fichiers temporaires
    cleanup_temp_files() {
        if [ -f /tmp/unit_test_output_file ]; then
            rm -f "$(cat /tmp/unit_test_output_file 2>/dev/null)"
            rm -f /tmp/unit_test_output_file
        fi
        if [ -f /tmp/typecheck_output_file ]; then
            rm -f "$(cat /tmp/typecheck_output_file 2>/dev/null)"
            rm -f /tmp/typecheck_output_file
        fi
    }

    # Assurer le nettoyage à la sortie du script
    trap cleanup_temp_files EXIT

    # Exécution du linter
    echo -e "${COLOR_YELLOW}Exécution du linter...${NC}"
    if ! run_lint; then
        echo -e "${COLOR_RED}✗ Le linter a échoué.${NC}"
        write_all_checks_report "failed" "lint"
        return 1
    fi
    
    # Vérification des types
    echo -e "${COLOR_YELLOW}Vérification des types...${NC}"
    if ! run_typecheck; then
        echo -e "${COLOR_RED}✗ La vérification des types a échoué.${NC}"
        write_all_checks_report "failed" "typecheck"
        return 1
    fi
    
    # Exécution des tests unitaires
    echo -e "${COLOR_YELLOW}Exécution des tests unitaires...${NC}"
    if ! run_unit_tests; then
        echo -e "${COLOR_RED}✗ Les tests unitaires ont échoué.${NC}"
        write_all_checks_report "failed" "unit_tests"
        local end_time
        end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        if [ -f /tmp/unit_test_output_file ]; then
            local output_file
            output_file=$(cat /tmp/unit_test_output_file)
            local failed_tests
            failed_tests=$(grep -cE "(failed|FAILED)" "$output_file")
            echo -e "${COLOR_RED}✗ $failed_tests erreurs de tests unitaires détectées.${NC}"
        fi
        
        echo -e "${COLOR_RED}✗ Certaines vérifications ont échoué après ${duration} secondes.${NC}"
        echo -e "${COLOR_CYAN}Consultez le fichier all-checks.md pour une liste complète des vérifications.${NC}"
        return 1
    fi
    
    # Succès
    write_all_checks_report "success"
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    echo -e "${COLOR_GREEN}✓ Toutes les vérifications ont été exécutées avec succès en ${duration} secondes.${NC}"
    echo -e "${COLOR_CYAN}Consultez le fichier all-checks.md pour une liste complète des vérifications.${NC}"
    return 0
}

# ==============================================================================
# UI du Menu
# ==============================================================================
show_menu() {
    clear
    echo -e "${COLOR_ORANGE}"
    echo '    ╔══════════════════════════════════╗'
    echo '    ║           G - F O R G E          ║'
    echo '    ╚══════════════════════════════════╝'
    echo -e "${NC}"
    echo -e "──────────────────────────────────────────"
    echo -e "    ${COLOR_CYAN}Docker & Services${NC}"
    printf "    1) ${COLOR_GREEN}🟢 Démarrer${NC}            5) ${COLOR_BLUE}📊 Logs Worker${NC}\n"
    printf "    2) ${COLOR_YELLOW}🔄 Redémarrer tout${NC}     6) ${COLOR_BLUE}🐚 Shell (Container)${NC}\n"
    printf "    3) ${COLOR_RED}🔴 Arrêter${NC}              7) ${COLOR_BLUE}🔨 Rebuild Docker${NC}\n"
    printf "    4) ${COLOR_CYAN}⚡ Statut${NC}              8) ${COLOR_RED}🧹 Nettoyer Docker${NC}\n"
    printf "    9) ${COLOR_YELLOW}🔄 Redémarrer worker${NC}    15) ${COLOR_BLUE}🐳 Logs Docker${NC}\n"
    printf "   20) ${COLOR_BLUE}🔨 Rebuild Worker${NC}\n"
    printf "   21) ${COLOR_BLUE}🔨 Rebuild All${NC}\n"
    echo ""
    echo -e "    ${COLOR_CYAN}Développement & Vérifications${NC}"
    printf "   10) ${COLOR_BLUE}🔍 Lint${NC}                 13) ${COLOR_BLUE}📘 TypeCheck${NC}\n"
    printf "   11) ${COLOR_BLUE}✨ Format${NC}               14) ${COLOR_BLUE}✅ Checks Rapides (Lint, Types)${NC}\n"
    printf "   12) ${COLOR_BLUE}🧪 Tests (Unitaires)${NC}     17) ${COLOR_BLUE}🚀 TOUS les Checks (Lint, Types, Tests Unitaires)${NC}\n"
    printf "   18) ${COLOR_BLUE}🧪 Tests (Intégration)${NC}\n"
    printf "   19) ${COLOR_BLUE}🧪 Lancer TOUS les tests${NC}\n"
    echo ""
    printf "   16) ${COLOR_RED}🚪 Quitter${NC}\n"
    echo ""
}

# ==============================================================================
# Boucle Principale
# ==============================================================================

main() {
    cd "${SCRIPT_DIR}"
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
                    docker) show_logs "${SCRIPT_DIR}/docker.log" "Docker" ;; 
                    *) show_logs "${SCRIPT_DIR}/worker.log" "Worker" ;; 
                esac 
                ;; 
            rebuild-all) rebuild_all ;; 
            rebuild-docker|rebuild) rebuild_docker ;; 
            rebuild-worker) rebuild_worker ;; 
            clean-docker) clean_docker ;; 
            shell) shell_access ;; 
            lint) run_lint ;; 
            format) run_format ;; 
            test) run_all_tests ;; 
            test:unit) run_unit_tests ;; 
            test:integration) run_integration_tests ;; 
            typecheck) run_typecheck ;; 
            small-checks) run_small_checks ;; 
            all-checks) run_all_checks ;; 
            menu) # Fallthrough to interactive menu
            ;; 
            *) usage ;; 
        esac
        if [ "$1" != "menu" ]; then
          exit 0
        fi
    fi

    while true; do
        show_menu
        read -p "Choisissez une option: " choice
        echo ""
        case "$choice" in
            1) start_services ;; 
            2) restart_all_services ;; 
            3) stop_services ;; 
            4) show_status ;; 
            5) show_logs "${SCRIPT_DIR}/worker.log" "Worker" ;; 
            6) shell_access ;; 
            7) rebuild_docker ;; 
            8) clean_docker ;; 
            9) restart_worker ;; 
            10) run_lint ;; 
            11) run_format ;; 
            12) run_unit_tests ;; 
            13) run_typecheck ;; 
            14) run_small_checks ;; 
            15) show_logs "${SCRIPT_DIR}/docker.log" "Docker" ;; 
            16) echo -e "${COLOR_CYAN}Au revoir !${NC}"; exit 0 ;; 
            17) run_all_checks ;; 
            18) run_integration_tests ;; 
            19) run_all_tests ;; 
            20) rebuild_worker ;; 
            21) rebuild_all ;; 
            *) echo -e "${COLOR_RED}Option invalide, veuillez réessayer.${NC}" ;; 
        esac
        echo -e "\nAppuyez sur Entree pour continuer..."
        read -r
    done
}

main "$@"