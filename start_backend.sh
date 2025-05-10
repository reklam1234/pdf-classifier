#!/bin/zsh

ROOT_DIR=$(pwd)
SERVER_DIR="$ROOT_DIR/server"
LOG_FILE="$ROOT_DIR/server.log"

echo "🔧 Starting backend..."
cd "$SERVER_DIR" || exit 1
npm install
npm run dev > "$LOG_FILE" 2>&1