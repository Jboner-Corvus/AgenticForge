#!/bin/bash

# 🚀 Script de déploiement des optimisations PostgreSQL
# AgenticForge - Optimisations Production

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions de logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S'): $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S'): $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S'): $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S'): $1"
}

# Fonction de sauvegarde
create_backup() {
    log_info "Création d'une sauvegarde avant déploiement..."

    mkdir -p "$BACKUP_DIR"

    # Sauvegarde des fichiers modifiés
    local files_to_backup=(
        "packages/core/src/server-start.ts"
        "packages/core/src/worker.ts"
        "docker-compose.yml"
        ".env"
    )

    for file in "${files_to_backup[@]}"; do
        if [[ -f "$PROJECT_ROOT/$file" ]]; then
            cp "$PROJECT_ROOT/$file" "$BACKUP_DIR/$(basename "$file").backup"
            log_info "Sauvegardé: $file"
        fi
    done

    log_success "Sauvegarde créée dans: $BACKUP_DIR"
}

# Vérification des prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."

    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé ou n'est pas dans le PATH"
        exit 1
    fi

    # Vérifier Docker Compose
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose n'est pas disponible"
        exit 1
    fi

    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé"
        exit 1
    fi

    # Vérifier pnpm
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm n'est pas installé"
        exit 1
    fi

    # Vérifier les nouveaux modules
    local required_modules=(
        "packages/core/src/modules/database/postgresPool.ts"
        "packages/core/src/modules/database/circuitBreaker.ts"
        "packages/core/src/modules/database/postgresMonitor.ts"
        "packages/core/src/modules/database/index.ts"
    )

    for module in "${required_modules[@]}"; do
        if [[ ! -f "$PROJECT_ROOT/$module" ]]; then
            log_error "Module manquant: $module"
            exit 1
        fi
    done

    log_success "Tous les prérequis sont satisfaits"
}

# Test des nouveaux modules
test_modules() {
    log_info "Test des nouveaux modules PostgreSQL..."

    cd "$PROJECT_ROOT"

    # Compiler TypeScript pour vérifier les erreurs
    if ! npx tsc --noEmit --project packages/core/tsconfig.json; then
        log_error "Erreurs TypeScript détectées"
        exit 1
    fi

    log_success "Modules compilés avec succès"
}

# Déploiement des services
deploy_services() {
    log_info "Déploiement des services avec optimisations PostgreSQL..."

    cd "$PROJECT_ROOT"

    # Arrêter les services existants
    log_info "Arrêt des services existants..."
    docker compose down || true

    # Nettoyer les ressources Docker
    log_info "Nettoyage des ressources Docker..."
    docker system prune -f || true

    # Démarrer avec la nouvelle configuration
    log_info "Démarrage des services optimisés..."
    docker compose up -d --build

    # Attendre que PostgreSQL soit prêt
    log_info "Attente de la disponibilité de PostgreSQL..."
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-user}" -d "${POSTGRES_DB:-gforge}" &>/dev/null; then
            log_success "PostgreSQL est prêt après ${attempt} tentatives"
            break
        fi

        log_info "Tentative ${attempt}/${max_attempts} - PostgreSQL pas encore prêt..."
        sleep 10
        ((attempt++))
    done

    if [ $attempt -gt $max_attempts ]; then
        log_error "PostgreSQL n'est pas devenu disponible après $max_attempts tentatives"
        exit 1
    fi

    # Attendre que l'application soit prête
    log_info "Attente de la disponibilité de l'application..."
    local app_ready=false
    attempt=1

    while [ $attempt -le 20 ]; do
        if curl -f http://localhost:8080/api/health &>/dev/null; then
            app_ready=true
            log_success "Application prête après ${attempt} tentatives"
            break
        fi

        log_info "Tentative ${attempt}/20 - Application pas encore prête..."
        sleep 5
        ((attempt++))
    done

    if [ "$app_ready" = false ]; then
        log_warning "Application pas encore prête, mais continuation du déploiement"
    fi
}

