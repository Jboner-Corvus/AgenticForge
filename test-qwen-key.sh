#!/bin/bash

# Script to test Qwen API key
# Usage: ./test-qwen-key.sh [your-api-key]

API_KEY="${1:-YOUR_ACTUAL_QWEN_API_KEY_HERE}"

if [ "$API_KEY" = "YOUR_ACTUAL_QWEN_API_KEY_HERE" ]; then
    echo "Please provide your Qwen API key as a command line argument"
    echo "Usage: ./test-qwen-key.sh your_actual_api_key_here"
    exit 1
fi

echo "Testing Qwen API key..."

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