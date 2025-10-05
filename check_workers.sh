#!/bin/bash

# =============================================================================
# AgenticForge Worker Management Script v2.0
# =============================================================================
# Advanced worker monitoring, health checks, and management tool
# Features: Health monitoring, performance stats, auto-cleanup, logging
# =============================================================================

# Set locale to avoid warnings
export LC_ALL=C
export LANG=C

set -eo pipefail

# =============================================================================
# Configuration & Constants
# =============================================================================

# Script configuration
readonly SCRIPT_NAME="check_workers.sh"
readonly SCRIPT_VERSION="2.0.0"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly ROOT_DIR="$SCRIPT_DIR"

# Colors for output
readonly COLOR_RED='\033[0;31m'
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_CYAN='\033[0;36m'
readonly COLOR_ORANGE='\033[0;33m'
readonly COLOR_PURPLE='\033[0;35m'
readonly NC='\033[0m' # No Color

# Default configuration
VERBOSE=${VERBOSE:-false}
AUTO_CLEANUP=${AUTO_CLEANUP:-false}
HEALTH_CHECK=${HEALTH_CHECK:-true}
PERF_MONITOR=${PERF_MONITOR:-true}
REDIS_CONTAINER=${REDIS_CONTAINER:-g_forge_redis}
WORKER_PATTERN=${WORKER_PATTERN:-'node.*dist/worker\.js'}
LOG_FILE=${LOG_FILE:-"$ROOT_DIR/worker-monitor.log"}

# =============================================================================
# Utility Functions
# =============================================================================

# Logging functions
log_info() {
    echo -e "${COLOR_BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S'): $1" >&2
}

log_warn() {
    echo -e "${COLOR_YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S'): $1" >&2
}

log_error() {
    echo -e "${COLOR_RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S'): $1" >&2
}

log_success() {
    echo -e "${COLOR_GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S'): $1" >&2
}

# Print colored output
print_header() {
    echo -e "${COLOR_CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${COLOR_CYAN}║${NC} ${COLOR_ORANGE}$1${NC}"
    echo -e "${COLOR_CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
}

