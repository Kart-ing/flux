#!/bin/bash

# Start only the frontend server
# Use this if you want to run backend and frontend in separate terminals

echo "🚀 Starting AgentPay Economy Frontend..."
echo ""

# Navigate to flux-economy directory
cd flux-economy || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

echo "🎯 Starting frontend server on http://localhost:3000"
echo "💡 Press Ctrl+C to stop"
echo ""

# Start the frontend server
npm run dev

