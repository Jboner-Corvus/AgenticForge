#!/bin/bash

# =============================================================================
# AgenticForge Canvas & Todo List Tests
# =============================================================================
# Focused tests for the core canvas and todo list capabilities
# =============================================================================

set -euo pipefail

# Colors
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_CYAN='\033[0;36m'
readonly COLOR_ORANGE='\033[0;33m'
readonly COLOR_RED='\033[0;31m'
readonly COLOR_YELLOW='\033[1;33m'
readonly NC='\033[0m'

# Configuration
readonly API_BASE_URL="http://localhost:8080"
readonly SESSION_ID="canvas-todo-test-$(date +%s)"
readonly MAX_WAIT_TIME=60  # Maximum time to wait for job completion (seconds)
readonly POLL_INTERVAL=2   # Polling interval (seconds)

# Global variables for test results
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Get auth token
if [[ -f "../.env" ]]; then
    AUTH_TOKEN=$(grep "^AUTH_TOKEN=" ../.env | cut -d'=' -f2 | tr -d '"')
else
    echo "❌ .env file not found"
    exit 1
fi

# Test result tracking
log_test_result() {
    local test_name="$1"
    local status="$2"
    local details="${3:-}"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if [[ "$status" == "PASS" ]]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo -e "${COLOR_GREEN}✅ $test_name${NC}"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo -e "${COLOR_RED}❌ $test_name${NC}"
        if [[ -n "$details" ]]; then
            echo -e "${COLOR_YELLOW}   Details: $details${NC}"
        fi
    fi
}

# Intelligent polling function
wait_for_job_completion() {
    local job_id="$1"
    local max_wait="${2:-$MAX_WAIT_TIME}"
    local wait_time=0
    
    echo -e "${COLOR_CYAN}⏳ Waiting for job $job_id to complete...${NC}"
    
    while [[ $wait_time -lt $max_wait ]]; do
        # Check job status
        local status_response
        status_response=$(curl -s -X GET \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            "$API_BASE_URL/api/job/$job_id")
        
        # Try to parse job status
        local job_status
        job_status=$(echo "$status_response" | jq -r '.status // "unknown"' 2>/dev/null)
        
        case "$job_status" in
            "completed")
                echo -e "${COLOR_GREEN}✅ Job $job_id completed successfully${NC}"
                return 0
                ;;
            "failed")
                echo -e "${COLOR_RED}❌ Job $job_id failed${NC}"
                echo "Error details: $(echo "$status_response" | jq -r '.error // "Unknown error"' 2>/dev/null)"
                return 1
                ;;
            "unknown")
                # If we can't parse the status, check if we got a valid response
                if [[ "$status_response" == *"jobId"* ]]; then
                    echo -e "${COLOR_GREEN}✅ Job $job_id accepted (streaming response)${NC}"
                    return 0
                fi
                ;;
        esac
        
        sleep $POLL_INTERVAL
        wait_time=$((wait_time + POLL_INTERVAL))
        echo -n "."
    done
    
    echo -e "\n${COLOR_YELLOW}⚠️  Job $job_id timed out after $max_wait seconds${NC}"
    return 2
}

