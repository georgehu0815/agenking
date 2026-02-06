#!/bin/bash
# Start Clawdbot Gateway as a daemon (background process)

# Exit on error
set -e
export MCP_SERVER_URL=http://localhost:3333/sse
echo "Using MCP_SERVER_URL: $MCP_SERVER_URL"
# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Log directory
LOG_DIR="${HOME}/.clawdbot/logs"
mkdir -p "$LOG_DIR"

# Log files
GATEWAY_LOG="${LOG_DIR}/gateway.log"
GATEWAY_ERR="${LOG_DIR}/gateway.err.log"
PID_FILE="${LOG_DIR}/gateway.pid"

echo -e "${YELLOW}Starting Clawdbot Gateway...${NC}"

# Function to stop existing gateway gracefully
stop_gateway() {
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping existing gateway (PID: $OLD_PID)...${NC}"

            # Try graceful shutdown first (SIGTERM)
            kill "$OLD_PID" 2>/dev/null || true

            # Wait up to 10 seconds for graceful shutdown
            for i in {1..10}; do
                if ! ps -p "$OLD_PID" > /dev/null 2>&1; then
                    echo -e "${GREEN}Gateway stopped gracefully${NC}"
                    break
                fi
                sleep 1
            done

            # Force kill if still running (SIGKILL)
            if ps -p "$OLD_PID" > /dev/null 2>&1; then
                echo -e "${YELLOW}Force killing gateway...${NC}"
                kill -9 "$OLD_PID" 2>/dev/null || true
                sleep 1
            fi
        fi
        rm -f "$PID_FILE"
    fi

    # Also check for any other gateway processes
    pkill -f "clawdbot-gateway" 2>/dev/null || true
    pkill -f "gateway:watch" 2>/dev/null || true

    # Give it a moment to clean up
    sleep 2
}

# Stop any existing gateway
stop_gateway

# Verify config (optional)
echo -e "${YELLOW}Verifying configuration...${NC}"
pnpm clawdbot config get agents.defaults.model.primary 2>/dev/null || echo "Config verification skipped"

# Start gateway as daemon
echo -e "${YELLOW}Starting gateway in background...${NC}"

# Run gateway with nohup to survive terminal close
nohup pnpm gateway:watch > "$GATEWAY_LOG" 2> "$GATEWAY_ERR" &

# Save PID
GATEWAY_PID=$!
echo "$GATEWAY_PID" > "$PID_FILE"

# Wait a moment and verify it started
sleep 3

if ps -p "$GATEWAY_PID" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Gateway started successfully!${NC}"
    echo -e "  PID: $GATEWAY_PID"
    echo -e "  Logs: $GATEWAY_LOG"
    echo -e "  Errors: $GATEWAY_ERR"
    echo ""
    echo -e "To view logs in real-time:"
    echo -e "  ${YELLOW}tail -f $GATEWAY_LOG${NC}"
    echo ""
    echo -e "To stop the gateway:"
    echo -e "  ${YELLOW}pnpm clawdbot gateway stop${NC}"
    echo -e "  or kill $GATEWAY_PID"
else
    echo -e "${RED}✗ Gateway failed to start${NC}"
    echo -e "Check logs: $GATEWAY_ERR"
    exit 1
fi

# pnpm clawdbot channels status

# azureopenai/gpt-5.2
# Starting gateway in background...
# ✓ Gateway started successfully!
#   PID: 50792
#   Logs: /Users/ghu/.clawdbot/logs/gateway.log
#   Errors: /Users/ghu/.clawdbot/logs/gateway.err.log

# To view logs in real-time:
#   tail -f /Users/ghu/.clawdbot/logs/gateway.log

# To stop the gateway:
#   pnpm clawdbot gateway stop
#   or kill 50792
tail -f /Users/ghu/.clawdbot/logs/gateway.log