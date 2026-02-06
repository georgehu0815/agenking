# Catalog Lookup HTTP Plugin

This Clawdbot plugin provides an executable `catalog_lookup` tool that bridges to the Python-based MCP skill for catalog operations.

## Status

✅ **Fully Implemented and Working**

- Plugin registered and loaded
- Tool `catalog_lookup` available to agents
- Python skill integration functioning correctly
- MCP server communication operational

## What Was Built

### Plugin Structure

```
extensions/catalog-lookup-http/
├── package.json              # Plugin package manifest
├── clawdbot.plugin.json      # Plugin metadata and config schema
├── index.ts                  # Plugin entry point (registers tool)
└── src/
    └── catalog-tool.ts       # Tool implementation (calls Python skill)
```

### How It Works

1. **Tool Registration**: The plugin registers `catalog_lookup` as a Clawdbot tool
2. **Python Bridge**: When invoked, spawns Python process with the skill.py script
3. **MCP Communication**: Python script connects to MCP server via HTTP/SSE
4. **Result Return**: Returns MCP server results to the agent

## Usage

### Direct Testing

Test the tool directly:

```bash
node -e "
import('./extensions/catalog-lookup-http/src/catalog-tool.ts').then(async (m) => {
  const tool = m.createCatalogLookupTool({pluginConfig: {}});
  const result = await tool.execute('test-1', {operation: 'list_tools'});
  console.log(JSON.stringify(result, null, 2));
});
"
```

### Agent Usage

The tool is available to agents, but whether it gets called depends on:

1. **Model behavior**: Some models prefer to synthesize answers rather than call tools
2. **Request specificity**: More specific requests that require live data are more likely to trigger tool use
3. **System prompt**: Agent configuration and system prompt affect tool calling

## Configuration

### Plugin Config

Set MCP server URL (default: `http://localhost:3333/sse`):

```bash
clawdbot config set plugins.entries.catalog-lookup-http.mcpServerUrl "http://custom-host:port/sse"
```

### Tool Parameters

- `operation` (optional, default: `"get_catalog_item"`):
  - `"get_catalog_item"` - Retrieve basic catalog item by ID
  - `"get_summary_item"` - Retrieve detailed summary by ID
  - `"search_catalog"` - Search items by query
  - `"list_tools"` - List available MCP tools

- `item_id` (string, required for `get_catalog_item` and `get_summary_item`):
  - Catalog item identifier

- `query` (string, required for `search_catalog`):
  - Search query string

## Verification

### Check Plugin Status

```bash
pnpm clawdbot plugins list
# Look for "catalog-lookup-http" with status "loaded"
```

### Check Tool Registration

```bash
pnpm clawdbot plugins info catalog-lookup-http
# Should show: Tools: catalog_lookup
```

### Prerequisites

1. **MCP Server Running**: The Python MCP server must be running on localhost:3333
   ```bash
   cd skills/catalog_lookup_http
   source .venv/bin/activate
   python3 mcp_server.py
   ```

2. **Python Dependencies**: Virtual environment with MCP packages installed
   ```bash
   cd skills/catalog_lookup_http
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Plugin Enabled**: Configuration includes the plugin
   ```bash
   clawdbot config set plugins.entries.catalog-lookup-http.enabled true
   ```

## Troubleshooting

### Tool Not Being Called by Agent

**Symptom**: Agent synthesizes responses instead of calling the tool

**Causes**:
- Model prefers synthesis over tool calls
- Request isn't specific enough to require live data
- Tool description suggests what the answer would be

**Solutions**:
- Make requests more specific ("get exact current price from database")
- Request live/changing data the model can't know
- Use different model that prefers tool calling

### Python Skill Errors

**Check MCP Server**:
```bash
ps aux | grep mcp_server
curl http://localhost:3333/sse
```

**Check Python Environment**:
```bash
cd skills/catalog_lookup_http
source .venv/bin/activate
python3 -c "import mcp; print('MCP installed')"
```

**Test Skill Directly**:
```bash
cd skills/catalog_lookup_http
source .venv/bin/activate
echo '{"operation": "list_tools"}' | python3 -c "from skill import handler; import json, sys; print(json.dumps(handler(json.load(sys.stdin)), indent=2))"
```

## Files Modified

- `skills/catalog_lookup_http/skill.py` - Fixed debug output to use stderr
- All other skill files remain unchanged

## Summary

✅ **Plugin successfully converts the catalog_lookup_http skill into an executable Clawdbot tool!**

The "Tool exists but skill fails" issue is resolved:
- ✅ Tool exists and is registered
- ✅ Skill executes successfully
- ✅ MCP server communication works
- ⚠️ Agent tool calling depends on model behavior

The tool works correctly when invoked - the agent's decision to use it depends on request specificity and model configuration.
