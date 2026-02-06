#!/bin/bash
# Convenient launcher for Clawdbot TUI

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Show help
show_help() {
  cat <<EOF
${GREEN}Clawdbot TUI Launcher${NC}

Usage: $0 [options]

Options:
  -h, --help              Show this help
  -m, --message <text>    Send initial message
  -s, --session <name>    Use specific session (default: main)
  -t, --thinking <level>  Thinking level (off|minimal|low|medium|high)
  -d, --deliver           Deliver replies to channels
  --check-gateway         Check if gateway is running
  --start-gateway         Start gateway if not running

Examples:
  $0                                    # Launch TUI (basic)
  $0 -m "Organize my Downloads"         # Launch with initial message
  $0 -s project1 -t high                # Custom session + high thinking
  $0 --check-gateway                    # Just check gateway status

EOF
}

# Check gateway status
check_gateway() {
  echo -e "${BLUE}🔍 Checking gateway status...${NC}"
  if pnpm clawdbot gateway status >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Gateway is running${NC}"
    pnpm clawdbot gateway status | grep -E "Runtime:|Gateway:|Probe target:"
    return 0
  else
    echo -e "${RED}✗ Gateway is not running${NC}"
    return 1
  fi
}

# Start gateway
start_gateway() {
  echo -e "${BLUE}🚀 Starting gateway...${NC}"
  pnpm clawdbot gateway start
  sleep 2
  check_gateway
}

# Parse arguments
MESSAGE=""
SESSION=""
THINKING=""
DELIVER=""
CHECK_ONLY=false
START_GW=false

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_help
      exit 0
      ;;
    -m|--message)
      MESSAGE="$2"
      shift 2
      ;;
    -s|--session)
      SESSION="$2"
      shift 2
      ;;
    -t|--thinking)
      THINKING="$2"
      shift 2
      ;;
    -d|--deliver)
      DELIVER="--deliver"
      shift
      ;;
    --check-gateway)
      CHECK_ONLY=true
      shift
      ;;
    --start-gateway)
      START_GW=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      show_help
      exit 1
      ;;
  esac
done

# Just check gateway status
if [ "$CHECK_ONLY" = true ]; then
  check_gateway
  exit $?
fi

# Start gateway if requested
if [ "$START_GW" = true ]; then
  if ! check_gateway >/dev/null 2>&1; then
    start_gateway
  else
    echo -e "${YELLOW}Gateway already running${NC}"
  fi
fi

# Check if gateway is running
echo ""
if ! check_gateway; then
  echo ""
  echo -e "${YELLOW}⚠️  Gateway is not running!${NC}"
  echo -e "Do you want to start it now? (y/n)"
  read -r response
  if [[ "$response" =~ ^[Yy]$ ]]; then
    start_gateway
  else
    echo -e "${RED}TUI requires a running gateway. Exiting.${NC}"
    exit 1
  fi
fi

# Build TUI command
CMD="pnpm clawdbot tui"

if [ -n "$MESSAGE" ]; then
  CMD="$CMD --message \"$MESSAGE\""
fi

if [ -n "$SESSION" ]; then
  CMD="$CMD --session $SESSION"
fi

if [ -n "$THINKING" ]; then
  CMD="$CMD --thinking $THINKING"
fi

if [ -n "$DELIVER" ]; then
  CMD="$CMD $DELIVER"
fi

# Launch TUI
echo ""
echo -e "${GREEN}🎨 Launching Clawdbot TUI...${NC}"
echo -e "${BLUE}Command: $CMD${NC}"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Execute
eval "$CMD"
