#!/bin/bash
# Start both gateway and TUI

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🦞 Clawdbot: Starting Gateway + TUI"
echo ""

# Check if gateway is running
if pnpm clawdbot gateway status >/dev/null 2>&1; then
  echo "✓ Gateway is already running"
else
  echo "🚀 Starting gateway..."
  pnpm clawdbot gateway start
  sleep 2
fi

# Show status
echo ""
pnpm clawdbot gateway status | head -10

echo ""
echo "🎨 Launching TUI..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Launch TUI
pnpm clawdbot tui
