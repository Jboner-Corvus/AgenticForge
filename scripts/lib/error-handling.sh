#!/bin/bash

# =============================================================================
# Error Handling Module
# =============================================================================
# Provides comprehensive error handling with automatic rollback mechanisms,
# health checks, and intelligent error recovery according to project specs.
# =============================================================================

set -eo pipefail

# Global error handling configuration
declare -g ERROR_LOG_FILE="${ERROR_LOG_FILE:-/tmp/agenticforge-errors.log}"
declare -g ROLLBACK_ENABLED="${ROLLBACK_ENABLED:-true}"
declare -g MAX_RETRY_ATTEMPTS="${MAX_RETRY_ATTEMPTS:-3}"
declare -g HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-30}"

# Error handling state
declare -g -A ROLLBACK_STACK=()
declare -g ROLLBACK_COUNT=0
declare -g CURRENT_OPERATION=""
declare -g ERROR_CONTEXT=""

# Color codes
readonly ERR_COLOR_RED='\033[0;31m'
readonly ERR_COLOR_YELLOW='\033[1;33m'
readonly ERR_COLOR_GREEN='\033[0;32m'
readonly ERR_COLOR_BLUE='\033[0;34m'
readonly ERR_COLOR_NC='\033[0m'

# =============================================================================
# Initialization
# =============================================================================

initialize_error_handling() {
    # Set up error trap
    trap 'handle_error $? $LINENO "$CURRENT_OPERATION" "$ERROR_CONTEXT"' ERR
    trap 'handle_exit' EXIT
    trap 'handle_interrupt' INT TERM
    
    # Ensure log file exists
    mkdir -p "$(dirname "$ERROR_LOG_FILE")"
    touch "$ERROR_LOG_FILE"
    
    log_info "Error handling system initialized"
}

# =============================================================================
# Core Error Handling
# =============================================================================

handle_error() {
    local exit_code="${1:-1}"
    local line_number="${2:-Unknown}"
    local operation="${3:-Unknown operation}"
    local context="${4:-Unknown context}"
    
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Log error details
    {
        echo "=== ERROR REPORT ==="
        echo "Timestamp: $timestamp"
        echo "Exit Code: $exit_code"
        echo "Line: $line_number"
        echo "Operation: $operation"
        echo "Context: $context"
        echo "Script: ${BASH_SOURCE[2]:-Unknown}"
        echo "Function: ${FUNCNAME[2]:-main}"
        echo "==================="
    } >> "$ERROR_LOG_FILE"
    
    # Display error
    echo -e "${ERR_COLOR_RED}❌ ERROR: Operation '$operation' failed${ERR_COLOR_NC}" >&2
    echo -e "${ERR_COLOR_RED}   Line: $line_number, Exit Code: $exit_code${ERR_COLOR_NC}" >&2
    echo -e "${ERR_COLOR_RED}   Context: $context${ERR_COLOR_NC}" >&2
    
    # Attempt rollback if enabled
    if [[ "$ROLLBACK_ENABLED" == "true" && $ROLLBACK_COUNT -gt 0 ]]; then
        echo -e "${ERR_COLOR_YELLOW}🔄 Attempting automatic rollback...${ERR_COLOR_NC}" >&2
        execute_rollback
    fi
    
    return $exit_code
}

handle_exit() {
    if [[ $? -ne 0 ]]; then
        echo -e "${ERR_COLOR_RED}💥 Script exited with errors. Check log: $ERROR_LOG_FILE${ERR_COLOR_NC}" >&2
    fi
}

handle_interrupt() {
    echo -e "\n${ERR_COLOR_YELLOW}⚠️ Script interrupted by user${ERR_COLOR_NC}" >&2
    
    if [[ "$ROLLBACK_ENABLED" == "true" && $ROLLBACK_COUNT -gt 0 ]]; then
        echo -e "${ERR_COLOR_YELLOW}🔄 Performing cleanup rollback...${ERR_COLOR_NC}" >&2
        execute_rollback
    fi
    
    exit 130
}

# =============================================================================
# Rollback System
# =============================================================================

add_rollback_action() {
    local action="${1:-}"
    local description="${2:-Rollback action}"
    
    if [[ -z "$action" ]]; then
        log_error "add_rollback_action: No action specified"
        return 1
    fi
    
    ROLLBACK_STACK[$ROLLBACK_COUNT]="$action"
    ((ROLLBACK_COUNT++))
    
    log_info "Added rollback action: $description"
}

execute_rollback() {
    if [[ $ROLLBACK_COUNT -eq 0 ]]; then
        log_info "No rollback actions to execute"
        return 0
    fi
    
    echo -e "${ERR_COLOR_YELLOW}🔄 Executing rollback operations...${ERR_COLOR_NC}"
    
    local success=true
    
    # Execute rollback actions in reverse order
    for ((i=$((ROLLBACK_COUNT-1)); i>=0; i--)); do
        local action="${ROLLBACK_STACK[$i]}"
        echo -e "${ERR_COLOR_YELLOW}   Rolling back: $action${ERR_COLOR_NC}"
        
        if ! eval "$action" 2>/dev/null; then
            echo -e "${ERR_COLOR_RED}   ❌ Rollback action failed: $action${ERR_COLOR_NC}" >&2
            success=false
        else
            echo -e "${ERR_COLOR_GREEN}   ✅ Rollback successful: $action${ERR_COLOR_NC}"
        fi
        
        unset ROLLBACK_STACK[$i]
    done
    
    ROLLBACK_COUNT=0
    
    if [[ "$success" == "true" ]]; then
        echo -e "${ERR_COLOR_GREEN}✅ Rollback completed successfully${ERR_COLOR_NC}"
    else
        echo -e "${ERR_COLOR_RED}⚠️ Some rollback actions failed${ERR_COLOR_NC}" >&2
    fi
}

