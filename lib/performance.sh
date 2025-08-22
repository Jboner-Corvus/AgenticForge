#!/bin/bash

# =============================================================================
# Performance Optimization Module
# =============================================================================
# Provides intelligent caching, parallel execution, resource monitoring,
# and performance optimization features according to project specifications.
# =============================================================================

set -eo pipefail

# Performance configuration
declare -g CACHE_DIR="${CACHE_DIR:-/tmp/agenticforge-cache}"
declare -g CACHE_TTL="${CACHE_TTL:-3600}"  # 1 hour default
declare -g MAX_PARALLEL_JOBS="${MAX_PARALLEL_JOBS:-4}"
declare -g PERFORMANCE_LOG="${PERFORMANCE_LOG:-/tmp/agenticforge-perf.log}"

# Performance state
declare -g -A CACHE_METADATA=()
declare -g -A PERFORMANCE_METRICS=()
declare -g -A PARALLEL_JOBS=()
declare -g PARALLEL_JOB_COUNT=0

# Color codes
readonly PERF_COLOR_BLUE='\033[0;34m'
readonly PERF_COLOR_GREEN='\033[0;32m'
readonly PERF_COLOR_YELLOW='\033[1;33m'
readonly PERF_COLOR_CYAN='\033[0;36m'
readonly PERF_COLOR_NC='\033[0m'

# =============================================================================
# Initialization
# =============================================================================

init_performance_system() {
    # Create cache directory
    mkdir -p "$CACHE_DIR"
    
    # Initialize performance log
    mkdir -p "$(dirname "$PERFORMANCE_LOG")"
    touch "$PERFORMANCE_LOG"
    
    # Clean old cache entries on startup
    cleanup_expired_cache
    
    perf_log "Performance system initialized"
    perf_log "Cache directory: $CACHE_DIR"
    perf_log "Max parallel jobs: $MAX_PARALLEL_JOBS"
}

# =============================================================================
# Caching System
# =============================================================================

cache_set() {
    local cache_type="${1:-}"
    local cache_key="${2:-}"
    local cache_value="${3:-}"
    local ttl="${4:-$CACHE_TTL}"
    
    if [[ -z "$cache_type" || -z "$cache_key" ]]; then
        perf_log "ERROR: cache_set requires cache_type and cache_key"
        return 1
    fi
    
    local cache_file="$CACHE_DIR/${cache_type}_${cache_key}"
    local metadata_key="${cache_type}:${cache_key}"
    local expiry=$(($(date +%s) + ttl))
    
    # Store cache value
    echo "$cache_value" > "$cache_file"
    
    # Store metadata
    CACHE_METADATA["$metadata_key"]="$expiry"
    
    perf_log "Cached: $metadata_key (TTL: ${ttl}s)"
}

cache_get() {
    local cache_type="${1:-}"
    local cache_key="${2:-}"
    
    if [[ -z "$cache_type" || -z "$cache_key" ]]; then
        perf_log "ERROR: cache_get requires cache_type and cache_key"
        return 1
    fi
    
    local cache_file="$CACHE_DIR/${cache_type}_${cache_key}"
    local metadata_key="${cache_type}:${cache_key}"
    local current_time=$(date +%s)
    local expiry="${CACHE_METADATA[$metadata_key]:-0}"
    
    # Check if cache exists and is not expired
    if [[ -f "$cache_file" && $current_time -lt $expiry ]]; then
        cat "$cache_file"
        perf_log "Cache hit: $metadata_key"
        return 0
    else
        # Clean expired cache
        if [[ -f "$cache_file" ]]; then
            rm -f "$cache_file"
            unset CACHE_METADATA["$metadata_key"]
            perf_log "Cache expired: $metadata_key"
        else
            perf_log "Cache miss: $metadata_key"
        fi
        return 1
    fi
}

cache_exists() {
    local cache_type="${1:-}"
    local cache_key="${2:-}"
    
    cache_get "$cache_type" "$cache_key" >/dev/null 2>&1
}

