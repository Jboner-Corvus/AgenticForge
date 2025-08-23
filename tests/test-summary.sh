#!/bin/bash

# =============================================================================
# AgenticForge Test Framework Summary
# =============================================================================
# Complete overview of available tests and their capabilities
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
    echo '    ╔═══════════════════════════════════════════════════════╗'
    echo '    ║        AGENTICFORGE TEST FRAMEWORK SUMMARY           ║'
    echo '    ╚═══════════════════════════════════════════════════════╝'
    echo -e "${NC}"
}

show_test_capabilities() {
    echo -e "${COLOR_CYAN}🧪 AgenticForge Testing Framework${NC}"
    echo ""
    echo -e "${COLOR_BLUE}📋 Available Test Scripts:${NC}"
    echo ""
    
    echo -e "${COLOR_GREEN}1. test-runner.sh${NC} - Interactive Test Menu"
    echo "   ├── Canvas & Todo List Tests (Quick)"
    echo "   ├── Full Agent Capability Tests"
    echo "   ├── Custom Message Test"
    echo "   ├── Check AgenticForge Status"
    echo "   └── View Test Logs"
    echo ""
    
    echo -e "${COLOR_GREEN}2. test-canvas-todo.sh${NC} - Focused Canvas & Todo Tests"
    echo "   ├── 📋 Todo list creation and management"
    echo "   ├── 🎨 Canvas diagram creation and updates"
    echo "   ├── 🔄 Interactive todo operations"
    echo "   └── 📊 Canvas workflow visualization"
    echo ""
    
    echo -e "${COLOR_GREEN}3. test-agent-capabilities.sh${NC} - Comprehensive API Tests"
    echo "   ├── 🗣️ Basic agent communication"
    echo "   ├── 📋 Todo list management"
    echo "   ├── 🎨 Canvas functionality"
    echo "   ├── 🛠️ Tool creation and execution"
    echo "   ├── 💻 Code generation"
    echo "   ├── 🎯 Planning and task execution"
    echo "   ├── 💾 Session management"
    echo "   └── 🔧 Error handling"
    echo ""
}

show_test_examples() {
    echo -e "${COLOR_BLUE}🎯 Test Examples & Capabilities:${NC}"
    echo ""
    
    echo -e "${COLOR_CYAN}Canvas Tests:${NC}"
    echo "• Architecture diagrams with component relationships"
    echo "• Workflow visualizations and process flows"
    echo "• Interactive canvas updates and modifications"
    echo "• Multi-canvas session management"
    echo ""
    
    echo -e "${COLOR_CYAN}Todo List Tests:${NC}"
    echo "• Structured task list creation"
    echo "• Priority-based task organization"
    echo "• Task completion and status tracking"
    echo "• Multi-list management within sessions"
    echo ""
    
    echo -e "${COLOR_CYAN}Tool Creation Tests:${NC}"
    echo "• Custom MCP tool generation in TypeScript"
    echo "• Zod schema validation implementation"
    echo "• Real-time tool integration"
    echo "• Tool execution and result verification"
    echo ""
    
    echo -e "${COLOR_CYAN}Code Generation Tests:${NC}"
    echo "• TypeScript function generation with validation"
    echo "• Python script creation and execution"
    echo "• Multi-language code generation"
    echo "• Test file creation and execution"
    echo ""
}