clear_rollback_stack() {
    ROLLBACK_STACK=()
    ROLLBACK_COUNT=0
    log_info "Rollback stack cleared"
}

# =============================================================================
# Safe Execution
# =============================================================================

safe_execute() {
    local command="${1:-}"
    local operation="${2:-Command execution}"
    local context="${3:-}"
    local max_attempts="${4:-$MAX_RETRY_ATTEMPTS}"
    
    if [[ -z "$command" ]]; then
        log_error "safe_execute: No command specified"
        return 1
    fi
    
    CURRENT_OPERATION="$operation"
    ERROR_CONTEXT="$context"
    
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log_info "Executing: $operation (attempt $attempt/$max_attempts)"
        
        if eval "$command"; then
            log_info "✅ $operation completed successfully"
            return 0
        else
            local exit_code=$?
            
            if [[ $attempt -eq $max_attempts ]]; then
                log_error "❌ $operation failed after $max_attempts attempts"
                return $exit_code
            else
                log_error "⚠️ $operation failed (attempt $attempt/$max_attempts), retrying..."
                ((attempt++))
                sleep $((attempt * 2))  # Exponential backoff
            fi
        fi
    done
    
    return 1
}

# =============================================================================
# Health Checks
# =============================================================================

check_service_health() {
    local service_name="${1:-}"
    local health_command="${2:-}"
    local timeout="${3:-$HEALTH_CHECK_TIMEOUT}"
    
    if [[ -z "$service_name" || -z "$health_command" ]]; then
        log_error "check_service_health: Missing required parameters"
        return 1
    fi
    
    log_info "🏥 Checking health of $service_name..."
    
    local elapsed=0
    
    while [[ $elapsed -lt $timeout ]]; do
        if eval "$health_command" >/dev/null 2>&1; then
            log_info "✅ $service_name is healthy"
            return 0
        fi
        
        sleep 1
        ((elapsed++))
        
        if [[ $((elapsed % 5)) -eq 0 ]]; then
            log_info "⏳ Still waiting for $service_name... (${elapsed}s/${timeout}s)"
        fi
    done
    
    log_error "❌ $service_name health check timed out after ${timeout}s"
    return 1
}

perform_system_health_check() {
    log_info "🏥 Performing system health check..."
    
    local all_healthy=true
    
    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        log_error "❌ Docker daemon not available"
        all_healthy=false
    else
        log_info "✅ Docker daemon is running"
    fi
    
    # Check disk space
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $disk_usage -gt 90 ]]; then
        log_error "❌ Disk usage is critical: ${disk_usage}%"
        all_healthy=false
    else
        log_info "✅ Disk usage is acceptable: ${disk_usage}%"
    fi
    
    # Check memory
    local mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [[ $mem_usage -gt 90 ]]; then
        log_error "⚠️ Memory usage is high: ${mem_usage}%"
    else
        log_info "✅ Memory usage is acceptable: ${mem_usage}%"
    fi
    
    if [[ "$all_healthy" == "true" ]]; then
        log_info "✅ System health check passed"
        return 0
    else
        log_error "❌ System health check failed"
        return 1
    fi
}

# =============================================================================
# Logging Functions
# =============================================================================

log_info() {
    local message="${1:-}"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[INFO]  $timestamp: $message"
    echo "$timestamp [INFO] $message" >> "$ERROR_LOG_FILE"
}

log_error() {
    local message="${1:-}"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${ERR_COLOR_RED}[ERROR] $timestamp: $message${ERR_COLOR_NC}" >&2
    echo "$timestamp [ERROR] $message" >> "$ERROR_LOG_FILE"
}

log_warning() {
    local message="${1:-}"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${ERR_COLOR_YELLOW}[WARN]  $timestamp: $message${ERR_COLOR_NC}" >&2
    echo "$timestamp [WARN] $message" >> "$ERROR_LOG_FILE"
}

log_success() {
    local message="${1:-}"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${ERR_COLOR_GREEN}[SUCCESS] $timestamp: $message${ERR_COLOR_NC}"
    echo "$timestamp [SUCCESS] $message" >> "$ERROR_LOG_FILE"
}

# =============================================================================
# Graceful Shutdown
# =============================================================================

setup_graceful_shutdown() {
    local cleanup_function="${1:-default_cleanup}"
    
    trap "$cleanup_function; handle_interrupt" INT TERM
    
    log_info "Graceful shutdown handlers configured"
}

default_cleanup() {
    log_info "🧹 Performing default cleanup..."
    
    # Stop any background processes
    jobs -p | xargs -r kill 2>/dev/null || true
    
    # Clean temporary files
    rm -f /tmp/agenticforge-* 2>/dev/null || true
    
    log_info "✅ Default cleanup completed"
}

# =============================================================================
# Timer Functions
# =============================================================================

declare -g -A OPERATION_START_TIMES=()

start_timer() {
    local operation="${1:-default}"
    OPERATION_START_TIMES["$operation"]=$(date +%s)
    log_info "⏱️ Started: $operation"
}

end_timer() {
    local operation="${1:-default}"
    local start_time="${OPERATION_START_TIMES[$operation]:-}"
    
    if [[ -n "$start_time" ]]; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_success "✅ Completed: $operation (${duration}s)"
        unset OPERATION_START_TIMES["$operation"]
    else
        log_warning "⚠️ Timer not found for operation: $operation"
    fi
}

# =============================================================================
# Module Status
# =============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "Error Handling Module v1.0.0"
    echo "This module should be sourced, not executed directly."
    exit 1
fi