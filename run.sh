#!/usr/bin/env bash

# ==============================================================================
# CONSOLE DE GESTION - AGENTIC PROMETHEUS v3.4 (Bake Edition)
# Script de gestion Docker et de développement pour l'écosystème autonome.
# ==============================================================================

# --- Configuration Stricte et Gestion des Erreurs ---
set -euo pipefail

# CORRECTION : Activation de Docker Buildx Bake pour des builds plus rapides
export COMPOSE_BAKE=true

# --- Palette de Couleurs ---
NC='\033[0m'
FG_RED='\033[0;31m'
FG_GREEN='\033[0;32m'
FG_YELLOW='\033[0;33m'
FG_BLUE='\033[0;34m'
FG_MAGENTA='\033[0;35m'
FG_CYAN='\033[1;36m'
FG_WHITE='\033[1;37m'

# --- Fonctions Utilitaires ---
_log() {
    local type="$1"
    local message="$2"
    local color="$NC"
    case "$type" in
        "INFO") color="$FG_GREEN" ;;
        "WARN") color="$FG_YELLOW" ;;
        "ERROR") color="$FG_RED" ;;
        "DEBUG") color="$FG_MAGENTA" ;;
    esac
    printf "${color}[%s]${NC} %s\\n" "$type" "$message"
}

_check_deps() {
    if ! command -v docker &> /dev/null; then
        _log "ERROR" "Docker n'est pas installé. Veuillez l'installer pour continuer."
        exit 1
    fi
    # CORRECTION : Retour à l'utilisation explicite de docker-compose
    if ! command -v docker-compose &> /dev/null; then
        _log "ERROR" "Docker Compose n'est pas installé ou détecté. Veuillez l'installer."
        exit 1
    fi
    if ! docker info &> /dev/null; then
        _log "ERROR" "Le démon Docker ne semble pas fonctionner. Assurez-vous qu'il est lancé."
        exit 1
    fi
    if ! command -v pnpm &> /dev/null; then
        _log "WARN" "pnpm n'est pas installé globalement. Les actions de développement local pourraient échouer."
    fi
}

_check_env() {
    if [ ! -f .env ]; then
        _log "WARN" "Fichier de configuration '.env' non trouvé."
        if [ -f .env.example ]; then
            _log "INFO" "Copie de '.env.example' vers '.env'..."
            cp .env.example .env
            _log "ERROR" "Veuillez éditer le fichier '.env' avec votre configuration, puis relancez."
        else
            _log "ERROR" "Fichier '.env.example' non trouvé. Impossible de créer le .env."
        fi
        exit 1
    fi
}

_show_title() {
    # Utilisation du nouveau logo fourni par l'utilisateur
    echo -e "${FG_CYAN}"
    echo "  ╔════════════════════════════════╗"
    echo "  ║ ▛▀▀▀▀▀▀▀▀▜ ▄▄▄ ▄ ▄▄▄ ▄▄▄▄▄▄▄▄▄▄ ║"
    echo "  ║ █ AGENTIC ▐▛▀▀▀▜▌█▞▀▀▜ █▛▀▀▀▜▌ ║"
    echo "  ║ █ PROMETHEUS ▐▌█▌▐▌▐▌█ █▌  ▐▌█ ║"
    echo "  ║ ▙▄▄▄▄▄▄▄▄▟ █▄▄▄▟▌█▙▄▄▟ █▙▄▄▄▟▌ ║"
    echo "  ╠═══════◇════════════════◇══════╣"
    echo "  ║   ░▒▓▌ FIRE OF KNOWLEDGE ▐▓▒░  ║"
    echo "  ╚══════════[̲̅⚡̲̅]═══[̲̅🌐̲̅]════════╝"
    echo -e "${NC}"
}

_confirm() {
    read -rp "$(echo -e ${FG_YELLOW}"$1 [y/N]: "${NC})" response
    case "$response" in
        [yY][eE][sS]|[yY]) return 0 ;;
        *) return 1 ;;
    esac
}

