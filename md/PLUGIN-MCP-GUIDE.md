# Building Clawdbot Plugins for MCP Servers

A comprehensive guide to creating executable Clawdbot plugins that bridge to Model Context Protocol (MCP) servers.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture Understanding](#architecture-understanding)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Testing and Verification](#testing-and-verification)
6. [Configuration and Deployment](#configuration-and-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Complete Example](#complete-example)

---
  "markdown-to-pdf": {
        "enabled": false,
        "config": {
          "pdfEngine": "xelatex",
          "defaultToc": true,
          "defaultNumberSections": true,
          "defaultMargin": "1in"
        }
      }

## Overview

### What This Guide Covers

This guide shows you how to convert an MCP server skill into an **executable Clawdbot plugin tool** that agents can actually invoke, rather than just reading as documentation.

### Problem Statement

**Before**: Skills are prompt-based only
- ✅ Skill appears in agent's system prompt
- ✅ Agent can read `SKILL.md` documentation
- ❌ Agent cannot execute the skill
- ❌ Agent hallucinates responses instead of calling real services

**After**: Plugin registers executable tool
- ✅ Tool registered in Clawdbot's tool system
- ✅ Agent can invoke tool during conversations
- ✅ Tool executes Python/MCP code
- ✅ Real data returned from MCP server

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  User Request                                                │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  Clawdbot Agent (with tools)                                │
│  - Reads system prompt                                       │
│  - Decides to use tool                                       │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  Plugin Tool (TypeScript)                    ← YOU BUILD     │
│  - Validates parameters                                      │
│  - Spawns Python process                                     │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  Python Skill (skill.py)                                     │
│  - Connects to MCP server                                    │
│  - Calls MCP tools                                           │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  MCP Server (HTTP/SSE or stdio)                              │
│  - Exposes tools via MCP protocol                            │
│  - Returns results                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### System Requirements

1. **Node.js 22+** - Clawdbot runtime
2. **Python 3.12+** - For MCP skills
3. **pnpm** - Package manager
4. **TypeScript** - Plugin development

### Knowledge Requirements

- Basic TypeScript/JavaScript
- Python async/await
- Understanding of MCP protocol
- Familiarity with Clawdbot structure

### Environment Setup

```bash
# Clone Clawdbot repository
git clone https://github.com/clawdbot/clawdbot
cd clawdbot

# Install dependencies
pnpm install

# Build Clawdbot
pnpm build
```

---

## Architecture Understanding

### Clawdbot Plugin System

Clawdbot uses a **plugin-based architecture** where:

1. **Plugins** are discovered from `extensions/*` directories
2. **Tools** are registered via `api.registerTool()`
3. **Agents** receive tools based on configuration and allowlists
4. **Models** (LLMs) decide when to invoke tools

### Plugin Types

| Type | Use Case | Example |
|------|----------|---------|
| **Tool Plugin** | Adds executable tools | This guide |
| **Channel Plugin** | Adds messaging channels | Discord, Slack |
| **Provider Plugin** | Adds LLM providers | OpenAI, Anthropic |
| **Hook Plugin** | Intercepts events | Logging, metrics |

### Skills vs Plugins

| Aspect | Skill | Plugin |
|--------|-------|--------|
| **Location** | `skills/` directory | `extensions/` directory |
| **Format** | `SKILL.md` + optional scripts | TypeScript/JavaScript |
| **Agent Integration** | Prompt-based (documentation) | Executable (invokable) |
| **Tool Registration** | No | Yes |
| **Use Case** | Guidance, workflows | Executable actions |

**Key Insight**: Skills are passive documentation; plugins make them executable.

---

## Step-by-Step Implementation

### Step 1: Create Plugin Directory Structure

**Location**: `extensions/<your-plugin-name>/`

```bash
mkdir -p extensions/my-mcp-plugin/src
cd extensions/my-mcp-plugin
```

**Required Files**:
```
extensions/my-mcp-plugin/
├── package.json              # Plugin manifest
├── clawdbot.plugin.json      # Plugin metadata
├── index.ts                  # Entry point (registers tool)
└── src/
    └── my-tool.ts           # Tool implementation
```

### Step 2: Create `package.json`

**File**: `extensions/my-mcp-plugin/package.json`

```json
{
  "name": "@clawdbot/my-mcp-plugin",
  "version": "2026.1.25",
  "type": "module",
  "description": "My MCP plugin description",
  "clawdbot": {
    "extensions": [
      "./index.ts"
    ]
  }
}
```

**Key Points**:
- `type: "module"` - ESM modules required
- `clawdbot.extensions` - Array of entry point files
- Version should match Clawdbot version
- Name should be scoped (`@clawdbot/...`)

### Step 3: Create `clawdbot.plugin.json`

**File**: `extensions/my-mcp-plugin/clawdbot.plugin.json`

```json
{
  "id": "my-mcp-plugin",
  "name": "My MCP Plugin",
  "description": "Description of what this plugin does",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "mcpServerUrl": {
        "type": "string",
        "description": "MCP server URL",
        "default": "http://localhost:3333/sse"
      },
      "timeout": {
        "type": "number",
        "description": "Request timeout in milliseconds",
        "default": 30000
      }
    }
  }
}
```

**Configuration Schema**:
- Defines user-configurable options
- Validated using JSON Schema
- Accessible via `api.pluginConfig` in code

### Step 4: Create Plugin Entry Point

**File**: `extensions/my-mcp-plugin/index.ts`

```typescript
import type { ClawdbotPluginApi } from "../../src/plugins/types.js";
import { createMyTool } from "./src/my-tool.js";

export default function register(api: ClawdbotPluginApi) {
  // Register the tool
  // optional: false - Tool always available (not filtered by allowlist)
  // optional: true - Tool requires explicit enablement
  api.registerTool(createMyTool(api), { optional: false });
}
```

**Registration Options**:
- `optional: false` - Tool included by default
- `optional: true` - Tool requires allowlist configuration

### Step 5: Implement Tool

**File**: `extensions/my-mcp-plugin/src/my-tool.ts`

```typescript
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Type } from "@sinclair/typebox";
import type { ClawdbotPluginApi } from "../../../src/plugins/types.js";
import type { ToolResult } from "../../../src/agents/pi-tool-definition-adapter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type PluginConfig = {
  mcpServerUrl?: string;
  timeout?: number;
};

export function createMyTool(api: ClawdbotPluginApi) {
  return {
    // Tool name (used by agents)
    name: "my_tool",

    // Tool description (helps agent decide when to use it)
    description:
      "Describe what this tool does and when to use it",

    // Tool parameters schema (using TypeBox)
    parameters: Type.Object({
      operation: Type.Optional(
        Type.Union([
          Type.Literal("list_items"),
          Type.Literal("get_item"),
          Type.Literal("search"),
        ], {
          description: "Operation to perform",
          default: "list_items",
        })
      ),
      item_id: Type.Optional(
        Type.String({
          description: "Item ID (required for get_item)",
        })
      ),
      query: Type.Optional(
        Type.String({
          description: "Search query (required for search)",
        })
      ),
    }),

    // Tool execution function
    async execute(
      toolCallId: string,
      params: Record<string, unknown>
    ): Promise<ToolResult> {
      const operation = (params.operation as string) || "list_items";
      const itemId = params.item_id as string | undefined;
      const query = params.query as string | undefined;

      // Validate required parameters
      if (operation === "get_item" && !itemId) {
        return {
          role: "toolResult",
          toolCallId,
          toolName: "my_tool",
          content: [{
            type: "text",
            text: JSON.stringify({
              error: "get_item requires item_id parameter"
            })
          }],
          isError: true,
        };
      }

      if (operation === "search" && !query) {
        return {
          role: "toolResult",
          toolCallId,
          toolName: "my_tool",
          content: [{
            type: "text",
            text: JSON.stringify({
              error: "search requires query parameter"
            })
          }],
          isError: true,
        };
      }

      // Resolve paths to Python skill
      const skillDir = path.resolve(
        __dirname,
        "../../../skills/my_mcp_skill"
      );
      const venvPython = path.join(skillDir, ".venv/bin/python3");

      // Check if venv exists, fall back to system python
      const pythonPath = await import("node:fs/promises")
        .then(fs => fs.access(venvPython).then(() => venvPython))
        .catch(() => "python3");

      // Prepare input for Python skill
      const skillInput = {
        operation,
        ...(itemId && { item_id: itemId }),
        ...(query && { query }),
      };

      // Get plugin configuration
      const pluginConfig = (api.pluginConfig ?? {}) as PluginConfig;
      const env = { ...process.env };

      // Pass config to Python via environment variables
      if (pluginConfig.mcpServerUrl) {
        env.MCP_SERVER_URL = pluginConfig.mcpServerUrl;
      }

      // Execute Python skill
      return new Promise((resolve) => {
        const proc = spawn(
          pythonPath,
          [
            "-c",
            `import json, sys; sys.path.insert(0, '${skillDir}'); from skill import handler; print(json.dumps(handler(json.load(sys.stdin))))`,
          ],
          {
            cwd: skillDir,
            stdio: ["pipe", "pipe", "pipe"],
            env,
          }
        );

        let stdout = "";
        let stderr = "";

        // Send input to Python
        proc.stdin.write(JSON.stringify(skillInput));
        proc.stdin.end();

        // Collect output
        proc.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        proc.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        // Handle completion
        proc.on("close", (code) => {
          if (code !== 0) {
            resolve({
              role: "toolResult",
              toolCallId,
              toolName: "my_tool",
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: `Skill execution failed (exit code ${code})`,
                  stderr: stderr.trim(),
                }, null, 2)
              }],
              isError: true,
            });
            return;
          }

          try {
            // Parse Python skill output
            const result = JSON.parse(stdout);

            resolve({
              role: "toolResult",
              toolCallId,
              toolName: "my_tool",
              content: [{
                type: "text",
                text: JSON.stringify(result, null, 2),
              }],
            });
          } catch (err) {
            resolve({
              role: "toolResult",
              toolCallId,
              toolName: "my_tool",
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: "Failed to parse skill output",
                  stdout: stdout.trim(),
                  stderr: stderr.trim(),
                }, null, 2)
              }],
              isError: true,
            });
          }
        });

        // Handle spawn errors
        proc.on("error", (err) => {
          resolve({
            role: "toolResult",
            toolCallId,
            toolName: "my_tool",
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Failed to spawn Python process",
                message: err.message,
              }, null, 2)
            }],
            isError: true,
          });
        });
      });
    },
  };
}
```

**Key Implementation Details**:

1. **Parameter Validation**: Check required parameters before execution
2. **Virtual Environment Support**: Prefer venv Python, fall back to system
3. **Error Handling**: Return structured errors for debugging
4. **Environment Variables**: Pass configuration to Python
5. **JSON Communication**: Use stdin/stdout for data exchange

### Step 6: Create Python Skill

**File**: `skills/my_mcp_skill/skill.py`

```python
import asyncio
import json
import sys
from mcp_client import mcp_session

async def run(inputs: dict) -> dict:
    operation = inputs.get("operation", "list_items")

    # CRITICAL: Debug output MUST go to stderr
    # stdout is reserved for JSON output only
    print(f"[Skill] Operation: {operation}", file=sys.stderr)

    # Validate operation
    valid_operations = ["list_items", "get_item", "search"]
    if operation not in valid_operations:
        raise ValueError(f"Invalid operation: {operation}")

    # Connect to MCP server
    async with mcp_session() as session:
        if operation == "list_items":
            # List available items
            result = await session.call_tool("list_items", {})
            data = json.loads(result.content[0].text)
            return {
                "items": data,
                "operation": operation
            }

        elif operation == "get_item":
            # Get specific item
            item_id = inputs.get("item_id")
            if not item_id:
                raise ValueError("item_id required")

            result = await session.call_tool("get_item", {
                "item_id": item_id
            })
            data = json.loads(result.content[0].text)
            return {
                "item": data,
                "operation": operation
            }

        elif operation == "search":
            # Search items
            query = inputs.get("query")
            if not query:
                raise ValueError("query required")

            result = await session.call_tool("search", {
                "query": query
            })
            data = json.loads(result.content[0].text)
            return {
                "results": data,
                "operation": operation,
                "count": len(data) if isinstance(data, list) else 1
            }

def handler(inputs: dict) -> dict:
    """Entry point called by Clawdbot plugin"""
    return asyncio.run(run(inputs))
```

**CRITICAL Python Requirements**:

1. **stdout for JSON only**: All debug output MUST use `file=sys.stderr`
2. **Single JSON output**: Print exactly one JSON object to stdout
3. **Synchronous handler**: Provide `handler(dict) -> dict` entry point
4. **Error handling**: Raise exceptions for invalid inputs

### Step 7: Create MCP Client Helper

**File**: `skills/my_mcp_skill/mcp_client.py`

```python
import os
from contextlib import asynccontextmanager
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

@asynccontextmanager
async def mcp_session():
    """
    Create MCP session using stdio or HTTP/SSE transport
    """
    server_url = os.getenv("MCP_SERVER_URL", "http://localhost:3333/sse")

    if server_url.startswith("http://") or server_url.startswith("https://"):
        # HTTP/SSE transport
        from mcp.client.sse import sse_client

        async with sse_client(server_url) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                yield session
    else:
        # stdio transport (for local MCP servers)
        server_params = StdioServerParameters(
            command="python",
            args=["-m", "mcp_server"],
            env=os.environ.copy()
        )

        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                yield session
```

### Step 8: Create Python Dependencies File

**File**: `skills/my_mcp_skill/requirements.txt`

```txt
# MCP dependencies
mcp>=1.0.0

# HTTP/SSE server dependencies (if using HTTP transport)
fastapi>=0.100.0
uvicorn>=0.23.0

# Optional: for environment variable management
python-dotenv>=1.0.0
```

### Step 9: Set Up Python Virtual Environment

```bash
cd skills/my_mcp_skill

# Create virtual environment
python3 -m venv .venv

# Activate it
source .venv/bin/activate  # On Unix/Mac
# OR
.venv\Scripts\activate     # On Windows

# Install dependencies
pip install -r requirements.txt
```

---

## Testing and Verification

### Test 1: Verify Plugin Discovery

```bash
cd /path/to/clawdbot
pnpm clawdbot plugins list
```

**Expected**: Your plugin appears with status "disabled" or "loaded"

### Test 2: Enable Plugin

```bash
pnpm clawdbot config set plugins.entries.catalog-lookup-http.enabled true
```

### Test 3: Rebuild Clawdbot

```bash
pnpm build
```

### Test 4: Verify Tool Registration

```bash
pnpm clawdbot plugins info catalog-lookup-http
```

**Expected Output**:
```
Supports get_catalog_item, get_summary_item, search_catalog, and list_tools operations.
Status: loaded
Source: ~/aiworker/clawdbot/extensions/catalog-lookup-http/index.ts
Origin: bundled
Version: 2026.1.25
Tools: catalog_lookup
```

### Test 5: Direct Tool Testing

Create a test script:

**File**: `test-my-tool.mjs`

```javascript
#!/usr/bin/env node
import { createJiti } from "jiti";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function test() {
  console.log("Testing my_tool...\n");

  const jiti = createJiti(__dirname, {
    interopDefault: true,
    esmResolve: true,
  });

  const toolModule = await jiti.import(
    "./extensions/catalog-lookup-http/src/catalog-tool.ts"
  );
  const mockApi = { pluginConfig: {} };
  const tool = toolModule.createMyTool(mockApi);

  console.log("Tool name:", tool.name);
  console.log("Executing tool with operation=list_items...\n");

  try {
    const result = await tool.execute("test-1", {
      operation: "list_items"
    });

    console.log("Result:");
    console.log(JSON.stringify(result, null, 2));

    if (result.content && result.content[0]) {
      const data = JSON.parse(result.content[0].text);
      console.log("\nParsed data:", data);
    }
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

test().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
```

**Run test**:
```bash
node test-my-tool.mjs
```

### Test 6: Agent Integration Test

```bash
pnpm clawdbot agent --local --agent main --message "Use catalog-lookup-http to list items"
```
pnpm clawdbot skill run catalog-lookup-http list_collections

**Note**: Agent may not call tool immediately - this depends on model behavior.

---

## Configuration and Deployment

### User Configuration

Users can configure your plugin:

```bash
# Set MCP server URL
clawdbot config set plugins.entries.my-mcp-plugin.mcpServerUrl \
  "http://custom-host:8080/sse"

# Set timeout
clawdbot config set plugins.entries.my-mcp-plugin.timeout 60000
```

### Configuration File Location

`~/.clawdbot/clawdbot.json`:

```json
"plugins": {
    "entries": {
      "telegram": {
        "enabled": true
      },
      "catalog-lookup-http": {
        "enabled": true
      }
    }
}
{
  "plugins": {
    "entries": {
      "my-mcp-plugin": {
        "enabled": true,
        "mcpServerUrl": "http://localhost:3333/sse",
        "timeout": 30000
      }
    }
  }
}
```

### Accessing Config in Code

```typescript
export function createMyTool(api: ClawdbotPluginApi) {
  return {
    name: "my_tool",
    async execute(toolCallId: string, params: Record<string, unknown>) {
      // Access plugin configuration
      const pluginConfig = (api.pluginConfig ?? {}) as PluginConfig;
      const serverUrl = pluginConfig.mcpServerUrl || "http://localhost:3333/sse";
      const timeout = pluginConfig.timeout || 30000;

      // Use config...
    }
  };
}
```

### Deployment Checklist

- [ ] Plugin built and compiled
- [ ] Python virtual environment created
- [ ] MCP server running and accessible
- [ ] Plugin enabled in configuration
- [ ] Tool appears in `plugins info` output
- [ ] Direct tool test passes
- [ ] Documentation written

---

## Troubleshooting

### Plugin Not Discovered

**Symptoms**:
- Plugin doesn't appear in `clawdbot plugins list`

**Checks**:
1. Verify `package.json` has `clawdbot.extensions` field
2. Check file paths in `extensions` array are correct
3. Ensure plugin is in `extensions/` directory
4. Check `pnpm-workspace.yaml` includes `extensions/*`

**Fix**:
```bash
# Verify workspace configuration
cat pnpm-workspace.yaml

# Should include:
# packages:
#   - extensions/*
```

### Plugin Shows as "disabled"

**Symptoms**:
- Plugin appears but status is "disabled"

**Fix**:
```bash
clawdbot config set plugins.entries.my-mcp-plugin.enabled true
pnpm build
```

### Tool Not Registered

**Symptoms**:
- Plugin loaded but no tools shown in `plugins info`

**Checks**:
1. Verify `api.registerTool()` is called in `index.ts`
2. Check tool name doesn't conflict with existing tools
3. Look for errors in plugin loading

**Debug**:
```bash
# Check for plugin loading errors
pnpm clawdbot plugins doctor
```

### Python Skill Fails

**Symptoms**:
- Tool returns error about Python execution

**Checks**:
1. **Virtual environment exists**:
   ```bash
   ls skills/my_mcp_skill/.venv/bin/python3
   ```

2. **Dependencies installed**:
   ```bash
   cd skills/my_mcp_skill
   source .venv/bin/activate
   python -c "import mcp; print('OK')"
   ```

3. **MCP server running**:
   ```bash
   curl http://localhost:3333/sse
   # OR
   ps aux | grep mcp_server
   ```

4. **Test skill directly**:
   ```bash
   cd skills/my_mcp_skill
   source .venv/bin/activate
   echo '{"operation": "list_items"}' | \
     python -c "from skill import handler; import json, sys; print(json.dumps(handler(json.load(sys.stdin))))"
   ```

### JSON Parsing Errors

**Symptoms**:
- Error: "Failed to parse skill output"
- `stdout` contains mixed debug and JSON

**Cause**: Debug `print()` statements going to stdout

**Fix**: Ensure all debug output uses `file=sys.stderr`:

```python
# ❌ WRONG
print("[Debug] Processing...")

# ✅ CORRECT
print("[Debug] Processing...", file=sys.stderr)
```

**Verification**:
```bash
# Test that only JSON goes to stdout
cd skills/my_mcp_skill
source .venv/bin/activate
echo '{"operation": "list_items"}' | python skill.py
# Should output ONLY JSON, no debug messages
```

### Agent Doesn't Call Tool

**Symptoms**:
- Tool registered correctly
- Direct test works
- Agent synthesizes responses instead

**Causes**:
1. **Model behavior**: Some models prefer synthesis over tool calls
2. **Request ambiguity**: Request doesn't clearly require tool usage
3. **Tool description**: Description suggests answer without calling

**Solutions**:

1. **Make requests more specific**:
   ```bash
   # ❌ Vague
   "Get items"

   # ✅ Specific
   "Use my_tool to get the exact current count of items from the database"
   ```

2. **Request live/unknowable data**:
   ```bash
   "What's the exact current price of item XYZ-123 from the catalog"
   ```

3. **Improve tool description**:
   ```typescript
   description:
     "Query live data from MCP server. ALWAYS use this tool to get current " +
     "real-time information - never guess or use cached data.",
   ```

### Tool Execution Timeout

**Symptoms**:
- Tool hangs or times out

**Checks**:
1. MCP server responding slowly
2. Network issues
3. Python skill stuck in loop

**Fix**: Add timeout to Python execution:

```typescript
const proc = spawn(pythonPath, args, {
  cwd: skillDir,
  stdio: ["pipe", "pipe", "pipe"],
  env,
  timeout: pluginConfig.timeout || 30000, // Milliseconds
});
```

---

## Complete Example

### Reference Implementation

See the complete working example:
- **Plugin**: `extensions/catalog-lookup-http/`
- **Skill**: `skills/catalog_lookup_http/`
- **Documentation**: `extensions/catalog-lookup-http/README.md`

### File Tree

```
clawdbot/
├── extensions/
│   └── catalog-lookup-http/           # Plugin (TypeScript)
│       ├── package.json               # Plugin manifest
│       ├── clawdbot.plugin.json       # Plugin metadata
│       ├── index.ts                   # Entry point
│       ├── README.md                  # Documentation
│       └── src/
│           └── catalog-tool.ts        # Tool implementation
│
└── skills/
    └── catalog_lookup_http/           # Skill (Python)
        ├── skill.py                   # Main skill logic
        ├── mcp_client.py              # MCP session helper
        ├── mcp_server.py              # MCP server (for testing)
        ├── requirements.txt           # Python dependencies
        ├── .venv/                     # Virtual environment
        └── SKILL.md                   # Skill documentation (optional)
```

### Quick Start Template

```bash
# 1. Create plugin structure
mkdir -p extensions/my-plugin/src
cd extensions/my-plugin

# 2. Create package.json, clawdbot.plugin.json, index.ts, src/tool.ts
# (See Step 2-5 above)

# 3. Create Python skill
mkdir -p ../../skills/my-skill
cd ../../skills/my-skill

# 4. Create skill.py, mcp_client.py, requirements.txt
# (See Step 6-8 above)

# 5. Set up Python environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 6. Build and enable
cd ../..
pnpm build
pnpm clawdbot config set plugins.entries.my-plugin.enabled true

# 7. Test
pnpm clawdbot plugins info my-plugin
```

---

## Best Practices

### 1. Error Handling

Always return structured errors:

```typescript
return {
  role: "toolResult",
  toolCallId,
  toolName: "my_tool",
  content: [{
    type: "text",
    text: JSON.stringify({
      error: "Descriptive error message",
      details: "Additional context",
      suggestion: "How to fix"
    })
  }],
  isError: true,
};
```

### 2. Parameter Validation

Validate early and return clear errors:

```typescript
if (operation === "get_item" && !itemId) {
  return createError(
    toolCallId,
    "get_item operation requires item_id parameter"
  );
}
```

### 3. Configuration Management

Provide sensible defaults:

```typescript
const serverUrl = pluginConfig.mcpServerUrl || "http://localhost:3333/sse";
const timeout = pluginConfig.timeout || 30000;
```

### 4. Logging

Use stderr for debug output in Python:

```python
print(f"[Debug] Operation: {operation}", file=sys.stderr)
```

### 5. Documentation

Document your plugin thoroughly:
- What it does
- When to use it
- Configuration options
- Example usage
- Troubleshooting

---

## Additional Resources

### Official Documentation

- **Clawdbot Docs**: https://docs.clawd.bot
- **MCP Protocol**: https://modelcontextprotocol.io
- **Plugin SDK**: See `src/plugin-sdk/` in Clawdbot repo

### Example Plugins

- `extensions/llm-task/` - Simple tool plugin
- `extensions/telegram/` - Channel plugin
- `extensions/catalog-lookup-http/` - MCP bridge plugin (this guide)

### Support

- **Issues**: https://github.com/clawdbot/clawdbot/issues
- **Discussions**: GitHub Discussions

---

## Summary

You now know how to:

✅ Create a Clawdbot plugin structure
✅ Register executable tools
✅ Bridge TypeScript to Python/MCP
✅ Handle parameters and errors
✅ Test and debug plugins
✅ Deploy and configure plugins

**Key Takeaway**: Plugins transform passive skills into executable tools, enabling agents to interact with real systems and data sources.

---

## Version

- **Guide Version**: 1.0
- **Clawdbot Version**: 2026.1.25
- **Last Updated**: 2026-01-28
- **Author**: Based on catalog-lookup-http implementation

