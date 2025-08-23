#!/bin/bash

# =============================================================================
# Help System Module
# =============================================================================
# Provides comprehensive help system with command documentation, examples,
# troubleshooting guides, and contextual assistance.
# =============================================================================

set -eo pipefail

# Help system configuration
declare -g HELP_DIR="${HELP_DIR:-/tmp/agenticforge-help}"
declare -g HELP_CACHE_TTL="${HELP_CACHE_TTL:-86400}"  # 24 hours

# Color codes
readonly HELP_COLOR_BLUE='\033[0;34m'
readonly HELP_COLOR_GREEN='\033[0;32m'
readonly HELP_COLOR_YELLOW='\033[1;33m'
readonly HELP_COLOR_CYAN='\033[0;36m'
readonly HELP_COLOR_WHITE='\033[1;37m'
readonly HELP_COLOR_NC='\033[0m'

# =============================================================================
# Initialization
# =============================================================================

initialize_help_system() {
    mkdir -p "$HELP_DIR"
    help_log "Help system initialized"
}

# =============================================================================
# Main Help Functions
# =============================================================================

show_main_help() {
    clear
    echo -e "${HELP_COLOR_CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                    AgenticForge Management Script                ║"
    echo "║                          Version 2.0.0                          ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${HELP_COLOR_NC}"
    echo ""
    echo -e "${HELP_COLOR_WHITE}DESCRIPTION:${HELP_COLOR_NC}"
    echo "  Advanced management script for AgenticForge development platform."
    echo "  Provides modular service management, testing, and deployment tools."
    echo ""
    echo -e "${HELP_COLOR_WHITE}USAGE:${HELP_COLOR_NC}"
    echo "  $0 [COMMAND] [OPTIONS]"
    echo "  $0 menu                    # Interactive menu"
    echo ""
    echo -e "${HELP_COLOR_WHITE}COMMANDS:${HELP_COLOR_NC}"
    echo ""
    echo -e "  ${HELP_COLOR_CYAN}Service Management:${HELP_COLOR_NC}"
    echo "    start                    Start all services (Docker + Worker)"
    echo "    stop                     Stop all services gracefully"
    echo "    restart                  Restart all services"
    echo "    status                   Show service status"
    echo ""
    echo -e "  ${HELP_COLOR_CYAN}Development:${HELP_COLOR_NC}"
    echo "    rebuild-all              Complete rebuild (packages + Docker)"
    echo "    test:unit                Run unit tests only"
    echo "    test:integration         Run integration tests"
    echo "    test:all                 Run all tests (unit + integration)"
    echo "    quality-check            Run quality checks (lint + typecheck + unit tests)"
    echo ""
    echo -e "  ${HELP_COLOR_CYAN}Maintenance:${HELP_COLOR_NC}"
    echo "    menu                     Interactive menu interface"
    echo "    help [topic]             Show detailed help"
    echo ""
    echo -e "${HELP_COLOR_WHITE}EXAMPLES:${HELP_COLOR_NC}"
    echo "  $0 start                   # Start development environment"
    echo "  $0 test:unit               # Run unit tests"
    echo "  $0 rebuild-all             # Full rebuild and restart"
    echo "  $0 help docker             # Docker-specific help"
    echo ""
    echo -e "${HELP_COLOR_WHITE}HELP TOPICS:${HELP_COLOR_NC}"
    echo "  docker, testing, troubleshooting, development, deployment"
    echo ""
    echo -e "For detailed help on any topic: ${HELP_COLOR_GREEN}$0 help <topic>${HELP_COLOR_NC}"
}

show_topic_help() {
    local topic="${1:-}"
    
    case "$topic" in
        "docker"|"containers")
            show_docker_help
            ;;
        "testing"|"tests")
            show_testing_help
            ;;
        "troubleshooting"|"debug")
            show_troubleshooting_help
            ;;
        "development"|"dev")
            show_development_help
            ;;
        "deployment"|"deploy")
            show_deployment_help
            ;;
        "performance"|"perf")
            show_performance_help
            ;;
        "environment"|"env")
            show_environment_help
            ;;
        *)
            echo -e "${HELP_COLOR_YELLOW}Unknown help topic: $topic${HELP_COLOR_NC}" >&2
            echo ""
            echo -e "Available topics:"
            echo "  docker, testing, troubleshooting, development, deployment"
            echo "  performance, environment"
            echo ""
            echo -e "Use: ${HELP_COLOR_GREEN}$0 help${HELP_COLOR_NC} for main help"
            return 1
            ;;
    esac
}

