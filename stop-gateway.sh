#!/bin/bash
# Stop Clawdbot Gateway daemon with comprehensive cleanup

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log directory
LOG_DIR="${HOME}/.clawdbot/logs"
PID_FILE="${LOG_DIR}/gateway.pid"

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  Stopping Clawdbot Gateway${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Function to check and stop launchd service
stop_launchd_service() {
    echo -e "${YELLOW}Checking for launchd service...${NC}"

    # Check if service is running
    if launchctl list | grep -q "com.clawdbot.gateway"; then
        echo -e "${YELLOW}Found launchd service: com.clawdbot.gateway${NC}"

        # Try multiple methods to stop it
        launchctl bootout gui/$(id -u)/com.clawdbot.gateway 2>/dev/null || \
        launchctl unload ~/Library/LaunchAgents/com.clawdbot.gateway.plist 2>/dev/null || \
        launchctl stop com.clawdbot.gateway 2>/dev/null

        sleep 1

        # Verify it's stopped
        if ! launchctl list | grep -q "com.clawdbot.gateway"; then
            echo -e "${GREEN}  ✓ Launchd service stopped${NC}"
            return 0
        else
            echo -e "${YELLOW}  ⚠ Launchd service may still be running${NC}"
            return 1
        fi
    else
        echo -e "  No launchd service found"
        return 0
    fi
}

# Function to find and kill all gateway processes
kill_gateway_processes() {
    local signal=${1:-TERM}
    local signal_name=${2:-"SIGTERM"}

    # Find all gateway-related processes (including parent clawdbot process)
    local pids=$(ps aux | grep -E "clawdbot-gateway|gateway:watch|clawdbot gateway|CLAWDBOT_SERVICE_KIND=gateway" | grep -v grep | awk '{print $2}')

    if [ -z "$pids" ]; then
        return 1  # No processes found
    fi

    echo -e "${YELLOW}Sending $signal_name to gateway processes...${NC}"
    for pid in $pids; do
        if ps -p "$pid" > /dev/null 2>&1; then
            kill -"$signal" "$pid" 2>/dev/null && echo -e "  ${GREEN}✓${NC} Stopped PID $pid"
        fi
    done

    return 0
}

# Function to clean up port 18789
cleanup_port() {
    echo -e "${YELLOW}Checking port 18789...${NC}"

    local port_pids=$(lsof -ti:18789 2>/dev/null)

    if [ -n "$port_pids" ]; then
        echo -e "${YELLOW}Found processes using port 18789${NC}"
        for pid in $port_pids; do
            kill -9 "$pid" 2>/dev/null && echo -e "  ${GREEN}✓${NC} Killed PID $pid on port 18789"
        done
        return 0
    else
        echo -e "  Port 18789 is free"
        return 0
    fi
}

# Step 1: Stop launchd service first (prevents auto-restart)
stop_launchd_service
echo ""

# Step 2: Try graceful shutdown using PID file
if [ -f "$PID_FILE" ]; then
    GATEWAY_PID=$(cat "$PID_FILE")

    if ps -p "$GATEWAY_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}Found gateway process from PID file (PID: $GATEWAY_PID)${NC}"

        # Try graceful shutdown
        kill_gateway_processes "TERM" "SIGTERM"

        # Wait up to 10 seconds
        echo -e "${YELLOW}Waiting for graceful shutdown...${NC}"
        for i in {1..10}; do
            # Check if any gateway processes remain
            if ! ps aux | grep -E "clawdbot-gateway|gateway:watch|CLAWDBOT_SERVICE_KIND=gateway" | grep -v grep > /dev/null 2>&1; then
                echo -e "${GREEN}✓ Gateway stopped gracefully${NC}"
                rm -f "$PID_FILE"
                cleanup_port
                echo ""
                echo -e "${GREEN}═══════════════════════════════════════${NC}"
                echo -e "${GREEN}  Gateway stopped successfully${NC}"
                echo -e "${GREEN}═══════════════════════════════════════${NC}"
                exit 0
            fi
            sleep 1
        done

        # Force kill if still running
        echo -e "${YELLOW}Graceful shutdown timeout, force killing...${NC}"
        kill_gateway_processes "KILL" "SIGKILL"
        sleep 2

    else
        echo -e "${YELLOW}Gateway process from PID file is not running${NC}"
    fi

    rm -f "$PID_FILE"
    echo ""
fi

# Step 3: Search and kill any remaining gateway processes
echo -e "${YELLOW}Searching for any remaining gateway processes...${NC}"
if ps aux | grep -E "clawdbot-gateway|gateway:watch|CLAWDBOT_SERVICE_KIND=gateway" | grep -v grep > /dev/null 2>&1; then
    echo -e "${YELLOW}Found remaining processes, attempting cleanup...${NC}"

    # Try graceful first
    kill_gateway_processes "TERM" "SIGTERM"
    sleep 2

    # Force kill if needed
    if ps aux | grep -E "clawdbot-gateway|gateway:watch|CLAWDBOT_SERVICE_KIND=gateway" | grep -v grep > /dev/null 2>&1; then
        echo -e "${YELLOW}Force killing remaining processes...${NC}"
        kill_gateway_processes "KILL" "SIGKILL"
        sleep 1
    fi
else
    echo -e "  No processes found"
fi
echo ""

# Step 4: Clean up port 18789
cleanup_port
echo ""

# Step 5: Final comprehensive verification
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  Final Status Check${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Check gateway processes
echo -e "${YELLOW}Gateway Processes:${NC}"
if ps aux | grep -E "clawdbot-gateway|gateway:watch|CLAWDBOT_SERVICE_KIND=gateway" | grep -v grep > /dev/null 2>&1; then
    echo -e "${RED}  ✗ Still running:${NC}"
    ps aux | grep -E "clawdbot-gateway|gateway:watch|CLAWDBOT_SERVICE_KIND=gateway" | grep -v grep
    FAILED=1
else
    echo -e "${GREEN}  ✓ None running${NC}"
fi

# Check launchd service
echo -e "${YELLOW}Launchd Service:${NC}"
if launchctl list | grep -q "com.clawdbot.gateway"; then
    echo -e "${RED}  ✗ Still active:${NC}"
    launchctl list | grep clawdbot
    FAILED=1
else
    echo -e "${GREEN}  ✓ None active${NC}"
fi

# Check port
echo -e "${YELLOW}Port 18789:${NC}"
if lsof -i:18789 2>/dev/null | grep -q LISTEN; then
    echo -e "${RED}  ✗ Still in use:${NC}"
    lsof -i:18789
    FAILED=1
else
    echo -e "${GREEN}  ✓ Free${NC}"
fi

# Check PID file
echo -e "${YELLOW}PID File:${NC}"
if [ -f "$PID_FILE" ]; then
    echo -e "${RED}  ✗ Still exists: $PID_FILE${NC}"
    FAILED=1
else
    echo -e "${GREEN}  ✓ Cleaned up${NC}"
fi

echo ""

# Final result
if [ -n "$FAILED" ]; then
    echo -e "${RED}═══════════════════════════════════════${NC}"
    echo -e "${RED}  ✗ Failed to stop all gateway instances${NC}"
    echo -e "${RED}═══════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Try running this command manually:${NC}"
    echo -e "${YELLOW}  pkill -9 -f clawdbot-gateway${NC}"
    echo -e "${YELLOW}  launchctl bootout gui/\$(id -u)/com.clawdbot.gateway${NC}"
    exit 1
else
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✓ Gateway stopped successfully${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}To restart the gateway, run:${NC}"
    echo -e "  ./start-gateway.sh"
    exit 0
fi
