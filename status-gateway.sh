#!/bin/bash
# Check Clawdbot Gateway daemon status

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log directory
LOG_DIR="${HOME}/.clawdbot/logs"
PID_FILE="${LOG_DIR}/gateway.pid"
GATEWAY_LOG="${LOG_DIR}/gateway.log"
GATEWAY_ERR="${LOG_DIR}/gateway.err.log"

echo -e "${BLUE}=== Clawdbot Gateway Status ===${NC}"
echo ""

# Check PID file
if [ -f "$PID_FILE" ]; then
    GATEWAY_PID=$(cat "$PID_FILE")
    echo -e "PID File: ${GREEN}Found${NC} ($PID_FILE)"
    echo -e "PID: $GATEWAY_PID"

    # Check if process is running
    if ps -p "$GATEWAY_PID" > /dev/null 2>&1; then
        echo -e "Status: ${GREEN}✓ Running${NC}"

        # Get process info
        echo ""
        echo -e "${BLUE}Process Info:${NC}"
        ps -p "$GATEWAY_PID" -o pid,ppid,user,%cpu,%mem,etime,command

        # Check port
        echo ""
        echo -e "${BLUE}Port Status:${NC}"
        lsof -i :18789 2>/dev/null | head -5 || echo "Port 18789: Not listening"

    else
        echo -e "Status: ${RED}✗ Not Running${NC} (stale PID file)"
        echo -e "${YELLOW}Tip: Remove stale PID with: rm $PID_FILE${NC}"
    fi
else
    echo -e "PID File: ${RED}Not Found${NC}"
    echo -e "Status: ${RED}✗ Not Running${NC}"

    # Check for any gateway processes
    echo ""
    echo -e "${BLUE}Searching for gateway processes:${NC}"
    if pgrep -f "clawdbot-gateway" > /dev/null 2>&1; then
        echo -e "${YELLOW}Found gateway processes (but no PID file):${NC}"
        ps aux | grep -E "clawdbot-gateway|gateway:watch" | grep -v grep
    else
        echo -e "${RED}No gateway processes found${NC}"
    fi
fi

# Log files
echo ""
echo -e "${BLUE}Log Files:${NC}"
if [ -f "$GATEWAY_LOG" ]; then
    LOG_SIZE=$(du -h "$GATEWAY_LOG" | awk '{print $1}')
    LOG_LINES=$(wc -l < "$GATEWAY_LOG")
    echo -e "Gateway Log: ${GREEN}$GATEWAY_LOG${NC} (${LOG_SIZE}, ${LOG_LINES} lines)"
else
    echo -e "Gateway Log: ${RED}Not found${NC}"
fi

if [ -f "$GATEWAY_ERR" ]; then
    ERR_SIZE=$(du -h "$GATEWAY_ERR" | awk '{print $1}')
    ERR_LINES=$(wc -l < "$GATEWAY_ERR")
    echo -e "Error Log: ${GREEN}$GATEWAY_ERR${NC} (${ERR_SIZE}, ${ERR_LINES} lines)"
else
    echo -e "Error Log: ${RED}Not found${NC}"
fi

# Recent log entries
if [ -f "$GATEWAY_LOG" ]; then
    echo ""
    echo -e "${BLUE}Recent Log Entries (last 5 lines):${NC}"
    tail -5 "$GATEWAY_LOG" 2>/dev/null || echo "Unable to read log"
fi

# Commands
echo ""
echo -e "${BLUE}=== Quick Commands ===${NC}"
echo -e "Start:  ${YELLOW}./start-gateway.sh${NC}"
echo -e "Stop:   ${YELLOW}./stop-gateway.sh${NC}"
echo -e "Status: ${YELLOW}./status-gateway.sh${NC}"
echo -e "Logs:   ${YELLOW}tail -f $GATEWAY_LOG${NC}"
echo -e "Errors: ${YELLOW}tail -f $GATEWAY_ERR${NC}"