# =============================================================================
# Specialized Help Functions
# =============================================================================

show_docker_help() {
    echo -e "${HELP_COLOR_CYAN}╔════════════════════════════════════════╗"
    echo -e "║            DOCKER HELP                ║"
    echo -e "╚════════════════════════════════════════╝${HELP_COLOR_NC}"
    echo ""
    echo -e "${HELP_COLOR_WHITE}DOCKER SERVICES:${HELP_COLOR_NC}"
    echo "  AgenticForge uses Docker Compose to manage:"
    echo "    • Redis (caching and session storage)"
    echo "    • PostgreSQL (main database)"
    echo "    • Application server"
    echo ""
    echo -e "${HELP_COLOR_WHITE}COMMON DOCKER COMMANDS:${HELP_COLOR_NC}"
    echo "  docker compose ps              # Show service status"
    echo "  docker compose logs -f         # Follow all logs"
    echo "  docker compose logs redis      # Show Redis logs"
    echo "  docker exec -it g_forge_server bash  # Shell into server"
    echo "  docker exec g_forge_redis redis-cli  # Redis CLI"
    echo ""
    echo -e "${HELP_COLOR_WHITE}TROUBLESHOOTING:${HELP_COLOR_NC}"
    echo "  • Port conflicts: Check ports 3002, 6379, 5432"
    echo "  • Storage issues: docker system prune -f"
    echo "  • Network issues: docker network ls"
    echo "  • Build problems: docker compose build --no-cache"
    echo ""
    echo -e "${HELP_COLOR_WHITE}CONFIGURATION:${HELP_COLOR_NC}"
    echo "  Configuration file: docker-compose.yml"
    echo "  Environment: .env file"
    echo "  Data persistence: Named Docker volumes"
}

show_testing_help() {
    echo -e "${HELP_COLOR_CYAN}╔════════════════════════════════════════╗"
    echo -e "║            TESTING HELP                ║"
    echo -e "╚════════════════════════════════════════╝${HELP_COLOR_NC}"
    echo ""
    echo -e "${HELP_COLOR_WHITE}TEST TYPES:${HELP_COLOR_NC}"
    echo ""
    echo -e "  ${HELP_COLOR_GREEN}Unit Tests:${HELP_COLOR_NC}"
    echo "    • Fast, isolated component tests"
    echo "    • No external dependencies required"
    echo "    • Command: ./run-v2.sh test:unit"
    echo ""
    echo -e "  ${HELP_COLOR_GREEN}Integration Tests:${HELP_COLOR_NC}"
    echo "    • End-to-end functionality tests"
    echo "    • Requires running services"
    echo "    • Command: ./run-v2.sh test:integration"
    echo ""
    echo -e "${HELP_COLOR_WHITE}TEST EXECUTION:${HELP_COLOR_NC}"
    echo "  ./run-v2.sh test:unit          # Unit tests only"
    echo "  ./run-v2.sh test:integration   # Integration tests only"
    echo "  ./run-v2.sh test:all           # All tests"
    echo ""
    echo -e "${HELP_COLOR_WHITE}TEST REQUIREMENTS:${HELP_COLOR_NC}"
    echo "  Unit Tests:         No special requirements"
    echo "  Integration Tests:  Services must be running"
    echo ""
    echo -e "${HELP_COLOR_WHITE}TEST OUTPUT:${HELP_COLOR_NC}"
    echo "  Logs: /tmp/agenticforge-tests/"
    echo "  Reports: Detailed pass/fail analysis"
    echo "  Coverage: Available with test:coverage command"
    echo ""
    echo -e "${HELP_COLOR_WHITE}TROUBLESHOOTING TESTS:${HELP_COLOR_NC}"
    echo "  • Check service status: ./run-v2.sh status"
    echo "  • View test logs in /tmp/agenticforge-tests/"
    echo "  • Clear test cache: rm -rf /tmp/agenticforge-tests/"
}

