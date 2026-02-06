#!/bin/bash
# Real-time monitoring script for skill and MCP calls
# This script tails multiple log sources to show skill invocations

echo "=========================================="
echo "Clawdbot Skill & MCP Call Monitor"
echo "=========================================="
echo ""
echo "Monitoring:"
echo "  - Gateway logs: ~/.clawdbot/logs/gateway.log"
echo "  - MCP server logs: /tmp/mcp_server.log"
echo "  - Gateway detailed logs: /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log"
echo ""
echo "Press Ctrl+C to stop"
echo ""
echo "=========================================="
echo ""

# Function to format and color output
format_log() {
    local source=$1
    local line=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "\033[1;36m[$timestamp][$source]\033[0m $line"
}

# Create a named pipe for log merging
PIPE=$(mktemp -u)
mkfifo "$PIPE"

# Tail gateway logs in background
if [ -f ~/.clawdbot/logs/gateway.log ]; then
    tail -f ~/.clawdbot/logs/gateway.log | while read line; do
        format_log "GATEWAY" "$line"
    done > "$PIPE" &
fi

# Tail MCP server logs in background
if [ -f /tmp/mcp_server.log ]; then
    tail -f /tmp/mcp_server.log | while read line; do
        format_log "MCP-SERVER" "$line"
    done > "$PIPE" &
fi

# Tail detailed gateway logs in background
DETAILED_LOG="/tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log"
if [ -f "$DETAILED_LOG" ]; then
    tail -f "$DETAILED_LOG" | grep -i "skill\|mcp\|tool" | while read line; do
        format_log "GATEWAY-DETAIL" "$line"
    done > "$PIPE" &
fi

# Catch Ctrl+C to cleanup
trap "rm -f $PIPE; kill $(jobs -p) 2>/dev/null; exit" INT TERM

# Read from the named pipe
cat "$PIPE"
