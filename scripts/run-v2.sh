#!/bin/bash

# =============================================================================
# AgenticForge Management Script v2.0.0
# =============================================================================
# Modern modular script with comprehensive error handling, performance 
# optimization, and testing framework according to project specifications.
# =============================================================================

set -eo pipefail  # Exit on error and pipe failures, allow unset variables for optional params

# Script metadata
readonly SCRIPT_VERSION="2.0.0"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
readonly LIB_DIR="$SCRIPT_DIR/lib"

# Colors for output
readonly COLOR_RED='\033[0;31m'
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_CYAN='\033[0;36m'
readonly COLOR_ORANGE='\033[0;33m'
readonly NC='\033[0m' # No Color

# Redis configuration
readonly REDIS_PORT_STD=6379

# Display banner
echo -e "${COLOR_ORANGE}🚀 AgenticForge Management Script v${SCRIPT_VERSION}${NC}"
echo -e "${COLOR_CYAN}📂 Working directory: ${ROOT_DIR}${NC}"

# Load modular components
if [[ -f "$LIB_DIR/error-handling.sh" ]]; then
    source "$LIB_DIR/error-handling.sh"
    initialize_error_handling
    echo -e "${COLOR_GREEN}✅ Loaded error handling module${NC}"
else
    echo -e "${COLOR_YELLOW}⚠️ Error handling module not available${NC}"
    # Basic error handling fallback
    log_info() { echo -e "[INFO]  $(date '+%Y-%m-%d %H:%M:%S'): $1"; }
    log_error() { echo -e "[ERROR] $(date '+%Y-%m-%d %H:%M:%S'): $1" >&2; }
    start_timer() { echo -e "[INFO]  $(date '+%Y-%m-%d %H:%M:%S'): Starting: $1"; }
    end_timer() { echo -e "[INFO]  $(date '+%Y-%m-%d %H:%M:%S'): Completed successfully: $1"; }
fi

if [[ -f "$LIB_DIR/performance.sh" ]]; then
    source "$LIB_DIR/performance.sh"
    init_performance_system
    echo -e "${COLOR_GREEN}✅ Loaded performance module${NC}"
else
    echo -e "${COLOR_YELLOW}⚠️ Performance module not available${NC}"
    # Basic performance fallbacks
    start_timer() { echo -e "[INFO]  $(date '+%Y-%m-%d %H:%M:%S'): Starting: $1"; }
    end_timer() { echo -e "[INFO]  $(date '+%Y-%m-%d %H:%M:%S'): Completed: $1"; }
fi

if [[ -f "$LIB_DIR/testing.sh" ]]; then
    source "$LIB_DIR/testing.sh"
    echo -e "${COLOR_GREEN}✅ Loaded testing module${NC}"
else
    echo -e "${COLOR_YELLOW}⚠️ Testing module not available${NC}"
fi

if [[ -f "$LIB_DIR/help-system.sh" ]]; then
    source "$LIB_DIR/help-system.sh"
    initialize_help_system 2>/dev/null || true
    echo -e "${COLOR_GREEN}✅ Loaded help system${NC}"
else
    echo -e "${COLOR_YELLOW}⚠️ Help system not available${NC}"
fi

# =============================================================================
# Environment Management
# =============================================================================

setup_environment() {
    echo -e "${COLOR_BLUE}🔧 Setting up environment...${NC}"
    
    cd "$ROOT_DIR"
    
    # Create .env if it doesn't exist
    if [[ ! -f ".env" ]]; then
        echo -e "${COLOR_YELLOW}📝 Creating .env file...${NC}"
        cat > .env << EOF
# AgenticForge Configuration
PUBLIC_PORT=8080
WEB_PORT=3002
REDIS_PORT=$REDIS_PORT_STD
POSTGRES_DB=gforge
POSTGRES_USER=user
POSTGRES_PASSWORD=secure_$(openssl rand -hex 4)
AUTH_TOKEN=$(openssl rand -hex 16)
LLM_API_KEY=your_api_key_here
NODE_ENV=development
LOG_LEVEL=info
EOF
        echo -e "${COLOR_GREEN}✅ Created .env file${NC}"
    fi
    
    # Load environment
    if [[ -f ".env" ]]; then
        set -a
        source .env
        set +a
    fi
    
    echo -e "${COLOR_GREEN}✅ Environment setup complete${NC}"
}

# =============================================================================
# Service Management
# =============================================================================

start_services() {
    echo -e "${COLOR_BLUE}🚀 Starting services...${NC}"
    
    setup_environment
    
    # Start Docker services
    echo -e "${COLOR_YELLOW}🐳 Starting Docker containers...${NC}"
    docker compose up -d
    
    # Health checks
    echo -e "${COLOR_YELLOW}🏥 Waiting for services...${NC}"
    
    # Wait for Redis
    for i in {1..30}; do
        if docker exec g_forge_redis redis-cli ping >/dev/null 2>&1; then
            echo -e "${COLOR_GREEN}✅ Redis is ready${NC}"
            break
        fi
        [[ $i -eq 30 ]] && { echo -e "${COLOR_RED}❌ Redis failed to start${NC}"; return 1; }
        sleep 1
    done
    
    # Start worker
    start_worker
    
    echo -e "${COLOR_GREEN}🎉 All services started!${NC}"
}