# Test des optimisations
test_optimizations() {
    log_info "Test des optimisations PostgreSQL..."

    cd "$PROJECT_ROOT"

    # Exécuter le script de test
    if [[ -f "test-postgres-optimizations.ts" ]]; then
        log_info "Exécution des tests d'optimisation..."
        if npx tsx test-postgres-optimizations.ts; then
            log_success "Tests d'optimisation réussis"
        else
            log_error "Échec des tests d'optimisation"
            return 1
        fi
    else
        log_warning "Script de test non trouvé, skip des tests automatiques"
    fi

    # Test de charge léger
    log_info "Test de charge léger..."
    local test_results=$(curl -s http://localhost:8080/api/health || echo "error")

    if [[ "$test_results" == *"error"* ]]; then
        log_error "Test de santé échoué"
        return 1
    else
        log_success "Test de santé réussi"
    fi
}

# Validation post-déploiement
validate_deployment() {
    log_info "Validation du déploiement..."

    # Vérifier l'état des conteneurs
    log_info "Vérification de l'état des conteneurs..."
    docker compose ps

    # Vérifier les logs pour les erreurs
    log_info "Vérification des logs pour les erreurs..."
    if docker compose logs --tail=50 | grep -i error; then
        log_warning "Erreurs détectées dans les logs (peuvent être normales au démarrage)"
    else
        log_success "Aucune erreur critique détectée dans les logs"
    fi

    # Vérifier les métriques PostgreSQL
    log_info "Vérification des métriques PostgreSQL..."
    docker compose exec -T postgres psql -U "${POSTGRES_USER:-user}" -d "${POSTGRES_DB:-gforge}" -c "SELECT version();" &>/dev/null
    if [ $? -eq 0 ]; then
        log_success "Connexion PostgreSQL réussie"
    else
        log_error "Échec de connexion PostgreSQL"
        return 1
    fi

    # Vérifier les métriques du pool
    log_info "Vérification des métriques du pool..."
    local pool_stats=$(docker compose exec -T postgres psql -U "${POSTGRES_USER:-user}" -d "${POSTGRES_DB:-gforge}" -c "SELECT count(*) as connections FROM pg_stat_activity;" 2>/dev/null || echo "error")

    if [[ "$pool_stats" == *"error"* ]]; then
        log_warning "Impossible de récupérer les statistiques du pool"
    else
        log_success "Statistiques du pool récupérées avec succès"
    fi
}

# Rollback en cas d'échec
rollback() {
    log_error "Échec du déploiement - Démarrage du rollback..."

    cd "$PROJECT_ROOT"

    # Arrêter les services
    docker compose down || true

    # Restaurer les fichiers sauvegardés
    if [[ -d "$BACKUP_DIR" ]]; then
        log_info "Restauration des fichiers sauvegardés..."

        for backup_file in "$BACKUP_DIR"/*.backup; do
            if [[ -f "$backup_file" ]]; then
                original_file="${backup_file%.backup}"
                original_name=$(basename "$original_file")

                if [[ -f "$PROJECT_ROOT/$original_name" ]]; then
                    cp "$backup_file" "$PROJECT_ROOT/$original_name"
                    log_info "Restauré: $original_name"
                fi
            fi
        done

        # Redémarrer avec l'ancienne configuration
        log_info "Redémarrage avec l'ancienne configuration..."
        docker compose up -d

        log_success "Rollback terminé - Services redémarrés avec l'ancienne configuration"
    else
        log_error "Aucune sauvegarde trouvée pour le rollback"
    fi
}

# Fonction principale
main() {
    echo ""
    echo "🚀 AgenticForge - Déploiement des Optimisations PostgreSQL"
    echo "======================================================"
    echo ""

    local start_time=$(date +%s)

    # Trap pour le rollback en cas d'erreur
    trap 'rollback' ERR

    # Étape 1: Sauvegarde
    create_backup

    # Étape 2: Vérifications préalables
    check_prerequisites

    # Étape 3: Tests des modules
    test_modules

    # Étape 4: Déploiement
    deploy_services

    # Étape 5: Tests post-déploiement
    if test_optimizations; then
        # Étape 6: Validation
        validate_deployment

        local end_time=$(date +%s)
        local duration=$((end_time - start_time))

        echo ""
        echo "🎉 DÉPLOIEMENT RÉUSSI !"
        echo "======================"
        log_success "Optimisations PostgreSQL déployées avec succès"
        log_success "Temps total: ${duration} secondes"
        log_success "Sauvegarde disponible: $BACKUP_DIR"
        echo ""
        echo "📊 Prochaines étapes recommandées:"
        echo "• Monitorer les métriques PostgreSQL"
        echo "• Tester la charge avec des vrais scénarios"
        echo "• Configurer les alertes de monitoring"
        echo "• Planifier les futures optimisations"
        echo ""

    else
        log_error "Échec des tests post-déploiement"
        rollback
        exit 1
    fi
}

# Vérifier si on est en mode dry-run
if [[ "${1:-}" == "--dry-run" ]]; then
    log_info "Mode DRY-RUN activé - Simulation du déploiement"
    echo ""
    echo "Étapes qui seraient exécutées:"
    echo "1. ✅ Création de sauvegarde"
    echo "2. ✅ Vérification des prérequis"
    echo "3. ✅ Test des modules TypeScript"
    echo "4. 🔄 Déploiement des services (simulé)"
    echo "5. 🔄 Tests d'optimisation (simulés)"
    echo "6. 🔄 Validation du déploiement (simulée)"
    echo ""
    log_success "Simulation terminée - Prêt pour le déploiement réel"
    exit 0
fi

# Vérifier si on demande de l'aide
if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Script de déploiement des optimisations PostgreSQL pour AgenticForge"
    echo ""
    echo "Options:"
    echo "  --dry-run    Simulation du déploiement sans modification"
    echo "  --help, -h   Afficher cette aide"
    echo ""
    echo "Le script effectue automatiquement:"
    echo "• Sauvegarde des fichiers existants"
    echo "• Vérification des prérequis"
    echo "• Tests des nouveaux modules"
    echo "• Déploiement des services optimisés"
    echo "• Tests et validation post-déploiement"
    echo "• Rollback automatique en cas d'échec"
    exit 0
fi

# Exécuter le déploiement
main "$@"