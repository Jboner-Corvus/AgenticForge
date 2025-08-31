#!/bin/bash

# Script Quality Gates pour AgenticForge Core
# Auteur: AgenticForge AI
# Date: 2025

set -e  # Arrêter le script si une commande échoue

# Variables
PROJECT_NAME="AgenticForge Core"

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

# Fonction principale des Quality Gates
run_quality_gates() {
    print_header "Exécution des Quality Gates - $PROJECT_NAME"
    
    local failed_gates=0
    
    # 1. Vérification des types
    echo "1. Vérification des types TypeScript..."
    if pnpm run typecheck; then
        print_success "Vérification des types réussie"
    else
        print_error "Vérification des types échouée"
        ((failed_gates++))
    fi
    
    # 2. Linter
    echo "2. Linter..."
    if pnpm run lint; then
        print_success "Linter réussi"
    else
        print_error "Linter échoué"
        ((failed_gates++))
    fi
    
    # 3. Tests
    echo "3. Tests unitaires..."
    if pnpm run test:unit; then
        print_success "Tests unitaires réussis"
    else
        print_error "Tests unitaires échoués"
        ((failed_gates++))
    fi
    
    # 4. Formatage
    echo "4. Formatage du code..."
    if pnpm run format; then
        print_success "Formatage réussi"
    else
        print_error "Formatage échoué"
        ((failed_gates++))
    fi
    
    # Résultat final
    if [ $failed_gates -eq 0 ]; then
        print_header "🎉 Tous les Quality Gates ont été passés avec succès"
        return 0
    else
        print_header "❌ $failed_gates Quality Gate(s) échoué(s)"
        return 1
    fi
}

# Exécuter les Quality Gates
run_quality_gates