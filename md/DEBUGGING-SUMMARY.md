# Clawdbot Skill & MCP Debugging - Summary

## What We Accomplished

Successfully set up comprehensive logging for the catalog skill and MCP server to debug empty search results.

### Problem Identified
- Initially, searching for "George" returned empty results
- Two MCP servers were running with conflicting tool definitions
- The correct MCP server lacked "George" in the catalog data

### Solution Implemented
1. **Killed conflicting MCP servers** - Stopped old/wrong servers running on port 3333
2. **Added "George's Special Pack" to catalog** - Updated `mcp_server.py` with test data
3. **Added comprehensive logging** - Debug statements in both skill and MCP server
4. **Created debugging tools** - Scripts for monitoring and testing

## Debugging Tools Created

### 1. [debug-catalog-skill.sh](debug-catalog-skill.sh)
Quick status check and test:
```bash
cd /Users/ghu/aiworker/clawdbot
./debug-catalog-skill.sh
```

Shows:
- ✅ MCP server status (running/stopped, PID)
- ✅ Port 3333 listening status
- ✅ Direct skill test with results
- ✅ Recent gateway logs (last 20 lines)
- ✅ Recent MCP server logs (last 30 lines)

### 2. [monitor-skill-calls.sh](monitor-skill-calls.sh)
Real-time log monitoring:
```bash
cd /Users/ghu/aiworker/clawdbot
./monitor-skill-calls.sh
```

Monitors:
- Gateway logs (`~/.clawdbot/logs/gateway.log`)
- MCP server logs (`/tmp/mcp_server.log`)
- Detailed gateway logs (`/tmp/clawdbot/clawdbot-YYYY-MM-DD.log`)

Press `Ctrl+C` to stop.

### 3. [test-skill-via-gateway.sh](test-skill-via-gateway.sh)
End-to-end testing:
```bash
cd /Users/ghu/aiworker/clawdbot
./test-skill-via-gateway.sh
```

Tests both:
- Direct skill invocation (Python)
- Via Clawdbot agent/gateway (simulates real user messages)

### 4. [SKILL-DEBUGGING.md](SKILL-DEBUGGING.md)
Comprehensive debugging guide covering:
- Log locations and formats
- Manual debugging steps
- Enabling debug logging
- Common issues & solutions
- Skill invocation flow diagram
- Advanced custom logging
- Using `jq` to filter JSON logs

## Log Locations & What They Show

| Log File | Location | Shows |
|----------|----------|-------|
| **Gateway Logs** | `~/.clawdbot/logs/gateway.log` | High-level gateway events, channel activity |
| **Gateway Detail** | `/tmp/clawdbot/clawdbot-2026-01-28.log` | Detailed JSON logs with tool calls, requests, responses |
| **MCP Server** | `/tmp/mcp_server.log` | MCP server startup, tool invocations with parameters |
| **Skill Debug** | stdout | Skill execution flow, MCP client requests/responses |

## Logging Added

### MCP Server (`mcp_server.py`)
```python
# Debug logging in search_catalog function
print(f"[MCP Server] search_catalog called with query='{query}'")
print(f"[MCP Server] Found {len(results)} results")
for item in results:
    print(f"[MCP Server]   - {item['id']}: {item['name']}")
```

### Skill Client (`skill.py`)
```python
print(f"[Skill] Invoked with inputs: {inputs}")
print(f"[Skill] Operation: {operation}")
print(f"[Skill] Calling MCP tool '{operation}' with params: {params}")
print(f"[Skill] MCP response content: {result.content}")
```

## Current Status

✅ **MCP Server**: Running on port 3333 (PID visible via `ps aux | grep mcp_server.py`)
✅ **Catalog Data**: Includes "George's Special Pack" (PROD-006, $14.99)
✅ **Skill**: Working and returning results for "George" search
✅ **Logging**: Comprehensive debug output enabled
✅ **Tools**: 3 debugging scripts + comprehensive guide available

## Testing Results

```
Search "George":     1 result  - George's Special Pack ✅
Search "premium":    2 results - Premium Subscription, Premium Plus Bundle ✅
Search "starter":    1 result  - Starter Pack ✅
List Tools:          3 tools   - get_catalog_item, get_summary_item, search_catalog ✅
```

## How to View Skill/MCP Calls

