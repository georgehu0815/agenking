#!/bin/bash
# Quick gateway restart (without launching TUI)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Restarting Clawdbot Gateway${NC}"
echo ""

# Function to check if gateway is running
check_gateway() {
  if pnpm clawdbot gateway status >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

# Function to wait for gateway
wait_for_gateway() {
  local max_attempts=30
  local attempt=0

  echo -e "${YELLOW}⏳ Waiting for gateway...${NC}"

  while [ $attempt -lt $max_attempts ]; do
    if check_gateway; then
      echo -e "${GREEN}✓ Gateway is ready!${NC}"
      return 0
    fi

    attempt=$((attempt + 1))
    echo -n "."
    sleep 1
  done

  echo ""
  echo -e "${RED}✗ Gateway failed to start${NC}"
  return 1
}

# Stop gateway
if check_gateway; then
  echo -e "${YELLOW}⏹️  Stopping gateway...${NC}"
  pnpm clawdbot gateway stop
  sleep 2
fi

# Clean up stray processes
stray_pids=$(ps aux | grep -E "clawdbot.*gateway|clawdbot-gateway" | grep -v grep | awk '{print $2}' || true)
if [ -n "$stray_pids" ]; then
  echo -e "${YELLOW}🧹 Cleaning up stray processes...${NC}"
  echo "$stray_pids" | xargs kill -9 2>/dev/null || true
  sleep 1
fi

# Start gateway
echo -e "${BLUE}🚀 Starting gateway...${NC}"
pnpm clawdbot gateway start

# Wait for it to be ready
echo ""
if wait_for_gateway; then
  echo ""
  echo -e "${GREEN}✓ Gateway restarted successfully!${NC}"
  echo ""

  # Show status
  pnpm clawdbot gateway status | head -15

  echo ""
  echo -e "${BLUE}━━━ Quick Actions ━━━${NC}"
  echo -e "  Launch TUI:     ${YELLOW}pnpm clawdbot tui${NC}"
  echo -e "  View logs:      ${YELLOW}pnpm clawdbot logs -f${NC}"
  echo -e "  Open dashboard: ${YELLOW}pnpm clawdbot dashboard${NC}"
  echo -e "  Check status:   ${YELLOW}./check-clawdbot-status.sh${NC}"
else
  echo ""
  echo -e "${RED}✗ Gateway restart failed${NC}"
  echo -e "Check logs: ${YELLOW}pnpm clawdbot logs -f${NC}"
  exit 1
fi
