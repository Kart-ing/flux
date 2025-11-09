#!/bin/bash

# Start only the backend server
# Use this if you want to run backend and frontend in separate terminals

echo "🚀 Starting AgentPay Economy Backend..."
echo ""

# Check if venv exists and activate it
if [ -d "venv" ]; then
    echo "📦 Activating virtual environment..."
    source venv/bin/activate
else
    echo "⚠️  Warning: Virtual environment not found. Make sure Python dependencies are installed."
    exit 1
fi

# Navigate to backend directory
cd flux-economy/backend || exit 1

echo "🎯 Starting backend server on http://localhost:5001"
echo "💡 Press Ctrl+C to stop"
echo ""

# Start the backend server
python api.py