show_troubleshooting_help() {
    echo -e "${HELP_COLOR_CYAN}╔════════════════════════════════════════╗"
    echo -e "║         TROUBLESHOOTING HELP           ║"
    echo -e "╚════════════════════════════════════════╝${HELP_COLOR_NC}"
    echo ""
    echo -e "${HELP_COLOR_WHITE}COMMON ISSUES:${HELP_COLOR_NC}"
    echo ""
    echo -e "${HELP_COLOR_YELLOW}1. Services won't start:${HELP_COLOR_NC}"
    echo "   • Check port availability: netstat -tulpn | grep -E ':(3002|6379|5432)'"
    echo "   • Check Docker: docker info"
    echo "   • Check logs: ./run-v2.sh menu → option 8"
    echo ""
    echo -e "${HELP_COLOR_YELLOW}2. Build failures:${HELP_COLOR_NC}"
    echo "   • Clean rebuild: ./run-v2.sh rebuild-all"
    echo "   • Check Node.js version: node --version (>=18 required)"
    echo "   • Clear caches: rm -rf node_modules packages/*/node_modules"
    echo ""
    echo -e "${HELP_COLOR_YELLOW}3. Test failures:${HELP_COLOR_NC}"
    echo "   • Verify services: ./run-v2.sh status"
    echo "   • Check test logs: /tmp/agenticforge-tests/"
    echo "   • Run tests individually: cd packages/core && pnpm test"
    echo ""
    echo -e "${HELP_COLOR_YELLOW}4. Database issues:${HELP_COLOR_NC}"
    echo "   • Check PostgreSQL: docker exec g_forge_db pg_isready"
    echo "   • Reset database: docker compose down -v && docker compose up -d"
    echo ""
    echo -e "${HELP_COLOR_YELLOW}5. Authentication errors (401):${HELP_COLOR_NC}"
    echo "   • Check AUTH_TOKEN in .env file"
    echo "   • Verify frontend/backend token sync"
    echo "   • Restart services after .env changes"
    echo ""
    echo -e "${HELP_COLOR_WHITE}LOG LOCATIONS:${HELP_COLOR_NC}"
    echo "  Application: docker compose logs"
    echo "  Worker: ./worker.log"
    echo "  Error logs: /tmp/agenticforge-errors.log"
    echo "  Performance: /tmp/agenticforge-perf.log"
    echo ""
    echo -e "${HELP_COLOR_WHITE}SYSTEM REQUIREMENTS:${HELP_COLOR_NC}"
    echo "  • Docker & Docker Compose"
    echo "  • Node.js 18+ with pnpm"
    echo "  • 4GB+ RAM recommended"
    echo "  • 10GB+ free disk space"
}

show_development_help() {
    echo -e "${HELP_COLOR_CYAN}╔════════════════════════════════════════╗"
    echo -e "║          DEVELOPMENT HELP              ║"
    echo -e "╚════════════════════════════════════════╝${HELP_COLOR_NC}"
    echo ""
    echo -e "${HELP_COLOR_WHITE}DEVELOPMENT WORKFLOW:${HELP_COLOR_NC}"
    echo ""
    echo -e "1. ${HELP_COLOR_GREEN}Initial Setup:${HELP_COLOR_NC}"
    echo "   ./run-v2.sh start              # Start all services"
    echo "   ./run-v2.sh test:unit          # Verify installation"
    echo ""
    echo -e "2. ${HELP_COLOR_GREEN}Daily Development:${HELP_COLOR_NC}"
    echo "   • Edit code in packages/core/ or packages/ui/"
    echo "   • Auto-rebuild on changes (hot reload enabled)"
    echo "   • Run tests: ./run-v2.sh test:unit"
    echo ""
    echo -e "3. ${HELP_COLOR_GREEN}Before Committing:${HELP_COLOR_NC}"
    echo "   ./run-v2.sh test:all           # Full test suite"
    echo "   pnpm run lint                  # Code linting"
    echo "   pnpm run format                # Code formatting"
    echo ""
    echo -e "${HELP_COLOR_WHITE}PROJECT STRUCTURE:${HELP_COLOR_NC}"
    echo "  packages/core/     Backend API and worker"
    echo "  packages/ui/       Frontend React application"
    echo "  scripts/           Management scripts"
    echo "  docker-compose.yml Container orchestration"
    echo ""
    echo -e "${HELP_COLOR_WHITE}USEFUL COMMANDS:${HELP_COLOR_NC}"
    echo "  pnpm run build                 # Build all packages"
    echo "  pnpm run typecheck             # TypeScript checking"
    echo "  docker exec -it g_forge_server bash  # Server shell"
    echo ""
    echo -e "${HELP_COLOR_WHITE}DEBUGGING:${HELP_COLOR_NC}"
    echo "  • Check logs: ./run-v2.sh menu → option 5 (Worker logs)"
    echo "  • Debug mode: NODE_ENV=development in .env"
    echo "  • Database inspection: docker exec -it g_forge_db psql -U user gforge"
}

