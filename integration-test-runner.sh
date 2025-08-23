#!/bin/bash

# =============================================================================
# AgenticForge Integration Test Runner
# =============================================================================
# Sequential execution of all integration tests with detailed reporting
# =============================================================================

set -eo pipefail

# Script metadata
readonly SCRIPT_VERSION="1.0.0"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly ROOT_DIR="$SCRIPT_DIR"

# Colors for output
readonly COLOR_RED='\033[0;31m'
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_CYAN='\033[0;36m'
readonly COLOR_ORANGE='\033[0;33m'
readonly NC='\033[0m' # No Color

# Configuration
readonly TEST_LOG_DIR="$ROOT_DIR/integration-test-logs"
readonly REPORT_FILE="$TEST_LOG_DIR/integration-test-report.txt"
readonly MAX_RETRIES=2
readonly TEST_TIMEOUT=300

# Test state
declare -g TESTS_TOTAL=0
declare -g TESTS_PASSED=0
declare -g TESTS_FAILED=0
declare -g TESTS_SKIPPED=0
declare -a FAILED_TESTS=()

# Display banner
show_banner() {
    echo -e "${COLOR_ORANGE}"
    echo '    ╔══════════════════════════════════════════════════════════╗'
    echo '    ║        AGENTICFORGE INTEGRATION TEST RUNNER             ║'
    echo '    ╚══════════════════════════════════════════════════════════╝'
    echo -e "${NC}"
    echo -e "${COLOR_CYAN}🚀 Running integration tests sequentially...${NC}"
    echo -e "${COLOR_CYAN}📂 Working directory: ${ROOT_DIR}${NC}"
    echo ""
}