cache_invalidate() {
    local cache_type="${1:-}"
    local cache_key="${2:-}"
    
    if [[ -z "$cache_type" ]]; then
        perf_log "ERROR: cache_invalidate requires cache_type"
        return 1
    fi
    
    if [[ -n "$cache_key" ]]; then
        # Invalidate specific key
        local cache_file="$CACHE_DIR/${cache_type}_${cache_key}"
        local metadata_key="${cache_type}:${cache_key}"
        
        rm -f "$cache_file"
        unset CACHE_METADATA["$metadata_key"]
        perf_log "Invalidated: $metadata_key"
    else
        # Invalidate all keys for cache_type
        rm -f "$CACHE_DIR/${cache_type}_"*
        
        # Remove from metadata
        for key in "${!CACHE_METADATA[@]}"; do
            if [[ "$key" == "${cache_type}:"* ]]; then
                unset CACHE_METADATA["$key"]
            fi
        done
        
        perf_log "Invalidated all: $cache_type"
    fi
}

cleanup_expired_cache() {
    local current_time=$(date +%s)
    local cleaned_count=0
    
    for metadata_key in "${!CACHE_METADATA[@]}"; do
        local expiry="${CACHE_METADATA[$metadata_key]}"
        
        if [[ $current_time -gt $expiry ]]; then
            # Extract cache_type and cache_key
            local cache_type="${metadata_key%%:*}"
            local cache_key="${metadata_key#*:}"
            local cache_file="$CACHE_DIR/${cache_type}_${cache_key}"
            
            rm -f "$cache_file"
            unset CACHE_METADATA["$metadata_key"]
            ((cleaned_count++))
        fi
    done
    
    if [[ $cleaned_count -gt 0 ]]; then
        perf_log "Cleaned $cleaned_count expired cache entries"
    fi
}

# =============================================================================
# Parallel Execution
# =============================================================================

parallel_execute() {
    local job_name="${1:-}"
    local command="${2:-}"
    local max_jobs="${3:-$MAX_PARALLEL_JOBS}"
    
    if [[ -z "$job_name" || -z "$command" ]]; then
        perf_log "ERROR: parallel_execute requires job_name and command"
        return 1
    fi
    
    # Wait if we've reached max parallel jobs
    while [[ $PARALLEL_JOB_COUNT -ge $max_jobs ]]; do
        wait_for_any_job
        sleep 0.1
    done
    
    # Start the job
    perf_log "Starting parallel job: $job_name"
    
    (
        local start_time=$(date +%s.%3N)
        local job_log="/tmp/job_${job_name}_$$.log"
        
        # Execute command and capture output
        if eval "$command" > "$job_log" 2>&1; then
            local end_time=$(date +%s.%3N)
            local duration=$(echo "$end_time - $start_time" | bc 2>/dev/null || echo "0")
            echo "SUCCESS:$duration:$(cat "$job_log")"
        else
            local exit_code=$?
            local end_time=$(date +%s.%3N)
            local duration=$(echo "$end_time - $start_time" | bc 2>/dev/null || echo "0")
            echo "FAILED:$exit_code:$duration:$(cat "$job_log")"
        fi
        
        rm -f "$job_log"
    ) &
    
    local job_pid=$!
    PARALLEL_JOBS["$job_name"]="$job_pid"
    ((PARALLEL_JOB_COUNT++))
    
    perf_log "Started job '$job_name' with PID $job_pid"
}

wait_for_job() {
    local job_name="${1:-}"
    
    if [[ -z "$job_name" ]]; then
        perf_log "ERROR: wait_for_job requires job_name"
        return 1
    fi
    
    local job_pid="${PARALLEL_JOBS[$job_name]:-}"
    
    if [[ -z "$job_pid" ]]; then
        perf_log "ERROR: Job '$job_name' not found"
        return 1
    fi
    
    perf_log "Waiting for job: $job_name (PID: $job_pid)"
    
    if wait "$job_pid"; then
        perf_log "Job completed successfully: $job_name"
        unset PARALLEL_JOBS["$job_name"]
        ((PARALLEL_JOB_COUNT--))
        return 0
    else
        local exit_code=$?
        perf_log "Job failed: $job_name (exit code: $exit_code)"
        unset PARALLEL_JOBS["$job_name"]
        ((PARALLEL_JOB_COUNT--))
        return $exit_code
    fi
}