show_deployment_help() {
    echo -e "${HELP_COLOR_CYAN}╔════════════════════════════════════════╗"
    echo -e "║          DEPLOYMENT HELP               ║"
    echo -e "╚════════════════════════════════════════╝${HELP_COLOR_NC}"
    echo ""
    echo -e "${HELP_COLOR_WHITE}DEPLOYMENT CHECKLIST:${HELP_COLOR_NC}"
    echo ""
    echo -e "□ Run full test suite: ${HELP_COLOR_GREEN}./run-v2.sh test:all${HELP_COLOR_NC}"
    echo -e "□ Build production assets: ${HELP_COLOR_GREEN}NODE_ENV=production pnpm run build${HELP_COLOR_NC}"
    echo -e "□ Update version: ${HELP_COLOR_GREEN}./scripts/increment-version.cjs${HELP_COLOR_NC}"
    echo -e "□ Verify environment configuration"
    echo -e "□ Test Docker build: ${HELP_COLOR_GREEN}docker compose build${HELP_COLOR_NC}"
    echo ""
    echo -e "${HELP_COLOR_WHITE}ENVIRONMENT VARIABLES:${HELP_COLOR_NC}"
    echo "  Required for production:"
    echo "    • PUBLIC_PORT (default: 8080)"
    echo "    • WEB_PORT (default: 3002)"
    echo "    • AUTH_TOKEN (generate secure token)"
    echo "    • POSTGRES_PASSWORD (generate secure password)"
    echo "    • LLM_API_KEY (for AI functionality)"
    echo ""
    echo -e "${HELP_COLOR_WHITE}PRODUCTION DEPLOYMENT:${HELP_COLOR_NC}"
    echo "  1. Set NODE_ENV=production"
    echo "  2. Configure secure AUTH_TOKEN"
    echo "  3. Use external PostgreSQL/Redis for scale"
    echo "  4. Set up SSL/TLS termination"
    echo "  5. Configure log aggregation"
    echo ""
    echo -e "${HELP_COLOR_WHITE}MONITORING:${HELP_COLOR_NC}"
    echo "  • Health endpoint: /api/health"
    echo "  • Docker health checks enabled"
    echo "  • Log files in /tmp/agenticforge-*"
}

show_performance_help() {
    echo -e "${HELP_COLOR_CYAN}╔════════════════════════════════════════╗"
    echo -e "║          PERFORMANCE HELP              ║"
    echo -e "╚════════════════════════════════════════╝${HELP_COLOR_NC}"
    echo ""
    echo -e "${HELP_COLOR_WHITE}PERFORMANCE FEATURES:${HELP_COLOR_NC}"
    echo ""
    echo -e "• ${HELP_COLOR_GREEN}Intelligent Caching:${HELP_COLOR_NC}"
    echo "  - Docker build cache optimization"
    echo "  - NPM dependency caching"
    echo "  - Operation result caching"
    echo ""
    echo -e "• ${HELP_COLOR_GREEN}Parallel Execution:${HELP_COLOR_NC}"
    echo "  - Concurrent package building"
    echo "  - Parallel test execution"
    echo "  - Resource-aware job scheduling"
    echo ""
    echo -e "• ${HELP_COLOR_GREEN}Resource Monitoring:${HELP_COLOR_NC}"
    echo "  - Real-time CPU/memory tracking"
    echo "  - Disk space monitoring"
    echo "  - Performance metrics logging"
    echo ""
    echo -e "${HELP_COLOR_WHITE}PERFORMANCE TUNING:${HELP_COLOR_NC}"
    echo "  MAX_PARALLEL_JOBS=4           # Adjust for your CPU"
    echo "  CACHE_TTL=3600                # Cache duration (seconds)"
    echo "  TEST_TIMEOUT=300              # Test timeout (seconds)"
    echo ""
    echo -e "${HELP_COLOR_WHITE}MONITORING COMMANDS:${HELP_COLOR_NC}"
    echo "  docker stats                   # Container resource usage"
    echo "  tail -f /tmp/agenticforge-perf.log  # Performance log"
    echo "  df -h                         # Disk usage"
    echo "  free -h                       # Memory usage"
}