start_worker() {
    echo -e "${COLOR_YELLOW}👷 Starting worker...${NC}"
    
    cd "$ROOT_DIR/packages/core"
    
    # Build if needed
    if [[ ! -d "dist" ]]; then
        echo -e "${COLOR_BLUE}📦 Building core package...${NC}"
        pnpm run build
    fi
    
    # Start worker
    nohup node dist/worker.js > "$ROOT_DIR/worker.log" 2>&1 &
    echo $! > "$ROOT_DIR/worker.pid"
    
    echo -e "${COLOR_GREEN}✅ Worker started${NC}"
}

stop_services() {
    echo -e "${COLOR_YELLOW}🛑 Stopping services...${NC}"
    
    # Stop worker
    if [[ -f "$ROOT_DIR/worker.pid" ]]; then
        local pid
        pid=$(cat "$ROOT_DIR/worker.pid")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            rm -f "$ROOT_DIR/worker.pid"
        fi
    fi
    
    # Stop Docker
    cd "$ROOT_DIR"
    docker compose down
    
    echo -e "${COLOR_GREEN}✅ Services stopped${NC}"
}

# =============================================================================
# Build Functions
# =============================================================================

rebuild_all() {
    echo -e "${COLOR_BLUE}🔄 Complete rebuild...${NC}"
    
    start_timer "rebuild_all"
    
    stop_services
    
    # Clean builds
    rm -rf packages/*/dist
    
    # Build packages
    echo -e "${COLOR_YELLOW}📦 Building packages...${NC}"
    
    cd "$ROOT_DIR/packages/core"
    pnpm install && pnpm run build
    
    cd "$ROOT_DIR/packages/ui"  
    pnpm install && NODE_ENV=production pnpm run build
    
    # Build Docker
    cd "$ROOT_DIR"
    echo -e "${COLOR_YELLOW}🐳 Building Docker images...${NC}"
    export DOCKER_BUILDKIT=1
    docker compose build --no-cache
    
    start_services
    
    end_timer "rebuild_all"
    echo -e "${COLOR_GREEN}🎉 Rebuild complete!${NC}"
}

# =============================================================================
# Testing Functions (separated as per specifications)
# =============================================================================

run_unit_tests() {
    echo -e "${COLOR_BLUE}🔬 Running unit tests only...${NC}"
    
    local total_failures=0
    local test_start_time=$(date +%s)
    
    # Test core package
    echo -e "${COLOR_CYAN}Testing core package...${NC}"
    cd "$ROOT_DIR/packages/core"
    if pnpm run test:unit; then
        echo -e "${COLOR_GREEN}✅ Core unit tests passed${NC}"
    else
        echo -e "${COLOR_RED}❌ Core unit tests failed${NC}"
        ((total_failures++))
    fi
    
    # Test UI package
    echo -e "${COLOR_CYAN}Testing UI package...${NC}"
    cd "$ROOT_DIR/packages/ui"
    if pnpm run test:unit; then
        echo -e "${COLOR_GREEN}✅ UI unit tests passed${NC}"
    else
        echo -e "${COLOR_RED}❌ UI unit tests failed${NC}"
        ((total_failures++))
    fi
    
    # Summary
    local test_end_time=$(date +%s)
    local test_duration=$((test_end_time - test_start_time))
    
    echo -e "\n${COLOR_CYAN}=== Unit Test Summary ===${NC}"
    echo -e "Duration: ${test_duration}s"
    
    if [ $total_failures -eq 0 ]; then
        echo -e "${COLOR_GREEN}🎉 All unit tests passed!${NC}"
        return 0
    else
        echo -e "${COLOR_RED}💥 $total_failures package(s) failed unit tests${NC}"
        return 1
    fi
}

run_integration_tests() {
    echo -e "${COLOR_BLUE}🔗 Running integration tests...${NC}"
    
    # Check if services are running
    if ! docker compose ps | grep -q "Up"; then
        echo -e "${COLOR_RED}❌ Services not running. Please start services first.${NC}"
        echo -e "${COLOR_YELLOW}Run: $0 start${NC}"
        return 1
    fi
    
    local total_failures=0
    local test_start_time=$(date +%s)
    
    # Test core integration
    echo -e "${COLOR_CYAN}Testing core integration...${NC}"
    cd "$ROOT_DIR/packages/core"
    if pnpm run test:integration 2>/dev/null || pnpm run test; then
        echo -e "${COLOR_GREEN}✅ Core integration tests passed${NC}"
    else
        echo -e "${COLOR_RED}❌ Core integration tests failed${NC}"
        ((total_failures++))
    fi
    
    # Summary
    local test_end_time=$(date +%s)
    local test_duration=$((test_end_time - test_start_time))
    
    echo -e "\n${COLOR_CYAN}=== Integration Test Summary ===${NC}"
    echo -e "Duration: ${test_duration}s"
    
    if [ $total_failures -eq 0 ]; then
        echo -e "${COLOR_GREEN}🎉 All integration tests passed!${NC}"
        return 0
    else
        echo -e "${COLOR_RED}💥 $total_failures package(s) failed integration tests${NC}"
        return 1
    fi
}

run_all_tests() {
    echo -e "${COLOR_BLUE}🧪 Running all tests...${NC}"
    
    local unit_result=0
    local integration_result=0
    
    run_unit_tests || unit_result=$?
    run_integration_tests || integration_result=$?
    
    if [ $unit_result -eq 0 ] && [ $integration_result -eq 0 ]; then
        echo -e "${COLOR_GREEN}🎉 All tests passed!${NC}"
        return 0
    else
        echo -e "${COLOR_RED}💥 Some tests failed${NC}"
        return 1
    fi
}

# =============================================================================
# Menu System
# =============================================================================

show_menu() {
    clear
    echo -e "${COLOR_ORANGE}"
    echo '    ╔══════════════════════════════════╗'
    echo '    ║        A G E N T I C F O R G E   ║'
    echo '    ╚══════════════════════════════════╝'
    echo -e "${NC}"
    echo -e "──────────────────────────────────────────"
    echo -e "    ${COLOR_CYAN}Docker & Services${NC}"
    printf "    1) ${COLOR_GREEN}🟢 Start Services${NC}            5) ${COLOR_BLUE}📊 Worker Logs${NC}\n"
    printf "    2) ${COLOR_YELLOW}🔄 Restart All${NC}               6) ${COLOR_BLUE}🐚 Container Shell${NC}\n"
    printf "    3) ${COLOR_RED}🔴 Stop Services${NC}              7) ${COLOR_BLUE}🔨 Rebuild All${NC}\n"
    printf "    4) ${COLOR_CYAN}⚡ Status${NC}                    8) ${COLOR_BLUE}🐳 Docker Logs${NC}\n"
    echo ""
    echo -e "    ${COLOR_CYAN}Testing & Quality${NC}"
    printf "    9) ${COLOR_BLUE}🔬 Unit Tests Only${NC}           12) ${COLOR_BLUE}🔍 Lint Code${NC}\n"
    printf "   10) ${COLOR_BLUE}🔗 Integration Tests${NC}         13) ${COLOR_BLUE}✨ Format Code${NC}\n"
    printf "   11) ${COLOR_BLUE}🧪 All Tests${NC}                14) ${COLOR_BLUE}📘 Type Check${NC}\n"
    echo ""
    printf "   15) ${COLOR_RED}🚪 Exit${NC}\n"
    echo ""
}

# =============================================================================
# Main Function
# =============================================================================

main() {
    cd "$ROOT_DIR"
    
    if [ "$#" -gt 0 ]; then
        case "$1" in
            start) start_services ;;
            stop) stop_services ;;
            restart) restart_all_services ;;
            status) docker compose ps ;;
            rebuild-all) rebuild_all ;;
            test:unit) run_unit_tests ;;
            test:integration) run_integration_tests ;;
            test:all) run_all_tests ;;
            help) 
                if [[ -n "$2" ]]; then
                    show_topic_help "$2"
                else
                    show_main_help
                fi
                ;;
            menu) ;; # Fallthrough to interactive menu
            *) 
                echo "Usage: $0 {start|stop|restart|status|rebuild-all|test:unit|test:integration|test:all|help|menu}"
                echo ""
                echo "Available commands:"
                echo "  start            - Start all services"
                echo "  stop             - Stop all services" 
                echo "  restart          - Restart all services"
                echo "  status           - Show service status"
                echo "  rebuild-all      - Complete rebuild"
                echo "  test:unit        - Run unit tests only"
                echo "  test:integration - Run integration tests"
                echo "  test:all         - Run all tests"
                echo "  help [topic]     - Show help (topics: docker, testing, troubleshooting)"
                echo "  menu             - Interactive menu"
                exit 1
                ;;
        esac
        if [ "$1" != "menu" ]; then
            exit 0
        fi
    fi

    while true; do
        show_menu
        read -p "Choose an option: " choice
        echo ""
        case "$choice" in
            1) start_services ;;
            2) restart_all_services ;;
            3) stop_services ;;
            4) docker compose ps ;;
            5) tail -f "$ROOT_DIR/worker.log" 2>/dev/null || echo "No worker log found" ;;
            6) docker exec -it g_forge_server bash ;;
            7) rebuild_all ;;
            8) docker compose logs -f ;;
            9) run_unit_tests ;;
            10) run_integration_tests ;;
            11) run_all_tests ;;
            12) cd "$ROOT_DIR" && pnpm run lint ;;
            13) cd "$ROOT_DIR" && pnpm run format ;;
            14) cd "$ROOT_DIR" && pnpm run typecheck ;;
            15) echo -e "${COLOR_CYAN}Goodbye!${NC}"; exit 0 ;;
            *) echo -e "${COLOR_RED}Invalid option, please try again.${NC}" ;;
        esac
        echo -e "\nPress Enter to continue..."
        read -r
    done
}

# Helper function for restart
restart_all_services() {
    stop_services
    start_services
}

main "$@"