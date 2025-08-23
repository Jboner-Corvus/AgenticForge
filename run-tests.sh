#!/bin/bash

# =============================================================================
# AgenticForge Test Launcher
# =============================================================================
# Convenient launcher for AgenticForge tests
# =============================================================================

set -euo pipefail

# Colors for output
readonly COLOR_CYAN='\033[0;36m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_ORANGE='\033[0;33m'
readonly NC='\033[0m'

show_banner() {
    echo -e "${COLOR_ORANGE}"
    echo '    ╔══════════════════════════════════════════╗'
    echo '    ║        AGENTICFORGE TEST LAUNCHER       ║'
    echo '    ╚══════════════════════════════════════════╝'
    echo -e "${NC}"
    echo -e "${COLOR_CYAN}Launching AgenticForge test suite...${NC}"
    echo ""
}

main() {
    # Check if tests directory exists
    if [[ ! -d "tests" ]]; then
        echo "❌ Tests directory not found"
        echo "💡 Make sure you're running this from the AgenticForge root directory"
        exit 1
    fi
    
    # Check if test runner exists
    if [[ ! -f "tests/test-runner.sh" ]]; then
        echo "❌ Test runner not found in tests directory"
        exit 1
    fi
    
    show_banner
    
    # Navigate to tests directory and run the test runner
    cd tests
    chmod +x test-runner.sh
    ./test-runner.sh
}

# Handle command line arguments for direct test execution
if [[ $# -gt 0 ]]; then
    case "$1" in
        "canvas"|"canvas-todo")
            echo -e "${COLOR_BLUE}🎨📋 Running Canvas & Todo List Tests...${NC}"
            cd tests
            chmod +x test-canvas-todo.sh
            ./test-canvas-todo.sh
            ;;
        "full"|"all"|"comprehensive")
            echo -e "${COLOR_BLUE}🚀 Running Full Agent Capability Tests...${NC}"
            cd tests
            chmod +x test-agent-capabilities.sh
            ./test-agent-capabilities.sh
            ;;
        "help"|"-h"|"--help")
            echo "AgenticForge Test Launcher"
            echo ""
            echo "Usage:"
            echo "  ./run-tests.sh                    # Interactive test menu"
            echo "  ./run-tests.sh canvas             # Canvas & Todo List tests only"
            echo "  ./run-tests.sh full               # Full capability tests"
            echo "  ./run-tests.sh help               # Show this help"
            echo ""
            echo "Available test suites:"
            echo "  - canvas, canvas-todo: Quick tests for canvas and todo list functionality"
            echo "  - full, all, comprehensive: Complete agent capability validation"
            ;;
        *)
            echo "❌ Unknown test suite: $1"
            echo "💡 Use './run-tests.sh help' for available options"
            exit 1
            ;;
    esac
else
    main
fi