# Initialize test environment
initialize() {
    echo -e "${COLOR_BLUE}🔧 Initializing test environment...${NC}"
    
    # Create test log directory
    mkdir -p "$TEST_LOG_DIR"
    
    # Clear previous logs
    rm -f "$TEST_LOG_DIR"/*.log
    
    # Initialize report file
    {
        echo "AgenticForge Integration Test Report"
        echo "===================================="
        echo "Date: $(date)"
        echo "Runner Version: $SCRIPT_VERSION"
        echo ""
    } > "$REPORT_FILE"
    
    echo -e "${COLOR_GREEN}✅ Test environment initialized${NC}"
}

# Log test results
log_test_result() {
    local test_name="$1"
    local status="$2"
    local duration="${3:-0}"
    local details="${4:-}"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    case "$status" in
        "PASS")
            TESTS_PASSED=$((TESTS_PASSED + 1))
            echo -e "${COLOR_GREEN}✅ $test_name${NC} (${duration}s)"
            echo "✅ $test_name (PASS) - ${duration}s" >> "$REPORT_FILE"
            ;;
        "FAIL")
            TESTS_FAILED=$((TESTS_FAILED + 1))
            FAILED_TESTS+=("$test_name")
            echo -e "${COLOR_RED}❌ $test_name${NC} (${duration}s)"
            echo "❌ $test_name (FAIL) - ${duration}s" >> "$REPORT_FILE"
            if [[ -n "$details" ]]; then
                echo -e "${COLOR_YELLOW}   Details: $details${NC}"
                echo "   Details: $details" >> "$REPORT_FILE"
            fi
            ;;
        "SKIP")
            TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
            echo -e "${COLOR_YELLOW}⚠️  $test_name${NC} (SKIPPED)"
            echo "⚠️  $test_name (SKIP)" >> "$REPORT_FILE"
            ;;
    esac
}

# Run a single integration test
run_single_test() {
    local test_name="$1"
    local test_command="$2"
    local test_log_file="$TEST_LOG_DIR/${test_name// /_}.log"
    
    echo -e "${COLOR_BLUE}🔍 Running: $test_name${NC}"
    echo "Test: $test_name" >> "$REPORT_FILE"
    echo "Command: $test_command" >> "$REPORT_FILE"
    
    local start_time=$(date +%s)
    local result=0
    
    # Run test with timeout
    if timeout "$TEST_TIMEOUT" bash -c "$test_command" > "$test_log_file" 2>&1; then
        result=0
    else
        result=$?
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [[ $result -eq 0 ]]; then
        log_test_result "$test_name" "PASS" "$duration"
    elif [[ $result -eq 124 ]]; then
        # Timeout
        log_test_result "$test_name" "FAIL" "$duration" "Timeout after ${TEST_TIMEOUT}s"
    else
        # Other failure
        log_test_result "$test_name" "FAIL" "$duration" "Exit code $result"
        
        # Show last few lines of log for debugging
        echo -e "${COLOR_RED}Last 10 lines of test output:${NC}" >&2
        tail -n 10 "$test_log_file" >&2
        echo "" >&2
    fi
    
    return $result
}

# Run integration tests for core package
run_core_integration_tests() {
    echo -e "${COLOR_CYAN}📦 Running core package integration tests...${NC}"
    
    # Check if core package exists
    if [[ ! -d "$ROOT_DIR/packages/core" ]]; then
        log_test_result "Core package directory check" "SKIP"
        return 0
    fi
    
    cd "$ROOT_DIR/packages/core"
    
    # Run all integration tests in core package
    run_single_test "Core API Integration Tests" "pnpm test:integration --run"
    run_single_test "Core Agent Integration Tests" "pnpm test --mode integration --run --testNamePattern='agent'"
    run_single_test "Core Redis Integration Tests" "pnpm test --mode integration --run --testNamePattern='redis'"
    run_single_test "Core PostgreSQL Integration Tests" "pnpm test --mode integration --run --testNamePattern='postgres'"
    
    cd "$ROOT_DIR"
}

# Run integration tests for UI package
run_ui_integration_tests() {
    echo -e "${COLOR_CYAN}🖥️  Running UI package integration tests...${NC}"
    
    # Check if UI package exists
    if [[ ! -d "$ROOT_DIR/packages/ui" ]]; then
        log_test_result "UI package directory check" "SKIP"
        return 0
    fi
    
    cd "$ROOT_DIR/packages/ui"
    
    # Run all integration tests in UI package
    run_single_test "UI Integration Tests" "pnpm test:integration --run"
    
    cd "$ROOT_DIR"
}

# Run end-to-end tests
run_e2e_tests() {
    echo -e "${COLOR_CYAN}🌐 Running end-to-end tests...${NC}"
    
    # Check if core package exists
    if [[ ! -d "$ROOT_DIR/packages/core" ]]; then
        log_test_result "E2E tests directory check" "SKIP"
        return 0
    fi
    
    cd "$ROOT_DIR/packages/core"
    
    # Run E2E tests
    run_single_test "Agent E2E Tests" "pnpm test --mode integration --run --testNamePattern='e2e'"
    
    cd "$ROOT_DIR"
}

# Run script-based integration tests
run_script_integration_tests() {
    echo -e "${COLOR_CYAN}📜 Running script-based integration tests...${NC}"
    
    # Run existing test scripts if they exist
    if [[ -f "$ROOT_DIR/tests/test-agent-capabilities.sh" ]]; then
        run_single_test "Agent Capability Tests" "cd $ROOT_DIR/tests && ./test-agent-capabilities.sh"
    else
        log_test_result "Agent Capability Tests" "SKIP" "0" "Script not found"
    fi
    
    if [[ -f "$ROOT_DIR/tests/test-canvas-todo.sh" ]]; then
        run_single_test "Canvas & Todo Tests" "cd $ROOT_DIR/tests && ./test-canvas-todo.sh"
    else
        log_test_result "Canvas & Todo Tests" "SKIP" "0" "Script not found"
    fi
}

# Generate test report
generate_report() {
    echo -e "\n${COLOR_CYAN}📊 Integration Test Summary${NC}"
    echo "============================="
    echo -e "Total Tests: ${COLOR_BLUE}$TESTS_TOTAL${NC}"
    echo -e "Passed: ${COLOR_GREEN}$TESTS_PASSED${NC}"
    echo -e "Failed: ${COLOR_RED}$TESTS_FAILED${NC}"
    echo -e "Skipped: ${COLOR_YELLOW}$TESTS_SKIPPED${NC}"
    
    local success_rate=0
    if [[ $TESTS_TOTAL -gt 0 ]]; then
        success_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    fi
    echo -e "Success Rate: ${COLOR_YELLOW}$success_rate%${NC}"
    
    # Add summary to report file
    {
        echo ""
        echo "Integration Test Summary"
        echo "========================"
        echo "Total Tests: $TESTS_TOTAL"
        echo "Passed: $TESTS_PASSED"
        echo "Failed: $TESTS_FAILED"
        echo "Skipped: $TESTS_SKIPPED"
        echo "Success Rate: $success_rate%"
    } >> "$REPORT_FILE"
    
    # List failed tests if any
    if [[ ${#FAILED_TESTS[@]} -gt 0 ]]; then
        echo -e "\n${COLOR_RED}❌ Failed Tests:${NC}"
        for test in "${FAILED_TESTS[@]}"; do
            echo -e "${COLOR_RED}  - $test${NC}"
        done
        echo -e "\n${COLOR_YELLOW}📋 Check logs in $TEST_LOG_DIR for details${NC}"
        
        # Add failed tests to report
        echo -e "\nFailed Tests:" >> "$REPORT_FILE"
        for test in "${FAILED_TESTS[@]}"; do
            echo "  - $test" >> "$REPORT_FILE"
        done
    fi
    
    echo -e "\n${COLOR_CYAN}📁 Detailed logs saved in: $TEST_LOG_DIR${NC}"
    echo -e "${COLOR_CYAN}📄 Test report saved in: $REPORT_FILE${NC}"
    
    if [[ $TESTS_FAILED -gt 0 ]]; then
        echo -e "\n${COLOR_RED}⚠️  Some integration tests failed!${NC}"
        return 1
    elif [[ $TESTS_TOTAL -eq 0 ]]; then
        echo -e "\n${COLOR_YELLOW}⚠️  No integration tests were run${NC}"
        return 1
    else
        echo -e "\n${COLOR_GREEN}🎉 All integration tests passed!${NC}"
        return 0
    fi
}

# Show usage information
show_usage() {
    echo "AgenticForge Integration Test Runner"
    echo ""
    echo "Usage:"
    echo "  ./integration-test-runner.sh [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -v, --verbose  Enable verbose output"
    echo "  --core-only    Run only core package tests"
    echo "  --ui-only      Run only UI package tests"
    echo "  --e2e-only     Run only end-to-end tests"
    echo "  --scripts-only Run only script-based tests"
    echo ""
    echo "Examples:"
    echo "  ./integration-test-runner.sh          # Run all integration tests"
    echo "  ./integration-test-runner.sh --core-only  # Run only core tests"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -v|--verbose)
                set -x
                shift
                ;;
            --core-only)
                RUN_CORE_ONLY=true
                shift
                ;;
            --ui-only)
                RUN_UI_ONLY=true
                shift
                ;;
            --e2e-only)
                RUN_E2E_ONLY=true
                shift
                ;;
            --scripts-only)
                RUN_SCRIPTS_ONLY=true
                shift
                ;;
            *)
                echo -e "${COLOR_RED}❌ Unknown option: $1${NC}"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Main function
main() {
    local RUN_CORE_ONLY=false
    local RUN_UI_ONLY=false
    local RUN_E2E_ONLY=false
    local RUN_SCRIPTS_ONLY=false
    
    # Parse command line arguments
    parse_args "$@"
    
    # Show banner
    show_banner
    
    # Initialize test environment
    initialize
    
    # Check if services are running
    echo -e "${COLOR_BLUE}🔍 Checking if required services are running...${NC}"
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        echo -e "${COLOR_YELLOW}⚠️  Docker is not running. Some tests may fail.${NC}"
    fi
    
    # Check if Redis is accessible
    if ! docker compose ps | grep -q redis; then
        echo -e "${COLOR_YELLOW}⚠️  Redis container is not running. Some tests may fail.${NC}"
    fi
    
    # Check if PostgreSQL is accessible
    if ! docker compose ps | grep -q postgres; then
        echo -e "${COLOR_YELLOW}⚠️  PostgreSQL container is not running. Some tests may fail.${NC}"
    fi
    
    echo -e "${COLOR_GREEN}✅ Environment check completed${NC}\n"
    
    # Run tests based on options
    if [[ "$RUN_CORE_ONLY" == true ]]; then
        run_core_integration_tests
    elif [[ "$RUN_UI_ONLY" == true ]]; then
        run_ui_integration_tests
    elif [[ "$RUN_E2E_ONLY" == true ]]; then
        run_e2e_tests
    elif [[ "$RUN_SCRIPTS_ONLY" == true ]]; then
        run_script_integration_tests
    else
        # Run all tests
        run_core_integration_tests
        run_ui_integration_tests
        run_e2e_tests
        run_script_integration_tests
    fi
    
    # Generate final report
    generate_report
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi