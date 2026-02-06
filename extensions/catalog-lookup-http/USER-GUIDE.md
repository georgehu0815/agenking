# Catalog Lookup HTTP Extension - User Guide

Complete guide to using the `catalog-lookup-http` extension in Clawdbot conversations.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Verification](#verification)
4. [Using in Chat](#using-in-chat)
5. [Example Conversations](#example-conversations)
6. [Available Operations](#available-operations)
7. [Different Chat Channels](#different-chat-channels)
8. [Tips for Tool Invocation](#tips-for-tool-invocation)
9. [Troubleshooting](#troubleshooting)
10. [Advanced Usage](#advanced-usage)

---

## Quick Start

### 1. Ensure Plugin is Enabled

```bash
# Check if plugin is loaded
pnpm clawdbot plugins list | grep catalog-lookup-http

# Enable if needed
pnpm clawdbot config set plugins.entries.catalog-lookup-http.enabled true

# Rebuild
pnpm build
```

### 2. Start MCP Server

```bash
cd skills/catalog_lookup_http
source .venv/bin/activate
python3 mcp_server.py
```

Keep this terminal open - the server must be running for the plugin to work.

### 3. Test the Tool

```bash
# Quick test
node test-my-tool.mjs

# Or test through agent
pnpm clawdbot agent --local --agent main \
  --message "Use catalog_lookup to list available tools"
```

---

## Prerequisites

### System Requirements

✅ **MCP Server Running**
- Server must be active at `http://localhost:3333/sse`
- Check with: `ps aux | grep mcp_server`

✅ **Python Virtual Environment**
- Located at: `skills/catalog_lookup_http/.venv`
- Dependencies installed: `mcp`, `fastapi`, `uvicorn`

✅ **Plugin Enabled**
- Status shows "loaded" in `clawdbot plugins list`

✅ **Clawdbot Built**
- Run `pnpm build` after any configuration changes

### Quick Health Check

```bash
# 1. Check MCP server
curl http://localhost:3333/sse
# Should connect (may timeout - that's OK)

# 2. Check plugin
pnpm clawdbot plugins info catalog-lookup-http
# Should show: Status: loaded, Tools: catalog_lookup

# 3. Test Python skill
cd skills/catalog_lookup_http
source .venv/bin/activate
echo '{"operation": "list_tools"}' | python3 -c \
  "from skill import handler; import json, sys; \
   print(json.dumps(handler(json.load(sys.stdin)), indent=2))"
```

---

## Verification

### Step 1: Verify Plugin is Loaded

```bash
pnpm clawdbot plugins info catalog-lookup-http
```

**Expected Output:**
```
Catalog Lookup (HTTP/SSE MCP)
id: catalog-lookup-http
Retrieve catalog item information via HTTP/SSE MCP server.
Supports get_catalog_item, get_summary_item, search_catalog,
and list_tools operations.

Status: loaded
Source: ~/aiworker/clawdbot/extensions/catalog-lookup-http/index.ts
Origin: bundled
Version: 2026.1.25
Tools: catalog_lookup
```

### Step 2: Test Tool Directly

```bash
node test-my-tool.mjs
```

**Expected Output:**
```
Testing catalog_lookup tool...

Tool name: catalog_lookup
Executing tool with operation=list_tools...

Available MCP tools:
  - get_catalog_item: Retrieve catalog item data by ID
  - get_summary_item: Retrieve summary item data by ID
  - search_catalog: Search catalog items by query string
```

### Step 3: Test Through Agent

```bash
pnpm clawdbot agent --local --agent main \
  --message "Execute catalog_lookup with operation list_tools"
```

---

## Using in Chat

### Command Line Interface (CLI)

#### Basic Usage

```bash
pnpm clawdbot agent --local --agent main \
  --message "YOUR MESSAGE HERE"
```

#### Real Examples

**List Available Tools:**
```bash
pnpm clawdbot agent --local --agent main \
  --message "Use catalog_lookup to show me what catalog operations are available"
```

**Search Catalog:**
```bash
pnpm clawdbot agent --local --agent main \
  --message "Search the catalog for items containing 'premium' using catalog_lookup"
```

**Get Specific Item:**
```bash
pnpm clawdbot agent --local --agent main \
  --message "Use catalog_lookup to get details for item PROD-001"
```

**Get Item Summary:**
```bash
pnpm clawdbot agent --local --agent main \
  --message "Get a detailed summary for catalog item PROD-001"
```

### Messaging Channels

If you have messaging channels configured (Telegram, WhatsApp, Discord, etc.):

1. **Start a conversation** with your Clawdbot
2. **Send a message** requesting catalog operations
3. **Agent responds** with data from the MCP server

---

## Example Conversations

### Example 1: Discovering Available Operations

**👤 You:**
```
What can you do with the catalog?
```

**🤖 Agent:**
```
I can help you with the following catalog operations:

• List all available tools
• Search for items by name or keyword
• Get detailed information about a specific item by ID
• Retrieve summary information with pricing details

What would you like to do?
```

**👤 You:**
```
Show me all available catalog tools
```

**🤖 Agent:**
```
[Executes: catalog_lookup with operation=list_tools]

Available catalog operations:

1. **get_catalog_item**
   - Retrieve basic catalog item data by ID
   - Required: item_id (string)

2. **get_summary_item**
   - Retrieve detailed summary with pricing
   - Required: item_id (string)

3. **search_catalog**
   - Search items by query string
   - Required: query (string)
```

---

### Example 2: Searching for Items

**👤 You:**
```
Search catalog for premium products
```

**🤖 Agent:**
```
[Executes: catalog_lookup with operation=search_catalog, query="premium"]

Found 2 items matching "premium":

**1. Premium Subscription (PROD-001)**
   • Price: $29.99 USD
   • Status: Active

**2. Premium Plus Bundle (PROD-004)**
   • Price: $49.99 USD
   • Status: Active

Would you like more details about any of these items?
```

**👤 You:**
```
Yes, get me full details for PROD-001
```

**🤖 Agent:**
```
[Executes: catalog_lookup with operation=get_catalog_item, item_id="PROD-001"]

**Catalog Item Details: PROD-001**

Name: Premium Subscription
Price: $29.99
Currency: USD
Status: Active

This is an active catalog item available for purchase.
```

---

### Example 3: Getting Item Summary

**👤 You:**
```
Get the summary for PROD-001
```

**🤖 Agent:**
```
[Executes: catalog_lookup with operation=get_summary_item, item_id="PROD-001"]

**Summary for PROD-001: Premium Subscription**

Summary Price: $129.99
Sale Price: $99.99
Country: US
Currency: USD
Owner: jeremy
Status: Active

🔥 This item is currently on sale!
Regular price: $129.99
Sale price: $99.99
Savings: $30.00 (23% off)
```

---

### Example 4: Multiple Operations

**👤 You:**
```
I'm looking for products with "subscription" in the name
```

**🤖 Agent:**
```
[Executes: catalog_lookup with operation=search_catalog, query="subscription"]

Found 3 subscription products:

1. **Premium Subscription** (PROD-001) - $29.99
2. **Basic Subscription** (PROD-002) - $9.99
3. **Enterprise Subscription** (PROD-003) - $99.99

All items are currently active and available.
```

**👤 You:**
```
Compare PROD-001 and PROD-002
```

**🤖 Agent:**
```
[Executes: catalog_lookup twice - once for each item]

**Comparison: Premium vs Basic Subscription**

**Premium (PROD-001)**
• Price: $29.99
• Features: Full access
• Status: Active

**Basic (PROD-002)**
• Price: $9.99
• Features: Limited access
• Status: Active

The Premium subscription costs $20 more but includes full access
to all features, while Basic has limited access.
```

---

## Available Operations

### 1. List Tools

**What it does:** Shows all available MCP operations

**Parameters:** None

**Example Request:**
```
"Show me available catalog operations"
"List all catalog tools"
"What can I do with the catalog?"
```

**CLI Command:**
```bash
pnpm clawdbot agent --local --agent main \
  --message "List all catalog operations using catalog_lookup"
```

**Expected Response:**
```json
{
  "tools": [
    {
      "name": "get_catalog_item",
      "description": "Retrieve catalog item data by ID",
      "input_schema": {...}
    },
    {
      "name": "get_summary_item",
      "description": "Retrieve summary item data by ID",
      "input_schema": {...}
    },
    {
      "name": "search_catalog",
      "description": "Search catalog items by query string",
      "input_schema": {...}
    }
  ],
  "operation": "list_tools",
  "count": 3
}
```

---

### 2. Search Catalog

**What it does:** Searches for items by query string

**Parameters:**
- `query` (string, required) - Search term

**Example Requests:**
```
"Search catalog for 'premium'"
"Find items containing 'starter'"
"Look for products with 'subscription' in the name"
```

**CLI Command:**
```bash
pnpm clawdbot agent --local --agent main \
  --message "Search catalog for premium items"
```

**Expected Response:**
```json
{
  "results": [
    {
      "id": "PROD-001",
      "name": "Premium Subscription",
      "price": 29.99,
      "currency": "USD",
      "status": "active"
    },
    {
      "id": "PROD-004",
      "name": "Premium Plus Bundle",
      "price": 49.99,
      "currency": "USD",
      "status": "active"
    }
  ],
  "operation": "search_catalog",
  "count": 2
}
```

---

### 3. Get Catalog Item

**What it does:** Retrieves basic item information by ID

**Parameters:**
- `item_id` (string, required) - Catalog item identifier

**Example Requests:**
```
"Get item PROD-001"
"Show me details for PROD-001"
"Look up catalog item PROD-001"
```

**CLI Command:**
```bash
pnpm clawdbot agent --local --agent main \
  --message "Get catalog item PROD-001"
```

**Expected Response:**
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

---

### 4. Get Summary Item

**What it does:** Retrieves detailed summary with additional fields

**Parameters:**
- `item_id` (string, required) - Catalog item identifier

**Example Requests:**
```
"Get summary for PROD-001"
"Show me detailed info for PROD-001"
"Get full summary of catalog item PROD-001"
```

**CLI Command:**
```bash
pnpm clawdbot agent --local --agent main \
  --message "Get summary for item PROD-001"
```

**Expected Response:**
```json
{
  "item": {
    "id": "PROD-001",
    "name": "Premium Subscription",
    "summary": 129.99,
    "sale_price": 99.99,
    "country": "US",
    "currency": "USD",
    "owner": "jeremy",
    "status": "active"
  },
  "operation": "get_summary_item"
}
```

---

## Different Chat Channels

### Via CLI (Local Testing)

**Best for:** Development, testing, debugging

```bash
pnpm clawdbot agent --local --agent main \
  --message "YOUR MESSAGE"
```

**Pros:**
- ✅ Fast iteration
- ✅ See raw output
- ✅ Easy debugging

**Cons:**
- ❌ Not persistent
- ❌ No conversation history

---

### Via Telegram

**Best for:** Real-time interaction, mobile access

**Setup:**
1. Configure Telegram bot token
2. Enable telegram plugin
3. Start gateway

**Usage:**
1. Open Telegram
2. Find your bot
3. Send message: `"Search catalog for premium"`

**Pros:**
- ✅ Persistent conversations
- ✅ Mobile friendly
- ✅ Rich formatting

---

### Via WhatsApp

**Best for:** Personal assistant, casual use

**Setup:**
1. Configure WhatsApp connection
2. Enable whatsapp plugin
3. Start gateway

**Usage:**
1. Message your Clawdbot number
2. Send: `"Get item PROD-001"`

**Pros:**
- ✅ Familiar interface
- ✅ Voice messages
- ✅ Media support

---

### Via Discord/Slack

**Best for:** Team collaboration, work contexts

**Setup:**
1. Create bot in Discord/Slack
2. Configure plugin
3. Start gateway

**Usage:**
1. Mention bot in channel
2. Send: `@clawdbot search catalog for premium`

**Pros:**
- ✅ Team visibility
- ✅ Thread support
- ✅ Integration with workflows

---

## Tips for Tool Invocation

### ✅ DO: Make Requests That Trigger the Tool

#### 1. Be Explicit About Using the Tool

```
✅ "Use catalog_lookup to search for premium items"
✅ "Execute catalog_lookup with operation search_catalog"
✅ "Call the catalog_lookup tool to get item PROD-001"
```

#### 2. Request Live/Current Data

```
✅ "What's the CURRENT price of PROD-001 in the database?"
✅ "Get the latest catalog data for premium items"
✅ "Show me real-time item availability"
```

#### 3. Ask for Specific Data the Agent Can't Know

```
✅ "How many items match 'starter' in the catalog right now?"
✅ "What's the exact sale price for PROD-001?"
✅ "List all items with owner 'jeremy'"
```

#### 4. Use Imperative Verbs

```
✅ "Search catalog for..."
✅ "Get item..."
✅ "Retrieve summary for..."
✅ "Fetch details about..."
```

---

### ❌ DON'T: Requests That Lead to Synthesis

#### 1. Vague Questions

```
❌ "Tell me about the catalog"
❌ "What items do you have?"
❌ "How does this work?"
```

#### 2. General Inquiries

```
❌ "What's in the catalog?"
❌ "Do you have premium items?"
❌ "Can you search items?"
```

#### 3. Questions Agent Might Guess

```
❌ "What are premium items?"
❌ "How much does PROD-001 cost?"
❌ "Is PROD-001 active?"
```

---

### Making the Tool Call More Likely

#### Strategy 1: Explicit Tool Mention

```bash
# Instead of:
"Search for premium items"

# Try:
"Use the catalog_lookup tool to search for premium items"
```

#### Strategy 2: Emphasize Live Data

```bash
# Instead of:
"What's the price of PROD-001?"

# Try:
"Get the CURRENT price of PROD-001 from the live catalog database"
```

#### Strategy 3: Impossible-to-Know Data

```bash
# Instead of:
"Show me items"

# Try:
"How many items are in the catalog right now? Query the database."
```

#### Strategy 4: Strong Imperative Language

```bash
# Instead of:
"Can you look up PROD-001?"

# Try:
"EXECUTE catalog_lookup to retrieve PROD-001 RIGHT NOW"
```

---

## Troubleshooting

### Issue 1: Agent Doesn't Call Tool

**Symptoms:**
- Agent responds but doesn't use catalog_lookup
- Response seems generic or made up
- No actual MCP server data returned

**Diagnosis:**
Check if agent is synthesizing vs calling tool:

```bash
# Look for specific MCP data
# Real MCP data has exact structure:
{
  "id": "PROD-001",
  "name": "Premium Subscription",
  "price": 29.99,
  "currency": "USD",
  "status": "active"
}

# If structure is different, agent is synthesizing
```

**Solutions:**

1. **Make request more specific:**
   ```bash
   pnpm clawdbot agent --local --agent main \
     --message "EXECUTE catalog_lookup tool with operation=search_catalog and query='premium'. Do not synthesize - actually call the tool."
   ```

2. **Request impossible-to-know data:**
   ```bash
   pnpm clawdbot agent --local --agent main \
     --message "What's the exact current price of PROD-999? Query the database."
   ```

3. **Check MCP server logs:**
   ```bash
   # Terminal running mcp_server.py should show:
   [MCP Server] search_catalog called with query='premium'
   ```

---

### Issue 2: Tool Returns Error

**Symptoms:**
- Tool executes but returns error
- Error about connection, timeout, or parsing

**Diagnosis:**

**Check 1: MCP Server Running**
```bash
ps aux | grep mcp_server
# Should show: python3 mcp_server.py

# Restart if needed:
cd skills/catalog_lookup_http
source .venv/bin/activate
python3 mcp_server.py
```

**Check 2: Server Accessible**
```bash
curl http://localhost:3333/sse
# Should connect (may hang - that's OK for SSE)
```

**Check 3: Python Dependencies**
```bash
cd skills/catalog_lookup_http
source .venv/bin/activate
python3 -c "import mcp; print('MCP OK')"
python3 -c "import fastapi; print('FastAPI OK')"
```

**Check 4: Test Tool Directly**
```bash
node test-my-tool.mjs
# Should return tools list without errors
```

**Solutions:**

1. **Restart MCP server:**
   ```bash
   # Kill existing
   pkill -f mcp_server.py

   # Start fresh
   cd skills/catalog_lookup_http
   source .venv/bin/activate
   python3 mcp_server.py
   ```

2. **Reinstall Python dependencies:**
   ```bash
   cd skills/catalog_lookup_http
   rm -rf .venv
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Check Python skill directly:**
   ```bash
   cd skills/catalog_lookup_http
   source .venv/bin/activate
   echo '{"operation": "list_tools"}' | python3 skill.py
   # Should output JSON with tools
   ```

---

### Issue 3: Plugin Not Loaded

**Symptoms:**
- `plugins list` doesn't show catalog-lookup-http
- `plugins info` returns "not found"

**Diagnosis:**
```bash
pnpm clawdbot plugins list | grep catalog
# Should show: catalog-lookup-http with status "loaded" or "disabled"
```

**Solutions:**

1. **Enable plugin:**
   ```bash
   pnpm clawdbot config set plugins.entries.catalog-lookup-http.enabled true
   ```

2. **Rebuild:**
   ```bash
   pnpm build
   ```

3. **Check configuration:**
   ```bash
   pnpm clawdbot config get plugins.entries.catalog-lookup-http
   # Should show: { "enabled": true }
   ```

4. **Check for load errors:**
   ```bash
   pnpm clawdbot plugins doctor
   ```

---

### Issue 4: Wrong Data Returned

**Symptoms:**
- Tool executes but returns unexpected data
- Field names don't match expected schema

**Diagnosis:**

**Check what MCP server actually returns:**
```bash
cd skills/catalog_lookup_http
source .venv/bin/activate
echo '{"operation": "get_catalog_item", "item_id": "PROD-001"}' | python3 skill.py
```

**Expected output format:**
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

**Solutions:**

1. **Update mcp_server.py** to return correct data structure
2. **Modify skill.py** to transform data if needed
3. **Check MCP server mock data** matches your expected schema

---

## Advanced Usage

### Custom MCP Server URL

If your MCP server runs on a different host/port:

```bash
pnpm clawdbot config set \
  plugins.entries.catalog-lookup-http.mcpServerUrl \
  "http://your-server:8080/sse"
```

### Custom Timeout

For slow MCP servers:

```bash
pnpm clawdbot config set \
  plugins.entries.catalog-lookup-http.timeout \
  60000
```

### Multiple Environments

**Development:**
```bash
export MCP_SERVER_URL="http://localhost:3333/sse"
```

**Production:**
```bash
export MCP_SERVER_URL="https://prod-mcp.example.com/sse"
```

### Scripting and Automation

```bash
#!/bin/bash
# Auto-query catalog

ITEMS=("PROD-001" "PROD-002" "PROD-003")

for item in "${ITEMS[@]}"; do
  echo "Querying $item..."
  pnpm clawdbot agent --local --agent main \
    --message "Get catalog item $item" \
    --json > "output_${item}.json"
done
```

### Integration with Workflows

If using Lobster workflows:

```yaml
name: catalog_workflow
steps:
  - name: search_items
    tool: catalog_lookup
    params:
      operation: search_catalog
      query: "premium"

  - name: get_details
    tool: catalog_lookup
    params:
      operation: get_catalog_item
      item_id: "${search_items.results[0].id}"
```

---

## Quick Reference

### Common Commands

```bash
# Check plugin status
pnpm clawdbot plugins info catalog-lookup-http

# Test tool directly
node test-my-tool.mjs

# Search catalog
pnpm clawdbot agent --local --agent main \
  --message "Search catalog for premium"

# Get item
pnpm clawdbot agent --local --agent main \
  --message "Get catalog item PROD-001"

# List tools
pnpm clawdbot agent --local --agent main \
  --message "Show catalog operations"
```

### Configuration Paths

```bash
# Plugin config
~/.clawdbot/clawdbot.json
  └── plugins.entries.catalog-lookup-http

# Python skill
skills/catalog_lookup_http/
  ├── skill.py
  ├── mcp_client.py
  ├── mcp_server.py
  └── .venv/

# Plugin code
extensions/catalog-lookup-http/
  ├── index.ts
  └── src/catalog-tool.ts
```

### Quick Checks

```bash
# Is MCP server running?
ps aux | grep mcp_server

# Is plugin loaded?
pnpm clawdbot plugins list | grep catalog

# Can I reach MCP server?
curl http://localhost:3333/sse

# Does tool work?
node test-my-tool.mjs
```

---

## Summary

✅ **Setup Complete When:**
- [ ] MCP server running
- [ ] Plugin shows "loaded" status
- [ ] Test script succeeds
- [ ] Agent can invoke tool

✅ **For Best Results:**
- Be explicit about using the tool
- Request live/current data
- Use imperative language
- Check MCP server logs to confirm calls

✅ **Get Help:**
- Read [README.md](README.md) for technical details
- See [PLUGIN-MCP-GUIDE.md](../../PLUGIN-MCP-GUIDE.md) for development
- Check [README-INTEGRATION.md](README-INTEGRATION.md) for architecture

---

## Version

- **Document Version**: 1.0
- **Plugin Version**: 2026.1.25
- **Last Updated**: 2026-01-28
- **Clawdbot Version**: 2026.1.25

