#!/bin/bash
# Debug script for catalog skill MCP calls
# This script helps debug skill invocations and MCP requests/responses

echo "=============================================="
echo "Catalog Skill Debug Script"
echo "=============================================="
echo ""

# Check if MCP server is running
echo "1. Checking MCP server status..."
MCP_PID=$(ps aux | grep "[m]cp_server.py" | awk '{print $2}')
if [ -z "$MCP_PID" ]; then
    echo "   ❌ MCP server is NOT running"
    echo "   Start it with: cd /Users/ghu/aiworker/clawdbot/skills/catalog_lookup_http && python3 mcp_server.py"
else
    echo "   ✅ MCP server is running (PID: $MCP_PID)"
    echo "   Log file: /tmp/mcp_server.log"
fi
echo ""

# Check if port 3333 is listening
echo "2. Checking port 3333..."
if lsof -i :3333 > /dev/null 2>&1; then
    echo "   ✅ Port 3333 is listening"
else
    echo "   ❌ Port 3333 is NOT listening"
fi
echo ""

# Test the skill
echo "3. Testing catalog skill..."
cd /Users/ghu/aiworker/clawdbot/skills/catalog_lookup_http
python3 << 'EOF'
import asyncio
from skill import run

async def test():
    print("\n   Testing search_catalog with query='George'...")
    try:
        result = await run({'operation': 'search_catalog', 'query': 'George'})
        print(f"   ✅ Result: {result}")
    except Exception as e:
        print(f"   ❌ Error: {e}")

asyncio.run(test())
EOF
echo ""

# Show recent gateway logs
echo "4. Recent gateway logs (last 20 lines)..."
tail -20 ~/.clawdbot/logs/gateway.log 2>/dev/null || echo "   No gateway logs found"
echo ""

# Show recent MCP server logs
echo "5. Recent MCP server logs (last 30 lines)..."
if [ -f /tmp/mcp_server.log ]; then
    tail -30 /tmp/mcp_server.log
else
    echo "   No MCP server logs found at /tmp/mcp_server.log"
fi
echo ""

echo "=============================================="
echo "Debug script complete"
echo "=============================================="