wait_for_any_job() {
    if [[ $PARALLEL_JOB_COUNT -eq 0 ]]; then
        return 0
    fi
    
    # Wait for any job to complete
    for job_name in "${!PARALLEL_JOBS[@]}"; do
        local job_pid="${PARALLEL_JOBS[$job_name]}"
        
        if ! kill -0 "$job_pid" 2>/dev/null; then
            # Job has completed
            wait "$job_pid" 2>/dev/null || true
            unset PARALLEL_JOBS["$job_name"]
            ((PARALLEL_JOB_COUNT--))
            perf_log "Job completed: $job_name"
            return 0
        fi
    done
    
    # If all jobs are still running, wait briefly
    sleep 0.1
}

wait_for_all_jobs() {
    perf_log "Waiting for all parallel jobs to complete..."
    
    while [[ $PARALLEL_JOB_COUNT -gt 0 ]]; do
        wait_for_any_job
    done
    
    perf_log "All parallel jobs completed"
}

kill_all_jobs() {
    perf_log "Terminating all parallel jobs..."
    
    for job_name in "${!PARALLEL_JOBS[@]}"; do
        local job_pid="${PARALLEL_JOBS[$job_name]}"
        
        if kill -0 "$job_pid" 2>/dev/null; then
            kill "$job_pid" 2>/dev/null || true
            perf_log "Terminated job: $job_name"
        fi
        
        unset PARALLEL_JOBS["$job_name"]
    done
    
    PARALLEL_JOB_COUNT=0
}

# =============================================================================
# Performance Monitoring
# =============================================================================

start_performance_monitor() {
    local operation="${1:-default}"
    
    PERFORMANCE_METRICS["${operation}_start"]=$(date +%s.%3N)
    PERFORMANCE_METRICS["${operation}_cpu_start"]=$(get_cpu_usage)
    PERFORMANCE_METRICS["${operation}_mem_start"]=$(get_memory_usage)
    
    perf_log "Started monitoring: $operation"
}

end_performance_monitor() {
    local operation="${1:-default}"
    
    local end_time=$(date +%s.%3N)
    local start_time="${PERFORMANCE_METRICS[${operation}_start]:-$end_time}"
    local duration=$(echo "$end_time - $start_time" | bc 2>/dev/null || echo "0")
    
    local cpu_end=$(get_cpu_usage)
    local cpu_start="${PERFORMANCE_METRICS[${operation}_cpu_start]:-0}"
    local cpu_delta=$(echo "$cpu_end - $cpu_start" | bc 2>/dev/null || echo "0")
    
    local mem_end=$(get_memory_usage)
    local mem_start="${PERFORMANCE_METRICS[${operation}_mem_start]:-0}"
    local mem_delta=$(echo "$mem_end - $mem_start" | bc 2>/dev/null || echo "0")
    
    perf_log "Performance report for '$operation':"
    perf_log "  Duration: ${duration}s"
    perf_log "  CPU usage change: ${cpu_delta}%"
    perf_log "  Memory usage change: ${mem_delta}MB"
    
    # Cleanup metrics
    unset PERFORMANCE_METRICS["${operation}_start"]
    unset PERFORMANCE_METRICS["${operation}_cpu_start"]
    unset PERFORMANCE_METRICS["${operation}_mem_start"]
}

get_cpu_usage() {
    # Get current CPU usage percentage
    top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//' 2>/dev/null || echo "0"
}

get_memory_usage() {
    # Get current memory usage in MB
    free -m | awk 'NR==2{print $3}' 2>/dev/null || echo "0"
}

get_disk_usage() {
    # Get disk usage percentage for root filesystem
    df / | awk 'NR==2 {print $5}' | sed 's/%//' 2>/dev/null || echo "0"
}

# =============================================================================
# Optimization Utilities
# =============================================================================

