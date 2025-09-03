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
readonly ROOT_DIR="$SCRIPT_DIR"
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
# Automated Deployment Functions
# =============================================================================

# Silent automated installation
automated_install() {
    local skip_prompts=${1:-false}
    
    echo -e "${COLOR_BLUE}🤖 Starting automated installation...${NC}"
    
    # Auto-install missing dependencies if possible
    if [[ "$skip_prompts" == "true" ]]; then
        auto_install_dependencies
    else
        check_prerequisites
    fi
    
    # Create directory structure
    ensure_directory_structure
    
    # Setup environment
    setup_environment
    
    # Install Node dependencies
    echo -e "${COLOR_CYAN}📦 Installing Node.js dependencies...${NC}"
    if ! install_node_dependencies; then
        echo -e "${COLOR_RED}❌ Failed to install dependencies${NC}"
        return 1
    fi
    
    # Build application
    echo -e "${COLOR_CYAN}🏗️ Building application...${NC}"
    if ! build_application; then
        echo -e "${COLOR_RED}❌ Build failed${NC}"
        return 1
    fi
    
    # Start services
    echo -e "${COLOR_CYAN}🚀 Starting services...${NC}"
    if ! start_services_silent; then
        echo -e "${COLOR_RED}❌ Failed to start services${NC}"
        return 1
    fi
    
    # Mark installation complete
    touch "$ROOT_DIR/.setup_complete"
    
    echo -e "\n${COLOR_GREEN}✅ Automated installation completed successfully!${NC}"
    show_post_install_info
    
    return 0
}

# Auto-install dependencies where possible
auto_install_dependencies() {
    echo -e "${COLOR_BLUE}🔧 Auto-installing dependencies...${NC}"
    
    # Try to install pnpm if Node.js is available
    if command -v npm >/dev/null 2>&1 && ! command -v pnpm >/dev/null 2>&1; then
        echo -e "${COLOR_YELLOW}📦 Installing pnpm...${NC}"
        if npm install -g pnpm >/dev/null 2>&1; then
            echo -e "${COLOR_GREEN}✅ pnpm installed successfully${NC}"
        else
            echo -e "${COLOR_YELLOW}⚠️ Could not install pnpm automatically${NC}"
        fi
    fi
    
    # Check Docker availability
    if ! command -v docker >/dev/null 2>&1; then
        echo -e "${COLOR_RED}❌ Docker is required but not installed${NC}"
        echo -e "${COLOR_YELLOW}🐳 Please install Docker: https://docs.docker.com/get-docker/${NC}"
        return 1
    fi
    
    # Check Docker Compose
    if ! docker compose version >/dev/null 2>&1; then
        echo -e "${COLOR_RED}❌ Docker Compose is required but not available${NC}"
        return 1
    fi
    
    return 0
}

# Ensure all necessary directories exist
ensure_directory_structure() {
    echo -e "${COLOR_CYAN}📁 Ensuring directory structure...${NC}"

    local dirs=(
        "workspace"
        "logs"
        ".build-cache"
        "packages/core/dist"
        "packages/ui/dist"
    )

    for dir in "${dirs[@]}"; do
        if [[ ! -d "$ROOT_DIR/$dir" ]]; then
            mkdir -p "$ROOT_DIR/$dir"
        fi
    done

    # Set up workspace structure for production
    setup_workspace_structure

    echo -e "${COLOR_GREEN}✅ Directory structure ready${NC}"
}

# Set up production workspace structure
setup_workspace_structure() {
    echo -e "${COLOR_CYAN}🔧 Setting up system workspace structure...${NC}"

    # Use system workspace path from environment
    local workspace_dir="$HOME/agenticforge-workspace"

    # Create workspace directory if it doesn't exist
    if [[ ! -d "$workspace_dir" ]]; then
        mkdir -p "$workspace_dir"
        echo -e "${COLOR_GREEN}✅ Created system workspace: $workspace_dir${NC}"
    else
        echo -e "${COLOR_BLUE}ℹ️ System workspace already exists: $workspace_dir${NC}"
    fi

    # Create workspace subdirectories
    local subdirs=("projects" "temp" "logs" "data" "backups")
    for subdir in "${subdirs[@]}"; do
        if [[ ! -d "$workspace_dir/$subdir" ]]; then
            mkdir -p "$workspace_dir/$subdir"
            echo -e "${COLOR_GREEN}✅ Created $workspace_dir/$subdir${NC}"
        fi
    done

    # Create README if it doesn't exist
    if [[ ! -f "$workspace_dir/README.md" ]]; then
        cat > "$workspace_dir/README.md" << 'EOF'
# AgenticForge System Workspace

Ce workspace système est utilisé par AgenticForge pour stocker les fichiers et données de l'agent en production.

## Structure des dossiers

- `projects/` - Projets utilisateur et code généré par l'agent
- `temp/` - Fichiers temporaires et cache
- `logs/` - Logs de l'agent et historique des opérations
- `data/` - Données persistantes et configurations
- `backups/` - Sauvegardes automatiques

## Configuration

- **Chemin:** `/home/demon/agenticforge-workspace`
- **Propriétaire:** Utilisateur système (pas Docker)
- **Accès:** Lecture/écriture pour l'utilisateur demon

## Utilisation

L'agent peut :
- Créer et modifier des fichiers dans ce workspace
- Accéder aux fichiers en dehors du workspace si demandé explicitement
- Utiliser ce dossier comme espace de travail par défaut

## Sécurité

- Fichiers en dehors du workspace nécessitent une approbation explicite
- Toutes les opérations sont tracées dans les logs
- Accès restreint aux utilisateurs autorisés

## Maintenance

Ce workspace est créé automatiquement lors de l'installation ou du rebuild du système.
EOF
        echo -e "${COLOR_GREEN}✅ Created workspace README${NC}"
    fi

    # Create .gitkeep files to ensure directories are tracked
    local keep_files=("temp/.gitkeep" "logs/.gitkeep" "data/.gitkeep" "projects/.gitkeep" "backups/.gitkeep")
    for keep_file in "${keep_files[@]}"; do
        if [[ ! -f "$workspace_dir/$keep_file" ]]; then
            touch "$workspace_dir/$keep_file"
        fi
    done

    echo -e "${COLOR_GREEN}✅ System workspace structure configured${NC}"
    echo -e "${COLOR_CYAN}📍 Workspace location: $workspace_dir${NC}"
}

# Install Node.js dependencies with retry logic
install_node_dependencies() {
    local max_retries=3
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        echo -e "${COLOR_CYAN}📦 Installing dependencies (attempt $((retry_count + 1))/$max_retries)...${NC}"
        
        if pnpm install --frozen-lockfile; then
            echo -e "${COLOR_GREEN}✅ Dependencies installed successfully${NC}"
            return 0
        elif pnpm install; then
            echo -e "${COLOR_GREEN}✅ Dependencies installed successfully${NC}"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $max_retries ]; then
            echo -e "${COLOR_YELLOW}⚠️ Retrying dependency installation...${NC}"
            # Clean cache before retry
            pnpm store prune >/dev/null 2>&1 || true
            sleep 2
        fi
    done
    
    echo -e "${COLOR_RED}❌ Failed to install dependencies after $max_retries attempts${NC}"
    return 1
}