print_section() {
    echo -e "\n${COLOR_BLUE}┌─ $1${NC}"
    echo -e "${COLOR_BLUE}└─────────────────────────────────────────────────────────────┘${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Safe execution with error handling
safe_exec() {
    local cmd="$1"
    local description="$2"

    if [[ "$VERBOSE" == "true" ]]; then
        log_info "Executing: $cmd"
    fi

    if eval "$cmd" 2>/dev/null; then
        return 0
    else
        if [[ "$VERBOSE" == "true" ]]; then
            log_warn "$description failed, but continuing..."
        fi
        return 1
    fi
}

# =============================================================================
# Core Worker Functions
# =============================================================================

# Count running workers
count_workers() {
    pgrep -f "$WORKER_PATTERN" | wc -l
}

# Get worker details (PID, PPID, CPU%, MEM%, COMMAND)
get_worker_details() {
    if command_exists pgrep && command_exists ps; then
        local worker_pids
        worker_pids=$(pgrep -f "$WORKER_PATTERN" 2>/dev/null || true)

        if [[ -n "$worker_pids" ]]; then
            echo "$worker_pids" | while read -r pid; do
                if [[ -n "$pid" ]]; then
                    ps -p "$pid" -o pid,ppid,pcpu,pmem,cmd --no-headers 2>/dev/null || true
                fi
            done
        fi
    fi
}

# Check worker health
check_worker_health() {
    local pid="$1"

    if ! kill -0 "$pid" 2>/dev/null; then
        echo "dead"
        return
    fi

    # Check if worker is responsive (simplified check)
    if kill -0 "$pid" 2>/dev/null; then
        health_status="healthy"
    else
        health_status="unresponsive"
    fi

    echo "$health_status"
}

# Get Redis lock information
get_redis_locks() {
    local redis_cmd="docker exec $REDIS_CONTAINER redis-cli"

    echo "worker:singleton:lock: $($redis_cmd GET worker:singleton:lock 2>/dev/null || echo 'AUCUN')"
    echo "server:singleton:lock: $($redis_cmd GET server:singleton:lock 2>/dev/null || echo 'AUCUN')"
}

# Get worker logs
get_worker_logs() {
    local lines="${1:-20}"
    local log_file="$ROOT_DIR/worker.log"

    if [[ -f "$log_file" ]]; then
        echo -e "${COLOR_BLUE}📄 Last $lines lines from worker.log:${NC}"
        tail -n "$lines" "$log_file"
    else
        echo -e "${COLOR_YELLOW}⚠️ No worker.log file found${NC}"
    fi
}

# Performance monitoring
get_performance_stats() {
    local worker_count
    worker_count=$(count_workers)

    if [[ $worker_count -gt 0 ]]; then
        echo -e "${COLOR_BLUE}📊 Performance Statistics:${NC}"

        # CPU and Memory usage
        echo "Total CPU usage by workers:"
        get_worker_details | awk '{cpu += $3} END {if (cpu > 0) print "  " cpu "%"; else print "  N/A"}'

        echo "Total Memory usage by workers:"
        get_worker_details | awk '{mem += $4} END {if (mem > 0) print "  " mem "%"; else print "  N/A"}'

        # System load
        if command_exists uptime; then
            echo "System load average:"
            uptime | awk -F'load average:' '{print "  " $2}'
        fi
    fi
}

# Auto cleanup function
auto_cleanup_workers() {
    local worker_count
    worker_count=$(count_workers)

    if [[ $worker_count -gt 1 ]]; then
        log_warn "Found $worker_count workers, cleaning up extra workers..."

        # Get all worker PIDs except the first one
        local worker_pids
        worker_pids=$(pgrep -f "$WORKER_PATTERN" | head -n -1 2>/dev/null || true)

        if [[ -n "$worker_pids" ]]; then
            echo -e "${COLOR_YELLOW}🗑️ Cleaning up extra workers...${NC}"

            local cleaned=0
            echo "$worker_pids" | while read -r pid; do
                if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
                    echo -e "${COLOR_RED}🛑 Terminating worker PID: $pid${NC}"
                    kill -TERM "$pid" 2>/dev/null || true
                    ((cleaned++))
                fi
            done

            # Wait for processes to terminate
            sleep 2

            log_success "Cleaned up $cleaned extra workers"
            return 0
        else
            log_warn "No extra worker PIDs found"
            return 1
        fi
    elif [[ $worker_count -eq 1 ]]; then
        echo -e "${COLOR_GREEN}✅ Optimal configuration: 1 worker active${NC}"
        return 0
    else
        echo -e "${COLOR_YELLOW}ℹ️ No workers currently running${NC}"
        return 0
    fi
}

# =============================================================================
# Display Functions
# =============================================================================

# Display worker status
display_worker_status() {
    local worker_count
    worker_count=$(count_workers)

    print_header "🔍 WORKER STATUS CHECK"
    echo -e "${COLOR_BLUE}📊 Active workers: ${COLOR_ORANGE}$worker_count${NC}"

    # Status indicator
    if [[ $worker_count -eq 0 ]]; then
        echo -e "${COLOR_RED}❌ Status: No workers running${NC}"
    elif [[ $worker_count -eq 1 ]]; then
        echo -e "${COLOR_GREEN}✅ Status: Optimal (1 worker)${NC}"
    else
        echo -e "${COLOR_YELLOW}⚠️ Status: Multiple workers ($worker_count) - Needs cleanup${NC}"
    fi
}

# Display detailed worker information
display_worker_details() {
    print_section "📋 WORKER DETAILS"

    local worker_details
    worker_details=$(get_worker_details)

    if [[ -n "$worker_details" ]]; then
        echo -e "${COLOR_CYAN}PID\tPPID\tCPU%\tMEM%\tCOMMAND${NC}"
        echo "$worker_details" | while read -r line; do
            if [[ -n "$line" ]]; then
                # Format the output nicely
                echo "$line" | awk '{
                    printf "%s\t%s\t%s\t%s\t", $1, $2, $3, $4;
                    for(i=5; i<=NF; i++) printf "%s ", $i;
                    printf "\n";
                }'
            fi
        done
    else
        echo -e "${COLOR_YELLOW}No worker processes found${NC}"
    fi
}

