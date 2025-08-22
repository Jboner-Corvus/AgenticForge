#!/bin/bash

# =============================================================================
# Testing Module
# =============================================================================
# Provides comprehensive testing framework with unit and integration test
# separation, detailed reporting, and test optimization.
# =============================================================================

set -eo pipefail

# Testing configuration
declare -g TEST_OUTPUT_DIR="${TEST_OUTPUT_DIR:-/tmp/agenticforge-tests}"
declare -g TEST_LOG_FILE="${TEST_LOG_FILE:-$TEST_OUTPUT_DIR/test.log}"
declare -g TEST_PARALLEL="${TEST_PARALLEL:-true}"
declare -g TEST_TIMEOUT="${TEST_TIMEOUT:-300}"  # 5 minutes default

# Test state
declare -g -A TEST_RESULTS=()
declare -g -A TEST_DURATIONS=()
declare -g TEST_SUITE_START_TIME=""

# Color codes
readonly TEST_COLOR_RED='\033[0;31m'
readonly TEST_COLOR_GREEN='\033[0;32m'
readonly TEST_COLOR_YELLOW='\033[1;33m'
readonly TEST_COLOR_BLUE='\033[0;34m'
readonly TEST_COLOR_CYAN='\033[0;36m'
readonly TEST_COLOR_NC='\033[0m'

# =============================================================================
# Initialization
# =============================================================================

init_testing_system() {
    # Create test output directory
    mkdir -p "$TEST_OUTPUT_DIR"
    
    # Initialize test log
    touch "$TEST_LOG_FILE"
    
    test_log "Testing system initialized"
    test_log "Output directory: $TEST_OUTPUT_DIR"
    test_log "Parallel execution: $TEST_PARALLEL"
}

# =============================================================================
# Test Execution Framework
# =============================================================================

run_test_suite() {
    local suite_name="${1:-}"
    local test_type="${2:-unit}"  # unit, integration, all
    local packages=("${@:3}")
    
    if [[ -z "$suite_name" ]]; then
        test_log "ERROR: run_test_suite requires suite_name"
        return 1
    fi
    
    test_log "🧪 Starting test suite: $suite_name ($test_type)"
    TEST_SUITE_START_TIME=$(date +%s)
    
    # Clear previous results
    TEST_RESULTS=()
    TEST_DURATIONS=()
    
    # Default to all packages if none specified
    if [[ ${#packages[@]} -eq 0 ]]; then
        packages=("packages/core" "packages/ui")
    fi
    
    local total_failures=0
    local total_tests=0
    
    # Execute tests for each package
    for package in "${packages[@]}"; do
        if [[ -d "$package" ]]; then
            run_package_tests "$package" "$test_type"
            local result=$?
            
            TEST_RESULTS["$package"]=$result
            ((total_tests++))
            
            if [[ $result -ne 0 ]]; then
                ((total_failures++))
            fi
        else
            test_log "WARNING: Package directory not found: $package"
        fi
    done
    
    # Generate test report
    generate_test_report "$suite_name" "$test_type" $total_tests $total_failures
    
    return $total_failures
}

run_package_tests() {
    local package_dir="${1:-}"
    local test_type="${2:-unit}"
    
    if [[ -z "$package_dir" || ! -d "$package_dir" ]]; then
        test_log "ERROR: Invalid package directory: $package_dir"
        return 1
    fi
    
    local package_name=$(basename "$package_dir")
    test_log "🔬 Testing package: $package_name ($test_type)"
    
    cd "$package_dir"
    
    # Check if package.json exists
    if [[ ! -f "package.json" ]]; then
        test_log "WARNING: No package.json found in $package_dir"
        return 1
    fi
    
    local start_time=$(date +%s)
    local test_command=""
    local result=0
    
    # Determine test command based on type
    case "$test_type" in
        "unit")
            if npm run test:unit --silent 2>/dev/null; then
                test_command="npm run test:unit"
            elif pnpm run test:unit --silent 2>/dev/null; then
                test_command="pnpm run test:unit"
            else
                test_log "No unit test script found for $package_name"
                return 1
            fi
            ;;
        "integration")
            if npm run test:integration --silent 2>/dev/null; then
                test_command="npm run test:integration"
            elif pnpm run test:integration --silent 2>/dev/null; then
                test_command="pnpm run test:integration"
            else
                # Fallback to regular test script
                if npm run test --silent 2>/dev/null; then
                    test_command="npm run test"
                elif pnpm run test --silent 2>/dev/null; then
                    test_command="pnpm run test"
                else
                    test_log "No test script found for $package_name"
                    return 1
                fi
            fi
            ;;
        "all")
            if npm run test --silent 2>/dev/null; then
                test_command="npm run test"
            elif pnpm run test --silent 2>/dev/null; then
                test_command="pnpm run test"
            else
                test_log "No test script found for $package_name"
                return 1
            fi
            ;;
        *)
            test_log "ERROR: Unknown test type: $test_type"
            return 1
            ;;
    esac
    
    # Execute test command with timeout
    local test_output_file="$TEST_OUTPUT_DIR/${package_name}_${test_type}.log"
    
    test_log "Executing: $test_command"
    
    if timeout "$TEST_TIMEOUT" bash -c "$test_command" > "$test_output_file" 2>&1; then
        result=0
        test_log "✅ Tests passed for $package_name ($test_type)"
    else
        result=$?
        test_log "❌ Tests failed for $package_name ($test_type)"
        
        # Show last few lines of output for debugging
        echo -e "${TEST_COLOR_RED}Last 10 lines of test output:${TEST_COLOR_NC}" >&2
        tail -n 10 "$test_output_file" >&2
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    TEST_DURATIONS["$package_name"]=$duration
    
    test_log "Test completed for $package_name in ${duration}s"
    
    return $result
}

