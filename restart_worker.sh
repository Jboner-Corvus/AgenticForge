#!/usr/bin/env bash
# Script to properly restart the AgenticForge worker

echo "🔄 Restarting AgenticForge Worker"

# Kill existing worker processes
echo "🔪 Killing existing worker processes..."
pkill -f "node dist/worker.js" >/dev/null 2>&1
sleep 2

# Remove PID file if it exists
if [ -f "worker.pid" ]; then
    rm worker.pid
    echo "🗑️  Removed old PID file"
fi

# Clear the worker log
if [ -f "worker.log" ]; then
    > worker.log
    echo "🧹 Cleared worker log"
fi

# Wait a moment for cleanup
sleep 3

# Start new worker
echo "🚀 Starting new worker process..."
cd packages/core
nohup node dist/worker.js > ../../worker.log 2>&1 &
WORKER_PID=$!
cd ../..

# Save PID
echo $WORKER_PID > worker.pid

echo "✅ Worker restarted with PID: $WORKER_PID"
echo "📝 Check worker.log for progress"
echo "💡 Monitor with: tail -f worker.log"