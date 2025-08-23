#!/bin/bash

# Script to test Qwen API connectivity using the key from .env file
echo "Testing Qwen API connectivity..."

# Extract API key from .env file
API_KEY=$(grep "^LLM_API_KEY=" /home/demon/agentforge/AgenticForge2/AgenticForge/.env | cut -d'=' -f2)

if [ -z "$API_KEY" ]; then
    echo "Error: Could not find LLM_API_KEY in .env file"
    exit 1
fi

echo "Using API key: ${API_KEY:0:10}**********"

# Test the API
echo "Sending test request to Qwen API..."

curl -X POST "https://portal.qwen.ai/v1/chat/completions" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "model": "qwen3-coder-plus",
        "messages": [
            {"role": "user", "content": "Hello, this is a test message to validate my API key."}
        ],
        "max_tokens": 100
    }'

echo -e "\nTest completed."