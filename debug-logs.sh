#!/bin/bash

# Script to monitor all Docker service logs for debugging 500 errors

echo "=== AgenticForge Debug Console ==="
echo "Monitoring all service logs. Reproduce the 500 error now."
echo "Press Ctrl+C to stop monitoring."
echo ""

# Function to clean up background processes on exit
cleanup() {
    echo ""
    echo "Stopping log monitoring..."
    # Kill all background processes in the current process group
    kill 0
    exit 0
}

# Set up cleanup function to run on script exit
trap cleanup EXIT INT TERM

# Start monitoring logs for all services in the background
echo "=== Server Logs ==="
docker-compose logs -f server &
SERVER_PID=$!

echo ""
echo "=== Web Logs ==="
docker-compose logs -f web &
WEB_PID=$!

echo ""
echo "=== Redis Logs ==="
docker-compose logs -f redis &
REDIS_PID=$!

echo ""
echo "=== PostgreSQL Logs ==="
docker-compose logs -f postgres &
POSTGRES_PID=$!

# Wait for all background processes
wait $SERVER_PID $WEB_PID $REDIS_PID $POSTGRES_PID