show_environment_help() {
    echo -e "${HELP_COLOR_CYAN}╔════════════════════════════════════════╗"
    echo -e "║          ENVIRONMENT HELP              ║"
    echo -e "╚════════════════════════════════════════╝${HELP_COLOR_NC}"
    echo ""
    echo -e "${HELP_COLOR_WHITE}ENVIRONMENT CONFIGURATION:${HELP_COLOR_NC}"
    echo ""
    echo -e "${HELP_COLOR_GREEN}.env file variables:${HELP_COLOR_NC}"
    echo ""
    echo -e "  ${HELP_COLOR_YELLOW}Application:${HELP_COLOR_NC}"
    echo "    PUBLIC_PORT=8080             # Main application port"
    echo "    WEB_PORT=3002                # Frontend development port"
    echo "    NODE_ENV=development         # Environment mode"
    echo ""
    echo -e "  ${HELP_COLOR_YELLOW}Database:${HELP_COLOR_NC}"
    echo "    POSTGRES_DB=gforge           # Database name"
    echo "    POSTGRES_USER=user           # Database user"
    echo "    POSTGRES_PASSWORD=...        # Database password"
    echo ""
    echo -e "  ${HELP_COLOR_YELLOW}Security:${HELP_COLOR_NC}"
    echo "    AUTH_TOKEN=...               # Authentication token"
    echo ""
    echo -e "  ${HELP_COLOR_YELLOW}LLM Configuration:${HELP_COLOR_NC}"
    echo "    LLM_API_KEY=...              # API key for LLM providers"
    echo "    LLM_MODEL_NAME=...           # Preferred model"
    echo "    LLM_PROVIDER=...             # Provider (openai, google, etc.)"
    echo ""
    echo -e "${HELP_COLOR_WHITE}ENVIRONMENT SETUP:${HELP_COLOR_NC}"
    echo "  1. Copy .env.example to .env (if available)"
    echo "  2. Generate secure tokens:"
    echo "     AUTH_TOKEN=\$(openssl rand -hex 32)"
    echo "  3. Configure LLM provider credentials"
    echo "  4. Restart services after changes"
    echo ""
    echo -e "${HELP_COLOR_WHITE}TROUBLESHOOTING:${HELP_COLOR_NC}"
    echo "  • Missing .env: Script will create basic version"
    echo "  • Invalid tokens: Regenerate with openssl"
    echo "  • Port conflicts: Change PORT values"
}

# =============================================================================
# Interactive Help
# =============================================================================

show_interactive_help() {
    echo -e "${HELP_COLOR_WHITE}Interactive Menu Help:${HELP_COLOR_NC}"
    echo ""
    echo "Navigation:"
    echo "  • Use number keys to select options"
    echo "  • Press Enter to execute"
    echo "  • Option 15 to exit"
    echo ""
    echo "Menu Categories:"
    echo "  1-8:   Docker & Service Management"
    echo "  9-11:  Testing & Quality Assurance"
    echo "  12-14: Code Quality Tools"
    echo ""
    echo "Useful Options:"
    echo "  5: View worker logs in real-time"
    echo "  6: Open container shell for debugging"
    echo "  8: View Docker container logs"
    echo ""
    echo -e "Press any key to return to menu..."
    read -r
}

# =============================================================================
# Context-Aware Help
# =============================================================================

show_contextual_help() {
    local context="${1:-}"
    
    case "$context" in
        "startup_error")
            echo -e "${HELP_COLOR_YELLOW}⚠️ Service startup failed${HELP_COLOR_NC}"
            echo "Try these steps:"
            echo "1. Check Docker daemon: docker info"
            echo "2. Check port availability: netstat -tulpn | grep -E ':(3002|6379|5432)'"
            echo "3. View logs: docker compose logs"
            echo "4. Clean restart: docker compose down && docker compose up -d"
            ;;
        "test_failure")
            echo -e "${HELP_COLOR_YELLOW}⚠️ Tests failed${HELP_COLOR_NC}"
            echo "Debugging steps:"
            echo "1. Check service status: ./run-v2.sh status"
            echo "2. View test logs: /tmp/agenticforge-tests/"
            echo "3. Run single package: cd packages/core && pnpm test"
            echo "4. Check dependencies: pnpm install"
            ;;
        "build_error")
            echo -e "${HELP_COLOR_YELLOW}⚠️ Build failed${HELP_COLOR_NC}"
            echo "Recovery steps:"
            echo "1. Clear caches: rm -rf node_modules packages/*/node_modules"
            echo "2. Reinstall: pnpm install"
            echo "3. Check Node version: node --version (>=18 required)"
            echo "4. Full rebuild: ./run-v2.sh rebuild-all"
            ;;
        *)
            show_main_help
            ;;
    esac
}

# =============================================================================
# Help Utilities
# =============================================================================

help_log() {
    local message="${1:-}"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "$timestamp [HELP] $message" >> "$HELP_DIR/help.log" 2>/dev/null || true
}

# =============================================================================
# Module Status
# =============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "Help System Module v1.0.0"
    echo "This module should be sourced, not executed directly."
    exit 1
fi