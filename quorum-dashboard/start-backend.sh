#!/bin/bash
# Backend startup script (used by npm scripts)
# This activates the venv and starts the Flask server

# Get the directory where this script is located (quorum-dashboard)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Get the project root (one level up, where venv is)
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Activate virtual environment (venv is in project root)
if [ -d "$PROJECT_ROOT/venv" ]; then
    source "$PROJECT_ROOT/venv/bin/activate"
    echo "✓ Virtual environment activated"
elif [ -d "$SCRIPT_DIR/venv" ]; then
    source "$SCRIPT_DIR/venv/bin/activate"
    echo "✓ Virtual environment activated (local)"
else
    echo "⚠️  Warning: Virtual environment not found. Attempting to run without it."
fi

# Navigate to backend directory
cd "$SCRIPT_DIR/backend" || exit 1

# Start the backend server
echo "🚀 Starting Flask backend server on http://localhost:5001"
python api.py
