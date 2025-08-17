#!/bin/bash

# Script to test frontend pages

echo "Testing frontend pages..."

# Test main page
echo "Testing main page..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002)
if [ "$response" -eq 200 ]; then
    echo "✓ Main page accessible"
else
    echo "✗ Main page not accessible (HTTP $response)"
fi

# Test if page contains expected content
echo "Testing page content..."
content=$(curl -s http://localhost:3002)
if echo "$content" | grep -q "<title>"; then
    echo "✓ Page contains title"
else
    echo "✗ Page missing title"
fi

# Test API health endpoint
echo "Testing API health..."
api_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/health)
if [ "$api_response" -eq 200 ]; then
    echo "✓ API health endpoint accessible"
else
    echo "✗ API health endpoint not accessible (HTTP $api_response)"
fi

echo "Frontend testing completed."