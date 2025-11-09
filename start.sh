#!/bin/bash

# Start script for AgentPay Economy
# This script starts both backend and frontend servers

echo "🚀 Starting AgentPay Economy..."
echo ""

# Check if venv exists and activate it
if [ -d "venv" ]; then
    echo "📦 Activating virtual environment..."
    source venv/bin/activate
else
    echo "⚠️  Warning: Virtual environment not found. Make sure Python dependencies are installed."
fi

# Check if node_modules exists in flux-economy
if [ ! -d "flux-economy/node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    cd flux-economy || exit 1
    npm install
    cd ..
fi

echo ""
echo "🎯 Starting backend and frontend servers..."
echo "   Backend: http://localhost:5001"
echo "   Frontend: http://localhost:3000"
echo ""
echo "💡 Press Ctrl+C to stop both servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    # Kill any remaining python/node processes
    pkill -f "python.*flux-economy/backend/api.py" 2>/dev/null
    pkill -f "next.*flux-economy" 2>/dev/null
    exit
}

# Trap Ctrl+C and cleanup
trap cleanup INT TERM EXIT

# Start backend in background
cd flux-economy/backend || exit 1
python3 api.py &
BACKEND_PID=$!
cd ../..

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Failed to start backend server"
    exit 1
fi

echo "✅ Backend started (PID: $BACKEND_PID)"
echo ""

# Start frontend in foreground (so we can see output and Ctrl+C works)
# When frontend exits or user presses Ctrl+C, cleanup will be called automatically
cd flux-economy || exit 1
npm run dev
cd ..
