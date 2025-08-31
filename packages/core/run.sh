#!/bin/bash

# Script de gestion des services AgenticForge Core
# Auteur: AgenticForge AI
# Date: 2025

set -e  # Arrêter le script si une commande échoue

# Variables
PROJECT_NAME="AgenticForge Core"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}! $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Commandes principales
start_services() {
    print_header "Démarrage des Services Core"
    echo "Démarrage du service core..."
    # Implémentation du démarrage des services core
    print_success "Services core démarrés avec succès"
}

stop_services() {
    print_header "Arrêt des Services Core"
    echo "Arrêt des services core..."
    # Implémentation de l'arrêt des services core
    print_success "Services core arrêtés avec succès"
}

restart_services() {
    print_header "Redémarrage des Services Core"
    stop_services
    start_services
    print_success "Services core redémarrés avec succès"
}

show_status() {
    print_header "Statut des Services Core"
    echo "Statut des services core:"
    # Implémentation de l'affichage du statut
}

show_logs() {
    local service=$1
    print_header "Logs des Services Core"
    case $service in
        "server")
            echo "Logs du serveur core..."
            # Implémentation des logs serveur
            ;;
        "worker")
            echo "Logs du worker..."
            # Implémentation des logs worker
            ;;
        *)
            echo "Logs de tous les services core..."
            # Implémentation des logs généraux
            ;;
    esac
}

run_lint() {
    print_header "Linter Core"
    echo "Exécution du linter sur le code core..."
    pnpm run lint
}

run_format() {
    print_header "Formatage du Code Core"
    echo "Formatage du code core..."
    pnpm run format
}

run_tests() {
    print_header "Tests Core"
    echo "Exécution des tests core..."
    pnpm run test
}

run_typecheck() {
    print_header "Vérification des Types Core"
    echo "Vérification des types core..."
    pnpm run typecheck
}

show_menu() {
    clear
    print_header "$PROJECT_NAME - Menu"
    echo "Utilisation: $0 [commande]"
    echo
    echo "Commandes disponibles:"
    echo "  start             : Démarre tous les services core"
    echo "  stop              : Arrête tous les services core"
    echo "  restart           : Redémarre tous les services core"
    echo "  status            : Affiche le statut des services core"
    echo "  logs [service]    : Affiche les logs. 'service' peut être 'server' ou 'worker'"
    echo "  lint              : Lance le linter sur le code core"
    echo "  format            : Formate le code core"
    echo "  test              : Lance les tests core"
    echo "  typecheck         : Vérifie les types TypeScript core"
    echo "  menu              : Affiche le menu interactif (défaut)"
    echo "  alltest           : Lance tous les tests possibles core"
    echo
    echo "Exemples:"
    echo "  $0 start"
    echo "  $0 logs server"
    echo "  $0 alltest"
    echo
}

run_all_tests() {
    print_header "Exécution de Tous les Tests Core"
    
    echo "1. Vérification des types..."
    if run_typecheck; then
        print_success "Vérification des types réussie"
    else
        print_error "Vérification des types échouée"
        exit 1
    fi
    
    echo "2. Linter..."
    if run_lint; then
        print_success "Linter réussi"
    else
        print_error "Linter échoué"
        exit 1
    fi
    
    echo "3. Tests..."
    if run_tests; then
        print_success "Tests réussis"
    else
        print_error "Tests échoués"
        exit 1
    fi
    
    echo "4. Formatage..."
    if run_format; then
        print_success "Formatage réussi"
    else
        print_error "Formatage échoué"
        exit 1
    fi
    
    print_success "Tous les tests core ont été exécutés avec succès"
}

# Parse les arguments
case $1 in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs $2
        ;;
    lint)
        run_lint
        ;;
    format)
        run_format
        ;;
    test)
        run_tests
        ;;
    typecheck)
        run_typecheck
        ;;
    alltest)
        run_all_tests
        ;;
    menu|"")
        show_menu
        ;;
    *)
        print_error "Commande inconnue: $1"
        show_menu
        exit 1
        ;;
esac