#!/bin/bash

# =============================================================================
# AgenticForge Run Script
# =============================================================================
# Script for running various checks and operations as referenced by the system
# =============================================================================

set -euo pipefail

# Script metadata
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
readonly COLOR_RED='\033[0;31m'
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

show_help() {
    echo "AgenticForge Run Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  all-checks    Run all quality checks (lint, typecheck, tests)"
    echo "  small-checks  Run basic quality checks (lint, typecheck)"
    echo "  rebuild       Rebuild the project"
    echo "  restart       Restart services"
    echo "  help          Show this help message"
    echo ""
}

# Run all quality checks
all_checks() {
    echo -e "${COLOR_BLUE}🔍 Running all quality checks...${NC}"
    
    # Run linting
    echo -e "${COLOR_CYAN}📝 Running linter...${NC}"
    cd "$SCRIPT_DIR" && pnpm run lint
    
    # Run type checking
    echo -e "${COLOR_CYAN}🔍 Running type check...${NC}"
    cd "$SCRIPT_DIR" && pnpm run typecheck
    
    # Run unit tests
    echo -e "${COLOR_CYAN}🧪 Running unit tests...${NC}"
    cd "$SCRIPT_DIR" && pnpm run test:unit
    
    # Run integration tests
    echo -e "${COLOR_CYAN}🔗 Running integration tests...${NC}"
    cd "$SCRIPT_DIR" && pnpm run test:integration
    
    echo -e "${COLOR_GREEN}✅ All checks completed successfully!${NC}"
}

# Run basic quality checks
small_checks() {
    echo -e "${COLOR_BLUE}🔍 Running small quality checks...${NC}"
    
    # Run linting
    echo -e "${COLOR_CYAN}📝 Running linter...${NC}"
    cd "$SCRIPT_DIR" && pnpm run lint
    
    # Run type checking
    echo -e "${COLOR_CYAN}🔍 Running type check...${NC}"
    cd "$SCRIPT_DIR" && pnpm run typecheck
    
    echo -e "${COLOR_GREEN}✅ Small checks completed successfully!${NC}"
}

# Rebuild the project
rebuild() {
    echo -e "${COLOR_BLUE}🔨 Rebuilding project...${NC}"
    cd "$SCRIPT_DIR" && pnpm run build
    echo -e "${COLOR_GREEN}✅ Project rebuilt successfully!${NC}"
}

# Restart services
restart() {
    echo -e "${COLOR_YELLOW}🔄 Restarting services...${NC}"
    cd "$SCRIPT_DIR" && ./run-v2.sh restart
    echo -e "${COLOR_GREEN}✅ Services restarted successfully!${NC}"
}

# Main command router
main() {
    if [[ $# -eq 0 ]]; then
        show_help
        exit 1
    fi
    
    case "$1" in
        all-checks)
            all_checks
            ;;
        small-checks)
            small_checks
            ;;
        rebuild)
            rebuild
            ;;
        restart)
            restart
            ;;
        help|-h|--help)
            show_help
            ;;
        *)
            echo -e "${COLOR_RED}❌ Unknown command: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"