### Real-Time Monitoring
```bash
# Terminal 1: Monitor all logs
./monitor-skill-calls.sh

# Terminal 2: Test the skill
./test-skill-via-gateway.sh
```

### Gateway Detailed Logs (JSON)
```bash
# Filter for tool-related events
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | jq 'select(.data.name | contains("Skill") or contains("catalog"))'

# Show tool execution start
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | jq 'select(.data.phase == "start")'

# Show tool results
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | jq 'select(.data.phase == "result") | {name: .data.name, result: .data.result}'
```

### MCP Server Logs
```bash
tail -f /tmp/mcp_server.log
```

### Skill Debug Output (Direct Test)
```bash
cd /Users/ghu/aiworker/clawdbot/skills/catalog_lookup_http
python3 << 'EOF'
import asyncio
from skill import run

result = asyncio.run(run({'operation': 'search_catalog', 'query': 'George'}))
print(result)
EOF
```

## Skill Invocation Flow

```
1. User Message
   ↓
2. Gateway receives (Telegram/Discord/etc.)
   ↓
3. Agent session created
   ↓
4. Agent analyzes message → Matches SKILL.md trigger
   ↓
5. Skill tool invoked by Pi agent
   ↓
6. skill.py executes
   [Skill] Invoked with inputs: {...}
   ↓
7. MCP client connects via SSE
   [Skill] Calling MCP tool 'search_catalog' with params: {...}
   ↓
8. MCP server processes request
   [MCP Server] search_catalog called with query='George'
   [MCP Server] Found 1 results
   ↓
9. MCP server returns JSON
   [Skill] MCP response content: [TextContent(...)]
   ↓
10. Skill formats response
    {'results': [...], 'count': 1}
    ↓
11. Agent receives result
    ↓
12. User sees response
```

## Next Steps

### For Production
1. Add structured logging (use Python `logging` module instead of `print`)
2. Add error tracking (Sentry, DataDog, etc.)
3. Add metrics collection (request counts, latency, error rates)
4. Configure log rotation for `/tmp/mcp_server.log`
5. Add request/response logging middleware in MCP server

### For Development
1. Keep debug scripts handy for troubleshooting
2. Use `monitor-skill-calls.sh` during development
3. Check detailed gateway logs when debugging agent behavior
4. Use `jq` to filter JSON logs efficiently

## Quick Reference Commands

```bash
# Check status
./debug-catalog-skill.sh

# Monitor logs
./monitor-skill-calls.sh

# Test end-to-end
./test-skill-via-gateway.sh

# Test skill directly
cd skills/catalog_lookup_http && python3 -c "import asyncio; from skill import run; print(asyncio.run(run({'operation': 'search_catalog', 'query': 'George'})))"

# Restart MCP server
pkill -f mcp_server.py && cd skills/catalog_lookup_http && nohup python3 mcp_server.py > /tmp/mcp_server.log 2>&1 &

# View MCP server log
tail -f /tmp/mcp_server.log

# View gateway detailed logs (filtered)
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | grep -i "skill\|mcp\|tool"

# Check MCP server process
ps aux | grep mcp_server.py
lsof -i :3333
```

## Files Modified

- ✅ `skills/catalog_lookup_http/mcp_server.py` - Added George's item + debug logging
- ✅ `skills/catalog_lookup_http/skill.py` - Added comprehensive debug logging

## Files Created

- ✅ `debug-catalog-skill.sh` - Quick status & test script
- ✅ `monitor-skill-calls.sh` - Real-time log monitoring
- ✅ `test-skill-via-gateway.sh` - End-to-end test script
- ✅ `SKILL-DEBUGGING.md` - Comprehensive debugging guide
- ✅ `DEBUGGING-SUMMARY.md` - This summary document

## References

- Skill location: [skills/catalog_lookup_http/](skills/catalog_lookup_http/)
- Skill documentation: [skills/catalog_lookup_http/SKILL.md](skills/catalog_lookup_http/SKILL.md)
- Detailed guide: [SKILL-DEBUGGING.md](SKILL-DEBUGGING.md)
- Gateway logs: `~/.clawdbot/logs/gateway.log`
- Detailed logs: `/tmp/clawdbot/clawdbot-YYYY-MM-DD.log`
- MCP server logs: `/tmp/mcp_server.log`
