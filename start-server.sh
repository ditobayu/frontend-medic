#!/bin/bash

# Simple script to start a local web server
# Make sure you have Python installed

echo "Starting local web server..."
echo "Frontend will be available at: http://localhost:3000"
echo "Press Ctrl+C to stop the server"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    python3 -m http.server 3000
elif command -v python &> /dev/null; then
    python -m http.server 3000
else
    echo "Python not found. Please install Python or open index.html directly in your browser."
    echo "You can also use any other web server like live-server (npm install -g live-server)"
fi
