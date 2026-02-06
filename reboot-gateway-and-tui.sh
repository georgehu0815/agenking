#!/bin/bash
# Reboot gateway and launch TUI

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Clawdbot Gateway Reboot + TUI         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Function to check if gateway is running
check_gateway() {
  if pnpm clawdbot gateway status >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

# Function to wait for gateway to be ready
wait_for_gateway() {
  local max_attempts=30
  local attempt=0

  echo -e "${YELLOW}⏳ Waiting for gateway to be ready...${NC}"

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
  echo -e "${RED}✗ Gateway failed to start within 30 seconds${NC}"
  return 1
}

# Step 1: Check current status
echo -e "${BLUE}━━━ Step 1: Checking current status ━━━${NC}"
if check_gateway; then
  echo -e "${YELLOW}⚠️  Gateway is currently running${NC}"
  echo -e "   Stopping gateway..."
  pnpm clawdbot gateway stop
  sleep 2
else
  echo -e "${GREEN}✓ Gateway is not running${NC}"
fi
echo ""

# Step 2: Kill any stray processes
echo -e "${BLUE}━━━ Step 2: Cleaning up processes ━━━${NC}"
stray_pids=$(ps aux | grep -E "clawdbot.*gateway|clawdbot-gateway" | grep -v grep | awk '{print $2}' || true)
if [ -n "$stray_pids" ]; then
  echo -e "${YELLOW}⚠️  Found stray gateway processes: $stray_pids${NC}"
  echo -e "   Killing stray processes..."
  echo "$stray_pids" | xargs kill -9 2>/dev/null || true
  sleep 1
  echo -e "${GREEN}✓ Processes cleaned up${NC}"
else
  echo -e "${GREEN}✓ No stray processes found${NC}"
fi
echo ""

# Step 3: Start gateway
echo -e "${BLUE}━━━ Step 3: Starting gateway ━━━${NC}"
echo -e "   Command: ${YELLOW}pnpm clawdbot gateway start${NC}"
pnpm clawdbot gateway start

# Step 4: Wait for gateway to be ready
echo ""
echo -e "${BLUE}━━━ Step 4: Waiting for gateway ━━━${NC}"
if ! wait_for_gateway; then
  echo ""
  echo -e "${RED}✗ Gateway failed to start. Check logs:${NC}"
  echo -e "   ${YELLOW}pnpm clawdbot logs -f${NC}"
  exit 1
fi

# Step 5: Show status
echo ""
echo -e "${BLUE}━━━ Step 5: Gateway status ━━━${NC}"
pnpm clawdbot gateway status | head -15

# Step 6: Launch TUI
echo ""
echo -e "${BLUE}━━━ Step 6: Launching TUI ━━━${NC}"
echo -e "${GREEN}🎨 Starting Clawdbot TUI...${NC}"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Launch TUI
pnpm clawdbot tui
