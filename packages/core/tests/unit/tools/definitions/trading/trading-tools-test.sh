#!/bin/bash

# =============================================================================  
# Trading Tools Test Suite
# =============================================================================  
# Comprehensive tests for AgenticForge trading functionality
# =============================================================================  

set -euo pipefail

# Colors
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_RED='\033[0;31m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_CYAN='\033[0;36m'
readonly COLOR_ORANGE='\033[0;33m'
readonly NC='\033[0m'

# Test configuration
readonly SESSION_ID="trading-test-$(date +%s)"
readonly TIMEOUT=60
readonly POLL_INTERVAL=2
readonly API_BASE="http://localhost:8080"
readonly AUTH_TOKEN=$(grep "^AUTH_TOKEN=" ../.env | cut -d'=' -f2 | tr -d '"' || echo "")

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

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
        "-s" "-w" "%{http_code}" "-o" "/tmp/agenticforge_trading_test_response.json"
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
        cat /tmp/agenticforge_trading_test_response.json
        return 0
    else
        echo "HTTP $http_code" >&2
        if [[ -f /tmp/agenticforge_trading_test_response.json ]]; then
            cat /tmp/agenticforge_trading_test_response.json >&2
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
    if [[ -f /tmp/agenticforge_trading_test_response.json ]]; then
        jq . /tmp/agenticforge_trading_test_response.json 2>/dev/null || cat /tmp/agenticforge_trading_test_response.json
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
test_alpha_vantage_ping() {
    log_test_start "Alpha Vantage Ping Test" "Test the Alpha Vantage ping tool to verify connectivity"
    
    local message="{\"prompt\": \"Use the alpha_vantage_ping tool to verify connectivity to the Alpha Vantage API\", \"sessionId\": \"$SESSION_ID\"}"
    
    if api_call "/api/chat" "POST" "$message"; then
        local job_id
        job_id=$(jq -r '.jobId' /tmp/agenticforge_trading_test_response.json 2>/dev/null || echo "")
        
        if [[ -n "$job_id" ]] && [[ "$job_id" != "null" ]]; then
            if wait_for_job "$job_id"; then
                log_test_result "Alpha Vantage Ping Test" "PASS"
            else
                log_test_result "Alpha Vantage Ping Test" "FAIL" "Job failed or timed out"
            fi
        else
            log_test_result "Alpha Vantage Ping Test" "FAIL" "No job ID returned"
        fi
    else
        log_test_result "Alpha Vantage Ping Test" "FAIL" "API call failed"
    fi
}

test_global_quote() {
    log_test_start "Global Quote Test" "Get the current price and volume information for TSLA stock"
    
    local message="{\"prompt\": \"Use the global_quote tool to get the current price and volume information for TSLA stock\", \"sessionId\": \"$SESSION_ID\"}"
    
    if api_call "/api/chat" "POST" "$message"; then
        local job_id
        job_id=$(jq -r '.jobId' /tmp/agenticforge_trading_test_response.json 2>/dev/null || echo "")
        
        if [[ -n "$job_id" ]] && [[ "$job_id" != "null" ]]; then
            if wait_for_job "$job_id"; then
                log_test_result "Global Quote Test" "PASS"
            else
                log_test_result "Global Quote Test" "FAIL" "Job failed or timed out"
            fi
        else
            log_test_result "Global Quote Test" "FAIL" "No job ID returned"
        fi
    else
        log_test_result "Global Quote Test" "FAIL" "API call failed"
    fi
}

test_finance_tool_quote() {
    log_test_start "Finance Tool Quote Test" "Use the finance tool to get a quote for AAPL stock"
    
    local message="{\"prompt\": \"Use the finance tool with action 'quote' to get information for AAPL stock\", \"sessionId\": \"$SESSION_ID\"}"
    
    if api_call "/api/chat" "POST" "$message"; then
        local job_id
        job_id=$(jq -r '.jobId' /tmp/agenticforge_trading_test_response.json 2>/dev/null || echo "")
        
        if [[ -n "$job_id" ]] && [[ "$job_id" != "null" ]]; then
            if wait_for_job "$job_id"; then
                log_test_result "Finance Tool Quote Test" "PASS"
            else
                log_test_result "Finance Tool Quote Test" "FAIL" "Job failed or timed out"
            fi
        else
            log_test_result "Finance Tool Quote Test" "FAIL" "No job ID returned"
        fi
    else
        log_test_result "Finance Tool Quote Test" "FAIL" "API call failed"
    fi
}

test_time_series_daily() {
    log_test_start "Time Series Daily Test" "Get daily historical data for MSFT stock"
    
    local message="{\"prompt\": \"Use the time_series_daily tool to get daily historical data for MSFT stock\", \"sessionId\": \"$SESSION_ID\"}"
    
    if api_call "/api/chat" "POST" "$message"; then
        local job_id
        job_id=$(jq -r '.jobId' /tmp/agenticforge_trading_test_response.json 2>/dev/null || echo "")
        
        if [[ -n "$job_id" ]] && [[ "$job_id" != "null" ]]; then
            if wait_for_job "$job_id"; then
                log_test_result "Time Series Daily Test" "PASS"
            else
                log_test_result "Time Series Daily Test" "FAIL" "Job failed or timed out"
            fi
        else
            log_test_result "Time Series Daily Test" "FAIL" "No job ID returned"
        fi
    else
        log_test_result "Time Series Daily Test" "FAIL" "API call failed"
    fi
}

test_symbol_search() {
    log_test_start "Symbol Search Test" "Search for stock symbols related to 'Tesla'"
    
    local message="{\"prompt\": \"Use the symbol_search tool to search for stock symbols related to 'Tesla'\", \"sessionId\": \"$SESSION_ID\"}"
    
    if api_call "/api/chat" "POST" "$message"; then
        local job_id
        job_id=$(jq -r '.jobId' /tmp/agenticforge_trading_test_response.json 2>/dev/null || echo "")
        
        if [[ -n "$job_id" ]] && [[ "$job_id" != "null" ]]; then
            if wait_for_job "$job_id"; then
                log_test_result "Symbol Search Test" "PASS"
            else
                log_test_result "Symbol Search Test" "FAIL" "Job failed or timed out"
            fi
        else
            log_test_result "Symbol Search Test" "FAIL" "No job ID returned"
        fi
    else
        log_test_result "Symbol Search Test" "FAIL" "API call failed"
    fi
}

test_technical_analysis() {
    log_test_start "Technical Analysis Test" "Get the RSI for GOOGL stock"
    
    local message="{\"prompt\": \"Use the rsi tool to get the RSI for GOOGL stock\", \"sessionId\": \"$SESSION_ID\"}"
    
    if api_call "/api/chat" "POST" "$message"; then
        local job_id
        job_id=$(jq -r '.jobId' /tmp/agenticforge_trading_test_response.json 2>/dev/null || echo "")
        
        if [[ -n "$job_id" ]] && [[ "$job_id" != "null" ]]; then
            if wait_for_job "$job_id"; then
                log_test_result "Technical Analysis Test" "PASS"
            else
                log_test_result "Technical Analysis Test" "FAIL" "Job failed or timed out"
            fi
        else
            log_test_result "Technical Analysis Test" "FAIL" "No job ID returned"
        fi
    else
        log_test_result "Technical Analysis Test" "FAIL" "API call failed"
    fi
}

test_composite_trading_analysis() {
    log_test_start "Composite Trading Analysis" "Perform a complete trading analysis for NVDA stock including quote, technical indicators, and recent news"
    
    local message="{\"prompt\": \"Perform a complete trading analysis for NVDA stock. First, get a quote for the current price. Then, calculate the RSI and SMA technical indicators. Finally, get recent news sentiment about NVIDIA. Use the appropriate Alpha Vantage tools for each step.\", \"sessionId\": \"$SESSION_ID\"}"
    
    if api_call "/api/chat" "POST" "$message"; then
        local job_id
        job_id=$(jq -r '.jobId' /tmp/agenticforge_trading_test_response.json 2>/dev/null || echo "")
        
        if [[ -n "$job_id" ]] && [[ "$job_id" != "null" ]]; then
            if wait_for_job "$job_id"; then
                log_test_result "Composite Trading Analysis" "PASS"
            else
                log_test_result "Composite Trading Analysis" "FAIL" "Job failed or timed out"
            fi
        else
            log_test_result "Composite Trading Analysis" "FAIL" "No job ID returned"
        fi
    else
        log_test_result "Composite Trading Analysis" "FAIL" "API call failed"
    fi
}

test_forex_data() {
    log_test_start "Forex Data Test" "Get daily foreign exchange rate data for EUR/USD"
    
    local message="{\"prompt\": \"Use the fx_daily tool to get daily foreign exchange rate data for EUR/USD\", \"sessionId\": \"$SESSION_ID\"}"
    
    if api_call "/api/chat" "POST" "$message"; then
        local job_id
        job_id=$(jq -r '.jobId' /tmp/agenticforge_trading_test_response.json 2>/dev/null || echo "")
        
        if [[ -n "$job_id" ]] && [[ "$job_id" != "null" ]]; then
            if wait_for_job "$job_id"; then
                log_test_result "Forex Data Test" "PASS"
            else
                log_test_result "Forex Data Test" "FAIL" "Job failed or timed out"
            fi
        else
            log_test_result "Forex Data Test" "FAIL" "No job ID returned"
        fi
    else
        log_test_result "Forex Data Test" "FAIL" "API call failed"
    fi
}

test_cryptocurrency_data() {
    log_test_start "Cryptocurrency Data Test" "Get daily data for Bitcoin in USD"
    
    local message="{\"prompt\": \"Use the digital_currency_daily tool to get daily data for Bitcoin (BTC) in USD\", \"sessionId\": \"$SESSION_ID\"}"
    
    if api_call "/api/chat" "POST" "$message"; then
        local job_id
        job_id=$(jq -r '.jobId' /tmp/agenticforge_trading_test_response.json 2>/dev/null || echo "")
        
        if [[ -n "$job_id" ]] && [[ "$job_id" != "null" ]]; then
            if wait_for_job "$job_id"; then
                log_test_result "Cryptocurrency Data Test" "PASS"
            else
                log_test_result "Cryptocurrency Data Test" "FAIL" "Job failed or timed out"
            fi
        else
            log_test_result "Cryptocurrency Data Test" "FAIL" "No job ID returned"
        fi
    else
        log_test_result "Cryptocurrency Data Test" "FAIL" "API call failed"
    fi
}

test_news_sentiment() {
    log_test_start "News Sentiment Test" "Get recent news sentiment about the technology sector"
    
    local message="{\"prompt\": \"Use the news_sentiment tool to get recent news sentiment about the technology sector\", \"sessionId\": \"$SESSION_ID\"}"
    
    if api_call "/api/chat" "POST" "$message"; then
        local job_id
        job_id=$(jq -r '.jobId' /tmp/agenticforge_trading_test_response.json 2>/dev/null || echo "")
        
        if [[ -n "$job_id" ]] && [[ "$job_id" != "null" ]]; then
            if wait_for_job "$job_id"; then
                log_test_result "News Sentiment Test" "PASS"
            else
                log_test_result "News Sentiment Test" "FAIL" "Job failed or timed out"
            fi
        else
            log_test_result "News Sentiment Test" "FAIL" "No job ID returned"
        fi
    else
        log_test_result "News Sentiment Test" "FAIL" "API call failed"
    fi
}

show_summary() {
    echo -e "\n${COLOR_CYAN}=== Trading Tools Test Summary ===${NC}"
    echo -e "Total Tests:  ${COLOR_BLUE}$TOTAL_TESTS${NC}"
    echo -e "Passed:       ${COLOR_GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed:       ${COLOR_RED}$FAILED_TESTS${NC}"
    
    if [[ $FAILED_TESTS -eq 0 ]]; then
        echo -e "\n${COLOR_GREEN}🎉 All trading tests completed successfully!${NC}"
        return 0
    else
        echo -e "\n${COLOR_YELLOW}⚠️  Some trading tests failed. Check the output above for details.${NC}"
        return 1
    fi
}

main() {
    echo -e "${COLOR_ORANGE}"
    echo '    ╔══════════════════════════════════════════╗'
    echo '    ║        TRADING TOOLS TEST SUITE          ║'
    echo '    ╚══════════════════════════════════════════╝'
    echo -e "${NC}"
    echo "Session: $SESSION_ID"
    echo ""
    
    # Check if services are running
    if ! check_worker_status; then
        exit 1
    fi
    
    echo -e "\n${COLOR_CYAN}Starting Trading Tools Tests...${NC}"
    
    # Run tests
    test_alpha_vantage_ping
    test_global_quote
    test_finance_tool_quote
    test_time_series_daily
    test_symbol_search
    test_technical_analysis
    test_composite_trading_analysis
    test_forex_data
    test_cryptocurrency_data
    test_news_sentiment
    
    # Show summary
    show_summary
}

# Run main function
main "$@"