# Display Redis lock status
display_redis_status() {
    print_section "🔒 REDIS LOCKS STATUS"

    if command_exists docker && docker ps | grep -q "$REDIS_CONTAINER"; then
        get_redis_locks | while read -r line; do
            local key value
            key=$(echo "$line" | cut -d: -f1)
            value=$(echo "$line" | cut -d: -f2-)

            if [[ "$value" == "AUCUN" ]]; then
                echo -e "  ${COLOR_YELLOW}$key: ${COLOR_RED}$value${NC}"
            else
                echo -e "  ${COLOR_GREEN}$key: ${COLOR_CYAN}$value${NC}"
            fi
        done
    else
        echo -e "${COLOR_RED}❌ Redis container not accessible${NC}"
    fi
}

# Display health status
display_health_status() {
    if [[ "$HEALTH_CHECK" != "true" ]]; then
        return
    fi

    print_section "🏥 HEALTH CHECKS"

    local worker_count
    worker_count=$(count_workers)

    if [[ $worker_count -gt 0 ]]; then
        get_worker_details | while read -r line; do
            if [[ -n "$line" ]]; then
                local pid
                pid=$(echo "$line" | awk '{print $1}')

                if [[ -n "$pid" ]]; then
                    local health
                    health=$(check_worker_health "$pid")

                    case "$health" in
                        "healthy")
                            echo -e "  ${COLOR_GREEN}✅ Worker $pid: Healthy${NC}"
                            ;;
                        "unresponsive")
                            echo -e "  ${COLOR_YELLOW}⚠️ Worker $pid: Unresponsive${NC}"
                            ;;
                        "dead")
                            echo -e "  ${COLOR_RED}❌ Worker $pid: Dead${NC}"
                            ;;
                        *)
                            echo -e "  ${COLOR_BLUE}❓ Worker $pid: Status unknown${NC}"
                            ;;
                    esac
                fi
            fi
        done
    else
        echo -e "${COLOR_YELLOW}ℹ️ No workers to check${NC}"
    fi
}

# Display useful commands
display_helpful_commands() {
    print_section "💡 USEFUL COMMANDS"

    echo -e "${COLOR_CYAN}Worker Management:${NC}"
    echo -e "  ${COLOR_GREEN}Start worker:${NC}    cd packages/core && npm run start:worker"
    echo -e "  ${COLOR_RED}Stop workers:${NC}    pkill -f 'node.*worker.js'"
    echo -e "  ${COLOR_BLUE}Restart worker:${NC}  $ROOT_DIR/run.sh restart-worker"

    echo -e "\n${COLOR_CYAN}Monitoring:${NC}"
    echo -e "  ${COLOR_BLUE}Real-time:${NC}       watch -n 2 '$0'"
    echo -e "  ${COLOR_BLUE}With cleanup:${NC}    $0 --cleanup"
    echo -e "  ${COLOR_BLUE}Verbose mode:${NC}    $0 --verbose"

    echo -e "\n${COLOR_CYAN}Logs:${NC}"
    echo -e "  ${COLOR_BLUE}Worker logs:${NC}     tail -f $ROOT_DIR/worker.log"
    echo -e "  ${COLOR_BLUE}System logs:${NC}     $ROOT_DIR/run.sh logs"
}

# =============================================================================
# Main Functions
# =============================================================================

