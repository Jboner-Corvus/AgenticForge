#!/usr/bin/env bash
# Test script to verify all fixes

echo "🧪 Testing AgenticForge Worker Fixes"

# Test 1: Check if Docker services are running
echo "🔍 Test 1: Checking Docker services..."
if docker compose ps | grep -q "Up"; then
    echo "✅ Docker services are running"
else
    echo "❌ Docker services are not running"
    exit 1
fi

# Test 2: Check Redis connection
echo "🔍 Test 2: Checking Redis connection..."
if docker exec g_forge_redis redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis is responding"
else
    echo "❌ Redis is not responding"
    exit 1
fi

# Test 3: Check PostgreSQL connection
echo "🔍 Test 3: Checking PostgreSQL connection..."
if docker exec g_forge_postgres pg_isready -U user -d gforge > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
    exit 1
fi

# Test 4: Check if worker process is running
echo "🔍 Test 4: Checking worker process..."
if pgrep -f "node dist/worker.js" > /dev/null; then
    echo "✅ Worker process is running"
else
    echo "❌ Worker process is not running"
    exit 1
fi

echo "🎉 All tests passed! The worker should be functioning correctly."