#!/usr/bin/env bash
# Quick fix script for AgenticForge worker API key issues

echo "🔧 AgenticForge Worker Quick Fix"

# Check if worker is running
if pgrep -f "node dist/worker.js" > /dev/null; then
    echo "✅ Worker is currently running"
else
    echo "❌ Worker is not running"
    exit 1
fi

# Check Docker services
echo "🔍 Checking Docker services..."
if docker compose ps | grep -q "Up"; then
    echo "✅ Docker services are running"
else
    echo "❌ Docker services are not running properly"
    exit 1
fi

# Check Redis connectivity
echo "🔍 Checking Redis connectivity..."
if docker exec g_forge_redis redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis is responding"
else
    echo "❌ Redis is not responding"
    exit 1
fi

# Check PostgreSQL connectivity
echo "🔍 Checking PostgreSQL connectivity..."
if docker exec g_forge_postgres pg_isready -U user -d gforge > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
    exit 1
fi

echo ""
echo "⚠️  The worker is running but likely failing due to invalid API keys."
echo "   Please update the API keys in your .env file with valid ones."
echo ""
echo "📝 To fix the API key issue:"
echo "   1. Get new Gemini API keys from https://aistudio.google.com/app/apikey"
echo "   2. Update the following keys in /home/demon/agentforge/AgenticForge2/AgenticForge/.env:"
echo "      - LLM_API_KEY"
echo "      - LLM_API_KEY_GEMINI_PRO_1"
echo "      - LLM_API_KEY_GEMINI_PRO_2"
echo "      - LLM_API_KEY_GEMINI_PRO_3"
echo "      - LLM_API_KEY_GEMINI_PRO_4"
echo "      - LLM_API_KEY_GEMINI_FLASH_2"
echo "      - LLM_API_KEY_GEMINI_FLASH_3"
echo "      - LLM_API_KEY_GEMINI_FLASH_4"
echo ""
echo "💡 After updating the keys, restart the worker with:"
echo "   ./run.sh restart-worker"
echo ""
echo "📋 Monitor the worker with:"
echo "   tail -f worker.log"