# Show help
show_help() {
    cat << EOF
${COLOR_CYAN}╔══════════════════════════════════════════════════════════════╗${NC}
${COLOR_CYAN}║${NC}              ${COLOR_ORANGE}AgenticForge Worker Monitor v$SCRIPT_VERSION${NC}              ${COLOR_CYAN}║${NC}
${COLOR_CYAN}╚══════════════════════════════════════════════════════════════╝${NC}

${COLOR_BLUE}DESCRIPTION:${NC}
    Advanced worker monitoring and management tool for AgenticForge

${COLOR_BLUE}USAGE:${NC}
    $0 [OPTIONS] [COMMAND]

${COLOR_BLUE}COMMANDS:${NC}
    check          Show worker status (default)
    cleanup        Automatically clean up extra workers
    health         Perform detailed health checks
    logs           Show recent worker logs
    monitor        Continuous monitoring mode
    restart        Restart worker service

${COLOR_BLUE}OPTIONS:${NC}
    -v, --verbose      Enable verbose output
    -c, --cleanup      Enable auto-cleanup mode
    -n, --no-health    Skip health checks
    -p, --no-perf      Skip performance monitoring
    -h, --help         Show this help message
    -V, --version      Show version information

${COLOR_BLUE}EXAMPLES:${NC}
    $0                    # Basic status check
    $0 --verbose          # Detailed output
    $0 cleanup            # Auto cleanup extra workers
    $0 monitor            # Continuous monitoring
    $0 --cleanup check    # Check with auto cleanup

${COLOR_BLUE}CONFIGURATION:${NC}
    WORKER_PATTERN    Pattern to match worker processes (default: 'node.*dist/worker\.js')
    REDIS_CONTAINER   Redis container name (default: g_forge_redis)
    LOG_FILE         Log file path (default: ./worker-monitor.log)
    VERBOSE          Enable verbose mode (default: false)
    AUTO_CLEANUP     Enable auto cleanup (default: false)

EOF
}

# Main check function
perform_check() {
    display_worker_status
    display_worker_details
    display_redis_status

    if [[ "$HEALTH_CHECK" == "true" ]]; then
        display_health_status
    fi

    if [[ "$PERF_MONITOR" == "true" ]]; then
        get_performance_stats
    fi

    display_helpful_commands

    # Auto cleanup if enabled
    if [[ "$AUTO_CLEANUP" == "true" ]]; then
        echo ""
        auto_cleanup_workers
    fi
}

# Monitor mode
monitor_mode() {
    echo -e "${COLOR_BLUE}🔄 Starting continuous monitoring (Ctrl+C to stop)...${NC}"
    echo -e "${COLOR_CYAN}Press Ctrl+C to exit monitoring mode${NC}\n"

    while true; do
        clear
        perform_check
        echo -e "\n${COLOR_YELLOW}⏰ Next update in 5 seconds...${NC}"
        sleep 5
    done
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -c|--cleanup)
                AUTO_CLEANUP=true
                shift
                ;;
            -n|--no-health)
                HEALTH_CHECK=false
                shift
                ;;
            -p|--no-perf)
                PERF_MONITOR=false
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            -V|--version)
                echo "AgenticForge Worker Monitor v$SCRIPT_VERSION"
                exit 0
                ;;
            check|cleanup|health|logs|monitor|restart)
                if [[ -z "$COMMAND" || "$COMMAND" == "check" ]]; then
                    COMMAND="$1"
                else
                    log_error "Multiple commands specified: $COMMAND and $1"
                    exit 1
                fi
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use '$0 --help' for usage information"
                exit 1
                ;;
        esac
    done
}

# Main execution
main() {
    local COMMAND="check"

    # Parse all arguments
    parse_args "$@"

    # Execute command
    case "$COMMAND" in
        check)
            perform_check
            ;;
        cleanup)
            auto_cleanup_workers
            ;;
        health)
            display_health_status
            ;;
        logs)
            get_worker_logs 50
            ;;
        monitor)
            monitor_mode
            ;;
        restart)
            echo -e "${COLOR_BLUE}🔄 Restarting worker service...${NC}"
            "$ROOT_DIR/run.sh" restart-worker
            ;;
        *)
            log_error "Unknown command: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

# =============================================================================
# Script Entry Point
# =============================================================================

# Handle script interruption gracefully
trap 'echo -e "\n${COLOR_YELLOW}👋 Monitoring stopped${NC}"; exit 0' INT TERM

# Run main function with all arguments
main "$@"