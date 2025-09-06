#!/bin/bash

# =============================================================================
# Canvas & Todo List Tests
# =============================================================================
# Tests canvas diagram creation and todo list management capabilities
# =============================================================================

set -euo pipefail

# Colors
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_RED='\033[0;31m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_CYAN='\033[0;36m'
readonly NC='\033[0m'

# Test configuration
readonly SESSION_ID="canvas-todo-test-$(date +%s)"
readonly TIMEOUT=60
readonly POLL_INTERVAL=2

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# API configuration
API_BASE="http://localhost:8080"
AUTH_TOKEN=""
if [[ -f "../.env" ]]; then
    AUTH_TOKEN=$(grep "^AUTH_TOKEN=" ../.env | cut -d'=' -f2 | tr -d '"' || echo "")
fi

if [[ -z "$AUTH_TOKEN" ]]; then
    echo -e "${COLOR_YELLOW}⚠️  Warning: AUTH_TOKEN not found in .env file${NC}"
fi

# Test utilities
log_test_start() {
    local test_name="$1"
    echo -e "\n🤖 ${test_name}"
    echo "Message: $2"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

log_test_result() {
    local test_name="$1"
    local status="$2"
    local details="${3:-}"
    
    if [[ "$status" == "PASS" ]]; then
        echo -e "✅ ${test_name}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "❌ ${test_name}"
        if [[ -n "$details" ]]; then
            echo -e "   Details: ${details}"
        fi
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo "================================================="
}

api_call() {
    local endpoint="$1"
    local method="${2:-GET}"
    local data="${3:-}"
    
    local headers=(
        "-H" "Authorization: Bearer $AUTH_TOKEN"
        "-H" "Content-Type: application/json"
    )
    
    local curl_args=(
        "-s" "-w" "%{http_code}" "-o" "/tmp/agenticforge_test_response.json"
    )
    
    if [[ "$method" == "POST" ]] && [[ -n "$data" ]]; then
        curl_args+=("-X" "$method" "${headers[@]}" "-d" "$data" "$API_BASE$endpoint")
    else
        curl_args+=("-X" "$method" "${headers[@]}" "$API_BASE$endpoint")
    fi
    
    local response
    response=$(curl "${curl_args[@]}")
    local http_code="${response: -3}"
    
    if [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
        cat /tmp/agenticforge_test_response.json
        return 0
    else
        echo "HTTP $http_code" >&2
        if [[ -f /tmp/agenticforge_test_response.json ]]; then
            cat /tmp/agenticforge_test_response.json >&2
        fi
        return 1
    fi
}

wait_for_job() {
    local job_id="$1"
    local timeout="${2:-$TIMEOUT}"
    local elapsed=0
    
    echo "Job ID: $job_id"
    
    # Show initial response
    if [[ -f /tmp/agenticforge_test_response.json ]]; then
        jq . /tmp/agenticforge_test_response.json 2>/dev/null || cat /tmp/agenticforge_test_response.json
    fi
    
    echo -n "⏳ Waiting for job $job_id to complete..."
    
    while [[ $elapsed -lt $timeout ]]; do
        # Check job status
        if api_call "/api/job/$job_id" "GET" > /tmp/agenticforge_job_status.json 2>/dev/null; then
            local status
            status=$(jq -r '.status' /tmp/agenticforge_job_status.json 2>/dev/null || echo "unknown")
            
            if [[ "$status" == "completed" ]]; then
                echo -e "\n✅ Job $job_id completed successfully"
                jq . /tmp/agenticforge_job_status.json 2>/dev/null || cat /tmp/agenticforge_job_status.json
                return 0
            elif [[ "$status" == "failed" ]]; then
                echo -e "\n❌ Job $job_id failed"
                jq . /tmp/agenticforge_job_status.json 2>/dev/null || cat /tmp/agenticforge_job_status.json
                return 1
            fi
        fi
        
        echo -n "."
        sleep $POLL_INTERVAL
        elapsed=$((elapsed + POLL_INTERVAL))
    done
    
    echo -e "\n⚠️  Job $job_id timed out after $timeout seconds"
    return 1
}

check_worker_status() {
    echo -e "${COLOR_CYAN}🔍 Checking AgenticForge worker status...${NC}"
    
    # Check if main services are running
    if ! curl -s "$API_BASE/api/health" >/dev/null; then
        echo -e "${COLOR_RED}❌ AgenticForge API not responding${NC}"
        echo -e "${COLOR_YELLOW}💡 Start services with: ../run.sh start${NC}"
        return 1
    fi
    
    # Check if worker process is running
    if ! pgrep -f "node dist/worker.js" >/dev/null; then
        echo -e "${COLOR_RED}❌ AgenticForge worker not running${NC}"
        echo -e "${COLOR_YELLOW}💡 Start worker with: ../run.sh restart-worker${NC}"
        return 1
    fi
    
    echo -e "${COLOR_GREEN}✅ AgenticForge services and worker are running${NC}"
    return 0
}

# Test functions
test_create_todo_list() {
    log_test_start "Creating project todo list" "Create a todo list for a web development project with these tasks: 1. Design database schema, 2. Set up API endpoints, 3. Create frontend components, 4. Write tests, 5. Deploy to production. Please use the todo list management system."
    
    local message="{\"prompt\": \"Create a todo list for a web development project with these tasks: 1. Design database schema, 2. Set up API endpoints, 3. Create frontend components, 4. Write tests, 5. Deploy to production. Please use the todo list management system.\", \"sessionId\": \"$SESSION_ID\"}"
    
    if api_call "/api/chat" "POST" "$message"; then
        local job_id
        job_id=$(jq -r '.jobId' /tmp/agenticforge_test_response.json 2>/dev/null || echo "")
        
        if [[ -n "$job_id" ]] && [[ "$job_id" != "null" ]]; then
            if wait_for_job "$job_id"; then
                log_test_result "Creating project todo list" "PASS"
            else
                log_test_result "Creating project todo list" "FAIL" "Job failed or timed out"
            fi
        else
            log_test_result "Creating project todo list" "FAIL" "No job ID returned"
        fi
    else
        log_test_result "Creating project todo list" "FAIL" "API call failed"
    fi
}

test_create_canvas() {
    log_test_start "Creating architecture canvas diagram" "Create a canvas diagram showing a typical web application architecture with these components: Frontend (React), Backend API (Node.js), Database (PostgreSQL), Cache (Redis), and Load Balancer. Show the connections and data flow between them."
    
    local message="{\"prompt\": \"Create a canvas diagram showing a typical web application architecture with these components: Frontend (React), Backend API (Node.js), Database (PostgreSQL), Cache (Redis), and Load Balancer. Show the connections and data flow between them.\", \"sessionId\": \"$SESSION_ID\"}"
    
    if api_call "/api/chat" "POST" "$message"; then
        local job_id
        job_id=$(jq -r '.jobId' /tmp/agenticforge_test_response.json 2>/dev/null || echo "")
        
        if [[ -n "$job_id" ]] && [[ "$job_id" != "null" ]]; then
            if wait_for_job "$job_id"; then
                log_test_result "Creating architecture canvas diagram" "PASS"
            else
                log_test_result "Creating architecture canvas diagram" "FAIL" "Job failed or timed out"
            fi
        else
            log_test_result "Creating architecture canvas diagram" "FAIL" "No job ID returned"
        fi
    else
        log_test_result "Creating architecture canvas diagram" "FAIL" "API call failed"
    fi
}

test_update_todo() {
    log_test_start "Updating todo list" "Add two more tasks to the todo list: 6. Set up monitoring, 7. Create documentation. Then mark the first task 'Design database schema' as completed."
    
    local message="{\"prompt\": \"Add two more tasks to the todo list: 6. Set up monitoring, 7. Create documentation. Then mark the first task 'Design database schema' as completed.\", \"sessionId\": \"$SESSION_ID\"}"
    
    if api_call "/api/chat" "POST" "$message"; then
        local job_id
        job_id=$(jq -r '.jobId' /tmp/agenticforge_test_response.json 2>/dev/null || echo "")
        
        if [[ -n "$job_id" ]] && [[ "$job_id" != "null" ]]; then
            if wait_for_job "$job_id"; then
                log_test_result "Updating todo list" "PASS"
            else
                log_test_result "Updating todo list" "FAIL" "Job failed or timed out"
            fi
        else
            log_test_result "Updating todo list" "FAIL" "No job ID returned"
        fi
    else
        log_test_result "Updating todo list" "FAIL" "API call failed"
    fi
}

test_update_canvas() {
    log_test_start "Updating canvas diagram" "Update the canvas diagram by adding a new component: Message Queue (RabbitMQ) that connects the Backend API to background worker processes. Also add the worker processes component."
    
    local message="{\"prompt\": \"Update the canvas diagram by adding a new component: Message Queue (RabbitMQ) that connects the Backend API to background worker processes. Also add the worker processes component.\", \"sessionId\": \"$SESSION_ID\"}"
    
    if api_call "/api/chat" "POST" "$message"; then
        local job_id
        job_id=$(jq -r '.jobId' /tmp/agenticforge_test_response.json 2>/dev/null || echo "")
        
        if [[ -n "$job_id" ]] && [[ "$job_id" != "null" ]]; then
            if wait_for_job "$job_id"; then
                log_test_result "Updating canvas diagram" "PASS"
            else
                log_test_result "Updating canvas diagram" "FAIL" "Job failed or timed out"
            fi
        else
            log_test_result "Updating canvas diagram" "FAIL" "No job ID returned"
        fi
    else
        log_test_result "Updating canvas diagram" "FAIL" "API call failed"
    fi
}

test_create_workflow_canvas() {
    log_test_start "Creating workflow canvas" "Create a new canvas showing the AgenticForge tool creation workflow: 1. User Request → 2. Agent Analysis → 3. Tool Design → 4. Code Generation → 5. Tool Testing → 6. Tool Integration → 7. Tool Execution. Make it a flowchart style."
    
    local message="{\"prompt\": \"Create a new canvas showing the AgenticForge tool creation workflow: 1. User Request → 2. Agent Analysis → 3. Tool Design → 4. Code Generation → 5. Tool Testing → 6. Tool Integration → 7. Tool Execution. Make it a flowchart style.\", \"sessionId\": \"$SESSION_ID\"}"
    
    if api_call "/api/chat" "POST" "$message"; then
        local job_id
        job_id=$(jq -r '.jobId' /tmp/agenticforge_test_response.json 2>/dev/null || echo "")
        
        if [[ -n "$job_id" ]] && [[ "$job_id" != "null" ]]; then
            if wait_for_job "$job_id"; then
                log_test_result "Creating workflow canvas" "PASS"
            else
                log_test_result "Creating workflow canvas" "FAIL" "Job failed or timed out"
            fi
        else
            log_test_result "Creating workflow canvas" "FAIL" "No job ID returned"
        fi
    else
        log_test_result "Creating workflow canvas" "FAIL" "API call failed"
    fi
}

test_create_prioritized_todo() {
    log_test_start "Creating prioritized todo list" "Create a new todo list for AgenticForge testing with priorities: HIGH: Test basic functionality, HIGH: Test tool creation, MEDIUM: Test canvas features, MEDIUM: Test todo management, LOW: Performance testing, LOW: Documentation updates."
    
    local message="{\"prompt\": \"Create a new todo list for AgenticForge testing with priorities: HIGH: Test basic functionality, HIGH: Test tool creation, MEDIUM: Test canvas features, MEDIUM: Test todo management, LOW: Performance testing, LOW: Documentation updates.\", \"sessionId\": \"$SESSION_ID\"}"
    
    if api_call "/api/chat" "POST" "$message"; then
        local job_id
        job_id=$(jq -r '.jobId' /tmp/agenticforge_test_response.json 2>/dev/null || echo "")
        
        if [[ -n "$job_id" ]] && [[ "$job_id" != "null" ]]; then
            if wait_for_job "$job_id"; then
                log_test_result "Creating prioritized todo list" "PASS"
            else
                log_test_result "Creating prioritized todo list" "FAIL" "Job failed or timed out"
            fi
        else
            log_test_result "Creating prioritized todo list" "FAIL" "No job ID returned"
        fi
    else
        log_test_result "Creating prioritized todo list" "FAIL" "API call failed"
    fi
}

test_review_canvas_state() {
    log_test_start "Reviewing canvas state" "Show me the current state of all canvases we've created in this session. List them and describe what each one contains."
    
    local message="{\"prompt\": \"Show me the current state of all canvases we've created in this session. List them and describe what each one contains.\", \"sessionId\": \"$SESSION_ID\"}"
    
    if api_call "/api/chat" "POST" "$message"; then
        local job_id
        job_id=$(jq -r '.jobId' /tmp/agenticforge_test_response.json 2>/dev/null || echo "")
        
        if [[ -n "$job_id" ]] && [[ "$job_id" != "null" ]]; then
            if wait_for_job "$job_id"; then
                log_test_result "Reviewing canvas state" "PASS"
            else
                log_test_result "Reviewing canvas state" "FAIL" "Job failed or timed out"
            fi
        else
            log_test_result "Reviewing canvas state" "FAIL" "No job ID returned"
        fi
    else
        log_test_result "Reviewing canvas state" "FAIL" "API call failed"
    fi
}

test_review_todo_state() {
    log_test_start "Reviewing todo lists state" "Show me the current state of all todo lists in this session. How many tasks are completed vs pending?"
    
    local message="{\"prompt\": \"Show me the current state of all todo lists in this session. How many tasks are completed vs pending?\", \"sessionId\": \"$SESSION_ID\"}"
    
    if api_call "/api/chat" "POST" "$message"; then
        local job_id
        job_id=$(jq -r '.jobId' /tmp/agenticforge_test_response.json 2>/dev/null || echo "")
        
        if [[ -n "$job_id" ]] && [[ "$job_id" != "null" ]]; then
            if wait_for_job "$job_id"; then
                log_test_result "Reviewing todo lists state" "PASS"
            else
                log_test_result "Reviewing todo lists state" "FAIL" "Job failed or timed out"
            fi
        else
            log_test_result "Reviewing todo lists state" "FAIL" "No job ID returned"
        fi
    else
        log_test_result "Reviewing todo lists state" "FAIL" "API call failed"
    fi
}

show_summary() {
    echo -e "\n${COLOR_CYAN}=== Test Summary ===${NC}"
    echo -e "Total Tests:  ${COLOR_BLUE}$TOTAL_TESTS${NC}"
    echo -e "Passed:       ${COLOR_GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed:       ${COLOR_RED}$FAILED_TESTS${NC}"
    
    if [[ $FAILED_TESTS -eq 0 ]]; then
        echo -e "\n${COLOR_GREEN}🎉 All tests completed successfully!${NC}"
        return 0
    else
        echo -e "\n${COLOR_YELLOW}⚠️  Some tests failed. Check the output above for details.${NC}"
        return 1
    fi
}

main() {
    echo -e "${COLOR_BLUE}🎨📋 Testing Canvas & Todo List Capabilities${NC}"
    echo "Session: $SESSION_ID"
    echo ""
    
    # Check if services are running
    if ! check_worker_status; then
        exit 1
    fi
    
    echo -e "\n${COLOR_CYAN}Starting Canvas & Todo List Tests...${NC}"
    
    # Run tests
    test_create_todo_list
    test_create_canvas
    test_update_todo
    test_update_canvas
    test_create_workflow_canvas
    test_create_prioritized_todo
    test_review_canvas_state
    test_review_todo_state
    
    # Show summary
    show_summary
}

# Run main function
main "$@"