# =============================================================================
# Specialized Test Functions
# =============================================================================

run_unit_tests_only() {
    local packages=("${@}")
    
    test_log "🔬 Running unit tests only..."
    
    if [[ ${#packages[@]} -eq 0 ]]; then
        packages=("packages/core" "packages/ui")
    fi
    
    run_test_suite "unit-tests" "unit" "${packages[@]}"
}

run_integration_tests_only() {
    local packages=("${@}")
    
    test_log "🔗 Running integration tests only..."
    
    # Verify services are running for integration tests
    if ! check_services_for_integration; then
        test_log "ERROR: Required services not running for integration tests"
        test_log "Please start services first with: ./run-v2.sh start"
        return 1
    fi
    
    if [[ ${#packages[@]} -eq 0 ]]; then
        packages=("packages/core")  # Usually only core has integration tests
    fi
    
    run_test_suite "integration-tests" "integration" "${packages[@]}"
}

run_all_tests() {
    local packages=("${@}")
    
    test_log "🧪 Running all tests..."
    
    local unit_result=0
    local integration_result=0
    
    # Run unit tests first
    run_unit_tests_only "${packages[@]}" || unit_result=$?
    
    # Run integration tests if unit tests pass or if forced
    if [[ $unit_result -eq 0 || "${FORCE_INTEGRATION:-false}" == "true" ]]; then
        run_integration_tests_only "${packages[@]}" || integration_result=$?
    else
        test_log "Skipping integration tests due to unit test failures"
        integration_result=1
    fi
    
    # Overall result
    if [[ $unit_result -eq 0 && $integration_result -eq 0 ]]; then
        test_log "🎉 All tests passed!"
        return 0
    else
        test_log "💥 Some tests failed (Unit: $unit_result, Integration: $integration_result)"
        return 1
    fi
}

# =============================================================================
# Test Utilities
# =============================================================================

check_services_for_integration() {
    test_log "🏥 Checking if services are ready for integration tests..."
    
    local all_ready=true
    
    # Check Docker containers
    if ! docker compose ps | grep -q "Up"; then
        test_log "❌ Docker services not running"
        all_ready=false
    else
        test_log "✅ Docker services are running"
    fi
    
    # Check Redis
    if ! docker exec g_forge_redis redis-cli ping >/dev/null 2>&1; then
        test_log "❌ Redis not accessible"
        all_ready=false
    else
        test_log "✅ Redis is accessible"
    fi
    
    # Check PostgreSQL
    if ! docker exec g_forge_db pg_isready >/dev/null 2>&1; then
        test_log "❌ PostgreSQL not ready"
        all_ready=false
    else
        test_log "✅ PostgreSQL is ready"
    fi
    
    if [[ "$all_ready" == "true" ]]; then
        test_log "✅ All services ready for integration tests"
        return 0
    else
        test_log "❌ Some services not ready for integration tests"
        return 1
    fi
}

run_test_with_coverage() {
    local package_dir="${1:-}"
    local test_type="${2:-unit}"
    
    if [[ -z "$package_dir" ]]; then
        test_log "ERROR: run_test_with_coverage requires package_dir"
        return 1
    fi
    
    test_log "📊 Running tests with coverage for: $(basename "$package_dir")"
    
    cd "$package_dir"
    
    local coverage_dir="$TEST_OUTPUT_DIR/coverage/$(basename "$package_dir")"
    mkdir -p "$coverage_dir"
    
    # Try different coverage commands
    local coverage_command=""
    if npm run test:coverage --silent 2>/dev/null; then
        coverage_command="npm run test:coverage"
    elif pnpm run test:coverage --silent 2>/dev/null; then
        coverage_command="pnpm run test:coverage"
    elif command -v nyc >/dev/null 2>&1; then
        coverage_command="nyc --reporter=html --report-dir='$coverage_dir' npm test"
    else
        test_log "No coverage tool available for $(basename "$package_dir")"
        # Fallback to regular tests
        run_package_tests "$package_dir" "$test_type"
        return $?
    fi
    
    if eval "$coverage_command"; then
        test_log "✅ Tests with coverage completed for $(basename "$package_dir")"
        test_log "Coverage report: $coverage_dir"
        return 0
    else
        local result=$?
        test_log "❌ Tests with coverage failed for $(basename "$package_dir")"
        return $result
    fi
}

# =============================================================================
# Test Reporting
# =============================================================================

generate_test_report() {
    local suite_name="${1:-}"
    local test_type="${2:-}"
    local total_tests="${3:-0}"
    local total_failures="${4:-0}"
    
    local suite_end_time=$(date +%s)
    local suite_duration=$((suite_end_time - TEST_SUITE_START_TIME))
    local success_count=$((total_tests - total_failures))
    
    local report_file="$TEST_OUTPUT_DIR/${suite_name}_report.txt"
    
    # Generate detailed report
    {
        echo "==============================================="
        echo "TEST SUITE REPORT"
        echo "==============================================="
        echo "Suite: $suite_name"
        echo "Type: $test_type"
        echo "Timestamp: $(date)"
        echo "Duration: ${suite_duration}s"
        echo ""
        echo "SUMMARY:"
        echo "  Total packages tested: $total_tests"
        echo "  Successful: $success_count"
        echo "  Failed: $total_failures"
        echo "  Success rate: $(( (success_count * 100) / (total_tests > 0 ? total_tests : 1) ))%"
        echo ""
        echo "PACKAGE RESULTS:"
        
        for package in "${!TEST_RESULTS[@]}"; do
            local result="${TEST_RESULTS[$package]}"
            local duration="${TEST_DURATIONS[$package]:-0}"
            local status="PASS"
            
            if [[ $result -ne 0 ]]; then
                status="FAIL"
            fi
            
            printf "  %-20s %s (%ds)\n" "$package" "$status" "$duration"
        done
        
        echo ""
        echo "==============================================="
    } > "$report_file"
    
    # Display summary
    echo -e "\n${TEST_COLOR_CYAN}=== Test Suite Summary ===${TEST_COLOR_NC}"
    echo -e "Suite: ${TEST_COLOR_BLUE}$suite_name${TEST_COLOR_NC} ($test_type)"
    echo -e "Duration: ${suite_duration}s"
    echo -e "Results: "
    
    if [[ $total_failures -eq 0 ]]; then
        echo -e "  ${TEST_COLOR_GREEN}🎉 All $total_tests package(s) passed!${TEST_COLOR_NC}"
    else
        echo -e "  ${TEST_COLOR_GREEN}✅ $success_count passed${TEST_COLOR_NC}"
        echo -e "  ${TEST_COLOR_RED}❌ $total_failures failed${TEST_COLOR_NC}"
    fi
    
    echo -e "\nDetailed report: $report_file"
    
    # Show failed packages if any
    if [[ $total_failures -gt 0 ]]; then
        echo -e "\n${TEST_COLOR_RED}Failed packages:${TEST_COLOR_NC}"
        for package in "${!TEST_RESULTS[@]}"; do
            if [[ ${TEST_RESULTS[$package]} -ne 0 ]]; then
                echo -e "  ${TEST_COLOR_RED}❌ $package${TEST_COLOR_NC}"
                
                # Show test output if available
                local output_file="$TEST_OUTPUT_DIR/$(basename "$package")_${test_type}.log"
                if [[ -f "$output_file" ]]; then
                    echo -e "     Log: $output_file"
                fi
            fi
        done
    fi
}

# =============================================================================
# Test Cleanup
# =============================================================================

cleanup_test_artifacts() {
    test_log "🧹 Cleaning up test artifacts..."
    
    # Clean old test outputs (keep last 5 runs)
    find "$TEST_OUTPUT_DIR" -name "*.log" -type f -mtime +5 -delete 2>/dev/null || true
    find "$TEST_OUTPUT_DIR" -name "*_report.txt" -type f -mtime +5 -delete 2>/dev/null || true
    
    # Clean coverage directories older than 1 day
    find "$TEST_OUTPUT_DIR/coverage" -type d -mtime +1 -exec rm -rf {} \; 2>/dev/null || true
    
    test_log "✅ Test cleanup completed"
}

# =============================================================================
# Logging
# =============================================================================

test_log() {
    local message="${1:-}"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${TEST_COLOR_BLUE}[TEST] $timestamp: $message${TEST_COLOR_NC}"
    echo "$timestamp [TEST] $message" >> "$TEST_LOG_FILE"
}

# =============================================================================
# Module Status
# =============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "Testing Module v1.0.0"
    echo "This module should be sourced, not executed directly."
    exit 1
fi