# Build application with retry logic
build_application() {
    echo -e "${COLOR_CYAN}🔨 Building application...${NC}"
    local max_retries=2
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        echo -e "${COLOR_CYAN}🏗️ Building application (attempt $((retry_count + 1))/$max_retries)...${NC}"
        
        if pnpm run build; then
            echo -e "${COLOR_GREEN}✅ Application built successfully${NC}"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $max_retries ]; then
            echo -e "${COLOR_YELLOW}⚠️ Retrying build...${NC}"
            # Clean dist directories before retry
            rm -rf packages/*/dist
            sleep 2
        fi
    done
    
    echo -e "${COLOR_RED}❌ Failed to build application after $max_retries attempts${NC}"
    return 1
}

# Silent service startup (no interactive prompts)
start_services_silent() {
    echo -e "${COLOR_CYAN}🐳 Starting Docker services...${NC}"

    cd "$ROOT_DIR"

    # Pull images if needed
    if ! docker compose pull --quiet; then
        echo -e "${COLOR_YELLOW}⚠️ Could not pull latest images, using local versions${NC}"
    fi

    # Start services
    if ! docker compose up -d; then
        echo -e "${COLOR_RED}❌ Failed to start Docker services${NC}"
        return 1
    fi
    
    # Wait for services with timeout
    if ! wait_for_services; then
        echo -e "${COLOR_RED}❌ Services failed to start properly${NC}"
        return 1
    fi
    
    # Start worker
    if ! start_worker_silent; then
        echo -e "${COLOR_RED}❌ Failed to start worker${NC}"
        return 1
    fi

    return 0
}

# Wait for services to be ready
wait_for_services() {
    local services=("redis:Redis" "postgres:PostgreSQL" "server:Main Server")
    
    for service_info in "${services[@]}"; do
        local service_name="${service_info%%:*}"
        local service_display="${service_info##*:}"
        
        echo -n "   🟡 $service_display: "
        
        case "$service_name" in
            "redis")
                if wait_for_redis; then
                    echo -e "${COLOR_GREEN}✅ Ready${NC}"
                else
                    echo -e "${COLOR_RED}❌ Failed${NC}"
                    return 1
                fi
                ;;
            "postgres")
                if wait_for_postgres; then
                    echo -e "${COLOR_GREEN}✅ Ready${NC}"
                else
                    echo -e "${COLOR_RED}❌ Failed${NC}"
                    return 1
                fi
                ;;
            "server")
                if wait_for_server; then
                    echo -e "${COLOR_GREEN}✅ Ready${NC}"
                else
                    echo -e "${COLOR_RED}❌ Failed${NC}"
                    return 1
                fi
                ;;
        esac
    done
    
    return 0
}

# Individual service wait functions
wait_for_redis() {
    for i in {1..30}; do
        if docker exec g_forge_redis redis-cli ping >/dev/null 2>&1; then
            return 0
        fi
        sleep 1
    done
    return 1
}

wait_for_postgres() {
    for i in {1..60}; do
        if docker exec g_forge_postgres pg_isready -U "${POSTGRES_USER:-user}" >/dev/null 2>&1; then
            return 0
        fi
        sleep 1
    done
    return 1
}

wait_for_server() {
    # Use the correct port - if PUBLIC_PORT is set, use it, otherwise default to 3001
    local server_port=${PUBLIC_PORT:-3001}
    for i in {1..120}; do
        if curl -s "http://localhost:${server_port}/api/health" >/dev/null 2>&1; then
            return 0
        fi
        echo -n "."
        sleep 1
    done
    return 1
}

# Silent worker startup with duplicate prevention
start_worker_silent() {
    cd "$ROOT_DIR/packages/core"

    # Check if worker is already running
    if [[ -f "$ROOT_DIR/worker.pid" ]]; then
        local existing_pid
        existing_pid=$(cat "$ROOT_DIR/worker.pid")
        if kill -0 "$existing_pid" 2>/dev/null; then
            echo -e "${COLOR_YELLOW}⚠️ Worker already running (PID: $existing_pid)${NC}"
            echo -e "${COLOR_YELLOW}💡 Use './run-v2.sh restart-worker' to restart or './run-v2.sh stop' to stop${NC}"
            return 1
        else
            # Clean up stale PID file
            rm -f "$ROOT_DIR/worker.pid"
        fi
    fi

    # Check for other worker processes
    local worker_count
    worker_count=$(pgrep -f "node dist/worker.js" | wc -l)
    if [[ $worker_count -gt 0 ]]; then
        echo -e "${COLOR_YELLOW}⚠️ Another worker process is already running${NC}"
        echo -e "${COLOR_YELLOW}💡 Use './run-v2.sh restart-worker' to restart or stop all workers first${NC}"
        return 1
    fi

    # Start worker with FULL system access (no restrictions)
    nohup node dist/worker.js > "$ROOT_DIR/worker.log" 2>&1 &
    echo $! > "$ROOT_DIR/worker.pid"

    # Verify worker started
    sleep 2
    local pid
    pid=$(cat "$ROOT_DIR/worker.pid")
    if kill -0 "$pid" 2>/dev/null; then
        echo -e "${COLOR_GREEN}✅ Worker started (PID: $pid)${NC}"
        return 0
    else
        echo -e "${COLOR_RED}❌ Worker failed to start${NC}"
        return 1
    fi
}

# Show post-installation information
show_post_install_info() {
    echo ""
    echo -e "${COLOR_CYAN}🎉 AgenticForge is ready!${NC}"
    echo ""
    echo -e "${COLOR_BLUE}📍 Access Points:${NC}"
    echo -e "   🌐 Web Interface: ${COLOR_GREEN}http://localhost:${WEB_PORT:-3002}${NC}"
    echo -e "   🛠️ API Server: ${COLOR_GREEN}http://localhost:${PUBLIC_PORT:-8080}${NC}"
    echo ""
    echo -e "${COLOR_YELLOW}📋 Next Steps:${NC}"
    echo -e "   1. Open the web interface to configure your LLM API keys"
    echo -e "   2. Test the system with a simple query"
    echo -e "   3. Check logs if needed: ./run-v2.sh logs"
    echo ""
    echo -e "${COLOR_CYAN}🔧 Management Commands:${NC}"
    echo -e "   ./run-v2.sh status    - Check service status"
    echo -e "   ./run-v2.sh stop      - Stop all services"
    echo -e "   ./run-v2.sh restart   - Restart all services"
    echo -e "   ./run-v2.sh menu      - Interactive menu"
    echo ""
}

# =============================================================================
# Beginner-Friendly Features
# =============================================================================

# Check if this is first time running
check_first_time() {
    if [[ ! -f "$ROOT_DIR/.setup_complete" ]]; then
        return 0  # First time
    fi
    return 1  # Not first time
}

# Prerequisites checker
check_prerequisites() {
    echo -e "${COLOR_BLUE}🔍 Checking prerequisites...${NC}"
    local missing_deps=()
    
    # Check Docker
    if ! command -v docker >/dev/null 2>&1; then
        missing_deps+=("Docker")
    fi
    
    # Check Docker Compose
    if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
        missing_deps+=("Docker Compose")
    fi
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        missing_deps+=("Node.js")
    fi
    
    # Check pnpm
    if ! command -v pnpm >/dev/null 2>&1; then
        missing_deps+=("pnpm")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo -e "${COLOR_RED}❌ Missing dependencies: ${missing_deps[*]}${NC}"
        echo -e "${COLOR_YELLOW}📚 Please install missing dependencies first:${NC}"
        echo -e "   Docker: https://docs.docker.com/get-docker/"
        echo -e "   Node.js: https://nodejs.org/"
        echo -e "   pnpm: npm install -g pnpm"
        echo ""
        read -r -p "Continue anyway? (y/N): " continue_anyway
        if [[ ! "$continue_anyway" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo -e "${COLOR_GREEN}✅ All prerequisites found${NC}"
    fi
}

# First-time setup wizard
first_time_setup() {
    clear
    echo -e "${COLOR_ORANGE}"
    echo '    ╔══════════════════════════════════════════════╗'
    echo '    ║     WELCOME TO AGENTICFORGE SETUP WIZARD    ║'
    echo '    ╚══════════════════════════════════════════════╝'
    echo -e "${NC}"
    echo -e "${COLOR_CYAN}🎉 Welcome! This seems to be your first time using AgenticForge.${NC}"
    echo -e "${COLOR_CYAN}Let me guide you through the setup process.${NC}"
    echo ""
    
    check_prerequisites
    
    echo -e "${COLOR_BLUE}📝 What we'll do:${NC}"
    echo -e "   1. Create environment configuration (.env)"
    echo -e "   2. Install dependencies"
    echo -e "   3. Build the application"
    echo -e "   4. Start all services"
    echo ""
    
    read -r -p "Ready to start setup? (Y/n): " start_setup
    if [[ "$start_setup" =~ ^[Nn]$ ]]; then
        echo -e "${COLOR_YELLOW}Setup cancelled. You can run this again anytime with: ./run-v2.sh${NC}"
        exit 0
    fi
    
    guided_setup
}

# Guided setup process
guided_setup() {
    echo -e "${COLOR_BLUE}🚀 Starting guided setup...${NC}"
    
    # Step 1: Environment setup
    echo -e "\n${COLOR_CYAN}Step 1/4: Setting up environment...${NC}"
    setup_environment
    
    # Step 2: Dependencies
    echo -e "\n${COLOR_CYAN}Step 2/4: Installing dependencies...${NC}"
    cd "$ROOT_DIR"
    if ! pnpm install; then
        echo -e "${COLOR_RED}❌ Failed to install dependencies${NC}"
        echo -e "${COLOR_YELLOW}💡 Try: pnpm install --frozen-lockfile${NC}"
        return 1
    fi
    
    # Step 3: Build
    echo -e "\n${COLOR_CYAN}Step 3/4: Building application...${NC}"
    if ! pnpm run build; then
        echo -e "${COLOR_RED}❌ Build failed${NC}"
        echo -e "${COLOR_YELLOW}💡 Check the error messages above${NC}"
        return 1
    fi
    
    # Step 4: Start services
    echo -e "\n${COLOR_CYAN}Step 4/4: Starting services...${NC}"
    start_services
    
    # Mark setup as complete
    touch "$ROOT_DIR/.setup_complete"
    
    echo -e "\n${COLOR_GREEN}🎉 Setup completed successfully!${NC}"
    echo -e "${COLOR_CYAN}📱 Access your AgenticForge at:${NC}"
    echo -e "   🌐 Web Interface: http://localhost:3002"
    echo -e "   🛠️ API Server: http://localhost:8080"
    echo ""
    echo -e "${COLOR_YELLOW}💡 Next steps:${NC}"
    echo -e "   • Configure your LLM API keys in the web interface"
    echo -e "   • Check the status with: ./run-v2.sh status"
    echo -e "   • View logs with: ./run-v2.sh logs"
    echo ""
}

# Enhanced menu with descriptions
show_guided_menu() {
    clear
    echo -e "${COLOR_ORANGE}"
    echo '    ╔══════════════════════════════════╗'
    echo '    ║        A G E N T I C F O R G E   ║'
    echo '    ╚══════════════════════════════════╝'
    echo -e "${NC}"
    echo -e "──────────────────────────────────────────"
    echo -e "    ${COLOR_CYAN}🐳 Docker & Services${NC}"
    printf "    1) \033[0;32m🟢 Start Services\033[0m     - Launch all AgenticForge services\n"
    printf "    2) \033[1;33m🔄 Restart All\033[0m        - Stop and restart everything\n"
    printf "    3) \033[0;31m🔴 Stop Services\033[0m       - Shutdown all services safely\n"
    printf "    4) \033[0;36m⚡ Status\033[0m             - Check service health\n"
    printf "    5) \033[0;34m📊 Worker Logs\033[0m        - View worker process logs\n"
    printf "    6) \033[0;34m🐚 Container Shell\033[0m    - Access server container\n"
    printf "    7) \033[0;34m🔨 Rebuild All\033[0m        - Full rebuild (use if issues)\n"
    printf "    8) \033[0;34m🌐 Rebuild Web\033[0m        - Rebuild frontend only (faster)\n"
    printf "    9) \033[0;34m🐳 Docker Logs\033[0m        - View all container logs\n"
    printf "   10) \033[1;33m🔄 Restart Worker\033[0m     - Restart worker only\n"
    echo ""
    echo -e "    ${COLOR_CYAN}🔧 Development${NC}"
    printf "   11) \033[0;34m💻 Dev Server (3003)\033[0m  - Start development server on port 3003\n"
    printf "   12) \033[0;31m🛑 Stop Dev Server\033[0m     - Stop development server\n"
    printf "   13) \033[0;34m📋 Dev Server Logs\033[0m    - View development server logs\n"
    echo ""
    echo -e "    ${COLOR_CYAN}🧪 Testing & Quality${NC}"
    printf "   14) \033[0;34m🔬 Unit Tests\033[0m          - Run unit tests only\n"
    printf "   15) \033[0;34m🔗 Integration Tests\033[0m   - Test service integration\n"
    printf "   16) \033[0;34m🧪 All Tests\033[0m          - Run complete test suite\n"
    printf "   17) \033[0;34m🎯 Quality Check\033[0m       - Lint + TypeCheck + Unit Tests\n"
    printf "   18) \033[0;34m🔍 Lint Code\033[0m          - Check code quality\n"
    printf "   19) \033[0;34m✨ Format Code\033[0m        - Auto-format source code\n"
    printf "   20) \033[0;34m📘 Type Check\033[0m         - Verify TypeScript types\n"
    printf "   21) \033[0;34m🔄 Integration Test Runner\033[0m - Run comprehensive integration tests\n"
    printf "   22) \033[0;34m🔍 Check Workers\033[0m       - Monitor worker processes\n"
    printf "   23) \033[0;31m🗑️ Kill Workers\033[0m        - Kill multiple worker processes\n"
    echo ""
    printf "   24) \033[0;36m❓ Help\033[0m               - Get help and troubleshooting\n"
    printf "   25) \033[0;31m🚪 Exit\033[0m               - Close this menu\n"
    echo ""
    echo -e "${COLOR_YELLOW}💡 Tip: First time? Try option 1 to start services!${NC}"
    echo ""
}

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
    echo -e "${COLOR_BLUE}🚀 Starting AgenticForge services...${NC}"

    setup_environment

    # Check if ports are already in use
    local ports_to_check=("8080" "3002" "6379" "5432")
    for port in "${ports_to_check[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "${COLOR_YELLOW}⚠️ Port $port is already in use${NC}"
            echo -e "${COLOR_YELLOW}💡 Stop existing services first with './run-v2.sh stop'${NC}"
            return 1
        fi
    done

    echo -e "${COLOR_YELLOW}📝 Checking if dependencies are installed...${NC}"
    if [[ ! -d "node_modules" ]] || [[ ! -d "packages/core/node_modules" ]]; then
        echo -e "${COLOR_YELLOW}📦 Installing dependencies (this may take a few minutes)...${NC}"
        if ! pnpm install; then
            echo -e "${COLOR_RED}❌ Failed to install dependencies${NC}"
            echo -e "${COLOR_YELLOW}💡 Try running: pnpm install --frozen-lockfile${NC}"
            return 1
        fi
    fi

    echo -e "${COLOR_YELLOW}🚀 Application will be built inside Docker container...${NC}"
    echo -e "${COLOR_CYAN}ℹ️ Skipping local build - Docker will handle the build process${NC}"
    echo -e "${COLOR_CYAN}💡 This ensures consistency between development and production${NC}"

    # Start Docker services
    echo -e "${COLOR_YELLOW}🐳 Starting Docker containers...${NC}"
    echo -e "${COLOR_CYAN}   • This might take a few minutes on first run${NC}"
    cd "$ROOT_DIR"
    if ! docker compose up -d; then
        echo -e "${COLOR_RED}❌ Failed to start Docker services${NC}"
        echo -e "${COLOR_YELLOW}💡 Check if Docker is running: docker --version${NC}"
        return 1
    fi
    
    # Health checks with progress
    echo -e "${COLOR_YELLOW}🟡 Waiting for services to be ready...${NC}"
    
    # Wait for Redis
    echo -n "   🟡 Redis: "
    for i in {1..30}; do
        if docker exec g_forge_redis redis-cli ping >/dev/null 2>&1; then
            echo -e "${COLOR_GREEN}✅ Ready${NC}"
            break
        fi
        if [[ $i -eq 30 ]]; then
            echo -e "${COLOR_RED}❌ Failed to start (timeout)${NC}"
            echo -e "${COLOR_YELLOW}💡 Check logs: docker logs g_forge_redis${NC}"
            return 1
        fi
        echo -n "."
        sleep 1
    done
    
    # Wait for PostgreSQL
    echo -n "   🟡 PostgreSQL: "
    for i in {1..60}; do
        if docker exec g_forge_postgres pg_isready -U "${POSTGRES_USER:-user}" >/dev/null 2>&1; then
            echo -e "${COLOR_GREEN}✅ Ready${NC}"
            break
        fi
        if [[ $i -eq 60 ]]; then
            echo -e "${COLOR_RED}❌ Failed to start (timeout)${NC}"
            echo -e "${COLOR_YELLOW}💡 Check logs: docker logs g_forge_postgres${NC}"
            return 1
        fi
        echo -n "."
        sleep 1
    done
    
    # Wait for main server
    echo -n "   🟡 Main Server: "
    for i in {1..120}; do
        if curl -s "http://localhost:${PUBLIC_PORT:-8080}/api/health" >/dev/null 2>&1; then
            echo -e "${COLOR_GREEN}✅ Ready${NC}"
            break
        fi
        if [[ $i -eq 120 ]]; then
            echo -e "${COLOR_RED}❌ Failed to start (timeout)${NC}"
            echo -e "${COLOR_YELLOW}💡 Check logs: docker logs g_forge_server${NC}"
            return 1
        fi
        echo -n "."
        sleep 1
    done
    
    # Start worker
    echo -e "${COLOR_YELLOW}👷 Starting worker process...${NC}"
    start_worker
    
    echo ""
    echo -e "${COLOR_GREEN}🎉 AgenticForge started successfully!${NC}"
    echo ""
    echo -e "${COLOR_CYAN}📱 Access your application:${NC}"
    echo -e "   🌐 Web Interface: ${COLOR_BLUE}http://localhost:${WEB_PORT:-3002}${NC}"
    echo -e "   🛠️ API Server: ${COLOR_BLUE}http://localhost:${PUBLIC_PORT:-8080}${NC}"
    echo ""
    echo -e "${COLOR_YELLOW}💡 Next steps:${NC}"
    echo -e "   • Open the web interface to configure your LLM API keys"
    echo -e "   • Check service status: ./run-v2.sh status"
    echo -e "   • View logs: ./run-v2.sh logs"
    echo ""
}

start_worker() {
    echo -e "${COLOR_YELLOW}👷 Starting worker...${NC}"

    cd "$ROOT_DIR/packages/core"

    # Check if worker is already running
    if [[ -f "$ROOT_DIR/worker.pid" ]]; then
        local existing_pid
        existing_pid=$(cat "$ROOT_DIR/worker.pid")
        if kill -0 "$existing_pid" 2>/dev/null; then
            echo -e "${COLOR_YELLOW}⚠️ Worker already running (PID: $existing_pid)${NC}"
            echo -e "${COLOR_YELLOW}💡 Use './run-v2.sh restart-worker' to restart${NC}"
            return 1
        else
            rm -f "$ROOT_DIR/worker.pid"
        fi
    fi

    # Check for other worker processes
    local worker_count
    worker_count=$(pgrep -f "node dist/worker.js" | wc -l)
    if [[ $worker_count -gt 0 ]]; then
        echo -e "${COLOR_YELLOW}⚠️ Another worker process is already running${NC}"
        echo -e "${COLOR_YELLOW}💡 Use './run-v2.sh restart-worker' to restart${NC}"
        return 1
    fi

    # Build if needed
    if [[ ! -d "dist" ]]; then
        echo -e "${COLOR_BLUE}📦 Building core package...${NC}"
        pnpm run build
    fi

    # Start worker with FULL system access (no restrictions)
    nohup node dist/worker.js > "$ROOT_DIR/worker.log" 2>&1 &
    echo $! > "$ROOT_DIR/worker.pid"

    echo -e "${COLOR_GREEN}✅ Worker started${NC}"
}

restart_worker() {
    echo -e "${COLOR_YELLOW}🔄 Restarting worker...${NC}"

    # Use kill_multiple_workers instead of orphan kill logic
    echo -e "${COLOR_CYAN}🔍 Managing existing worker processes...${NC}"

    # Kill all extra workers, keeping only 1 (force mode for automated restart)
    if ! kill_multiple_workers 1 true; then
        echo -e "${COLOR_YELLOW}⚠️ Worker cleanup completed with warnings${NC}"
    fi

    # Remove old PID file
    if [[ -f "$ROOT_DIR/worker.pid" ]]; then
        rm -f "$ROOT_DIR/worker.pid"
        echo -e "${COLOR_CYAN}📝 Removed old PID file${NC}"
    fi

    # Clear old logs
    if [[ -f "$ROOT_DIR/worker.log" ]]; then
        > "$ROOT_DIR/worker.log"
        echo -e "${COLOR_CYAN}🧹 Cleared old logs${NC}"
    fi

    # Wait for processes to fully stop
    sleep 2

    # Start new worker
    cd "$ROOT_DIR/packages/core"

    # Build if needed
    if [[ ! -d "dist" ]]; then
        echo -e "${COLOR_BLUE}📦 Building core package...${NC}"
        pnpm run build
    fi

    # Start fresh worker with FULL system access (no restrictions)
    nohup node dist/worker.js > "$ROOT_DIR/worker.log" 2>&1 &
    echo $! > "$ROOT_DIR/worker.pid"

    # Verify worker started
    sleep 2
    local pid
    pid=$(cat "$ROOT_DIR/worker.pid")
    if kill -0 "$pid" 2>/dev/null; then
        echo -e "${COLOR_GREEN}✅ Worker restarted successfully (PID: $pid)${NC}"
    else
        echo -e "${COLOR_RED}❌ Worker failed to start${NC}"
        return 1
    fi
}

stop_services() {
    echo -e "${COLOR_YELLOW}🛑 Stopping services...${NC}"

    # Stop worker processes using kill_multiple_workers
    echo -e "${COLOR_CYAN}🔍 Stopping all worker processes...${NC}"

    # Kill all workers (force mode for shutdown)
    if ! kill_multiple_workers 0 true; then
        echo -e "${COLOR_YELLOW}⚠️ Some workers may still be running${NC}"
    fi

    # Also kill by PID file if it exists (fallback)
    if [[ -f "$ROOT_DIR/worker.pid" ]]; then
        local pid
        pid=$(cat "$ROOT_DIR/worker.pid")
        if kill -0 "$pid" 2>/dev/null; then
            kill -9 "$pid" 2>/dev/null || true
        fi
        rm -f "$ROOT_DIR/worker.pid"
        echo -e "${COLOR_CYAN}📝 Removed worker PID file${NC}"
    fi

    # Wait for processes to fully stop
    sleep 2

    # Stop Docker
    cd "$ROOT_DIR"
    docker compose down

    echo -e "${COLOR_GREEN}✅ Services stopped${NC}"
}

# =============================================================================
# Build Functions
# =============================================================================

rebuild_web() {
    echo -e "${COLOR_BLUE}🌐 Rebuilding frontend (web) only...${NC}"

    start_timer "rebuild_web"

    # Clean frontend build directories
    echo -e "${COLOR_YELLOW}🧹 Cleaning frontend build directories...${NC}"
    rm -rf packages/ui/dist
    rm -rf packages/ui/build
    rm -rf packages/ui/.next
    rm -rf packages/ui/.vite

    # Build frontend locally (required for Docker COPY)
    echo -e "${COLOR_YELLOW}📦 Building frontend locally for Docker...${NC}"
    cd "$ROOT_DIR/packages/ui"
    if ! pnpm install; then
        echo -e "${COLOR_RED}❌ Failed to install frontend dependencies${NC}"
        return 1
    fi

    if ! NODE_ENV=production pnpm run build; then
        echo -e "${COLOR_RED}❌ Failed to build frontend${NC}"
        return 1
    fi

    echo -e "${COLOR_GREEN}✅ Frontend built successfully${NC}"

    # Stop the web container
    cd "$ROOT_DIR"
    echo -e "${COLOR_YELLOW}🛑 Stopping web container...${NC}"
    docker compose stop web || true

    # Remove web Docker image to force complete rebuild
    echo -e "${COLOR_YELLOW}🗑️ Removing old web Docker image...${NC}"
    docker compose rm -f web || true
    docker rmi agenticforge-web:latest 2>/dev/null || true

    # Build Docker web image with no cache (fresh build)
    echo -e "${COLOR_YELLOW}🐳 Building web Docker image (no cache)...${NC}"
    echo -e "${COLOR_CYAN}   📦 Using pre-built frontend from local build${NC}"
    echo -e "${COLOR_CYAN}   🔄 This ensures clean application of modifications${NC}"
    export DOCKER_BUILDKIT=1
    if ! docker compose build --no-cache web; then
        echo -e "${COLOR_RED}❌ Failed to build web Docker image${NC}"
        return 1
    fi

    # Start the web container
    echo -e "${COLOR_YELLOW}🚀 Starting web container...${NC}"
    if ! docker compose up -d web; then
        echo -e "${COLOR_RED}❌ Failed to start web container${NC}"
        return 1
    fi

    # Wait for web to be ready
    echo -e "${COLOR_YELLOW}🟡 Waiting for web to be ready...${NC}"
    for i in {1..60}; do
        if curl -s "http://localhost:${WEB_PORT:-3002}" >/dev/null 2>&1; then
            echo -e "${COLOR_GREEN}✅ Web is ready${NC}"
            break
        fi
        if [[ $i -eq 60 ]]; then
            echo -e "${COLOR_RED}❌ Web failed to start (timeout)${NC}"
            return 1
        fi
        echo -n "."
        sleep 1
    done

    end_timer "rebuild_web"
    echo -e "${COLOR_GREEN}🎉 Frontend rebuild completed!${NC}"
    echo -e "${COLOR_CYAN}🌐 Frontend changes have been applied and deployed.${NC}"
    echo -e "${COLOR_BLUE}📱 Access your updated web interface at: http://localhost:${WEB_PORT:-3002}${NC}"
}

rebuild_all() {
    echo -e "${COLOR_BLUE}🔄 Complete rebuild...${NC}"
    
    start_timer "rebuild_all"
    
    stop_services
    
    # Clean Docker cache to ensure fresh builds
    echo -e "${COLOR_YELLOW}🧹 Cleaning Docker cache...${NC}"
    docker system prune -f
    
    # Clean builds
    echo -e "${COLOR_YELLOW}🧹 Cleaning build directories...${NC}"
    rm -rf packages/*/dist
    rm -rf packages/*/build

    # Build core package locally (required for worker that runs outside Docker)
    echo -e "${COLOR_YELLOW}📦 Building core package locally (for worker)...${NC}"
    cd "$ROOT_DIR/packages/core"
    if pnpm install && pnpm run build; then
        echo -e "${COLOR_GREEN}✅ Core package built successfully${NC}"
    else
        echo -e "${COLOR_RED}❌ Core package build failed${NC}"
        return 1
    fi

    # Build UI package locally (required for Docker COPY)
    echo -e "${COLOR_YELLOW}🌐 Building UI package locally (for Docker)...${NC}"
    cd "$ROOT_DIR/packages/ui"
    if pnpm install && NODE_ENV=production pnpm run build; then
        echo -e "${COLOR_GREEN}✅ UI package built successfully${NC}"
    else
        echo -e "${COLOR_RED}❌ UI package build failed${NC}"
        return 1
    fi

    echo -e "${COLOR_CYAN}ℹ️ Worker will run outside Docker as configured${NC}"
    echo -e "${COLOR_CYAN}💡 Core and UI packages built locally for Docker compatibility${NC}"

    # Build Docker with no cache to ensure fresh images
    cd "$ROOT_DIR"
    echo -e "${COLOR_YELLOW}🐳 Building Docker images (no cache)...${NC}"
    echo -e "${COLOR_CYAN}   📦 This may take several minutes on first run${NC}"
    echo -e "${COLOR_CYAN}   ☕ Please be patient - we're building fresh images!${NC}"
    echo -e "${COLOR_CYAN}   💡 You can follow the build progress below...${NC}"
    echo ""

    export DOCKER_BUILDKIT=1

    # Show a progress indicator while building
    echo -e "${COLOR_BLUE}🔨 Starting Docker build process...${NC}"
    if docker compose build --no-cache; then
        echo ""
        echo -e "${COLOR_GREEN}✅ Docker images built successfully!${NC}"
    else
        echo ""
        echo -e "${COLOR_RED}❌ Docker build failed${NC}"
        return 1
    fi
    
    # Restart services with proper delay to ensure system prompt reload
    echo -e "${COLOR_YELLOW}🔄 Restarting services to load updated configuration...${NC}"
    echo -e "${COLOR_CYAN}   🚀 Starting all services...${NC}"
    if restart_all_services; then
        echo -e "${COLOR_GREEN}   ✅ Services restarted successfully${NC}"
    else
        echo -e "${COLOR_RED}   ❌ Service restart failed${NC}"
        return 1
    fi

    # Wait for services to fully initialize
    echo -e "${COLOR_CYAN}⏳ Waiting for services to initialize...${NC}"
    echo -e "${COLOR_CYAN}   📡 This may take up to 2 minutes...${NC}"
    sleep 5
    echo -e "${COLOR_GREEN}   ✅ Initialization complete!${NC}"
    
    end_timer "rebuild_all"
    echo -e "${COLOR_GREEN}🎉 Complete rebuild finished!${NC}"
    echo -e "${COLOR_CYAN}💡 System prompt and configuration changes have been applied.${NC}"
}

# =============================================================================
# Testing Functions (separated as per specifications)
# =============================================================================

run_unit_tests() {
    echo -e "${COLOR_BLUE}🔬 Running unit tests only...${NC}"
    
    local total_failures=0
    local test_start_time
    test_start_time=$(date +%s)
    
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
    local test_end_time
    test_end_time=$(date +%s)
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
    local test_start_time
    test_start_time=$(date +%s)
    
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
    local test_end_time
    test_end_time=$(date +%s)
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

run_quality_check() {
    echo -e "${COLOR_BLUE}🔍 Running quality check (lint + typecheck + unit tests)...${NC}"
    
    local quality_start_time
    quality_start_time=$(date +%s)
    
    local lint_result=0
    local typecheck_result=0
    local unit_result=0
    
    # Step 1: Lint
    echo -e "\n${COLOR_CYAN}Step 1/3: Running linter...${NC}"
    cd "$ROOT_DIR"
    if pnpm run lint; then
        echo -e "${COLOR_GREEN}✅ Lint check passed${NC}"
    else
        echo -e "${COLOR_RED}❌ Lint check failed${NC}"
        lint_result=1
    fi
    
    # Step 2: TypeCheck
    echo -e "\n${COLOR_CYAN}Step 2/3: Running type check...${NC}"
    if pnpm run typecheck; then
        echo -e "${COLOR_GREEN}✅ Type check passed${NC}"
    else
        echo -e "${COLOR_RED}❌ Type check failed${NC}"
        typecheck_result=1
    fi
    
    # Step 3: Unit Tests
    echo -e "\n${COLOR_CYAN}Step 3/3: Running unit tests...${NC}"
    if run_unit_tests; then
        unit_result=0
    else
        unit_result=1
    fi
    
    # Summary
    local quality_end_time
    quality_end_time=$(date +%s)
    local quality_duration=$((quality_end_time - quality_start_time))
    
    echo -e "\n${COLOR_CYAN}=== Quality Check Summary ===${NC}"
    echo -e "Duration: ${quality_duration}s"
    
    local total_failures=$((lint_result + typecheck_result + unit_result))
    
    if [ $total_failures -eq 0 ]; then
        echo -e "${COLOR_GREEN}🎉 All quality checks passed!${NC}"
        echo -e "   ✅ Lint: passed"
        echo -e "   ✅ TypeCheck: passed"
        echo -e "   ✅ Unit Tests: passed"
        return 0
    else
        echo -e "${COLOR_RED}💥 $total_failures quality check(s) failed${NC}"
        [ $lint_result -eq 1 ] && echo -e "   ❌ Lint: failed"
        [ $typecheck_result -eq 1 ] && echo -e "   ❌ TypeCheck: failed"
        [ $unit_result -eq 1 ] && echo -e "   ❌ Unit Tests: failed"
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
    printf "    1) %s🟢 Start Services%s            5) %s📊 Worker Logs%s\n" "${COLOR_GREEN}" "${NC}" "${COLOR_BLUE}" "${NC}"
    printf "    2) %s🔄 Restart All%s               6) %s🐚 Container Shell%s\n" "${COLOR_YELLOW}" "${NC}" "${COLOR_BLUE}" "${NC}"
    printf "    3) %s🔴 Stop Services%s              7) %s🔨 Rebuild All%s\n" "${COLOR_RED}" "${NC}" "${COLOR_BLUE}" "${NC}"
    printf "    4) %s⚡ Status%s                    8) %s🐳 Docker Logs%s\n" "${COLOR_CYAN}" "${NC}" "${COLOR_BLUE}" "${NC}"
    echo ""
    echo -e "    ${COLOR_CYAN}Testing & Quality${NC}"
    printf "    9) %s🔬 Unit Tests Only%s           12) %s🔍 Lint Code%s\n" "${COLOR_BLUE}" "${NC}" "${COLOR_BLUE}" "${NC}"
    printf "   10) %s🔗 Integration Tests%s         13) %s✨ Format Code%s\n" "${COLOR_BLUE}" "${NC}" "${COLOR_BLUE}" "${NC}"
    printf "   11) %s🧪 All Tests%s                14) %s📘 Type Check%s\n" "${COLOR_BLUE}" "${NC}" "${COLOR_BLUE}" "${NC}"
    echo ""
    printf "   15) %s🚪 Exit%s\n" "${COLOR_RED}" "${NC}"
    echo ""
}

# =============================================================================
# Development Server Functions
# =============================================================================

# Start development server on port 3003
start_dev_server() {
    echo -e "${COLOR_BLUE}🚀 Starting development server on port 3003...${NC}"

    # Check if port 3003 is already in use
    if lsof -Pi :3003 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${COLOR_YELLOW}⚠️ Port 3003 is already in use${NC}"
        echo -e "${COLOR_YELLOW}💡 Use './run-v2.sh stop-dev' to stop the existing server${NC}"
        return 1
    fi

    # Stop any existing dev server
    stop_dev_server

    # Navigate to the UI package
    cd "$ROOT_DIR/packages/ui"

    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        echo -e "${COLOR_YELLOW}📦 Installing UI dependencies...${NC}"
        pnpm install
    fi

    # Set the port and start the development server in the background
    echo -e "${COLOR_GREEN}✅ Starting development server in background...${NC}"
    echo -e "${COLOR_CYAN}   🌐 Access at: http://localhost:3003${NC}"
    echo -e "${COLOR_CYAN}   📋 Logs will be available in: $ROOT_DIR/dev-server.log${NC}"

    # Start server in background and redirect output to log file
    PORT=3003 nohup pnpm run dev > "$ROOT_DIR/dev-server.log" 2>&1 &
    local dev_pid=$!

    # Save PID to file
    echo $dev_pid > "$ROOT_DIR/dev-server.pid"

    # Wait a moment for server to start
    sleep 3

    # Check if server is still running
    if kill -0 $dev_pid 2>/dev/null; then
        echo -e "${COLOR_GREEN}✅ Development server started successfully (PID: $dev_pid)${NC}"
    else
        echo -e "${COLOR_RED}❌ Development server failed to start${NC}"
        echo -e "${COLOR_YELLOW}💡 Check logs: tail -f $ROOT_DIR/dev-server.log${NC}"
        rm -f "$ROOT_DIR/dev-server.pid"
        return 1
    fi
}

# Stop development server
stop_dev_server() {
    if [[ -f "$ROOT_DIR/dev-server.pid" ]]; then
        local pid
        pid=$(cat "$ROOT_DIR/dev-server.pid")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${COLOR_YELLOW}🛑 Stopping development server (PID: $pid)...${NC}"
            kill "$pid" 2>/dev/null || true
            sleep 2
            
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                echo -e "${COLOR_YELLOW}⚠️ Force stopping development server...${NC}"
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
        rm -f "$ROOT_DIR/dev-server.pid"
        echo -e "${COLOR_GREEN}✅ Development server stopped${NC}"
    else
        echo -e "${COLOR_YELLOW}ℹ️ No development server running${NC}"
    fi
}

# =============================================================================
# Main Function
# =============================================================================

main() {
    cd "$ROOT_DIR"
    
    # Check for automated installation flags
    if [[ "$1" == "install" ]] || [[ "$1" == "deploy" ]]; then
        automated_install true
        return $?
    fi
    
    # Check for first-time setup (interactive)
    if check_first_time && [ "$#" -eq 0 ]; then
        first_time_setup
        return
    fi
    
    if [ "$#" -gt 0 ]; then
        case "$1" in
            start) 
                echo -e "${COLOR_BLUE}🚀 Starting AgenticForge services...${NC}"
                start_services 
                ;;
            stop) 
                echo -e "${COLOR_YELLOW}🛑 Stopping AgenticForge services...${NC}"
                stop_services 
                ;;
            restart) 
                echo -e "${COLOR_YELLOW}🔄 Restarting AgenticForge...${NC}"
                restart_all_services 
                ;;
            status) 
                echo -e "${COLOR_CYAN}⚡ Service Status:${NC}"
                docker compose ps 
                ;;
            rebuild-all) 
                echo -e "${COLOR_BLUE}🔨 Rebuilding everything...${NC}"
                rebuild_all 
                ;;
            rebuild-web) 
                echo -e "${COLOR_BLUE}🌐 Rebuilding frontend only...${NC}"
                rebuild_web 
                ;;
            restart-worker) 
                echo -e "${COLOR_YELLOW}🔄 Restarting worker...${NC}"
                restart_worker 
                ;;
            dev)
                echo -e "${COLOR_BLUE}🚀 Starting development server on port 3003...${NC}"
                start_dev_server
                ;;
            stop-dev)
                echo -e "${COLOR_RED}🛑 Stopping development server...${NC}"
                stop_dev_server
                ;;
            dev-logs)
                echo -e "${COLOR_BLUE}📋 Showing development server logs...${NC}"
                if [[ -f "$ROOT_DIR/dev-server.log" ]]; then
                    tail -f "$ROOT_DIR/dev-server.log"
                else
                    echo -e "${COLOR_YELLOW}⚠️ No development server log found${NC}"
                    echo -e "${COLOR_CYAN}💡 Start the dev server first with: ./run-v2.sh dev${NC}"
                fi
                ;;
            install|deploy)
                echo -e "${COLOR_BLUE}🤖 Running automated installation...${NC}"
                automated_install true
                ;;
            setup)
                echo -e "${COLOR_BLUE}🔧 Running setup wizard...${NC}"
                first_time_setup
                ;;
            test:unit) run_unit_tests ;;
            test:integration) run_integration_tests ;;
            test:all) run_all_tests ;;
            quality-check) run_quality_check ;;
            kill-workers)
                local max_workers=${2:-0}
                local force=${3:-false}
                kill_multiple_workers "$max_workers" "$force"
                ;;
            check-workers)
                if [[ -f "$ROOT_DIR/check_workers.sh" ]]; then
                    # Remove the first argument (check-workers) and pass the rest to check_workers.sh
                    shift
                    "$ROOT_DIR/check_workers.sh" "$@"
                else
                    echo -e "${COLOR_RED}❌ check_workers.sh not found${NC}"
                fi
                ;;
            help)
                if [[ -n "$2" ]]; then
                    show_topic_help "$2"
                else
                    show_main_help
                fi
                ;;
            menu) ;; # Fallthrough to interactive menu
            *) 
                echo -e "${COLOR_RED}Unknown command: $1${NC}"
                echo ""
                echo "Usage: $0 {start|stop|restart|status|rebuild-all|rebuild-web|restart-worker|install|deploy|setup|test:unit|test:integration|test:all|quality-check|kill-workers|check-workers|help|menu|dev|stop-dev|dev-logs}"
                echo ""
                echo -e "${COLOR_CYAN}Available commands:${NC}"
                echo -e "  ${COLOR_GREEN}install/deploy${NC}   - Fully automated installation (no prompts)"
                echo -e "  ${COLOR_GREEN}start${NC}            - Start all services"
                echo -e "  ${COLOR_RED}stop${NC}             - Stop all services"
                echo -e "  ${COLOR_YELLOW}restart${NC}          - Restart all services"
                echo -e "  ${COLOR_YELLOW}restart-worker${NC}   - Restart worker only"
                echo -e "  ${COLOR_CYAN}status${NC}           - Show service status"
                echo -e "  ${COLOR_BLUE}rebuild-all${NC}      - Complete rebuild (all services)"
                echo -e "  ${COLOR_BLUE}rebuild-web${NC}      - Rebuild frontend only (faster)"
                echo -e "  ${COLOR_BLUE}setup${NC}            - Run interactive setup wizard"
                echo -e "  ${COLOR_BLUE}dev${NC}              - Start development server on port 3003"
                echo -e "  ${COLOR_RED}stop-dev${NC}         - Stop development server"
                echo -e "  ${COLOR_BLUE}dev-logs${NC}         - View development server logs"
                echo -e "  ${COLOR_BLUE}test:unit${NC}        - Run unit tests only"
                echo -e "  ${COLOR_BLUE}test:integration${NC} - Run integration tests"
                echo -e "  ${COLOR_BLUE}test:all${NC}         - Run all tests"
                echo -e "  ${COLOR_BLUE}quality-check${NC}    - Run lint, typecheck, and unit tests"
                echo -e "  ${COLOR_RED}kill-workers${NC}     - Kill multiple workers (usage: kill-workers [max] [force])"
                echo -e "  ${COLOR_BLUE}check-workers${NC}    - Run check_workers.sh with all options"
                echo -e "  ${COLOR_CYAN}help [topic]${NC}     - Show help (topics: docker, testing, troubleshooting)"
                echo -e "  ${COLOR_CYAN}menu${NC}             - Interactive menu"
                echo ""
                echo -e "${COLOR_YELLOW}💡 First time? Try: $0 install${NC}"
                exit 1
                ;;
        esac
        if [[ "$1" != "menu" ]]; then
            exit 0
        fi
    fi

    # Interactive menu loop
    while true; do
        show_guided_menu
        echo -n "Choose an option (1-25): "
        read -r choice
        echo ""
        
        case "$choice" in
            1) 
                echo -e "${COLOR_GREEN}🚀 Starting all services...${NC}"
                start_services 
                ;;
            2) 
                echo -e "${COLOR_YELLOW}🔄 Restarting all services...${NC}"
                restart_all_services 
                ;;
            3) 
                echo -e "${COLOR_RED}🛑 Stopping all services...${NC}"
                stop_services 
                ;;
            4) 
                echo -e "${COLOR_CYAN}⚡ Current service status:${NC}"
                docker compose ps 
                ;;
            5) 
                echo -e "${COLOR_BLUE}📊 Showing worker logs (Ctrl+C to exit):${NC}"
                tail -f "$ROOT_DIR/worker.log" 2>/dev/null || echo "No worker log found" 
                ;;
            6) 
                echo -e "${COLOR_BLUE}🐚 Opening container shell...${NC}"
                docker exec -it g_forge_server bash 
                ;;
            7) 
                echo -e "${COLOR_BLUE}🔨 Starting complete rebuild...${NC}"
                rebuild_all 
                ;;
            8) 
                echo -e "${COLOR_BLUE}🌐 Starting frontend rebuild...${NC}"
                rebuild_web 
                ;;
            9) 
                echo -e "${COLOR_BLUE}🐳 Showing Docker logs (Ctrl+C to exit):${NC}"
                docker compose logs -f 
                ;;
            10) 
                echo -e "${COLOR_YELLOW}🔄 Restarting worker...${NC}"
                restart_worker 
                ;;
            11) 
                echo -e "${COLOR_BLUE}💻 Starting development server on port 3003...${NC}"
                start_dev_server 
                ;;
            12) 
                echo -e "${COLOR_RED}🛑 Stopping development server...${NC}"
                stop_dev_server 
                ;;
            13) 
                echo -e "${COLOR_BLUE}📋 Showing development server logs (Ctrl+C to exit):${NC}"
                tail -f "$ROOT_DIR/dev-server.log" 2>/dev/null || echo "No development server log found" 
                ;;
            14) 
                echo -e "${COLOR_BLUE}🔬 Running unit tests...${NC}"
                run_unit_tests
                ;;
            15) 
                echo -e "${COLOR_BLUE}🔗 Running integration tests...${NC}"
                run_integration_tests 
                ;;
            16) 
                echo -e "${COLOR_BLUE}🧪 Running all tests...${NC}"
                run_all_tests 
                ;;
            17) 
                echo -e "${COLOR_BLUE}🎯 Running quality check...${NC}"
                run_quality_check
                ;;
            18) 
                echo -e "${COLOR_BLUE}🔍 Running code linting...${NC}"
                cd "$ROOT_DIR" && pnpm run lint 
                ;;
            19) 
                echo -e "${COLOR_BLUE}✨ Formatting code...${NC}"
                cd "$ROOT_DIR" && pnpm run format 
                ;;
            20) 
                echo -e "${COLOR_BLUE}📘 Checking TypeScript types...${NC}"
                cd "$ROOT_DIR" && pnpm run typecheck 
                ;;
            21)
                echo -e "${COLOR_BLUE}🔄 Running integration test runner...${NC}"
                cd "$ROOT_DIR" && ./integration-test-runner.sh
                ;;
            22)
                echo -e "${COLOR_BLUE}🔍 Running worker check...${NC}"
                if [[ -f "$ROOT_DIR/check_workers.sh" ]]; then
                    "$ROOT_DIR/check_workers.sh"
                else
                    echo -e "${COLOR_RED}❌ check_workers.sh not found${NC}"
                fi
                ;;
            23)
                echo -e "${COLOR_RED}🗑️ Kill multiple workers...${NC}"
                echo -e "${COLOR_YELLOW}Enter maximum number of workers to keep (0 = kill all):${NC}"
                read -r max_workers
                if [[ -z "$max_workers" ]]; then
                    max_workers=0
                fi
                echo -e "${COLOR_YELLOW}Force kill without confirmation? (y/N):${NC}"
                read -r force_confirm
                local force="false"
                if [[ "$force_confirm" =~ ^[Yy]$ ]]; then
                    force="true"
                fi
                kill_multiple_workers "$max_workers" "$force"
                ;;
            24)
                echo -e "${COLOR_CYAN}❓ Help & Troubleshooting${NC}"
                show_main_help
                ;;
            25)
                echo -e "${COLOR_CYAN}👋 Thanks for using AgenticForge! Goodbye!${NC}"
                exit 0
                ;;
            *) 
                echo -e "${COLOR_RED}❌ Invalid option '$choice'. Please choose 1-25.${NC}"
                ;;
        esac
        
        if [[ "$choice" =~ ^[1-9]$|^1[0-9]$|^2[0-5]$ ]]; then
            echo ""
            echo -e "${COLOR_YELLOW}🔙 Press Enter to return to menu...${NC}"
            read -r
        fi
    done
}

# Kill multiple workers function
kill_multiple_workers() {
    local max_workers=${1:-0}  # Default to 0 means kill all extra workers
    local force_kill=${2:-false}

    echo -e "${COLOR_BLUE}🔍 Checking and managing worker processes...${NC}"

    # Check if check_workers.sh exists
    if [[ ! -f "$ROOT_DIR/check_workers.sh" ]]; then
        echo -e "${COLOR_RED}❌ check_workers.sh not found in $ROOT_DIR${NC}"
        return 1
    fi

    # Make sure check_workers.sh is executable
    if [[ ! -x "$ROOT_DIR/check_workers.sh" ]]; then
        chmod +x "$ROOT_DIR/check_workers.sh"
    fi

    # Count current workers
    local worker_count
    worker_count=$("$ROOT_DIR/check_workers.sh" 2>/dev/null | grep -o "Active workers: [0-9]*" | grep -o "[0-9]*" || echo "0")

    if [[ -z "$worker_count" || "$worker_count" == "0" ]]; then
        echo -e "${COLOR_YELLOW}ℹ️ No workers currently running${NC}"
        return 0
    fi

    echo -e "${COLOR_CYAN}📊 Found $worker_count active worker(s)${NC}"

    if [[ $worker_count -le $max_workers ]]; then
        echo -e "${COLOR_GREEN}✅ Worker count ($worker_count) is within limit ($max_workers)${NC}"
        return 0
    fi

    local workers_to_kill=$((worker_count - max_workers))
    echo -e "${COLOR_YELLOW}⚠️ Need to kill $workers_to_kill worker(s) to reach limit of $max_workers${NC}"

    # Confirm before killing (unless force is enabled)
    if [[ "$force_kill" != "true" ]]; then
        read -r -p "Continue with killing $workers_to_kill worker(s)? (y/N): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            echo -e "${COLOR_YELLOW}Operation cancelled${NC}"
            return 0
        fi
    fi

    # Use check_workers.sh cleanup function
    echo -e "${COLOR_YELLOW}🗑️ Cleaning up extra workers...${NC}"

    # Run cleanup with verbose output
    if "$ROOT_DIR/check_workers.sh" cleanup --verbose; then
        echo -e "${COLOR_GREEN}✅ Worker cleanup completed${NC}"

        # Verify the cleanup
        sleep 2
        local new_count
        new_count=$("$ROOT_DIR/check_workers.sh" 2>/dev/null | grep -o "Active workers: [0-9]*" | grep -o "[0-9]*" || echo "0")

        if [[ $new_count -le $max_workers ]]; then
            echo -e "${COLOR_GREEN}✅ Successfully reduced workers to $new_count (limit: $max_workers)${NC}"
        else
            echo -e "${COLOR_YELLOW}⚠️ Cleanup completed but still have $new_count workers${NC}"
        fi
    else
        echo -e "${COLOR_RED}❌ Worker cleanup failed${NC}"
        return 1
    fi

    return 0
}

# Helper function for restart
restart_all_services() {
    echo -e "${COLOR_YELLOW}🛑 Stopping all services...${NC}"
    stop_services

    # Give services time to fully stop
    sleep 3

    echo -e "${COLOR_BLUE}🚀 Starting all services...${NC}"
    if ! start_services_silent; then
        echo -e "${COLOR_RED}❌ Failed to start services${NC}"
        return 1
    fi

    echo -e "${COLOR_YELLOW}🔄 Ensuring worker is properly restarted...${NC}"
    if ! restart_worker; then
        echo -e "${COLOR_RED}❌ Failed to restart worker${NC}"
        return 1
    fi

    echo -e "${COLOR_GREEN}✅ All services restarted successfully!${NC}"
    return 0
}

main "$@"