# --- Actions Docker ---
_action_start() { _log "INFO" "Démarrage de l'écosystème..."; docker-compose up --build -d; _log "INFO" "Services démarrés."; }
_action_stop() { _log "INFO" "Arrêt de l'écosystème..."; docker-compose down; _log "INFO" "Services arrêtés."; }
_action_restart() { _log "INFO" "Redémarrage des services..."; docker-compose restart; _log "INFO" "Services redémarrés."; }
_action_logs() { _log "INFO" "Affichage des logs... [CTRL+C] pour quitter."; docker-compose logs -f; }
_action_status() { _log "INFO" "Statut des services :"; docker-compose ps; }
_action_rebuild() {
    _log "INFO" "Reconstruction des images sans utiliser le cache..."
    docker-compose build --no-cache
    _log "INFO" "Images reconstruites."
}
_action_shell() {
    _log "INFO" "Sélectionnez un service pour accéder à son shell :"
    local services=$(docker-compose config --services)
    select service in $services "Annuler"; do
        if [[ "$service" == "Annuler" ]] || [[ -z "$service" ]]; then
            _log "INFO" "Opération annulée."
            break
        fi
        if [[ -n "$service" ]]; then
            _log "INFO" "Accès au shell de '${service}'... (tapez 'exit' pour quitter)"
            docker-compose exec "$service" /bin/sh
            break
        else
            _log "WARN" "Choix invalide. Veuillez réessayer."
        fi
    done
}
_action_prune() {
    if _confirm "Êtes-vous sûr de vouloir nettoyer Docker (conteneurs, réseaux, volumes non utilisés) ?"; then
        _action_stop; _log "INFO" "Nettoyage du système Docker..."; docker system prune -af --volumes; _log "INFO" "Nettoyage terminé.";
    else _log "INFO" "Opération annulée."; fi
}

# --- Actions de Développement Local ---
_action_lint() {
    _log "DEBUG" "Lancement de ESLint pour l'analyse statique du code..."
    if pnpm run lint; then _log "INFO" "Analyse ESLint terminée."; else _log "ERROR" "ESLint a trouvé des erreurs."; fi
}
_action_lint_fix() {
    _log "DEBUG" "Lancement de ESLint avec auto-correction..."
    pnpm run lint:fix
    _log "INFO" "Tentative de correction automatique terminée."
}
_action_format() {
    _log "DEBUG" "Lancement de Prettier pour formater le code..."
    pnpm run format
    _log "INFO" "Formatage du code terminé."
}
_action_test() {
    _log "DEBUG" "Lancement des tests avec Jest..."
    pnpm run test
}
_action_check_types() {
    _log "DEBUG" "Lancement du compilateur TypeScript pour la vérification des types..."
    if pnpm exec tsc --noEmit; then
        _log "INFO" "Vérification des types terminée. Aucune erreur trouvée."
    else
        _log "ERROR" "TypeScript a trouvé des erreurs de typage."
    fi
}
_action_clean() {
    if _confirm "Voulez-vous vraiment supprimer le répertoire 'dist' ?"; then
        _log "INFO" "Nettoyage du répertoire de build..."
        pnpm run clean
        _log "INFO" "Répertoire 'dist' supprimé."
    else _log "INFO" "Opération annulée."; fi
}

# --- Boucle Principale de la Console ---
_check_deps
_check_env

while true; do
    clear
    _show_title
    echo -e "${FG_WHITE}--- Console de Gestion Docker ---${NC}"
    echo -e " ${FG_GREEN}1)${NC} Démarrer    ${FG_YELLOW}2)${NC} Redémarrer    ${FG_RED}3)${NC} Arrêter    ${FG_BLUE}4)${NC} Statut"
    echo -e " ${FG_CYAN}5)${NC} Logs        ${FG_MAGENTA}6)${NC} Shell         ${FG_YELLOW}7)${NC} Rebuild    ${FG_RED}8)${NC} Prune"
    echo -e "\n${FG_WHITE}--- Développement & Qualité ---${NC}"
    echo -e " ${FG_GREEN}10)${NC} Lint (Vérifier)   ${FG_GREEN}11)${NC} Lint (Corriger)   ${FG_BLUE}12)${NC} Formater"
    echo -e " ${FG_CYAN}13)${NC} Lancer les Tests  ${FG_MAGENTA}14)${NC} Vérifier les Types (TSC)"
    echo -e " ${FG_RED}15)${NC} Nettoyer le build"
    echo -e "\n ${FG_WHITE}16)${NC} Quitter"
    
    echo ""
    read -rp "$(echo -e ${FG_WHITE}"Votre choix : "${NC})" main_choice

    case "$main_choice" in
        1) _action_start ;;
        2) _action_restart ;;
        3) _action_stop ;;
        4) _action_status ;;
        5) _action_logs ;;
        6) _action_shell ;;
        7) _action_rebuild ;;
        8) _action_prune ;;
        10) _action_lint ;;
        11) _action_lint_fix ;;
        12) _action_format ;;
        13) _action_test ;;
        14) _action_check_types ;;
        15) _action_clean ;;
        16) break ;;
        *) _log "WARN" "Choix invalide. Veuillez sélectionner une option valide." ;;
    esac
    
    # Pause pour que l'utilisateur puisse voir le résultat avant de réafficher le menu.
    if [[ "$main_choice" != "16" ]]; then
         read -rp "$(echo -e ${FG_BLUE}"\nAppuyez sur [ENTRÉE] pour retourner au menu..."${NC})"
    fi
done

_log "INFO" "Fermeture de la console Agentic Prometheus. À la prochaine !"
exit 0