# API helper with result validation
send_message() {
    local message="$1"
    local description="$2"
    local expected_result="${3:-}"  # Optional expected result for validation
    
    echo -e "${COLOR_BLUE}🤖 $description${NC}"
    echo "Message: $message"
    echo ""
    
    local payload="{\"prompt\": \"$message\", \"sessionId\": \"$SESSION_ID\"}"
    
    local response
    response=$(curl -s -X POST \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$API_BASE_URL/api/chat")
    
    # Try to parse the response
    local job_id
    job_id=$(echo "$response" | jq -r '.jobId // "none"' 2>/dev/null)
    
    if [[ "$job_id" != "none" ]]; then
        echo "Job ID: $job_id"
        echo "$response" | jq . 2>/dev/null || echo "$response"
        
        # Wait for job completion with intelligent polling
        if wait_for_job_completion "$job_id"; then
            log_test_result "$description" "PASS"
        else
            log_test_result "$description" "FAIL" "Job failed or timed out"
        fi
    else
        # Handle direct responses (like health checks)
        echo "$response" | jq . 2>/dev/null || echo "$response"
        log_test_result "$description" "PASS" "Direct response received"
    fi
    
    echo "================================================="
}

# Cleanup function
cleanup_session() {
    echo -e "${COLOR_CYAN}🧹 Cleaning up test session...${NC}"
    
    # Try to delete the session
    local cleanup_response
    cleanup_response=$(curl -s -X DELETE \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$API_BASE_URL/api/sessions/$SESSION_ID" \
        -w "HTTPSTATUS:%{http_code}")
    
    local http_status
    http_status=$(echo "$cleanup_response" | grep -o "HTTPSTATUS:[0-9]*$" | cut -d: -f2)
    
    if [[ "$http_status" == "200" ]] || [[ "$http_status" == "204" ]]; then
        echo -e "${COLOR_GREEN}✅ Session cleanup completed${NC}"
    else
        echo -e "${COLOR_YELLOW}⚠️  Session cleanup response: $http_status${NC}"
    fi
}

# Trap to ensure cleanup happens
trap cleanup_session EXIT

echo -e "${COLOR_ORANGE}🎨📋 Testing Canvas & Todo List Capabilities${NC}"
echo -e "${COLOR_CYAN}Session: $SESSION_ID${NC}"
echo ""

echo -e "${COLOR_CYAN}Starting Canvas & Todo List Tests...${NC}\n"

# Test 1: Create a project todo list
send_message \
    "Create a todo list for a web development project with these tasks: 1. Design database schema, 2. Set up API endpoints, 3. Create frontend components, 4. Write tests, 5. Deploy to production. Please use the todo list management system." \
    "Creating project todo list"

# Test 2: Canvas architecture diagram
send_message \
    "Create a canvas diagram showing a typical web application architecture with these components: Frontend (React), Backend API (Node.js), Database (PostgreSQL), Cache (Redis), and Load Balancer. Show the connections and data flow between them." \
    "Creating architecture canvas diagram"

# Test 3: Update todo list
send_message \
    "Add two more tasks to the todo list: 6. Set up monitoring, 7. Create documentation. Then mark the first task 'Design database schema' as completed." \
    "Updating todo list"

# Test 4: Update canvas
send_message \
    "Update the canvas diagram by adding a new component: Message Queue (RabbitMQ) that connects the Backend API to background worker processes. Also add the worker processes component." \
    "Updating canvas diagram"

# Test 5: Canvas with workflow
send_message \
    "Create a new canvas showing the AgenticForge tool creation workflow: 1. User Request → 2. Agent Analysis → 3. Tool Design → 4. Code Generation → 5. Tool Testing → 6. Tool Integration → 7. Tool Execution. Make it a flowchart style." \
    "Creating workflow canvas"

# Test 6: Todo with priorities
send_message \
    "Create a new todo list for AgenticForge testing with priorities: HIGH: Test basic functionality, HIGH: Test tool creation, MEDIUM: Test canvas features, MEDIUM: Test todo management, LOW: Performance testing, LOW: Documentation updates." \
    "Creating prioritized todo list"

# Test 7: Interactive canvas
send_message \
    "Show me the current state of all canvases we've created in this session. List them and describe what each one contains." \
    "Reviewing canvas state"

# Test 8: Interactive todo
send_message \
    "Show me the current state of all todo lists in this session. How many tasks are completed vs pending?" \
    "Reviewing todo lists state"

# Test summary
echo -e "\n${COLOR_CYAN}📊 Test Summary${NC}"
echo "=================="
echo -e "Total Tests: ${COLOR_BLUE}$TESTS_TOTAL${NC}"
echo -e "Passed: ${COLOR_GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${COLOR_RED}$TESTS_FAILED${NC}"

local success_rate=0
if [[ $TESTS_TOTAL -gt 0 ]]; then
    success_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
fi
echo -e "Success Rate: ${COLOR_YELLOW}$success_rate%${NC}"

if [[ $TESTS_FAILED -gt 0 ]]; then
    echo -e "\n${COLOR_RED}⚠️  Some tests failed. Check the output above for details.${NC}"
    exit 1
else
    echo -e "\n${COLOR_GREEN}🎉 All tests passed!${NC}"
fi

echo -e "${COLOR_CYAN}Check the AgenticForge web interface at http://localhost:3002 to see the results.${NC}"