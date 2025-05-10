#!/bin/zsh

ROOT_DIR=$(pwd)
CLIENT_DIR="$ROOT_DIR/client"

echo "🖼 Starting frontend..."
cd "$CLIENT_DIR" || exit 1
npm install
npm start