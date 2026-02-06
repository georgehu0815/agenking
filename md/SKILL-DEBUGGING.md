# Skill & MCP Call Debugging Guide

This guide explains how to debug Clawdbot skills and MCP (Model Context Protocol) calls, including logging requests and responses.

## Overview

The catalog skill demonstrates how to integrate with an MCP server over HTTP+SSE (Server-Sent Events). The architecture is:

```
Clawdbot Agent → Skill (skill.py) → MCP Client → MCP Server (mcp_server.py)
```

## Debugging Tools

### 1. Debug Script - Quick Status Check
```bash
./debug-catalog-skill.sh
```

Shows:
- MCP server status
- Port 3333 listening status
- Direct skill test results
- Recent gateway logs
- Recent MCP server logs

### 2. Monitor Script - Real-Time Logging
```bash
./monitor-skill-calls.sh
```

Monitors in real-time:
- Gateway logs (skill invocations)
- MCP server logs (tool calls)
- Detailed gateway logs (filtered for skill/MCP activity)

Press `Ctrl+C` to stop monitoring.

### 3. Test Script - End-to-End Testing
```bash
./test-skill-via-gateway.sh
```

Tests both:
- Direct skill invocation (Python)
- Via Clawdbot agent/gateway (simulates real usage)

## Log Locations

| Component | Log File | Purpose |
|-----------|----------|---------|
| **Gateway** | `~/.clawdbot/logs/gateway.log` | High-level gateway events |
| **Gateway Detail** | `/tmp/clawdbot/clawdbot-YYYY-MM-DD.log` | Detailed JSON logs with tool calls |
| **MCP Server** | `/tmp/mcp_server.log` | MCP server requests/responses |
| **Skill Output** | stdout when running directly | Skill debug logging |

## Manual Debugging Steps

### 1. Check MCP Server Status
```bash
ps aux | grep mcp_server.py
lsof -i :3333
```

### 2. View MCP Server Logs
```bash
tail -f /tmp/mcp_server.log
```

### 3. Test Skill Directly
```bash
cd skills/catalog_lookup_http
python3 << 'EOF'
import asyncio
from skill import run

result = asyncio.run(run({
    'operation': 'search_catalog',
    'query': 'George'
}))
print(result)
EOF
```

### 4. Check Gateway Logs
```bash
# High-level logs
tail -f ~/.clawdbot/logs/gateway.log

# Detailed logs with tool calls
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | grep -i "skill\|tool"
```

### 5. Test MCP Client Connection
```bash
cd skills/catalog_lookup_http
python3 test_mcp_client.py
```

## Enabling Debug Logging

### MCP Server Debug Mode
The MCP server is already configured with `debug=True`:
```python
mcp = FastMCP("catalog-service-http", host="0.0.0.0", port=3333, debug=True)
```

### Skill Debug Logging
The skill now includes debug print statements:
```python
print(f"[Skill] Invoked with inputs: {inputs}")
print(f"[Skill] Operation: {operation}")
print(f"[Skill] Calling MCP tool '{operation}' with params: {params}")
print(f"[Skill] MCP response content: {result.content}")
```

### Gateway Debug Logging
Check the detailed logs at `/tmp/clawdbot/clawdbot-YYYY-MM-DD.log` which include:
- Tool execution start/end events
- Tool names and parameters
- Tool results
- Error messages

## Common Issues & Solutions

### Issue: Empty Search Results
**Symptom**: Searching returns 0 results
**Solution**:
- Check that the search term exists in catalog data
- Verify MCP server is running the correct version
- Test directly: `python3 test_mcp_client.py`

### Issue: MCP Server Not Responding
**Symptom**: Connection errors or timeouts
**Solution**:
```bash
# Kill any old servers
pkill -f mcp_server.py

# Start fresh server
cd skills/catalog_lookup_http
nohup python3 mcp_server.py > /tmp/mcp_server.log 2>&1 &

# Verify it's listening
lsof -i :3333
```

### Issue: Wrong MCP Server Running
**Symptom**: Tool names don't match (e.g., `catalog.lookup` vs `get_catalog_item`)
**Solution**:
```bash
# Check which servers are running
ps aux | grep mcp_server.py

# Check their working directories
lsof -p <PID> | grep cwd

# Kill wrong ones and restart correct one
```

### Issue: Gateway Not Invoking Skill
**Symptom**: Agent doesn't use the skill when expected
**Solution**:
- Verify skill is listed: `pnpm clawdbot skills list`
- Check skill status: `pnpm clawdbot skills check`
- Verify SKILL.md triggers match user query
- Check agent has access to skills directory

## Skill Invocation Flow

1. **User sends message** → Telegram/Discord/etc.
2. **Gateway receives message** → Creates agent session
3. **Agent analyzes message** → Checks skill triggers in SKILL.md
4. **Skill tool called** → Pi agent invokes skill
5. **Skill executes** → Python skill.py runs
6. **MCP client connects** → Opens SSE connection to MCP server
7. **MCP tool called** → `search_catalog`, `get_catalog_item`, etc.
8. **MCP server responds** → Returns JSON result
9. **Skill processes response** → Formats and returns to agent
10. **Agent responds** → Sends result back to user

## Advanced: Custom Logging

### Add Custom Logging to Skill
Edit `skills/catalog_lookup_http/skill.py`:
```python
import logging
logging.basicConfig(
    level=logging.DEBUG,
    format='[%(asctime)s] [Skill] %(message)s'
)

async def run(inputs: dict) -> dict:
    logging.info(f"Skill invoked: {inputs}")
    # ... rest of code
```

### Add Custom Logging to MCP Server
Edit `skills/catalog_lookup_http/mcp_server.py`:
```python
import logging
logging.basicConfig(
    level=logging.DEBUG,
    format='[%(asctime)s] [MCP] %(message)s'
)

@mcp.tool()
def search_catalog(query: str) -> list:
    logging.info(f"search_catalog called: query='{query}'")
    # ... rest of code
```

## Viewing Logs via jq (JSON logs)

The detailed gateway logs are in JSON format. Use `jq` to filter:

```bash
# Show all tool-related events
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | jq 'select(.data.phase == "start" or .data.phase == "result")'

# Show only skill tool calls
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | jq 'select(.data.name == "Skill")'

# Show tool results
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | jq 'select(.data.phase == "result") | {name: .data.name, result: .data.result}'
```

## Testing Search Queries

### Test the catalog search with different queries:
```bash
cd skills/catalog_lookup_http
python3 << 'EOF'
import asyncio
from skill import run

queries = ['premium', 'starter', 'George', 'subscription', 'bundle']

async def test():
    for query in queries:
        result = await asyncio.run(run({
            'operation': 'search_catalog',
            'query': query
        }))
        print(f"Query '{query}': {result['count']} results")

asyncio.run(test())
EOF
```

## References

- [MCP Protocol Documentation](https://modelcontextprotocol.io)
- [FastMCP Documentation](https://github.com/jlowin/fastmcp)
- [Clawdbot Skills Guide](docs/skills.md)
- Skill README: `skills/catalog_lookup_http/README.md`
- Skill Usage: `skills/catalog_lookup_http/USAGE.md`
