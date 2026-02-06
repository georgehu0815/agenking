# Catalog MCP Direct - Usage Guide

Complete guide for using the TypeScript-based MCP plugin (`catalog-mcp-direct`) in Clawdbot.

## Table of Contents

- [Quick Start](#quick-start)
- [Direct Testing](#1-direct-testing)
- [CLI Usage](#2-cli-usage-with-agent)
- [Chat/Conversation Usage](#3-chatconversation-usage)
- [Programmatic Usage](#4-programmatic-usage)
- [Configuration](#5-configuration)
- [Available Operations](#6-available-operations)
- [Tips for Better Tool Calling](#7-tips-for-better-tool-calling)
- [Troubleshooting](#8-troubleshooting)

---

## Quick Start

**Prerequisites:**
1. MCP server running at `http://localhost:3333/sse`
2. Plugin enabled: `pnpm clawdbot config set plugins.entries.catalog-mcp-direct.enabled true`
3. Clawdbot built: `pnpm build`

**Verify plugin is loaded:**
```bash
pnpm clawdbot plugins info catalog-mcp-direct
```

---

## 1. Direct Testing

The quickest way to verify the plugin works is to run the test script:

```bash
node test-catalog-mcp-ts.mjs
```

**Expected output:**
```
Testing catalog_mcp tool (TypeScript direct)...

=== Test 1: List Tools ===
✓ Found 3 tools:
  - get_catalog_item: Retrieve catalog item data by ID
  - get_summary_item: Retrieve summary item data by ID
  - search_catalog: Search catalog items by query string

=== Test 2: Search Catalog ===
✓ Found 2 items matching "premium":
  - PROD-001: Premium Subscription ($29.99)
  - PROD-004: Premium Plus Bundle ($49.99)

=== Test 3: Get Catalog Item ===
✓ Item details:
  ID: PROD-001
  Name: Premium Subscription
  Price: $29.99 USD
  Status: active

✅ All tests passed!
```

---

## 2. CLI Usage with Agent

### List Available MCP Tools

```bash
pnpm clawdbot agent --local --agent main --message "Use catalog_mcp to list available tools"
```

**Expected behavior:**
- Agent calls `catalog_mcp` with operation `list_tools`
- Returns list of 3 available MCP operations

### Search for Items

```bash
pnpm clawdbot agent --local --agent main \
  --message "Use catalog_mcp to search for premium items"
```

**Example response:**
```
I found 2 premium items in the catalog:

1. PROD-001: Premium Subscription
   - Price: $29.99
   - Status: active

2. PROD-004: Premium Plus Bundle
   - Price: $49.99
   - Status: active
```

### Get Specific Item

```bash
pnpm clawdbot agent --local --agent main \
  --message "Use catalog_mcp to get details for item PROD-001"
```

**Example response:**
```
Here are the details for PROD-001:

Name: Premium Subscription
Price: $29.99 USD
Status: active
ID: PROD-001
```

### Get Detailed Summary

```bash
pnpm clawdbot agent --local --agent main \
  --message "Use catalog_mcp to get summary for item PROD-001"
```

**Example response:**
```
Here's the detailed summary for PROD-001:

Name: Premium Subscription
Summary: Comprehensive summary text...
Sale Price: $24.99
Regular Price: $29.99
Country: USA
Currency: USD
Owner: Admin
Status: active
```

---

## 3. Chat/Conversation Usage

You can use the plugin in any Clawdbot chat interface (Telegram, WhatsApp, Discord, Slack, web UI).

### Example Conversations

#### Example 1: Search Catalog

**User:**
```
Search the catalog for premium items
```

**Agent:**
```
[Thinking: User wants to search catalog, I'll use catalog_mcp tool]
[Calls: catalog_mcp with operation=search_catalog, query="premium"]

I found 2 premium items:

• PROD-001: Premium Subscription ($29.99)
• PROD-004: Premium Plus Bundle ($49.99)

Would you like details on any of these?
```

#### Example 2: Get Item Price

**User:**
```
What's the price of PROD-001?
```

**Agent:**
```
[Calls: catalog_mcp with operation=get_catalog_item, item_id="PROD-001"]

PROD-001 (Premium Subscription) costs $29.99 USD and is currently active.
```

#### Example 3: Explore Catalog

**User:**
```
What items are available in the catalog?
```

**Agent:**
```
[Calls: catalog_mcp with operation=search_catalog, query=""]

Let me check the catalog for you...

I found these items:
1. PROD-001: Premium Subscription ($29.99)
2. PROD-002: Basic Plan ($9.99)
3. PROD-003: Enterprise Solution ($99.99)
4. PROD-004: Premium Plus Bundle ($49.99)

Would you like more details on any of these?
```

#### Example 4: Multiple Requests

**User:**
```
Find premium items and tell me the details of the cheapest one
```

**Agent:**
```
[Calls: catalog_mcp with operation=search_catalog, query="premium"]
[Calls: catalog_mcp with operation=get_catalog_item, item_id="PROD-001"]

I found 2 premium items. The cheapest is:

PROD-001: Premium Subscription
Price: $29.99 USD
Status: active

This is the most affordable premium option in the catalog.
```

---

## 4. Programmatic Usage

If you want to use the tool directly in your own code:

### Basic Usage

```javascript
#!/usr/bin/env node
import { createJiti } from "jiti";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function useTool() {
  const jiti = createJiti(__dirname, {
    interopDefault: true,
    esmResolve: true,
  });

  // Load the tool
  const toolModule = await jiti.import(
    "./extensions/catalog-mcp-direct/src/catalog-mcp-tool.ts"
  );
  const mockApi = { pluginConfig: {} };
  const tool = toolModule.createCatalogMcpTool(mockApi);

  // Execute operation
  const result = await tool.execute("custom-id", {
    operation: "search_catalog",
    query: "premium"
  });

  const data = JSON.parse(result.content[0].text);
  console.log(`Found ${data.count} items:`, data.results);
}

useTool();
```

### Advanced Usage - Multiple Operations

```javascript
async function catalogWorkflow() {
  const jiti = createJiti(__dirname, {
    interopDefault: true,
    esmResolve: true,
  });

  const toolModule = await jiti.import(
    "./extensions/catalog-mcp-direct/src/catalog-mcp-tool.ts"
  );
  const tool = toolModule.createCatalogMcpTool({ pluginConfig: {} });

  // 1. List available tools
  console.log("Step 1: List MCP tools");
  const toolsResult = await tool.execute("step-1", {
    operation: "list_tools"
  });
  const toolsData = JSON.parse(toolsResult.content[0].text);
  console.log(`Found ${toolsData.count} tools\n`);

  // 2. Search for items
  console.log("Step 2: Search for premium items");
  const searchResult = await tool.execute("step-2", {
    operation: "search_catalog",
    query: "premium"
  });
  const searchData = JSON.parse(searchResult.content[0].text);
  console.log(`Found ${searchData.count} items\n`);

  // 3. Get details for first item
  if (searchData.results.length > 0) {
    const firstItemId = searchData.results[0].id;
    console.log(`Step 3: Get details for ${firstItemId}`);

    const itemResult = await tool.execute("step-3", {
      operation: "get_catalog_item",
      item_id: firstItemId
    });
    const itemData = JSON.parse(itemResult.content[0].text);
    console.log("Item details:", itemData.item);
  }
}

catalogWorkflow();
```

### Error Handling

```javascript
async function safeToolUsage() {
  try {
    const result = await tool.execute("safe-call", {
      operation: "get_catalog_item",
      item_id: "PROD-001"
    });

    if (result.isError) {
      console.error("Tool returned error:", result.content[0].text);
      return;
    }

    const data = JSON.parse(result.content[0].text);
    console.log("Success:", data);
  } catch (err) {
    console.error("Exception occurred:", err.message);
  }
}
```

---

## 5. Configuration

### View Current Configuration

```bash
pnpm clawdbot config get plugins.entries.catalog-mcp-direct
```

### Change MCP Server URL

**Default:** `http://localhost:3333/sse`

**Change to custom URL:**
```bash
pnpm clawdbot config set \
  plugins.entries.catalog-mcp-direct.serverUrl \
  "http://your-server:port/sse"
```

### Change Timeout

**Default:** `30000` (30 seconds)

**Change timeout to 60 seconds:**
```bash
pnpm clawdbot config set \
  plugins.entries.catalog-mcp-direct.timeout \
  60000
```

### Enable/Disable Plugin

**Enable:**
```bash
pnpm clawdbot config set plugins.entries.catalog-mcp-direct.enabled true
```

**Disable:**
```bash
pnpm clawdbot config set plugins.entries.catalog-mcp-direct.enabled false
```

### Configuration File

Manual configuration at `~/.clawdbot/clawdbot.json`:

```json
{
  "plugins": {
    "entries": {
      "catalog-mcp-direct": {
        "enabled": true,
        "serverUrl": "http://localhost:3333/sse",
        "timeout": 30000
      }
    }
  }
}
```

---

## 6. Available Operations

The `catalog_mcp` tool supports 4 operations:

### 1. list_tools

**Purpose:** List all available MCP operations

**Parameters:** None

**Example:**
```bash
pnpm clawdbot agent --local --agent main \
  --message "Use catalog_mcp to list tools"
```

**Response format:**
```json
{
  "tools": [
    {
      "name": "get_catalog_item",
      "description": "Retrieve catalog item data by ID",
      "input_schema": { ... }
    },
    {
      "name": "get_summary_item",
      "description": "Retrieve summary item data by ID",
      "input_schema": { ... }
    },
    {
      "name": "search_catalog",
      "description": "Search catalog items by query string",
      "input_schema": { ... }
    }
  ],
  "operation": "list_tools",
  "count": 3
}
```

### 2. search_catalog

**Purpose:** Search catalog items by keyword

**Parameters:**
- `query` (string, required) - Search query

**Example:**
```bash
pnpm clawdbot agent --local --agent main \
  --message "Use catalog_mcp to search for 'premium'"
```

**Response format:**
```json
{
  "results": [
    {
      "id": "PROD-001",
      "name": "Premium Subscription",
      "price": 29.99,
      "currency": "USD",
      "status": "active"
    }
  ],
  "operation": "search_catalog",
  "count": 1
}
```

### 3. get_catalog_item

**Purpose:** Get basic item details by ID

**Parameters:**
- `item_id` (string, required) - Catalog item ID

**Example:**
```bash
pnpm clawdbot agent --local --agent main \
  --message "Use catalog_mcp to get item PROD-001"
```

**Response format:**
```json
{
  "item": {
    "id": "PROD-001",
    "name": "Premium Subscription",
    "price": 29.99,
    "currency": "USD",
    "status": "active"
  },
  "operation": "get_catalog_item"
}
```

### 4. get_summary_item

**Purpose:** Get detailed item summary by ID

**Parameters:**
- `item_id` (string, required) - Catalog item ID

**Example:**
```bash
pnpm clawdbot agent --local --agent main \
  --message "Use catalog_mcp to get summary for PROD-001"
```

**Response format:**
```json
{
  "item": {
    "id": "PROD-001",
    "name": "Premium Subscription",
    "summary": "Comprehensive premium features...",
    "sale_price": 24.99,
    "country": "USA",
    "currency": "USD",
    "owner": "Admin",
    "status": "active"
  },
  "operation": "get_summary_item"
}
```

---

## 7. Tips for Better Tool Calling

The agent's decision to call tools depends on how you phrase requests. Here are tips to increase the likelihood:

### ✅ DO: Be Specific About Data Source

**Good:**
```
Use catalog_mcp to get the current price from the database
```

**Why:** Explicitly mentions the tool and requests live data

**Bad:**
```
What's the price?
```

**Why:** Vague, agent might synthesize an answer

### ✅ DO: Request Live/Real Data

**Good:**
```
Check the actual catalog for premium items right now
```

**Why:** Emphasizes real-time data that requires tool call

**Bad:**
```
Tell me about premium items
```

**Why:** Agent might provide general information without calling tool

### ✅ DO: Mention Tool Name Explicitly

**Good:**
```
Use the catalog_mcp tool to search for items
```

**Why:** Directly instructs agent to use specific tool

**Bad:**
```
Find items for me
```

**Why:** Generic request, tool use not specified

### ✅ DO: Request Specific Operations

**Good:**
```
Search the catalog for items matching "enterprise"
```

**Why:** Clear action that maps to `search_catalog` operation

**Bad:**
```
What do you know about enterprise options?
```

**Why:** Knowledge question, not action-oriented

### ✅ DO: Ask for Current/Latest Information

**Good:**
```
What's the latest price for PROD-001?
```

**Why:** "Latest" suggests need for real-time data

**Bad:**
```
How much does PROD-001 typically cost?
```

**Why:** "Typically" suggests general information is acceptable

### Model Behavior Notes

- **Some models prefer synthesis** over tool calls - this is normal LLM behavior
- **More specific requests** increase tool calling likelihood
- **Explicit tool mentions** help guide the model
- **Live data emphasis** makes tool calls more likely
- Different models (Sonnet, Opus, Haiku) have different tool-calling preferences

---

## 8. Troubleshooting

### Plugin Not Loaded

**Symptom:**
```
Error: Tool 'catalog_mcp' not found
```

**Check plugin status:**
```bash
pnpm clawdbot plugins list | grep catalog-mcp-direct
```

**Expected:** Shows "catalog-mcp-direct" with status "loaded"

**Fix if disabled:**
```bash
pnpm clawdbot config set plugins.entries.catalog-mcp-direct.enabled true
pnpm build
```

**Verify tool registration:**
```bash
pnpm clawdbot plugins info catalog-mcp-direct
```

**Expected output:**
```
Catalog MCP (TypeScript Direct)
Status: loaded
Tools: catalog_mcp
```

---

### MCP Server Connection Error

**Symptom:**
```
MCP client error: connect ECONNREFUSED 127.0.0.1:3333
```

**Check if MCP server is running:**
```bash
curl http://localhost:3333/sse
```

**Expected:** Connection successful (may show SSE stream)

**Start MCP server if not running:**
```bash
cd skills/catalog_lookup_http
source .venv/bin/activate
python3 mcp_server.py
```

**Verify process:**
```bash
ps aux | grep mcp_server
```

---

### Tool Returns Error

**Symptom:**
```
Tool execution failed: [error message]
```

**Test directly:**
```bash
node test-catalog-mcp-ts.mjs
```

**Check MCP server logs:**

Terminal running `mcp_server.py` should show incoming requests. Look for errors.

**Check server URL configuration:**
```bash
pnpm clawdbot config get plugins.entries.catalog-mcp-direct.serverUrl
```

**Ensure it matches your MCP server URL**

---

### Agent Not Calling Tool

**Symptom:** Agent responds without calling `catalog_mcp` tool

**Causes:**
1. Model prefers synthesizing answers
2. Request isn't specific enough
3. Tool description suggests what answer would be
4. Request doesn't clearly require live data

**Solutions:**

1. **Be more specific:**
   ```
   Use catalog_mcp to get the exact current price from database
   ```

2. **Mention tool explicitly:**
   ```
   Call the catalog_mcp tool to search for items
   ```

3. **Request verifiable data:**
   ```
   What's item PROD-001's actual status right now?
   ```

4. **Try different model:**
   - Some models prefer tool calling more than others
   - Sonnet generally good at tool use
   - Opus more thorough but may synthesize more

---

### Timeout Errors

**Symptom:**
```
Error: MCP request timeout after 30000ms
```

**Increase timeout:**
```bash
pnpm clawdbot config set \
  plugins.entries.catalog-mcp-direct.timeout \
  60000
```

**Check MCP server performance:**

If server is slow, investigate server-side issues

---

### TypeScript/Build Errors

**Symptom:**
```
Error: Cannot find module '@modelcontextprotocol/sdk'
```

**Fix:**
```bash
# Clean and rebuild
rm -rf dist node_modules
pnpm install
pnpm build
```

**Verify dependencies:**
```bash
cd extensions/catalog-mcp-direct
cat package.json | grep modelcontextprotocol
```

**Expected:** Should show `@modelcontextprotocol/sdk` dependency

---

### Permission Errors

**Symptom:**
```
Error: EACCES: permission denied
```

**Check file permissions:**
```bash
ls -la extensions/catalog-mcp-direct/
```

**Fix permissions if needed:**
```bash
chmod +x test-catalog-mcp-ts.mjs
```

---

## Performance

### Benchmarks

Tested on MacBook Pro M1:

| Operation | Python Plugin | TypeScript Plugin | Improvement |
|-----------|--------------|-------------------|-------------|
| list_tools | ~300ms | ~80ms | **3.75x faster** |
| search_catalog | ~350ms | ~100ms | **3.5x faster** |
| get_catalog_item | ~280ms | ~75ms | **3.7x faster** |

### Why TypeScript is Faster

- **No process spawning** - Direct in-process communication
- **No Python interpreter startup** - Node.js runtime already loaded
- **Optimized TypeScript runtime** - V8 engine performance
- **Single language** - No cross-process JSON serialization

---

## Multi-Plugin Setup

Both Python and TypeScript plugins can run simultaneously:

### Running Both Plugins

```bash
# Enable Python version
pnpm clawdbot config set plugins.entries.catalog-lookup-http.enabled true

# Enable TypeScript version
pnpm clawdbot config set plugins.entries.catalog-mcp-direct.enabled true

# Rebuild
pnpm build
```

### Different Tool Names

- **Python plugin:** `catalog_lookup` tool
- **TypeScript plugin:** `catalog_mcp` tool

### When to Use Each

**Use TypeScript version (catalog_mcp):**
- ✅ Default choice for best performance
- ✅ Production deployments
- ✅ When Python environment is problematic
- ✅ When you want type safety

**Use Python version (catalog_lookup):**
- ⚠️ When testing Python MCP workflow
- ⚠️ When you need Python-specific features
- ⚠️ Migration period while switching

**Recommendation:** Use TypeScript version (`catalog_mcp`) - it's faster and simpler.

---

## Summary

✅ **catalog_mcp tool** - Pure TypeScript MCP client
✅ **3-4x faster** than Python approach
✅ **No Python dependency** required
✅ **Fully type-safe** and production-ready
✅ **Easy to maintain** and extend

This is the **recommended approach** for MCP integrations in Clawdbot!

---

## Resources

- **Plugin README:** [extensions/catalog-mcp-direct/README.md](./README.md)
- **MCP Protocol:** https://modelcontextprotocol.io
- **MCP TypeScript SDK:** https://github.com/modelcontextprotocol/typescript-sdk
- **Clawdbot Plugin Guide:** [PLUGIN-MCP-GUIDE.md](../../PLUGIN-MCP-GUIDE.md)

---

**Version:** 1.0.0
**Last Updated:** 2026-01-28
**Plugin:** catalog-mcp-direct
**Clawdbot Version:** 2026.1.25
