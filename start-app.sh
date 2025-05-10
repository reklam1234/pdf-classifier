#!/bin/zsh

set -e

echo "🚀 Starting PDF Classifier..."

ROOT_DIR=$(pwd)
SERVER_DIR="$ROOT_DIR/server"
CLIENT_DIR="$ROOT_DIR/client"
LOG_FILE="$ROOT_DIR/server.log"

echo "📁 Project root: $ROOT_DIR"
echo "📂 Backend dir: $SERVER_DIR"
echo "📂 Frontend dir: $CLIENT_DIR"
echo "📝 Log file: $LOG_FILE"

# Clean up old logs
echo "🧹 Cleaning old server log..."
> "$LOG_FILE"

# Check iTerm exists
if ! [ -e "/Applications/iTerm.app" ]; then
  echo "❌ iTerm2 not found. Please install it from https://iterm2.com"
  exit 1
fi

echo "🧙 Launching iTerm2 panes..."
osascript <<EOF
tell application "iTerm"
  activate
  try
    set newWindow to (create window with default profile)

    tell current session of newWindow
      write text "echo '🔧 Backend starting...' && cd \"$SERVER_DIR\" && npm install && npm run dev > \"$LOG_FILE\" 2>&1"
      split horizontally with default profile
    end tell

    tell second session of newWindow
      write text "echo '🖼 Frontend starting...' && cd \"$CLIENT_DIR\" && npm install && npm start"
      split vertically with default profile
    end tell

    tell third session of newWindow
      write text "echo '📜 Tailing logs...' && tail -f \"$LOG_FILE\""
    end tell

  on error errMsg
    display dialog "iTerm script error: " & errMsg
  end try
end tell
EOF

# Open the browser
echo "🌐 Opening http://localhost:3000..."
sleep 5
open http://localhost:3000

echo "✅ All services launched."