optimize_docker_build() {
    local build_context="${1:-.}"
    local cache_key="docker_build_$(echo "$build_context" | md5sum | cut -d' ' -f1)"
    
    # Check if we have a recent successful build cached
    if cache_exists "docker" "$cache_key"; then
        perf_log "Using cached Docker build for: $build_context"
        return 0
    fi
    
    perf_log "Optimizing Docker build for: $build_context"
    
    # Use BuildKit and build cache
    export DOCKER_BUILDKIT=1
    export BUILDKIT_PROGRESS=plain
    
    local build_command="docker build --build-arg BUILDKIT_INLINE_CACHE=1 '$build_context'"
    
    start_performance_monitor "docker_build"
    
    if eval "$build_command"; then
        end_performance_monitor "docker_build"
        cache_set "docker" "$cache_key" "success" 1800  # Cache for 30 minutes
        perf_log "Docker build completed and cached"
        return 0
    else
        local exit_code=$?
        end_performance_monitor "docker_build"
        perf_log "Docker build failed with exit code: $exit_code"
        return $exit_code
    fi
}

optimize_npm_install() {
    local package_dir="${1:-.}"
    local package_json="$package_dir/package.json"
    
    if [[ ! -f "$package_json" ]]; then
        perf_log "ERROR: package.json not found in $package_dir"
        return 1
    fi
    
    local cache_key="npm_$(md5sum "$package_json" | cut -d' ' -f1)"
    
    # Check if dependencies are already installed and cached
    if cache_exists "npm" "$cache_key" && [[ -d "$package_dir/node_modules" ]]; then
        perf_log "Using cached npm dependencies for: $package_dir"
        return 0
    fi
    
    perf_log "Optimizing npm install for: $package_dir"
    
    cd "$package_dir"
    
    start_performance_monitor "npm_install"
    
    # Use pnpm for better performance and caching
    if command -v pnpm >/dev/null 2>&1; then
        if pnpm install --frozen-lockfile --prefer-offline; then
            end_performance_monitor "npm_install"
            cache_set "npm" "$cache_key" "success" 3600  # Cache for 1 hour
            perf_log "pnpm install completed and cached"
            return 0
        fi
    else
        # Fallback to npm with optimizations
        if npm ci --prefer-offline --no-audit; then
            end_performance_monitor "npm_install"
            cache_set "npm" "$cache_key" "success" 3600  # Cache for 1 hour
            perf_log "npm install completed and cached"
            return 0
        fi
    fi
    
    local exit_code=$?
    end_performance_monitor "npm_install"
    perf_log "npm install failed with exit code: $exit_code"
    return $exit_code
}

# =============================================================================
# Resource Management
# =============================================================================

check_system_resources() {
    local min_memory_mb="${1:-1024}"
    local min_disk_gb="${2:-5}"
    
    perf_log "Checking system resources..."
    
    # Check available memory
    local available_memory=$(free -m | awk 'NR==2{print $7}')
    if [[ $available_memory -lt $min_memory_mb ]]; then
        perf_log "WARNING: Low available memory: ${available_memory}MB (minimum: ${min_memory_mb}MB)"
        return 1
    fi
    
    # Check available disk space
    local available_disk=$(df / | awk 'NR==2 {print int($4/1024/1024)}')
    if [[ $available_disk -lt $min_disk_gb ]]; then
        perf_log "WARNING: Low available disk space: ${available_disk}GB (minimum: ${min_disk_gb}GB)"
        return 1
    fi
    
    perf_log "System resources OK: Memory=${available_memory}MB, Disk=${available_disk}GB"
    return 0
}

# =============================================================================
# Logging
# =============================================================================

perf_log() {
    local message="${1:-}"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S.%3N')
    echo -e "${PERF_COLOR_BLUE}[PERF] $timestamp: $message${PERF_COLOR_NC}"
    echo "$timestamp [PERF] $message" >> "$PERFORMANCE_LOG"
}

# =============================================================================
# Module Status
# =============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "Performance Module v1.0.0"
    echo "This module should be sourced, not executed directly."
    exit 1
fi