#!/bin/bash

# Start script for Quorum Dashboard
# This script starts both backend and frontend servers

echo "🚀 Starting Quorum Dashboard..."
echo ""

# Check if venv exists and activate it
if [ -d "venv" ]; then
    echo "📦 Activating virtual environment..."
    source venv/bin/activate
else
    echo "⚠️  Warning: Virtual environment not found. Make sure Python dependencies are installed."
fi

# Navigate to quorum-dashboard directory
cd quorum-dashboard || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

echo ""
echo "🎯 Starting backend and frontend servers..."
echo "   Backend: http://localhost:5001"
echo "   Frontend: http://localhost:3000"
echo ""
echo "💡 Press Ctrl+C to stop both servers"
echo ""

# Start both servers using concurrently
npm run dev:all
