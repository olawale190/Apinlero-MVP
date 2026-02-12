#!/bin/bash

# Token Manager - Daily Check Setup
# This script sets up a daily automated check for token expiration

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CHECK_SCRIPT="$SCRIPT_DIR/check-tokens.js"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Token Manager - Daily Check Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js is not installed${NC}"
    echo "Please install Node.js first: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"
echo ""

# Make check-tokens.js executable
chmod +x "$CHECK_SCRIPT"

# Create a launchd plist for macOS
PLIST_FILE="$HOME/Library/LaunchAgents/com.apinlero.token-checker.plist"

cat > "$PLIST_FILE" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.apinlero.token-checker</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>$CHECK_SCRIPT</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/token-checker.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/token-checker-error.log</string>
</dict>
</plist>
EOF

echo -e "${GREEN}✅ Created launchd configuration${NC}"

# Load the launchd job
launchctl unload "$PLIST_FILE" 2>/dev/null
launchctl load "$PLIST_FILE"

echo -e "${GREEN}✅ Daily token check scheduled!${NC}"
echo ""
echo -e "${BLUE}Configuration:${NC}"
echo "  - Runs daily at 9:00 AM"
echo "  - Logs saved to: $HOME/Library/Logs/token-checker.log"
echo ""
echo -e "${YELLOW}Manual Commands:${NC}"
echo "  Run check now:     node $CHECK_SCRIPT"
echo "  Add new token:     node $CHECK_SCRIPT --add"
echo "  List all tokens:   node $CHECK_SCRIPT --list"
echo "  View logs:         cat $HOME/Library/Logs/token-checker.log"
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
