#!/bin/bash
# Test script to invoke the catalog skill via Clawdbot gateway
# This simulates how the skill would be called during an agent session

echo "=========================================="
echo "Testing Catalog Skill via Gateway"
echo "=========================================="
echo ""

# Test via the skill directly first
echo "1. Direct skill test (bypassing gateway)..."
cd /Users/ghu/aiworker/clawdbot/skills/catalog_lookup_http
python3 << 'EOF'
import asyncio
from skill import run

async def test():
    print("\n[Direct Test] Searching for 'George'...")
    result = await run({'operation': 'search_catalog', 'query': 'George'})
    print(f"[Direct Test] Result: {result['count']} items found")
    if result['count'] > 0:
        for item in result['results']:
            print(f"  - {item['id']}: {item['name']} (${item['price']})")

asyncio.run(test())
EOF
echo ""

# Test via clawdbot agent command
echo "2. Testing via Clawdbot agent..."
echo "   Sending message to agent via Clawdbot gateway..."
cd /Users/ghu/aiworker/clawdbot
pnpm clawdbot message send --channel telegram --agent default --text "search catalog items George" 2>&1 | head -20
echo ""

echo "=========================================="
echo "Test complete"
echo "=========================================="
echo ""
echo "To monitor logs in real-time, run:"
echo "  ./monitor-skill-calls.sh"