show_sample_requests() {
    echo -e "${COLOR_BLUE}📝 Sample API Requests:${NC}"
    echo ""
    
    echo -e "${COLOR_YELLOW}Todo List Creation:${NC}"
    cat << 'EOF'
{
  "prompt": "Create a todo list for a web development project with tasks: 1. Design database schema, 2. Set up API endpoints, 3. Create frontend components, 4. Write tests, 5. Deploy to production",
  "sessionId": "test-session-123"
}
EOF
    echo ""
    
    echo -e "${COLOR_YELLOW}Canvas Creation:${NC}"
    cat << 'EOF'
{
  "prompt": "Create a canvas diagram showing AgenticForge architecture with: User Interface, API Server, Worker Process, Redis, PostgreSQL, Docker. Show connections between them",
  "sessionId": "test-session-123"
}
EOF
    echo ""
    
    echo -e "${COLOR_YELLOW}Tool Creation:${NC}"
    cat << 'EOF'
{
  "prompt": "Create a custom MCP tool called 'systemInfo' that gathers CPU usage, memory usage, and disk space. Write it in TypeScript with proper Zod schemas",
  "sessionId": "test-session-123"
}
EOF
    echo ""
}

show_expected_results() {
    echo -e "${COLOR_BLUE}✅ Expected Test Results:${NC}"
    echo ""
    
    echo -e "${COLOR_GREEN}Successful Test Run:${NC}"
    echo "• ✅ All API calls return 200/202 status"
    echo "• ✅ Agent responds with job IDs for processing"
    echo "• ✅ Canvas artifacts created and visible in UI"
    echo "• ✅ Todo lists properly managed and tracked"
    echo "• ✅ Tools integrated and executable"
    echo "• ✅ Code files generated in workspace"
    echo ""
    
    echo -e "${COLOR_GREEN}Web Interface Verification:${NC}"
    echo "• 🌐 Check http://localhost:3002 for visual results"
    echo "• 📋 View created todo lists with task status"
    echo "• 🎨 See canvas diagrams and visualizations"
    echo "• 🛠️ Observe generated tools in tools panel"
    echo "• 💬 Review session history and interactions"
    echo ""
}

show_usage_instructions() {
    echo -e "${COLOR_BLUE}🚀 Quick Start Instructions:${NC}"
    echo ""
    
    echo -e "${COLOR_CYAN}1. Start AgenticForge:${NC}"
    echo "   ./run-v2.sh start"
    echo ""
    
    echo -e "${COLOR_CYAN}2. Run Interactive Tests:${NC}"
    echo "   ./test-runner.sh"
    echo ""
    
    echo -e "${COLOR_CYAN}3. Or Run Specific Tests:${NC}"
    echo "   ./test-canvas-todo.sh        # Quick canvas & todo tests"
    echo "   ./test-agent-capabilities.sh # Full capability tests"
    echo ""
    
    echo -e "${COLOR_CYAN}4. View Results:${NC}"
    echo "   • Web Interface: http://localhost:3002"
    echo "   • Test Logs: ./agent-test-logs/ directory"
    echo "   • Worker Logs: ./worker.log file"
    echo ""
}

show_troubleshooting() {
    echo -e "${COLOR_BLUE}🔧 Troubleshooting:${NC}"
    echo ""
    
    echo -e "${COLOR_YELLOW}Common Issues:${NC}"
    echo "• AgenticForge not running → ./run-v2.sh status"
    echo "• Authentication errors → Check .env AUTH_TOKEN"
    echo "• API timeouts → Complex requests take 30+ seconds"
    echo "• Missing jq → sudo apt-get install jq"
    echo ""
    
    echo -e "${COLOR_YELLOW}Debug Tips:${NC}"
    echo "• Add 'set -x' to scripts for verbose output"
    echo "• Check worker.log for processing details"
    echo "• Verify services with: docker compose ps"
    echo "• Test API manually: curl http://localhost:8080/api/health"
    echo ""
}

main() {
    show_banner
    show_test_capabilities
    show_test_examples
    show_sample_requests
    show_expected_results
    show_usage_instructions
    show_troubleshooting
    
    echo -e "${COLOR_ORANGE}🎉 Happy Testing! The Agent is ready to demonstrate its capabilities.${NC}"
    echo ""
    echo -e "${COLOR_CYAN}💡 Pro Tip: Start with './test-runner.sh' for an interactive experience!${NC}"
}

main "$@"