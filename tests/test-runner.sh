#!/bin/bash

# =============================================================================
# AgenticForge Quick Test Runner
# =============================================================================
# Simple interface to run different test suites
# =============================================================================

set -euo pipefail

# Colors
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_CYAN='\033[0;36m'
readonly COLOR_ORANGE='\033[0;33m'
readonly COLOR_YELLOW='\033[1;33m'
readonly NC='\033[0m'

show_banner() {
    clear
    echo -e "${COLOR_ORANGE}"
    echo '    ╔══════════════════════════════════════════╗'
    echo '    ║        AGENTICFORGE TEST RUNNER         ║'
    echo '    ╚══════════════════════════════════════════╝'
    echo -e "${NC}"
}

show_menu() {
    echo -e "${COLOR_CYAN}🧪 Choose test suite to run:${NC}"
    echo ""
    echo -e "  ${COLOR_BLUE}1)${NC} Canvas & Todo List Tests (Quick)"
    echo -e "  ${COLOR_BLUE}2)${NC} Full Agent Capability Tests"
    echo -e "  ${COLOR_BLUE}3)${NC} Custom Message Test"
    echo -e "  ${COLOR_BLUE}4)${NC} Check AgenticForge Status"
    echo -e "  ${COLOR_BLUE}5)${NC} View Test Logs"
    echo ""
    echo -e "  ${COLOR_BLUE}0)${NC} Exit"
    echo ""
}

check_agentic_forge() {
    echo -e "${COLOR_CYAN}🔍 Checking AgenticForge status...${NC}"
    
    if ! curl -s http://localhost:8080/api/health >/dev/null; then
        echo -e "${COLOR_YELLOW}⚠️  AgenticForge API not responding${NC}"
        echo -e "${COLOR_CYAN}💡 Start it with: ../run-v2.sh start${NC}"
        return 1
    fi
    
    if ! curl -s http://localhost:3002 >/dev/null; then
        echo -e "${COLOR_YELLOW}⚠️  AgenticForge Web UI not responding${NC}"
        return 1
    fi
    
    echo -e "${COLOR_GREEN}✅ AgenticForge is running${NC}"
    echo -e "${COLOR_CYAN}🌐 Web UI: http://localhost:3002${NC}"
    echo -e "${COLOR_CYAN}🔌 API: http://localhost:8080${NC}"
    return 0
}

run_canvas_todo_tests() {
    echo -e "${COLOR_BLUE}🎨📋 Running Canvas & Todo List Tests...${NC}"
    
    if [[ ! -f "test-canvas-todo.sh" ]]; then
        echo -e "${COLOR_YELLOW}⚠️  test-canvas-todo.sh not found${NC}"
        return 1
    fi
    
    chmod +x test-canvas-todo.sh
    ./test-canvas-todo.sh
}

run_full_tests() {
    echo -e "${COLOR_BLUE}🚀 Running Full Agent Capability Tests...${NC}"
    
    if [[ ! -f "test-agent-capabilities.sh" ]]; then
        echo -e "${COLOR_YELLOW}⚠️  test-agent-capabilities.sh not found${NC}"
        return 1
    fi
    
    chmod +x test-agent-capabilities.sh
    ./test-agent-capabilities.sh
}

custom_test() {
    echo -e "${COLOR_CYAN}💬 Custom Message Test${NC}"
    echo -e "${COLOR_CYAN}Enter your message for the AI agent:${NC}"
    read -r -p "> " user_message
    
    if [[ -z "$user_message" ]]; then
        echo -e "${COLOR_YELLOW}⚠️  Empty message${NC}"
        return 1
    fi
    
    # Get auth token
    if [[ -f "../.env" ]]; then
        AUTH_TOKEN=$(grep "^AUTH_TOKEN=" ../.env | cut -d'=' -f2 | tr -d '"')
    else
        echo -e "${COLOR_YELLOW}⚠️  .env file not found${NC}"
        return 1
    fi
    
    local session_id="custom-test-$(date +%s)"
    local payload="{\"prompt\": \"$user_message\", \"sessionId\": \"$session_id\"}"
    
    echo -e "${COLOR_BLUE}🤖 Sending message to agent...${NC}"
    echo ""
    
    curl -s -X POST \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "http://localhost:8080/api/chat" | jq . 2>/dev/null || {
        echo "Response received (jq not available for formatting)"
    }
    
    echo ""
    echo -e "${COLOR_GREEN}✅ Message sent! Check the web interface for the response.${NC}"
}

view_logs() {
    echo -e "${COLOR_CYAN}📁 Available test logs:${NC}"
    echo ""
    
    if [[ -d "agent-test-logs" ]]; then
        echo -e "${COLOR_BLUE}Agent Capability Test Logs:${NC}"
        ls -la agent-test-logs/ 2>/dev/null || echo "No logs found"
        echo ""
    fi
    
    if [[ -d "test-logs" ]]; then
        echo -e "${COLOR_BLUE}General Test Logs:${NC}"
        ls -la test-logs/ 2>/dev/null || echo "No logs found"
        echo ""
    fi
    
    # Show recent worker logs
    if [[ -f "../worker.log" ]]; then
        echo -e "${COLOR_BLUE}Recent Worker Log (last 10 lines):${NC}"
        tail -10 ../worker.log
        echo ""
    fi
    
    echo -e "${COLOR_CYAN}💡 Open individual log files to see detailed results${NC}"
}

main() {
    show_banner
    
    while true; do
        show_menu
        read -r -p "Choose option (0-5): " choice
        echo ""
        
        case "$choice" in
            1)
                if check_agentic_forge; then
                    run_canvas_todo_tests
                fi
                ;;
            2)
                if check_agentic_forge; then
                    run_full_tests
                fi
                ;;
            3)
                if check_agentic_forge; then
                    custom_test
                fi
                ;;
            4)
                check_agentic_forge
                ;;
            5)
                view_logs
                ;;
            0)
                echo -e "${COLOR_CYAN}👋 Goodbye!${NC}"
                exit 0
                ;;
            *)
                echo -e "${COLOR_YELLOW}⚠️  Invalid option. Please choose 0-5.${NC}"
                ;;
        esac
        
        echo ""
        read -r -p "Press Enter to continue..."
        echo ""
    done
}

# Run main function
main "$@"